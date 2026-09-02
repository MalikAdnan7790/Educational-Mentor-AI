import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createSessionSchema } from "@/lib/validation";
import { getSessionStudent } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const student = await getSessionStudent();
  if (!student) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = createSessionSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input", details: parsed.error.flatten() }, { status: 400 });
  }
  const { problemId, mode, isAiFree } = parsed.data;

  const problem = await prisma.problem.findUnique({ where: { id: problemId } });
  if (!problem) return NextResponse.json({ error: "problem_not_found" }, { status: 404 });

  const session = await prisma.attemptSession.create({
    data: { studentId: student.id, problemId, mode, isAiFree, status: "ACTIVE" },
  });

  return NextResponse.json(session, { status: 201 });
}

export async function GET() {
  const student = await getSessionStudent();
  if (!student) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const sessions = await prisma.attemptSession.findMany({
    where: { studentId: student.id },
    orderBy: { startedAt: "desc" },
    include: {
      problem: true,
      _count: { select: { attempts: true, hintEvents: true } },
    },
    take: 50,
  });
  return NextResponse.json(sessions);
}
