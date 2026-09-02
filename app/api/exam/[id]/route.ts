import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionStudent } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const student = await getSessionStudent();
  if (!student) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const exam = await prisma.exam.findUnique({
    where: { id: params.id },
    include: { questions: { orderBy: { order: "asc" } } },
  });
  if (!exam || exam.studentId !== student.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const graded = exam.status === "GRADED";

  return NextResponse.json({
    id: exam.id,
    title: exam.title,
    subjectKey: exam.subjectKey,
    topic: exam.topic,
    difficulty: exam.difficulty,
    timeLimitSec: exam.timeLimitSec,
    questionCount: exam.questionCount,
    sourceNoteId: exam.sourceNoteId,
    status: exam.status,
    score: exam.score,
    summary: exam.summaryJson ? JSON.parse(exam.summaryJson) : null,
    createdAt: exam.createdAt,
    questions: exam.questions.map((q) => ({
      id: q.id,
      order: q.order,
      type: q.type,
      question: q.question,
      options: q.optionsJson ? JSON.parse(q.optionsJson) : null,
      points: q.points,
      ...(graded
        ? {
            answer: q.answer,
            studentAnswer: q.studentAnswer,
            isCorrect: q.isCorrect,
            analysis: q.analysis,
          }
        : {}),
    })),
  });
}
