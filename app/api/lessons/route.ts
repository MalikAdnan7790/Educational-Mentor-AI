import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionStudent } from "@/lib/auth";
import { generateMiniLesson } from "@/lib/ai/mini-lesson";
import { z } from "zod";

export const dynamic = "force-dynamic";

const generateSchema = z.object({
  subjectKey: z.string().optional(),
  topic: z.string().min(1),
  sectionCount: z.number().min(2).max(8).default(4),
});

export async function GET() {
  const student = await getSessionStudent();
  if (!student) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const lessons = await prisma.miniLesson.findMany({
    where: { studentId: student.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json({
    lessons: lessons.map((l) => ({
      id: l.id,
      topic: l.topic,
      subjectKey: l.subjectKey,
      currentStep: l.currentStep,
      status: l.status,
      scorePct: l.scorePct,
      createdAt: l.createdAt,
      sections: JSON.parse(l.sectionsJson),
    })),
  });
}

export async function POST(req: Request) {
  const student = await getSessionStudent();
  if (!student) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const parsed = generateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input", details: parsed.error.flatten() }, { status: 400 });
  }

  const { subjectKey, topic, sectionCount } = parsed.data;

  const lesson = await generateMiniLesson({ subjectKey, topic, sectionCount });
  if (!lesson) {
    return NextResponse.json({ error: "generation_failed" }, { status: 502 });
  }

  const saved = await prisma.miniLesson.create({
    data: {
      studentId: student.id,
      topic: lesson.topic,
      subjectKey: subjectKey ?? null,
      sectionsJson: JSON.stringify(lesson.sections),
    },
  });

  return NextResponse.json({
    id: saved.id,
    topic: saved.topic,
    subjectKey: saved.subjectKey,
    currentStep: saved.currentStep,
    status: saved.status,
    scorePct: saved.scorePct,
    createdAt: saved.createdAt,
    sections: lesson.sections,
  });
}
