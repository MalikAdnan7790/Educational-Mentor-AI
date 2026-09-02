import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionStudent } from "@/lib/auth";
import { computeMetrics } from "@/lib/scoring";

export const dynamic = "force-dynamic";

export async function GET() {
  const student = await getSessionStudent();
  if (!student) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const score = await prisma.independentScore.findUnique({ where: { studentId: student.id } });
  if (!score) {
    return NextResponse.json(
      computeMetrics({
        totalProblems: 0,
        solvedWithoutFull: 0,
        firstAttemptCorrect: 0,
        totalAttempts: 0,
        totalHints: 0,
        aiFreeAttempts: 0,
        aiFreeSuccess: 0,
        retrySuccesses: 0,
        retryOpportunities: 0,
        lastWeekAvgHints: 0,
        thisWeekAvgHints: 0,
      }),
    );
  }
  return NextResponse.json(
    computeMetrics({
      totalProblems: score.totalProblems,
      solvedWithoutFull: score.solvedWithoutFull,
      firstAttemptCorrect: score.firstAttemptCorrect,
      totalAttempts: score.totalAttempts,
      totalHints: score.totalHints,
      aiFreeAttempts: score.aiFreeAttempts,
      aiFreeSuccess: score.aiFreeSuccess,
      retrySuccesses: score.retrySuccesses,
      retryOpportunities: score.retryOpportunities,
      lastWeekAvgHints: score.lastWeekAvgHints,
      thisWeekAvgHints: score.thisWeekAvgHints,
    }),
  );
}
