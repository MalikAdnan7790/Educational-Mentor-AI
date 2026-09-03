import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionStudent } from "@/lib/auth";
import { challengeSubmitSchema } from "@/lib/validation";
import { gradeChallenge, nextAdaptiveDifficulty } from "@/lib/ai/challenge";
import { applyMasteryEvidence } from "@/lib/analytics";
import type { Difficulty } from "@/types/prisma-enums";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const student = await getSessionStudent();
  if (!student) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = challengeSubmitSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input", details: parsed.error.flatten() }, { status: 400 });
  }

  const challenge = await prisma.challenge.findUnique({ where: { id: params.id } });
  if (!challenge || challenge.studentId !== student.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (challenge.status !== "PENDING") {
    return NextResponse.json({ error: "already_submitted" }, { status: 409 });
  }

  const grade = await gradeChallenge(
    challenge.problemText,
    challenge.solution,
    parsed.data.answer,
  );

  await prisma.challenge.update({
    where: { id: params.id },
    data: {
      studentSolution: parsed.data.answer,
      analysisJson: JSON.stringify(grade.analysis),
      score: grade.score,
      confidencePct: parsed.data.confidence ?? null,
      status: "GRADED",
    },
  });

  // Update knowledge record based on result
  if (challenge.subjectKey && challenge.topic) {
    await applyMasteryEvidence(
      student.id,
      challenge.subjectKey,
      challenge.topic,
      grade.score,
    );
  }

  // Confidence vs performance — calibration feedback, never shaming
  const confidence = parsed.data.confidence ?? null;
  let confidenceNote: string | null = null;
  if (confidence != null) {
    if (confidence >= 70 && !grade.isCorrect) {
      confidenceNote = `You felt confident, so this result is useful information — not a failure. Usually the gap is one specific concept worth revisiting (${challenge.topic ?? "this topic"}). A calm 10-minute revision will close it.`;
    } else if (confidence <= 40 && grade.isCorrect) {
      confidenceNote = "You doubted yourself and still solved it — that is real skill, not luck. You are ready for a harder version of this.";
    }
  }

  const adaptiveNext = nextAdaptiveDifficulty(challenge.difficulty as Difficulty, grade.score);

  return NextResponse.json({ ...grade, confidenceNote, adaptiveNext });
}
