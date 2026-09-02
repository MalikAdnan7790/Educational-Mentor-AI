/**
 * Independence scoring + achievement engine.
 *
 * Computes the five headline metrics:
 *   - Independent Success Rate
 *   - First-Attempt Accuracy
 *   - Hint Dependency (avg hints per problem)
 *   - Retry Success Rate
 *   - AI-Free Success Rate
 *
 * And evaluates the achievement catalogue on each completion event.
 */

import { prisma } from "@/lib/db";
import type { Attempt, Difficulty, LearningMode } from "@prisma/client";

export interface IndependenceMetrics {
  independentSuccessRate: number; // problems solved without full assistance
  firstAttemptAccuracy: number;   // first-attempt correct / total problems
  hintDependency: number;         // avg hints per problem
  retrySuccessRate: number;       // recovered after 1st failure / problems that needed retry
  aiFreeSuccessRate: number;      // ai-free correct / ai-free attempts
  totalProblems: number;
  solvedWithoutFull: number;
  totalAttempts: number;
  totalHints: number;
  lastWeekAvgHints: number;
  thisWeekAvgHints: number;
  hintDeltaPct: number;           // percent change last week → this week
}

export function computeMetrics(score: {
  totalProblems: number;
  solvedWithoutFull: number;
  firstAttemptCorrect: number;
  totalAttempts: number;
  totalHints: number;
  aiFreeAttempts: number;
  aiFreeSuccess: number;
  retrySuccesses: number;
  retryOpportunities: number;
  lastWeekAvgHints: number;
  thisWeekAvgHints: number;
}): IndependenceMetrics {
  const d = (n: number, d: number) => (d === 0 ? 0 : n / d);

  const independentSuccessRate = d(score.solvedWithoutFull, score.totalProblems);
  const firstAttemptAccuracy = d(score.firstAttemptCorrect, score.totalProblems);
  const hintDependency = d(score.totalHints, score.totalProblems);
  const retrySuccessRate = d(score.retrySuccesses, score.retryOpportunities);
  const aiFreeSuccessRate = d(score.aiFreeSuccess, score.aiFreeAttempts);

  const last = score.lastWeekAvgHints;
  const cur = score.thisWeekAvgHints;
  const hintDeltaPct = last === 0 ? (cur === 0 ? 0 : -100) : ((last - cur) / last) * 100;

  return {
    independentSuccessRate,
    firstAttemptAccuracy,
    hintDependency,
    retrySuccessRate,
    aiFreeSuccessRate,
    totalProblems: score.totalProblems,
    solvedWithoutFull: score.solvedWithoutFull,
    totalAttempts: score.totalAttempts,
    totalHints: score.totalHints,
    lastWeekAvgHints: last,
    thisWeekAvgHints: cur,
    hintDeltaPct,
  };
}

export async function recomputeStudentScore(studentId: string) {
  const sessions = await prisma.attemptSession.findMany({
    where: { studentId, status: { in: ["COMPLETED", "REVEALED"] } },
    include: {
      attempts: { orderBy: { attemptNumber: "asc" } },
      hintEvents: true,
    },
  });

  const now = new Date();
  const startOfThisWeek = startOfWeek(now);
  const startOfLastWeek = new Date(startOfThisWeek.getTime() - 7 * 86400000);

  let totalHints = 0;
  let firstAttemptCorrect = 0;
  let solvedWithoutFull = 0;
  let totalAttempts = 0;
  let aiFreeAttempts = 0;
  let aiFreeSuccess = 0;
  let retrySuccesses = 0;
  let retryOpportunities = 0;
  let hintsThisWeek = 0;
  let hintsLastWeek = 0;
  let sessionsThisWeek = 0;
  let sessionsLastWeek = 0;

  for (const s of sessions) {
    const attempts: Attempt[] = s.attempts;
    totalAttempts += attempts.length;
    totalHints += s.hintEvents.length;

    const first = attempts[0];
    if (first?.isCorrect) firstAttemptCorrect += 1;

    // "solved without full assistance" = finished with status COMPLETED
    // and final hint level < 6 (i.e. didn't need the full solution reveal)
    const neededFullReveal = s.status === "REVEALED" || s.currentHintLevel >= 6;
    if (s.status === "COMPLETED" && !neededFullReveal) solvedWithoutFull += 1;

    if (s.isAiFree) {
      aiFreeAttempts += 1;
      if (s.status === "COMPLETED") aiFreeSuccess += 1;
    }

    if (first && !first.isCorrect) {
      retryOpportunities += 1;
      const laterCorrect = attempts.slice(1).some((a) => a.isCorrect);
      if (laterCorrect || (s.status === "COMPLETED" && attempts.at(-1)?.isCorrect)) {
        retrySuccesses += 1;
      }
    }

    for (const h of s.hintEvents) {
      if (h.requestedAt >= startOfThisWeek) hintsThisWeek += 1;
      else if (h.requestedAt >= startOfLastWeek) hintsLastWeek += 1;
    }

    const finished = s.finishedAt ?? s.startedAt;
    if (finished >= startOfThisWeek) sessionsThisWeek += 1;
    else if (finished >= startOfLastWeek) sessionsLastWeek += 1;
  }

  // Average hints per session finished within each week window
  const thisWeekAvgHints = hintsThisWeek / Math.max(1, sessionsThisWeek);
  const lastWeekAvgHints = hintsLastWeek / Math.max(1, sessionsLastWeek);

  const data = {
    totalProblems: sessions.length,
    solvedWithoutFull,
    firstAttemptCorrect,
    totalAttempts,
    totalHints,
    aiFreeAttempts,
    aiFreeSuccess,
    retrySuccesses,
    retryOpportunities,
    lastWeekAvgHints,
    thisWeekAvgHints,
  };

  await prisma.independentScore.upsert({
    where: { studentId },
    update: data,
    create: { studentId, ...data },
  });

  return computeMetrics({ ...data, lastWeekAvgHints, thisWeekAvgHints });
}

