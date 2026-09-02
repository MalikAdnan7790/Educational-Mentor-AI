import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionStudent } from "@/lib/auth";
import { generateCoachReport } from "@/lib/ai/coach";

export const dynamic = "force-dynamic";

export async function POST() {
  const student = await getSessionStudent();
  if (!student) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const [sessions, mistakeRecords, knowledge, confidenceChecks] = await Promise.all([
    prisma.attemptSession.findMany({
      where: { studentId: student.id },
      orderBy: { startedAt: "desc" },
      take: 10,
      include: {
        problem: { select: { subject: true, topic: true } },
        attempts: { select: { isCorrect: true, mistakeType: true } },
        hintEvents: { select: { id: true } },
      },
    }),
    prisma.mistakeRecord.findMany({
      where: { studentId: student.id, status: { in: ["OPEN", "REVIEWED"] } },
      orderBy: { occurrences: "desc" },
      take: 8,
    }),
    prisma.knowledgeRecord.findMany({
      where: { studentId: student.id },
      orderBy: { masteryPct: "asc" },
      take: 12,
    }),
    prisma.confidenceCheck.findMany({
      where: { studentId: student.id },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
  ]);

  const totalAttempts = sessions.reduce((n, s) => n + s.attempts.length, 0);
  const firstAttempts = sessions.filter((s) => s.attempts.length > 0);
  const firstAttemptAccuracyPct = firstAttempts.length
    ? (firstAttempts.filter((s) => s.attempts[0].isCorrect).length / firstAttempts.length) * 100
    : 0;
  const avgHintsPerSession = sessions.length
    ? sessions.reduce((n, s) => n + s.hintEvents.length, 0) / sessions.length
    : 0;

  const highConfidenceWrong = confidenceChecks.filter((c) => c.confidence >= 70 && !c.actualCorrect).length;
  const lowConfidenceRight = confidenceChecks.filter((c) => c.confidence <= 40 && c.actualCorrect).length;

  const report = await generateCoachReport({
    studentLevel: student.educationLevel,
    subjectKey: null,
    totals: {
      sessions: sessions.length,
      completed: sessions.filter((s) => s.status === "COMPLETED").length,
      revealed: sessions.filter((s) => s.status === "REVEALED").length,
      abandoned: sessions.filter((s) => s.status === "ABANDONED").length,
      attempts: totalAttempts,
    },
    firstAttemptAccuracyPct,
    avgHintsPerSession,
    recent: sessions.map((s) => ({
      subject: s.problem.subject,
      topic: s.problem.topic,
      status: s.status,
      attempts: s.attempts.length,
      hints: s.hintEvents.length,
      mistake: s.attempts.filter((a) => a.mistakeType !== "NONE").map((a) => a.mistakeType)[0] ?? null,
    })),
    openMistakes: mistakeRecords.map((m) => ({
      mistakeType: m.mistakeType,
      description: m.description,
      occurrences: m.occurrences,
    })),
    knowledge: knowledge.map((k) => ({
      subject: k.subjectKey,
      topic: k.topic,
      masteryPct: k.masteryPct,
    })),
    confidence: { highConfidenceWrong, lowConfidenceRight, total: confidenceChecks.length },
  });

  if (!report) {
    return NextResponse.json({ error: "generation_failed" }, { status: 503 });
  }

  return NextResponse.json(report);
}
