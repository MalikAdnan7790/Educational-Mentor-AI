import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionStudent } from "@/lib/auth";
import { missionCreateSchema } from "@/lib/validation";
import { generateMission } from "@/lib/ai/mission";

export const dynamic = "force-dynamic";

export async function GET() {
  const student = await getSessionStudent();
  if (!student) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const missions = await prisma.mission.findMany({
    where: { studentId: student.id },
    orderBy: { createdAt: "desc" },
    include: {
      steps: {
        orderBy: { order: "asc" },
        select: { id: true, kind: true, status: true, order: true },
      },
    },
  });

  return NextResponse.json(
    missions.map((m) => {
      const completed = m.steps.filter((s) => s.status === "COMPLETED").length;
      return {
        id: m.id,
        title: m.title,
        description: m.description,
        topic: m.topic,
        weaknessKey: m.weaknessKey,
        status: m.status,
        createdAt: m.createdAt,
        completedAt: m.completedAt,
        stepsTotal: m.steps.length,
        stepsCompleted: completed,
      };
    })
  );
}

export async function POST(req: Request) {
  const student = await getSessionStudent();
  if (!student) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const parsed = missionCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  // Find the mistake to repair: the given one, or the most frequent OPEN one
  const mistake = parsed.data.mistakeId
    ? await prisma.mistakeRecord.findFirst({
        where: { id: parsed.data.mistakeId, studentId: student.id },
      })
    : await prisma.mistakeRecord.findFirst({
        where: { studentId: student.id, status: "OPEN", occurrences: { gte: 2 } },
        orderBy: { occurrences: "desc" },
      });

  if (!mistake || mistake.occurrences < 2) {
    return NextResponse.json(
      { error: "no_recurring_mistake", message: "Missions unlock when a mistake repeats (2+ times)." },
      { status: 400 }
    );
  }

  // Reuse an existing ACTIVE mission for the same weakness instead of duplicating
  const existing = await prisma.mission.findFirst({
    where: { studentId: student.id, status: "ACTIVE", sourceMistakeId: mistake.id },
  });
  if (existing) {
    return NextResponse.json({ id: existing.id, reused: true }, { status: 200 });
  }

  const gen = await generateMission(
    {
      mistakeType: mistake.mistakeType,
      description: mistake.description,
      why: mistake.why ?? undefined,
      topic: mistake.topic,
      subjectKey: mistake.subjectKey ?? undefined,
      occurrences: mistake.occurrences,
    },
    student.educationLevel
  );

  if (!gen) {
    return NextResponse.json({ error: "generation_failed" }, { status: 503 });
  }

  const mission = await prisma.mission.create({
    data: {
      studentId: student.id,
      topic: mistake.topic ?? mistake.subjectKey ?? "General",
      title: gen.title,
      description: gen.description,
      weaknessKey: mistake.mistakeType,
      sourceMistakeId: mistake.id,
      steps: {
        create: [
          { order: 1, kind: "MINI_LESSON", content: gen.miniLesson, answer: null },
          { order: 2, kind: "PRACTICE_1", content: gen.practice1.question, answer: gen.practice1.answer },
          { order: 3, kind: "PRACTICE_2", content: gen.practice2.question, answer: gen.practice2.answer },
          { order: 4, kind: "CHALLENGE", content: gen.challenge.question, answer: gen.challenge.answer },
          { order: 5, kind: "RE_TEST", content: gen.reTest.question, answer: gen.reTest.answer },
        ],
      },
    },
    include: { steps: { orderBy: { order: "asc" } } },
  });

  const { sourceMistakeId: _, steps, ...safe } = mission;
  return NextResponse.json(
    {
      ...safe,
      steps: steps.map((s) => ({
        id: s.id,
        order: s.order,
        kind: s.kind,
        content: s.content,
        status: s.status,
        answer: s.status === "COMPLETED" ? s.answer : null,
      })),
    },
    { status: 201 }
  );
}
