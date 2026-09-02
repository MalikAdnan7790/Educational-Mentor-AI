import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionStudent } from "@/lib/auth";
import { evaluateTeachBack } from "@/lib/ai/teach";
import { applyMasteryEvidence } from "@/lib/analytics";
import { teachEvaluateSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const student = await getSessionStudent();
  if (!student) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = teachEvaluateSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input", details: parsed.error.flatten() }, { status: 400 });
  }

  const subjectKey = parsed.data.subject?.toLowerCase() ?? null;
  const evaluation = await evaluateTeachBack({
    subjectKey,
    topic: parsed.data.topic,
    explanation: parsed.data.explanation,
  });

  if (!evaluation) return NextResponse.json({ error: "generation_failed" }, { status: 503 });

  // Teaching a topic well is real mastery evidence — the I MASTER stage is
  // exactly "explain your reasoning to someone else".
  if (subjectKey) {
    await applyMasteryEvidence(student.id, subjectKey, parsed.data.topic, evaluation.understandingScore);
  }

  return NextResponse.json(evaluation);
}
