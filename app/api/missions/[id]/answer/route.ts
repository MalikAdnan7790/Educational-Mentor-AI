import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionStudent } from "@/lib/auth";
import { missionAnswerSchema } from "@/lib/validation";
import { evaluateMissionStep } from "@/lib/ai/mission";
import { applyMasteryEvidence } from "@/lib/analytics";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const student = await getSessionStudent();
  if (!student) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = missionAnswerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const mission = await prisma.mission.findFirst({
    where: { id, studentId: student.id, status: "ACTIVE" },
    include: { steps: { orderBy: { order: "asc" } } },
  });
  if (!mission) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const step = mission.steps.find((s) => s.status === "PENDING");
  if (!step) {
    return NextResponse.json({ error: "mission_finished" }, { status: 400 });
  }

  const answer = parsed.data.answer;

  // The mini lesson is read, not solved — acknowledging it completes the step
  if (step.kind === "MINI_LESSON") {
    await prisma.missionStep.update({
      where: { id: step.id },
      data: { status: "COMPLETED", completedAt: new Date() },
    });
    return NextResponse.json({
      passed: true,
      score: null,
      feedback: "Lesson read. Now apply it in the practice steps.",
      stepStatus: "COMPLETED",
      missionStatus: "ACTIVE",
    });
  }

  const evaluation = await evaluateMissionStep({
    kind: step.kind,
    topic: mission.topic,
    question: step.content,
    expectedAnswer: step.answer ?? "",
    studentAnswer: answer,
    attempts: step.attempts,
  });

  if (!evaluation) {
    return NextResponse.json({ error: "grading_failed" }, { status: 503 });
  }

  const attempts = step.attempts + 1;
  const passed = evaluation.passed;

  await prisma.missionStep.update({
    where: { id: step.id },
    data: {
      attempts,
      studentAnswer: answer,
      analysisJson: JSON.stringify(evaluation),
      score: evaluation.score,
      status: passed ? "COMPLETED" : "PENDING",
      completedAt: passed ? new Date() : null,
    },
  });

  let missionStatus: string = "ACTIVE";
  let missionCompleted = false;

  if (passed && step.order === mission.steps.length) {
    // Final RE_TEST passed — the weakness is repaired
    missionCompleted = true;
    missionStatus = "COMPLETED";
    await prisma.mission.update({
      where: { id: mission.id },
      data: { status: "COMPLETED", completedAt: new Date() },
    });
    let subjectKey: string | null = null;
    if (mission.sourceMistakeId) {
      const mistake = await prisma.mistakeRecord.findUnique({
        where: { id: mission.sourceMistakeId },
        select: { subjectKey: true, status: true },
      });
      if (mistake) {
        subjectKey = mistake.subjectKey;
        await prisma.mistakeRecord.update({
          where: { id: mission.sourceMistakeId },
          data: { status: "RESOLVED" },
        });
      }
    }
    if (subjectKey) {
      await applyMasteryEvidence(student.id, subjectKey, mission.topic, evaluation.score);
    }
  }

  return NextResponse.json({
    passed,
    score: evaluation.score,
    feedback: evaluation.feedback,
    stepStatus: passed ? "COMPLETED" : "PENDING",
    attempts,
    missionStatus,
    missionCompleted,
    // canonical answer revealed only after passing
    answer: passed ? step.answer : null,
  });
}
