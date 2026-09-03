import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionStudent } from "@/lib/auth";
import { evaluateAttempt } from "@/lib/ai/evaluate";
import { submitAttemptSchema } from "@/lib/validation";
import { evaluateAchievements, recomputeStudentScore } from "@/lib/scoring";
import { applyMasteryEvidence } from "@/lib/analytics";
import type { LearningMode } from "@/types/prisma-enums";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const student = await getSessionStudent();
  if (!student) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = submitAttemptSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input", details: parsed.error.flatten() }, { status: 400 });
  }

  const session = await prisma.attemptSession.findUnique({
    where: { id: params.id },
    include: {
      problem: true,
      attempts: { orderBy: { attemptNumber: "asc" } },
      hintEvents: { select: { id: true } },
    },
  });
  if (!session || session.studentId !== student.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (session.status !== "ACTIVE") {
    return NextResponse.json({ error: "session_not_active", status: session.status }, { status: 409 });
  }

  const analysis = await evaluateAttempt({
    session: {
      id: session.id,
      mode: session.mode as LearningMode,
      isAiFree: session.isAiFree,
      currentHintLevel: session.currentHintLevel,
    },
    problem: session.problem,
    previousAttempts: session.attempts,
    newAnswer: parsed.data.answer,
    timeTakenSec: parsed.data.timeTakenSec,
  });

  const attempt = await prisma.attempt.create({
    data: {
      sessionId: session.id,
      attemptNumber: session.attempts.length + 1,
      answer: parsed.data.answer,
      isCorrect: analysis.isCorrect,
      hintLevelUsed: session.currentHintLevel,
      timeTakenSec: parsed.data.timeTakenSec ?? null,
      mistakeType: analysis.mistakeType,
      reasoning: analysis.reasoning,
      aiFeedback: analysis.feedback,
    },
  });

  const updates: Record<string, any> = { currentHintLevel: analysis.nextHintLevel };
  if (analysis.nextAction === "accept") {
    updates.status = "COMPLETED";
    updates.finishedAt = new Date();
  }
  await prisma.attemptSession.update({ where: { id: session.id }, data: updates });

  // Record mistake if applicable
  if (!analysis.isCorrect && analysis.mistakeType !== "NONE") {
    await upsertMistakeRecord(student.id, session, analysis);
  }

  // When the attempt auto-completes the session, the finish endpoint will
  // reject it as already finished — so run the scoring pipeline here.
  let newAchievements: { key: string; title: string; description: string }[] = [];
  if (analysis.nextAction === "accept") {
    let evidenceScore = session.attempts.length === 0 ? 90 : 70;
    if (session.hintEvents.length >= 4) evidenceScore -= 15;
    await applyMasteryEvidence(
      session.studentId,
      session.problem.subject,
      session.problem.topic,
      evidenceScore,
    );
    await recomputeStudentScore(session.studentId);
    newAchievements = await evaluateAchievements(session.studentId);
  }

  return NextResponse.json({ attempt, analysis, newAchievements });
}

async function upsertMistakeRecord(
  studentId: string,
  session: { id: string; problemId: string; problem: { subject: string; topic: string } },
  analysis: { mistakeType: string; feedback: string; conceptGap?: string },
) {
  const existing = await prisma.mistakeRecord.findFirst({
    where: {
      studentId,
      mistakeType: analysis.mistakeType,
      subjectKey: session.problem.subject,
      topic: session.problem.topic,
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
        studentId,
        subjectKey: session.problem.subject,
        topic: session.problem.topic,
        mistakeType: analysis.mistakeType,
        description: analysis.conceptGap || analysis.feedback.slice(0, 200),
        source: "session",
        sessionId: session.id,
      },
    });
  }
}
