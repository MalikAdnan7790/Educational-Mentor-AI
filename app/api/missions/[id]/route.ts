import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionStudent } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const student = await getSessionStudent();
  if (!student) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const mission = await prisma.mission.findFirst({
    where: { id, studentId: student.id },
    include: { steps: { orderBy: { order: "asc" } } },
  });
  if (!mission) return NextResponse.json({ error: "not_found" }, { status: 404 });

  return NextResponse.json({
    id: mission.id,
    title: mission.title,
    description: mission.description,
    topic: mission.topic,
    weaknessKey: mission.weaknessKey,
    status: mission.status,
    createdAt: mission.createdAt,
    completedAt: mission.completedAt,
    steps: mission.steps.map((s) => ({
      id: s.id,
      order: s.order,
      kind: s.kind,
      content: s.content,
      status: s.status,
      attempts: s.attempts,
      studentAnswer: s.studentAnswer,
      score: s.score,
      analysis: s.analysisJson ? JSON.parse(s.analysisJson) : null,
      // canonical answer only revealed once the step is passed
      answer: s.status === "COMPLETED" ? s.answer : null,
    })),
  });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const student = await getSessionStudent();
  if (!student) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const mission = await prisma.mission.findFirst({
    where: { id, studentId: student.id, status: "ACTIVE" },
  });
  if (!mission) return NextResponse.json({ error: "not_found" }, { status: 404 });

  await prisma.mission.update({
    where: { id },
    data: { status: "ABANDONED" },
  });

  return NextResponse.json({ ok: true });
}
