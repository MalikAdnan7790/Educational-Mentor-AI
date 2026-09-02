import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionStudent } from "@/lib/auth";
import { generateExam } from "@/lib/ai/exam";
import { isAIEnabled } from "@/lib/ai/client";
import { examCreateSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const student = await getSessionStudent();
  if (!student) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  if (!isAIEnabled()) {
    return NextResponse.json({ error: "ai_not_configured" }, { status: 503 });
  }

  const parsed = examCreateSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input", details: parsed.error.flatten() }, { status: 400 });
  }
  const { subjectKey, topic, difficulty, questionCount, timeLimitMin, sourceNoteId } = parsed.data;

  // Notes → Quiz: generate strictly from the student's uploaded material
  let sourceText: string | undefined;
  let sourceTitle: string | undefined;
  if (sourceNoteId) {
    const note = await prisma.noteDocument.findUnique({
      where: { id: sourceNoteId },
      include: { chunks: { orderBy: { idx: "asc" } } },
    });
    if (!note || note.studentId !== student.id) {
      return NextResponse.json({ error: "note_not_found" }, { status: 404 });
    }
    sourceText = note.chunks.map((c) => c.content).join("\n\n");
    // Keep the generation prompt within limits even for long notes
    if (sourceText.length > 24000) sourceText = sourceText.slice(0, 24000);
    sourceTitle = note.title;
  }

  const generated = await generateExam({
    subjectKey,
    topic,
    difficulty,
    questionCount,
    sourceText,
  });
  if (!generated) {
    return NextResponse.json({ error: "generation_failed" }, { status: 503 });
  }

  const exam = await prisma.exam.create({
    data: {
      studentId: student.id,
      title: sourceTitle ? `Quiz: ${sourceTitle}` : generated.title,
      subjectKey: subjectKey ?? null,
      topic: topic ?? null,
      difficulty,
      timeLimitSec: timeLimitMin ? timeLimitMin * 60 : null,
      questionCount: generated.questions.length,
      sourceNoteId: sourceNoteId ?? null,
      questions: {
        create: generated.questions.map((q, i) => ({
          order: i + 1,
          type: q.type,
          question: q.question,
          optionsJson: q.options ? JSON.stringify(q.options) : null,
          answer: q.answer,
          points: q.points,
        })),
      },
    },
    include: { questions: { orderBy: { order: "asc" } } },
  });

  // Never send canonical answers while the exam is active
  return NextResponse.json(
    {
      id: exam.id,
      title: exam.title,
      subjectKey: exam.subjectKey,
      topic: exam.topic,
      difficulty: exam.difficulty,
      timeLimitSec: exam.timeLimitSec,
      questionCount: exam.questionCount,
      sourceNoteId: exam.sourceNoteId,
      status: exam.status,
      questions: exam.questions.map((q) => ({
        id: q.id,
        order: q.order,
        type: q.type,
        question: q.question,
        options: q.optionsJson ? JSON.parse(q.optionsJson) : null,
        points: q.points,
      })),
    },
    { status: 201 },
  );
}

export async function GET() {
  const student = await getSessionStudent();
  if (!student) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const exams = await prisma.exam.findMany({
    where: { studentId: student.id },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      title: true,
      subjectKey: true,
      topic: true,
      difficulty: true,
      questionCount: true,
      score: true,
      status: true,
      sourceNoteId: true,
      createdAt: true,
    },
  });
  return NextResponse.json(exams);
}
