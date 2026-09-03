import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionStudent } from "@/lib/auth";
import { z } from "zod";

export const dynamic = "force-dynamic";

const stepSchema = z.object({
  answer: z.string().min(1),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const student = await getSessionStudent();
  if (!student) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const lesson = await prisma.miniLesson.findUnique({ where: { id: params.id } });
  if (!lesson || lesson.studentId !== student.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (lesson.status === "COMPLETED") {
    return NextResponse.json({ error: "already_completed" }, { status: 409 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = stepSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const sections = JSON.parse(lesson.sectionsJson) as {
    title: string;
    content: string;
    checkQuestion: string;
    checkAnswer: string;
  }[];

  const currentStep = lesson.currentStep;
  if (currentStep >= sections.length) {
    return NextResponse.json({ error: "no_more_steps" }, { status: 400 });
  }

  const section = sections[currentStep];
  const studentAnswer = parsed.data.answer.trim().toLowerCase();
  const canonicalAnswer = section.checkAnswer.trim().toLowerCase();

  const isCorrect =
    studentAnswer === canonicalAnswer ||
    (canonicalAnswer.length > 12 && studentAnswer.includes(canonicalAnswer)) ||
    (studentAnswer.length > 12 && canonicalAnswer.includes(studentAnswer));

  const nextStep = currentStep + 1;
  const isLast = nextStep >= sections.length;

  const totalCorrect = isCorrect ? 1 : 0;
  const newScorePct = isLast
    ? Math.round(((lesson.scorePct * currentStep + (isCorrect ? 100 : 0)) / sections.length))
    : lesson.scorePct;

  await prisma.miniLesson.update({
    where: { id: lesson.id },
    data: {
      currentStep: nextStep,
      status: isLast ? "COMPLETED" : "ACTIVE",
      scorePct: isLast ? newScorePct : lesson.scorePct,
    },
  });

  return NextResponse.json({
    isCorrect,
    expectedAnswer: section.checkAnswer,
    sectionTitle: section.title,
    completed: isLast,
    nextStep,
    totalSteps: sections.length,
    scorePct: isLast ? newScorePct : Math.round((totalCorrect / sections.length) * 100),
  });
}
