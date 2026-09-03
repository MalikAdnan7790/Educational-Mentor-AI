import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionStudent } from "@/lib/auth";
import { generateVivaQuestion, summarizeViva } from "@/lib/ai/viva";
import { applyMasteryEvidence } from "@/lib/analytics";
import type { Difficulty, LanguagePref, EducationLevel } from "@/types/prisma-enums";

export const dynamic = "force-dynamic";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const student = await getSessionStudent();
  if (!student) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

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

  const last = viva.questions.at(-1);
  if (!last) return NextResponse.json({ error: "no_question" }, { status: 409 });
  if (!last.studentAnswer) {
    return NextResponse.json({ error: "answer_current_first" }, { status: 409 });
  }

  if (viva.questions.length >= viva.questionCount) {
    const summary = await summarizeViva(
      viva.topic,
      viva.questions.map((q) => ({
        question: q.question,
        concept: q.concept,
        answer: q.studentAnswer,
        understanding: q.understanding,
        isCorrect: q.isCorrect,
      })),
    );

    const answered = viva.questions.filter((q) => q.studentAnswer);
    const avgUnderstanding =
      answered.length > 0
        ? answered.reduce((sum, q) => sum + (q.understanding ?? 0), 0) / answered.length
        : 0;

    await prisma.vivaSession.update({
      where: { id: viva.id },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        totalScore: avgUnderstanding,
        summaryJson: summary ? JSON.stringify(summary) : JSON.stringify({ strongAreas: [], weakAreas: [], practiceTopics: [], feedback: "Viva completed. Ask your teacher to review the transcript above." }),
      },
    });

    if (viva.subjectKey) {
      await applyMasteryEvidence(student.id, viva.subjectKey, viva.topic, Math.round(avgUnderstanding));
    }

    return NextResponse.json({ finished: true, summary, totalScore: Math.round(avgUnderstanding) });
  }

  const next = await generateVivaQuestion({
    topic: viva.topic,
    difficulty: viva.difficulty as Difficulty,
    language: viva.language as LanguagePref,
    order: last.order + 1,
    previousQA: viva.questions.map((q) => ({
      question: q.question,
      answer: q.studentAnswer,
      concept: q.concept,
    })),
    studentLevel: student.educationLevel as EducationLevel,
  });
  if (!next) {
    return NextResponse.json({ error: "generation_failed" }, { status: 503 });
  }

  const question = await prisma.vivaQuestion.create({
    data: {
      vivaId: viva.id,
      order: last.order + 1,
      question: next.question,
      concept: next.concept,
    },
  });

  return NextResponse.json({
    finished: false,
    question: { id: question.id, order: question.order, question: question.question, concept: question.concept },
  });
}
