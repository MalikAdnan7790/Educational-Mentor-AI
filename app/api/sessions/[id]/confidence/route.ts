import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionStudent } from "@/lib/auth";
import { confidenceSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const student = await getSessionStudent();
  if (!student) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = confidenceSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input", details: parsed.error.flatten() }, { status: 400 });
  }

  const session = await prisma.attemptSession.findUnique({
    where: { id: params.id },
    include: { attempts: { orderBy: { attemptNumber: "desc" }, take: 1 } },
  });
  if (!session || session.studentId !== student.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const check = await prisma.confidenceCheck.create({
    data: {
      sessionId: session.id,
      studentId: session.studentId,
      attemptId: session.attempts[0]?.id ?? null,
      confidence: parsed.data.confidence,
      actualCorrect: !!session.attempts[0]?.isCorrect,
    },
  });

  // Also record in ConfidenceRecord for knowledge-confidence analytics
  const problem = await prisma.problem.findUnique({
    where: { id: session.problemId },
    select: { subject: true, topic: true },
  });

  await prisma.confidenceRecord.create({
    data: {
      studentId: session.studentId,
      subjectKey: problem?.subject ?? null,
      topic: problem?.topic ?? null,
      confidencePct: parsed.data.confidence,
      actualCorrect: !!session.attempts[0]?.isCorrect,
      context: "session",
    },
  });

  return NextResponse.json(check, { status: 201 });
}
