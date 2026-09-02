import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionStudent } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const student = await getSessionStudent();
  if (!student) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const session = await prisma.attemptSession.findUnique({
    where: { id: params.id },
    include: {
      problem: true,
      attempts: { orderBy: { attemptNumber: "asc" } },
      hintEvents: { orderBy: { requestedAt: "asc" } },
      confidenceChecks: { orderBy: { createdAt: "asc" } },
      reflections: { orderBy: { createdAt: "asc" } },
      explainAnswers: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!session || session.studentId !== student.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json(session);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const student = await getSessionStudent();
  if (!student) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const session = await prisma.attemptSession.findUnique({ where: { id: params.id } });
  if (!session || session.studentId !== student.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (session.status !== "ACTIVE") {
    return NextResponse.json({ error: "session_not_active" }, { status: 409 });
  }

  await prisma.attemptSession.update({
    where: { id: params.id },
    data: { status: "ABANDONED" },
  });
  return NextResponse.json({ ok: true });
}
