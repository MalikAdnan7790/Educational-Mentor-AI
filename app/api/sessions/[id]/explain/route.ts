import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionStudent } from "@/lib/auth";
import { evaluateAnswerExplanation } from "@/lib/ai/explain-answer";
import { explainAnswerSubmitSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const student = await getSessionStudent();
  if (!student) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = explainAnswerSubmitSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input", details: parsed.error.flatten() }, { status: 400 });
  }

  const session = await prisma.attemptSession.findUnique({
    where: { id: params.id },
    include: {
      problem: { select: { content: true } },
      attempts: { orderBy: { attemptNumber: "asc" } },
    },
  });
  if (!session || session.studentId !== student.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const attempt = parsed.data.attemptId
    ? session.attempts.find((a) => a.id === parsed.data.attemptId)
    : session.attempts.at(-1);
  if (!attempt) {
    return NextResponse.json({ error: "no_attempt" }, { status: 400 });
  }

  const evaluation = await evaluateAnswerExplanation({
    problemContent: session.problem.content,
    studentAnswer: attempt.answer,
    answerWasCorrect: attempt.isCorrect,
    explanation: parsed.data.explanation,
  });
  if (!evaluation) {
    return NextResponse.json({ error: "generation_failed" }, { status: 503 });
  }

  const record = await prisma.explainAnswer.create({
    data: {
      studentId: student.id,
      sessionId: session.id,
      attemptId: attempt.id,
      answerWasCorrect: attempt.isCorrect,
      explanation: parsed.data.explanation,
      reasoningCorrect: evaluation.reasoningCorrect,
      reasoningScore: evaluation.reasoningScore,
      feedback: evaluation.feedback,
    },
  });

  return NextResponse.json({
    id: record.id,
    answerWasCorrect: attempt.isCorrect,
    ...evaluation,
  });
}