function startOfWeek(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = (day + 6) % 7; // Monday as start of week
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - diff);
  return date;
}

export const ACHIEVEMENT_CATALOGUE = [
  {
    key: "first_independent",
    title: "First Independent Solution",
    description: "Solved your first problem without full assistance.",
    icon: "🧠",
  },
  {
    key: "streak_5",
    title: "Independent Streak",
    description: "Solved 5 problems independently in a row.",
    icon: "🔥",
  },
  {
    key: "hint_saver",
    title: "Hint Saver",
    description: "Solved 10 problems using fewer than 2 hints each.",
    icon: "💡",
  },
  {
    key: "thinker",
    title: "Thinker",
    description: "Solved 20 problems without requiring the full solution.",
    icon: "🚀",
  },
  {
    key: "self_learner",
    title: "Self Learner",
    description: "Maintained 80%+ independent success for 7 days.",
    icon: "🏆",
  },
  {
    key: "first_attempt_ace",
    title: "Sharp Shooter",
    description: "Got 5 first-attempt correct answers.",
    icon: "🎯",
  },
  {
    key: "ai_free_master",
    title: "AI-Free Master",
    description: "Solved 5 AI-Free challenges.",
    icon: "🛡️",
  },
] as const;

export async function evaluateAchievements(studentId: string) {
  const score = await prisma.independentScore.findUnique({ where: { studentId } });
  const sessions = await prisma.attemptSession.findMany({
    where: { studentId, status: { in: ["COMPLETED", "REVEALED"] } },
    include: { attempts: { orderBy: { attemptNumber: "asc" } }, hintEvents: true },
    orderBy: { finishedAt: "desc" },
  });

  const earned = new Set<string>();

  if (score && score.solvedWithoutFull >= 1) earned.add("first_independent");

  // streak of 5 solved-without-full in chronological order
  const chronological = [...sessions].reverse();
  let streak = 0;
  for (const s of chronological) {
    const neededFull = s.status === "REVEALED" || s.currentHintLevel >= 6;
    if (s.status === "COMPLETED" && !neededFull) {
      streak += 1;
      if (streak >= 5) earned.add("streak_5");
    } else {
      streak = 0;
    }
  }

  if (score && score.totalHints < score.solvedWithoutFull * 2 && score.solvedWithoutFull >= 10) {
    earned.add("hint_saver");
  }
  if (score && score.solvedWithoutFull >= 20) earned.add("thinker");

  if (score && score.totalProblems >= 5) {
    const rate = score.solvedWithoutFull / score.totalProblems;
    if (rate >= 0.8) earned.add("self_learner");
  }
  if (score && score.firstAttemptCorrect >= 5) earned.add("first_attempt_ace");
  if (score && score.aiFreeSuccess >= 5) earned.add("ai_free_master");

  const existing = await prisma.achievement.findMany({ where: { studentId } });
  const have = new Set(existing.map((a) => a.key));
  const newOnes: { key: string; title: string; description: string }[] = [];

  for (const key of earned) {
    if (have.has(key)) continue;
    const def = ACHIEVEMENT_CATALOGUE.find((a) => a.key === key);
    if (!def) continue;
    await prisma.achievement.create({
      data: {
        studentId,
        key: def.key,
        title: def.title,
        description: def.description,
      },
    });
    newOnes.push({ key: def.key, title: def.title, description: def.description });
  }

  return newOnes;
}

/**
 * Independent Mode adaptation rules.
 * Called when a session completes to adjust the student's defaults.
 */
export function adaptDifficulty(
  independentSuccessRate: number,
  currentDifficulty: Difficulty
): { difficulty: Difficulty; hintCeiling: number } {
  if (independentSuccessRate >= 0.8) {
    return { difficulty: "HARD", hintCeiling: 3 };
  }
  if (independentSuccessRate >= 0.6) {
    return { difficulty: "MEDIUM", hintCeiling: 4 };
  }
  // Keep the student from stalling — nudge easier if they're stuck
  if (currentDifficulty !== "EASY") {
    return { difficulty: "EASY", hintCeiling: 5 };
  }
  return { difficulty: "EASY", hintCeiling: 5 };
}

/**
 * When should the Adaptive engine promote a student to Independent Mode?
 */
export function shouldPromoteToIndependent(metrics: IndependenceMetrics): boolean {
  return (
    metrics.totalProblems >= 10 &&
    metrics.independentSuccessRate >= 0.65 &&
    metrics.firstAttemptAccuracy >= 0.4 &&
    metrics.hintDependency <= 2.5
  );
}

export function recommendedNextMode(
  currentMode: LearningMode,
  metrics: IndependenceMetrics
): LearningMode {
  if (currentMode === "DEPENDENT" && metrics.totalProblems >= 5 && metrics.firstAttemptAccuracy >= 0.3) {
    return "GUIDED";
  }
  if (currentMode === "GUIDED" && shouldPromoteToIndependent(metrics)) return "INDEPENDENT";
  if (currentMode === "ADAPTIVE" && shouldPromoteToIndependent(metrics)) return "INDEPENDENT";
  return currentMode;
}
