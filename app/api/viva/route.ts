import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionStudent } from "@/lib/auth";
import { generateVivaQuestion } from "@/lib/ai/viva";
import { isAIEnabled } from "@/lib/ai/client";
import { vivaCreateSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const student = await getSessionStudent();
  if (!student) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  if (!isAIEnabled()) {
    return NextResponse.json({ error: "ai_not_configured" }, { status: 503 });
  }

  const parsed = vivaCreateSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input", details: parsed.error.flatten() }, { status: 400 });
  }
  const { subjectKey, topic, difficulty, language, questionCount } = parsed.data;

  const viva = await prisma.vivaSession.create({
    data: {
      studentId: student.id,
      subjectKey: subjectKey ?? null,
      topic,
      difficulty,
      language,
      questionCount,
    },
  });

  const first = await generateVivaQuestion({
    topic,
    difficulty,
    language,
    order: 1,
    previousQA: [],
    studentLevel: student.educationLevel,
  });
  if (!first) {
    await prisma.vivaSession.delete({ where: { id: viva.id } });
    return NextResponse.json({ error: "generation_failed" }, { status: 503 });
  }

  const question = await prisma.vivaQuestion.create({
    data: {
      vivaId: viva.id,
      order: 1,
      question: first.question,
      concept: first.concept,
    },
  });

  return NextResponse.json(
    {
      viva: { id: viva.id, topic: viva.topic, subjectKey: viva.subjectKey, difficulty: viva.difficulty, language: viva.language, status: viva.status },
      question: { id: question.id, order: question.order, question: question.question, concept: question.concept },
    },
    { status: 201 },
  );
}

export async function GET() {
  const student = await getSessionStudent();
  if (!student) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const vivas = await prisma.vivaSession.findMany({
    where: { studentId: student.id },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { _count: { select: { questions: true } } },
  });
  return NextResponse.json(vivas);
}
