import { NextResponse } from "next/server";
import { getSessionStudent } from "@/lib/auth";
import { streamCodingReply, CODING_LANGUAGES } from "@/lib/ai/coding";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const codingMessageSchema = z.object({
  language: z.enum(CODING_LANGUAGES as [string, ...string[]]),
  messages: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string(),
  })).max(20),
  code: z.string().nullable().optional(),
});

export async function POST(req: Request) {
  const student = await getSessionStudent();
  if (!student) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const parsed = codingMessageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input", details: parsed.error.flatten() }, { status: 400 });
  }

  const { language, messages, code } = parsed.data;

  let stream;
  try {
    stream = await streamCodingReply({ language, messages, code: code ?? null });
  } catch {
    return NextResponse.json(
      { error: "ai_unavailable", message: "Coding mentor is temporarily unavailable." },
      { status: 503 },
    );
  }

  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta: chunk })}\n\n`));
        }
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
        controller.close();
      } catch {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: "stream_failed" })}\n\n`));
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
