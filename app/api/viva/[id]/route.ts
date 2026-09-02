import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionStudent } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const student = await getSessionStudent();
  if (!student) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const viva = await prisma.vivaSession.findUnique({
    where: { id: params.id },
    include: { questions: { orderBy: { order: "asc" } } },
  });
  if (!viva || viva.studentId !== student.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  // The viva is question-at-a-time: only expose grades for answered questions
  const questions = viva.questions.map((q) =>
    q.studentAnswer
      ? {
          id: q.id,
          order: q.order,
          question: q.question,
          concept: q.concept,
          studentAnswer: q.studentAnswer,
          isCorrect: q.isCorrect,
          understanding: q.understanding,
          feedback: q.feedback,
        }
      : { id: q.id, order: q.order, question: q.question, concept: q.concept },
  );

  const summary = viva.summaryJson ? JSON.parse(viva.summaryJson) : null;

  return NextResponse.json({
    id: viva.id,
    topic: viva.topic,
    subjectKey: viva.subjectKey,
    difficulty: viva.difficulty,
    language: viva.language,
    status: viva.status,
    questionCount: viva.questionCount,
    totalScore: viva.totalScore,
    summary,
    createdAt: viva.createdAt,
    questions,
  });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const student = await getSessionStudent();
  if (!student) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const viva = await prisma.vivaSession.findUnique({ where: { id: params.id } });
  if (!viva || viva.studentId !== student.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (viva.status !== "ACTIVE") {
    return NextResponse.json({ error: "not_active" }, { status: 409 });
  }

  await prisma.vivaSession.update({
    where: { id: viva.id },
    data: { status: "ABANDONED", completedAt: new Date() },
  });
  return NextResponse.json({ ok: true });
}
