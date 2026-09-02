import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionStudent } from "@/lib/auth";
import { explainBackSchema } from "@/lib/validation";
import { analyzeExplainBack } from "@/lib/ai/explain-back";
import { applyMasteryEvidence } from "@/lib/analytics";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const student = await getSessionStudent();
  if (!student) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = explainBackSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input", details: parsed.error.flatten() }, { status: 400 });
  }

  const { conversationId, subjectKey, topic, explanation } = parsed.data;

  // Load context: the last assistant message from the conversation (what was taught)
  let context = "";
  if (conversationId) {
    const lastAssistant = await prisma.message.findFirst({
      where: { conversationId, role: "ASSISTANT" },
      orderBy: { createdAt: "desc" },
    });
    context = lastAssistant?.content ?? "";
  }

  const result = await analyzeExplainBack(explanation, subjectKey ?? null, topic, context);

  // Persist the explain-back record
  const record = await prisma.explainBack.create({
    data: {
      studentId: student.id,
      conversationId: conversationId ?? null,
      subjectKey: subjectKey ?? null,
      topic,
      explanation,
      analysisJson: JSON.stringify({
        accuracyPct: result.accuracyPct,
        completenessPct: result.completenessPct,
        reasoningPct: result.reasoningPct,
        misconceptions: result.misconceptions,
      }),
      understandingScore: result.understandingScore,
      accuracyPct: result.accuracyPct,
      completenessPct: result.completenessPct,
      reasoningPct: result.reasoningPct,
    },
  });

  // Record misconceptions as MistakeRecords
  for (const mc of result.misconceptions) {
    const existing = await prisma.mistakeRecord.findFirst({
      where: {
        studentId: student.id,
        mistakeType: "CONCEPT_GAP",
        description: mc.description,
        status: "OPEN",
      },
    });

    if (existing) {
      await prisma.mistakeRecord.update({
        where: { id: existing.id },
        data: { occurrences: { increment: 1 }, lastSeenAt: new Date() },
      });
    } else {
      await prisma.mistakeRecord.create({
        data: {
          studentId: student.id,
          subjectKey: subjectKey ?? null,
          topic,
          mistakeType: "CONCEPT_GAP",
          description: mc.description,
          source: "explain-back",
        },
      });
    }
  }

  // Update knowledge record
  if (subjectKey) {
    await applyMasteryEvidence(student.id, subjectKey, topic, result.understandingScore);
  }

  return NextResponse.json({ ...result, id: record.id }, { status: 201 });
}
