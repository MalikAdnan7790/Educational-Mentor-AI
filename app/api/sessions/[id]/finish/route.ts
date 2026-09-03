import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionStudent } from "@/lib/auth";
import {
  adaptDifficulty,
  evaluateAchievements,
  recomputeStudentScore,
  recommendedNextMode,
} from "@/lib/scoring";
import { applyMasteryEvidence } from "@/lib/analytics";
import { finishSessionSchema } from "@/lib/validation";
import type { Difficulty, LearningMode } from "@/types/prisma-enums";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const student = await getSessionStudent();
  if (!student) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = finishSessionSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input", details: parsed.error.flatten() }, { status: 400 });
  }

  const session = await prisma.attemptSession.findUnique({
    where: { id: params.id },
    include: {
      student: true,
      problem: { select: { subject: true, topic: true } },
      attempts: { orderBy: { attemptNumber: "asc" } },
      hintEvents: { select: { id: true } },
    },
  });
  if (!session || session.studentId !== student.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  // Sessions auto-completed by the attempt route (correct answer) still need
  // their reflection/confidence saved — treat them as already finished and
  // only persist the remaining inputs, without re-running the pipeline.
  const alreadyFinished = session.status !== "ACTIVE";
  if (alreadyFinished && session.status === "ABANDONED") {
    return NextResponse.json({ error: "already_finished", sessionStatus: session.status }, { status: 409 });
  }

  const lastAttempt = session.attempts.at(-1);
  let newStatus: "COMPLETED" | "REVEALED" | "ABANDONED" = "ABANDONED";
  if (lastAttempt?.isCorrect) newStatus = "COMPLETED";
  else if (session.currentHintLevel >= 6) newStatus = "REVEALED";

  await prisma.$transaction(async (tx) => {
    if (!alreadyFinished) {
      await tx.attemptSession.update({
        where: { id: session.id },
        data: {
          status: newStatus,
          finishedAt: new Date(),
          finalResult: lastAttempt?.mistakeType ?? "NONE",
        },
      });
    }

    if (parsed.data.confidence !== undefined) {
      await tx.confidenceCheck.create({
        data: {
          sessionId: session.id,
          studentId: session.studentId,
          confidence: parsed.data.confidence,
          actualCorrect: !!lastAttempt?.isCorrect,
        },
      });
    }

    if (parsed.data.reflection) {
      const existingReflection = await tx.reflection.findFirst({
        where: { sessionId: session.id },
      });
      if (!existingReflection) {
        await tx.reflection.create({
          data: {
            sessionId: session.id,
            studentId: session.studentId,
            question: parsed.data.reflection.question,
            answer: parsed.data.reflection.answer,
          },
        });
      }
    }
  });

  const metrics = await recomputeStudentScore(session.studentId);
  const newAchievements = alreadyFinished
    ? []
    : await evaluateAchievements(session.studentId);

  // Feed the topic's mastery stage from this session's outcome
  if (!alreadyFinished) {
    const attempts = session.attempts;
    const hintCount = session.hintEvents.length;
    let evidenceScore: number;
    if (newStatus === "COMPLETED") {
      evidenceScore = attempts[0]?.isCorrect ? 90 : 70;
      if (hintCount >= 4) evidenceScore -= 15;
    } else if (newStatus === "REVEALED") {
      evidenceScore = 25;
    } else {
      evidenceScore = 15; // abandoned — exposure only
    }
    await applyMasteryEvidence(
      session.studentId,
      session.problem.subject.toLowerCase(),
      session.problem.topic,
      evidenceScore,
    );
  }

  const adaptation = adaptDifficulty(metrics.independentSuccessRate, session.student.currentDifficulty as Difficulty);
  const nextMode = recommendedNextMode(session.student.preferredMode as LearningMode, metrics);

  await prisma.student.update({
    where: { id: session.studentId },
    data: { currentDifficulty: adaptation.difficulty },
  });

  return NextResponse.json({
    sessionStatus: newStatus,
    metrics,
    newAchievements,
    adaptation,
    recommendedMode: nextMode,
  });
}
