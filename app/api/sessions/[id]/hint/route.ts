import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionStudent } from "@/lib/auth";
import { generateHintContent } from "@/lib/ai/evaluate";
import { HINT_LEVELS } from "@/lib/independent-engine";

export const dynamic = "force-dynamic";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const student = await getSessionStudent();
  if (!student) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const session = await prisma.attemptSession.findUnique({
    where: { id: params.id },
    include: { problem: true, _count: { select: { attempts: true } } },
  });
  if (!session || session.studentId !== student.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (session.status !== "ACTIVE") {
    return NextResponse.json({ error: "session_not_active" }, { status: 409 });
  }

  // AI-Free mode: hints locked before first attempt
  if (session.isAiFree && session._count.attempts === 0) {
    return NextResponse.json({ error: "hints_locked_ai_free" }, { status: 403 });
  }

  const nextLevel = Math.min(HINT_LEVELS.FULL_SOLUTION, session.currentHintLevel + 1);

  const hint = await generateHintContent(session.problem, nextLevel);

  await prisma.hintEvent.create({
    data: {
      sessionId: session.id,
      studentId: session.studentId,
      level: hint.level,
      content: hint.content,
    },
  });

  await prisma.attemptSession.update({
    where: { id: session.id },
    data: { currentHintLevel: hint.level },
  });

  return NextResponse.json({ hint });
}
