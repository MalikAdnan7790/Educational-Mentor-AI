import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionStudent } from "@/lib/auth";
import { gradeVivaAnswer } from "@/lib/ai/viva";
import { vivaAnswerSchema } from "@/lib/validation";
import type { Difficulty, LanguagePref } from "@/types/prisma-enums";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const student = await getSessionStudent();
  if (!student) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = vivaAnswerSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input", details: parsed.error.flatten() }, { status: 400 });
  }

  const viva = await prisma.vivaSession.findUnique({
    where: { id: params.id },
    include: { questions: { orderBy: { order: "asc" } } },
  });
  if (!viva || viva.studentId !== student.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (viva.status !== "ACTIVE") {
    return NextResponse.json({ error: "not_active", status: viva.status }, { status: 409 });
  }

  const current = viva.questions.at(-1);
  if (!current) return NextResponse.json({ error: "no_question" }, { status: 409 });
  if (current.studentAnswer) {
    return NextResponse.json({ error: "already_answered" }, { status: 409 });
  }

  const grade = await gradeVivaAnswer({
    question: current.question,
    concept: current.concept,
    studentAnswer: parsed.data.answer,
    difficulty: viva.difficulty as Difficulty,
    language: viva.language as LanguagePref,
  });
  if (!grade) {
    // Nothing saved — the student can resubmit the same answer
    return NextResponse.json({ error: "grading_failed" }, { status: 503 });
  }

  await prisma.vivaQuestion.update({
    where: { id: current.id },
    data: {
      studentAnswer: parsed.data.answer,
      isCorrect: grade.isCorrect,
      understanding: grade.understanding,
      feedback: grade.followUp ? `${grade.feedback}\n\n${grade.followUp}` : grade.feedback,
      score: grade.understanding,
    },
  });

  const answered = viva.questions.filter((q) => q.studentAnswer).length + 1;

  return NextResponse.json({
    question: {
      id: current.id,
      order: current.order,
      question: current.question,
      concept: current.concept,
      studentAnswer: parsed.data.answer,
      isCorrect: grade.isCorrect,
      understanding: grade.understanding,
      feedback: grade.followUp ? `${grade.feedback}\n\n${grade.followUp}` : grade.feedback,
    },
    progress: { answered, total: viva.questionCount },
  });
}
