import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionStudent } from "@/lib/auth";
import { sendMessageSchema } from "@/lib/validation";
import { streamMentorReply } from "@/lib/ai/mentor";
import { detect } from "@/lib/ai/detect";
import { extractMemories } from "@/lib/ai/memory";
import { updateStudyStreak } from "@/lib/streak";
import { AIError, errorCardMessage } from "@/lib/ai/errors";
import { checkRateLimit } from "@/lib/rate-limit";
import { getTeacherAction } from "@/lib/teacher-actions";
import type { LearningMode, LanguagePref, EducationLevel } from "@/types/prisma-enums";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const student = await getSessionStudent();
  if (!student) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const rl = checkRateLimit(`msg:${student.id}`, "chat");
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "rate_limited", message: "Too many messages. Please wait a moment." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } },
    );
  }

  const parsed = sendMessageSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input", details: parsed.error.flatten() }, { status: 400 });
  }

  const conversation = await prisma.conversation.findUnique({ where: { id: params.id } });
  if (!conversation || conversation.studentId !== student.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (conversation.status !== "ACTIVE") {
    return NextResponse.json({ error: "conversation_archived" }, { status: 409 });
  }

  const { content, imageBase64, teacherAction } = parsed.data;

  // Turn-1 detection: auto-detect subject/topic/language/pedagogicalMode if not set
  const messageCount = await prisma.message.count({ where: { conversationId: conversation.id } });
  let subjectKey = conversation.subjectKey;
  let topic = conversation.topic;
  let language = conversation.language;
  let pedagogicalMode = conversation.pedagogicalMode;

  if (messageCount === 0) {
    const detection = await detect(content);
    if (!subjectKey && detection.subjectKey) subjectKey = detection.subjectKey;
    if (!topic && detection.topic) topic = detection.topic;
    if (detection.language) language = detection.language as typeof language;
    if (!pedagogicalMode && detection.pedagogicalMode) pedagogicalMode = detection.pedagogicalMode;

    // Update conversation with detected values
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        subjectKey: subjectKey ?? conversation.subjectKey,
        topic: topic ?? conversation.topic,
        language,
        pedagogicalMode: pedagogicalMode ?? conversation.pedagogicalMode,
        title: conversation.title ?? content.slice(0, 80),
      },
    });
  }

  // Persist student message
  const studentMsg = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      role: "USER",
      content,
      language,
      source: conversation.kind === "VOICE" ? "VOICE_STT" : "TEXT_USER",
    },
  });

  // Update conversation metadata
  await prisma.conversation.update({
    where: { id: conversation.id },
    data: {
      lastMessageAt: new Date(),
      messageCount: { increment: 1 },
    },
  });

  // Stream mentor reply (image passed through for vision)
  let stream;
  try {
    stream = await streamMentorReply({
      conversationId: conversation.id,
      studentId: student.id,
      mode: conversation.mode as LearningMode,
      language: language as LanguagePref,
      isAiFree: conversation.isAiFree,
      subjectKey,
      topic,
      educationLevel: student.educationLevel as EducationLevel,
      userMessage: content,
      imageBase64: imageBase64 ?? null,
      teacherActionDirective: teacherAction ? getTeacherAction(teacherAction)?.directive ?? null : null,
      pedagogicalMode: pedagogicalMode as any,
    });
  } catch (err) {
    if (err instanceof AIError) {
      return NextResponse.json(
        { error: err.code, message: errorCardMessage(err.code) },
        { status: err.retryable ? 503 : 400 },
      );
    }
    return NextResponse.json(
      { error: "ai_unavailable", message: "AI mentor is temporarily unavailable. Please try again." },
      { status: 503 },
    );
  }

  // SSE response
  const encoder = new TextEncoder();
  let fullText = "";

  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          fullText += chunk;
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta: chunk })}\n\n`));
        }

        // Strip META sentinel before persisting
        const cleanText = stripMeta(fullText);

        // Persist teacher message
        const teacherMsg = await prisma.message.create({
          data: {
            conversationId: conversation.id,
            role: "ASSISTANT",
            content: fullText, // persist with meta for internal use
            language,
            source: conversation.kind === "VOICE" ? "VOICE_TTS" : "TEXT_ASSISTANT",
            hintLevel: extractMeta(fullText)?.hintLevel ?? 0,
            wasFullExplanation: extractMeta(fullText)?.wasFullExplanation ?? false,
          },
        });

        await prisma.conversation.update({
          where: { id: conversation.id },
          data: { messageCount: { increment: 1 } },
        });

        // Non-blocking: extract memories from conversation for cross-session context
        void extractMemories(student.id, conversation.id);
        void updateStudyStreak(student.id);

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, text: cleanText, messageId: teacherMsg.id })}\n\n`));
        controller.close();
      } catch (err) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: "stream_failed" })}\n\n`),
        );
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
      Connection: "keep-alive",
    },
  });
}

const META_SENTINEL = "<<<META>>>";

function stripMeta(text: string): string {
  const idx = text.indexOf(META_SENTINEL);
  return idx >= 0 ? text.slice(0, idx).trim() : text;
}

function extractMeta(text: string): Record<string, any> | null {
  const idx = text.indexOf(META_SENTINEL);
  if (idx < 0) return null;
  try {
    return JSON.parse(text.slice(idx + META_SENTINEL.length).trim());
  } catch {
    return null;
  }
}
