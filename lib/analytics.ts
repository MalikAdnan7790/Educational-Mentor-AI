import { prisma } from "@/lib/db";

// ─── AI Dependency ─────────────────────────────────────────────────
// Weighted formula: how dependent is the student on AI assistance?
// Lower = more independent. Range 0–100.

export interface AIDependencyResult {
  score: number; // 0..100 (0 = fully independent)
  breakdown: {
    hintUsage: number;
    fullExplanations: number;
    reveals: number;
    firstAttemptAccuracy: number;
    aiFreeSuccess: number;
  };
  thisWeek: number;
  lastWeek: number;
  trend: "improving" | "stable" | "declining";
}

export async function getAIDependency(studentId: string): Promise<AIDependencyResult> {
  const now = new Date();
  const startOfThisWeek = startOfWeek(now);
  const startOfLastWeek = new Date(startOfThisWeek.getTime() - 7 * 86400000);

  const [sessionsThisWeek, sessionsLastWeek, score] = await Promise.all([
    prisma.attemptSession.findMany({
      where: { studentId, startedAt: { gte: startOfThisWeek }, status: { in: ["COMPLETED", "REVEALED"] } },
      include: { attempts: true, hintEvents: true },
    }),
    prisma.attemptSession.findMany({
      where: { studentId, startedAt: { gte: startOfLastWeek, lt: startOfThisWeek }, status: { in: ["COMPLETED", "REVEALED"] } },
      include: { attempts: true, hintEvents: true },
    }),
    prisma.independentScore.findUnique({ where: { studentId } }),
  ]);

  // Chat dependency: full explanations and hint-level from messages
  const chatMessages = await prisma.message.findMany({
    where: {
      conversation: { studentId },
      role: "ASSISTANT",
      createdAt: { gte: startOfLastWeek },
    },
    select: { hintLevel: true, wasFullExplanation: true, createdAt: true },
  });

  const chatThisWeek = chatMessages.filter((m) => m.createdAt >= startOfThisWeek);
  const chatLastWeek = chatMessages.filter((m) => m.createdAt >= startOfLastWeek && m.createdAt < startOfThisWeek);

  // Compute scores
  const overallScore = computeDependencyScore(
    score?.totalProblems ?? 0,
    score?.totalHints ?? 0,
    score?.firstAttemptCorrect ?? 0,
    chatMessages.filter((m) => m.wasFullExplanation).length,
    chatMessages.filter((m) => m.hintLevel >= 5).length,
  );

  const thisWeekScore = computeDependencyScore(
    sessionsThisWeek.length,
    sessionsThisWeek.reduce((acc, s) => acc + s.hintEvents.length, 0),
    sessionsThisWeek.filter((s) => s.attempts[0]?.isCorrect).length,
    chatThisWeek.filter((m) => m.wasFullExplanation).length,
    chatThisWeek.filter((m) => m.hintLevel >= 5).length,
  );

  const lastWeekScore = computeDependencyScore(
    sessionsLastWeek.length,
    sessionsLastWeek.reduce((acc, s) => acc + s.hintEvents.length, 0),
    sessionsLastWeek.filter((s) => s.attempts[0]?.isCorrect).length,
    chatLastWeek.filter((m) => m.wasFullExplanation).length,
    chatLastWeek.filter((m) => m.hintLevel >= 5).length,
  );

  const trend: "improving" | "stable" | "declining" =
    lastWeekScore - thisWeekScore > 5 ? "improving"
    : thisWeekScore - lastWeekScore > 5 ? "declining"
    : "stable";

  return {
    score: overallScore,
    breakdown: {
      hintUsage: score ? (score.totalHints / Math.max(1, score.totalProblems)) * 100 : 0,
      fullExplanations: chatMessages.filter((m) => m.wasFullExplanation).length,
      reveals: chatMessages.filter((m) => m.hintLevel >= 6).length,
      firstAttemptAccuracy: score ? (score.firstAttemptCorrect / Math.max(1, score.totalProblems)) * 100 : 0,
      aiFreeSuccess: score ? (score.aiFreeSuccess / Math.max(1, score.aiFreeAttempts)) * 100 : 0,
    },
    thisWeek: thisWeekScore,
    lastWeek: lastWeekScore,
    trend,
  };
}

function computeDependencyScore(
  totalProblems: number,
  totalHints: number,
  firstAttemptCorrect: number,
  fullExplanations: number,
  reveals: number,
): number {
  if (totalProblems === 0 && fullExplanations === 0) return 50;

  const hintFactor = totalProblems > 0 ? (totalHints / totalProblems) * 15 : 0;
  const accuracyFactor = totalProblems > 0 ? (1 - firstAttemptCorrect / totalProblems) * 25 : 0;
  const explainFactor = fullExplanations * 5;
  const revealFactor = reveals * 10;

  return Math.min(100, Math.max(0, hintFactor + accuracyFactor + explainFactor + revealFactor));
}

// ─── Mistake DNA ───────────────────────────────────────────────────

export interface MistakeDNAResult {
  total: number;
  byType: { type: string; count: number; pct: number }[];
  recent: { id: string; mistakeType: string; description: string; subjectKey: string | null; topic: string | null; occurrences: number; lastSeenAt: Date }[];
  topPatterns: { type: string; description: string; occurrences: number }[];
}

export async function getMistakeDNA(studentId: string): Promise<MistakeDNAResult> {
  const mistakes = await prisma.mistakeRecord.findMany({
    where: { studentId, status: { in: ["OPEN", "REVIEWED"] } },
    orderBy: { occurrences: "desc" },
  });

  const total = mistakes.reduce((acc, m) => acc + m.occurrences, 0);

  const typeMap = new Map<string, number>();
  for (const m of mistakes) {
    typeMap.set(m.mistakeType, (typeMap.get(m.mistakeType) ?? 0) + m.occurrences);
  }

  const byType = Array.from(typeMap.entries())
    .map(([type, count]) => ({ type, count, pct: total > 0 ? (count / total) * 100 : 0 }))
    .sort((a, b) => b.count - a.count);

  const recent = mistakes.slice(0, 10).map((m) => ({
    id: m.id,
    mistakeType: m.mistakeType,
    description: m.description,
    subjectKey: m.subjectKey,
    topic: m.topic,
    occurrences: m.occurrences,
    lastSeenAt: m.lastSeenAt,
  }));

  const topPatterns = mistakes.slice(0, 5).map((m) => ({
    type: m.mistakeType,
    description: m.description,
    occurrences: m.occurrences,
  }));

  return { total, byType, recent, topPatterns };
}

// ─── Knowledge vs Confidence ───────────────────────────────────────

export interface KnowledgeConfidenceItem {
  topic: string;
  subjectKey: string;
  masteryPct: number;
  confidencePct: number;
  classification: "under-confident" | "over-confident" | "balanced";
}

export interface KnowledgeConfidenceResult {
  items: KnowledgeConfidenceItem[];
  summary: {
    underConfident: number;
    overConfident: number;
    balanced: number;
  };
}

export async function getKnowledgeConfidence(studentId: string): Promise<KnowledgeConfidenceResult> {
  const [knowledge, confidence] = await Promise.all([
    prisma.knowledgeRecord.findMany({ where: { studentId } }),
    prisma.confidenceRecord.findMany({
      where: { studentId },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  // Group confidence by topic, take most recent
  const confMap = new Map<string, number>();
  for (const c of confidence) {
    const key = `${c.subjectKey ?? ""}:${c.topic ?? ""}`;
    if (!confMap.has(key)) confMap.set(key, c.confidencePct);
  }

  const items: KnowledgeConfidenceItem[] = [];
  let underConfident = 0;
  let overConfident = 0;
  let balanced = 0;

  for (const k of knowledge) {
    const confKey = `${k.subjectKey}:${k.topic}`;
    const confPct = confMap.get(confKey) ?? 50;
    const gap = confPct - k.masteryPct;

    let classification: "under-confident" | "over-confident" | "balanced";
    if (gap > 20) {
      classification = "over-confident";
      overConfident++;
    } else if (gap < -20) {
      classification = "under-confident";
      underConfident++;
    } else {
      classification = "balanced";
      balanced++;
    }

    items.push({
      topic: k.topic,
      subjectKey: k.subjectKey,
      masteryPct: k.masteryPct,
      confidencePct: confPct,
      classification,
    });
  }

  return {
    items,
    summary: { underConfident, overConfident, balanced },
  };
}

// ─── Next Best Action ──────────────────────────────────────────────

export interface NextActionResult {
  id: string;
  title: string;
  description: string;
  why: string;
  estMinutes: number;
  subjectKey: string | null;
  topic: string | null;
  actionType: string;
  targetRef: string | null;
}

export async function getNextBestAction(studentId: string): Promise<NextActionResult | null> {
  const pending = await prisma.nextBestAction.findFirst({
    where: { studentId, status: "PENDING" },
    orderBy: { createdAt: "desc" },
  });

  if (pending) {
    return {
      id: pending.id,
      title: pending.title,
      description: pending.description,
      why: pending.why,
      estMinutes: pending.estMinutes,
      subjectKey: pending.subjectKey,
      topic: pending.topic,
      actionType: pending.actionType,
      targetRef: pending.targetRef,
    };
  }

  // Generate a new one based on weaknesses
  return generateNextAction(studentId);
}

async function generateNextAction(studentId: string): Promise<NextActionResult | null> {
  const [mistakes, knowledge, score] = await Promise.all([
    prisma.mistakeRecord.findMany({
      where: { studentId, status: "OPEN" },
      orderBy: { occurrences: "desc" },
      take: 3,
    }),
    prisma.knowledgeRecord.findMany({
      where: { studentId },
      orderBy: { masteryPct: "asc" },
      take: 3,
    }),
    prisma.independentScore.findUnique({ where: { studentId } }),
  ]);

  let title: string;
  let description: string;
  let why: string;
  let estMinutes: number;
  let actionType: string;
  let subjectKey: string | null = null;
  let topic: string | null = null;

  if (mistakes.length > 0 && mistakes[0].occurrences >= 3) {
    const m = mistakes[0];
    title = `Review: ${m.mistakeType.replace(/_/g, " ")}`;
    description = `You've made this type of mistake ${m.occurrences} times. Let's work through it together.`;
    why = "Recurring mistakes are the fastest way to improve — targeted practice locks in the fix.";
    estMinutes = 10;
    actionType = "PRACTICE";
    subjectKey = m.subjectKey;
    topic = m.topic;
  } else if (knowledge.length > 0 && knowledge[0].masteryPct < 40) {
    const k = knowledge[0];
    title = `Strengthen: ${k.topic}`;
    description = `Your mastery of ${k.topic} is at ${Math.round(k.masteryPct)}%. A focused session will help.`;
    why = "Building weak areas has the highest impact on overall performance.";
    estMinutes = 15;
    actionType = "CHALLENGE";
    subjectKey = k.subjectKey;
    topic = k.topic;
  } else if (score && score.aiFreeAttempts < score.totalProblems * 0.2) {
    title = "Try an AI-Free challenge";
    description = "Challenge yourself to solve a problem without AI assistance.";
    why = "AI-Free practice builds real problem-solving muscles.";
    estMinutes = 10;
    actionType = "PRACTICE";
  } else {
    title = "Explain a concept back";
    description = "Pick a topic you studied recently and explain it in your own words.";
    why = "Explaining concepts reveals gaps that practice alone can miss.";
    estMinutes = 5;
    actionType = "EXPLAIN_BACK";
  }

  const created = await prisma.nextBestAction.create({
    data: {
      studentId,
      title,
      description,
      why,
      estMinutes,
      subjectKey,
      topic,
      actionType,
    },
  });

  return {
    id: created.id,
    title: created.title,
    description: created.description,
    why: created.why,
    estMinutes: created.estMinutes,
    subjectKey: created.subjectKey,
    topic: created.topic,
    actionType: created.actionType,
    targetRef: created.targetRef,
  };
}

// ─── Learning DNA (observable behavior only) ──────────────────────
// Every trait is backed by counted events. No psychological claims:
// we only describe what the student actually did.

export interface LearningDnaTrait {
  label: string;
  icon: string;
  evidence: string;
}

export interface LearningDNAResult {
  hasData: boolean;
  traits: LearningDnaTrait[];
  stats: {
    totalProblems: number;
    totalAttempts: number;
    firstAttemptAccuracy: number; // pct
    avgHintsPerProblem: number;
    retrySuccessRate: number; // pct
    aiFreeSuccessRate: number; // pct
    explainBackCount: number;
    explainBackAvg: number | null; // pct
    chatConversations: number;
    activeDays: number;
    topSubjects: { subject: string; count: number }[];
  };
  topMistakes: { type: string; count: number }[];
  summaryLine: string | null;
}

export async function getLearningDNA(studentId: string): Promise<LearningDNAResult> {
  const [score, explainBacks, mistakes, conversations, sessions] = await Promise.all([
    prisma.independentScore.findUnique({ where: { studentId } }),
    prisma.explainBack.findMany({
      where: { studentId },
      select: { understandingScore: true },
    }),
    prisma.mistakeRecord.findMany({
      where: { studentId, status: { in: ["OPEN", "REVIEWED"] } },
      select: { mistakeType: true, occurrences: true },
    }),
    prisma.conversation.count({ where: { studentId } }),
    prisma.attemptSession.findMany({
      where: { studentId },
      select: {
        startedAt: true,
        isAiFree: true,
        status: true,
        problem: { select: { subject: true } },
      },
    }),
  ]);

  const totalProblems = score?.totalProblems ?? 0;
  const firstAttemptAccuracy = totalProblems > 0 && score ? (score.firstAttemptCorrect / totalProblems) * 100 : 0;
  const avgHints = totalProblems > 0 && score ? score.totalHints / totalProblems : 0;
  const retryOpps = score?.retryOpportunities ?? 0;
  const retryRate = retryOpps > 0 && score ? (score.retrySuccesses / retryOpps) * 100 : 0;
  const aiFreeAttempts = score?.aiFreeAttempts ?? 0;
  const aiFreeRate = aiFreeAttempts > 0 && score ? (score.aiFreeSuccess / aiFreeAttempts) * 100 : 0;

  const explainBackCount = explainBacks.length;
  const explainBackAvg =
    explainBackCount > 0
      ? explainBacks.reduce((acc, e) => acc + e.understandingScore, 0) / explainBackCount
      : null;

  const mistakeTypeMap = new Map<string, number>();
  for (const m of mistakes) {
    mistakeTypeMap.set(m.mistakeType, (mistakeTypeMap.get(m.mistakeType) ?? 0) + m.occurrences);
  }
  const topMistakes = Array.from(mistakeTypeMap.entries())
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  const subjectMap = new Map<string, number>();
  for (const s of sessions) {
    const key = s.problem.subject;
    subjectMap.set(key, (subjectMap.get(key) ?? 0) + 1);
  }
  const topSubjects = Array.from(subjectMap.entries())
    .map(([subject, count]) => ({ subject, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  const activeDays = new Set(
    sessions.map((s) => s.startedAt.toISOString().slice(0, 10)),
  ).size;

  const traits: LearningDnaTrait[] = [];
  if (totalProblems >= 3 && score) {
    if (firstAttemptAccuracy >= 60) {
      traits.push({
        label: "Sharp first attempts",
        icon: "🎯",
        evidence: `${score.firstAttemptCorrect} of ${totalProblems} problems solved correctly on the first try.`,
      });
    }
    if (retryOpps >= 2 && retryRate >= 50) {
      traits.push({
        label: "Persistent retrier",
        icon: "🔄",
        evidence: `After a first miss, you came back and solved ${score.retrySuccesses} of ${retryOpps} problems.`,
      });
    }
    if (avgHints <= 1.5) {
      traits.push({
        label: "Hint-sparing",
        icon: "💡",
        evidence: `You averaged ${avgHints.toFixed(1)} hints per problem across ${totalProblems} problems.`,
      });
    }
    if ((score.aiFreeSuccess ?? 0) >= 2) {
      traits.push({
        label: "AI-free solver",
        icon: "🛡️",
        evidence: `You solved ${score.aiFreeSuccess} problems in AI-Free mode.`,
      });
    }
  }
  if (explainBackCount >= 2) {
    traits.push({
      label: "Explains ideas back",
      icon: "🗣️",
      evidence: `You explained ${explainBackCount} topics back in your own words.`,
    });
  }

  const hasData = totalProblems > 0 || explainBackCount > 0 || conversations > 0;
  const summaryLine = hasData
    ? `Based on ${totalProblems} problem${totalProblems === 1 ? "" : "s"}, ${explainBackCount} explain-back${explainBackCount === 1 ? "" : "s"}, and ${conversations} chat session${conversations === 1 ? "" : "s"}.`
    : null;

  return {
    hasData,
    traits,
    stats: {
      totalProblems,
      totalAttempts: score?.totalAttempts ?? 0,
      firstAttemptAccuracy,
      avgHintsPerProblem: avgHints,
      retrySuccessRate: retryRate,
      aiFreeSuccessRate: aiFreeRate,
      explainBackCount,
      explainBackAvg,
      chatConversations: conversations,
      activeDays,
      topSubjects,
    },
    topMistakes,
    summaryLine,
  };
}

// ─── I KNOW → I CAN → I MASTER stages ─────────────────────────────
// Stage per topic, derived from evidence the system has actually seen:
//   I KNOW   — exposure exists (studied/practiced) but no demonstrated solve
//   I CAN    — solved at least once, or mastery evidence >= 40
//   I MASTER — mastery >= 75 AND depth shown (explained back well, or solved AI-free)

export type MasteryStage = "I_KNOW" | "I_CAN" | "I_MASTER";

export interface MasteryStageItem {
  subjectKey: string;
  topic: string;
  stage: MasteryStage;
  masteryPct: number;
  progressPct: number;
  evidence: {
    problemsAttempted: number;
    problemsCorrect: number;
    hintsUsed: number;
    explainBacks: number;
    bestExplainScore: number | null;
    aiFreeCorrect: number;
  };
}

export interface MasteryStagesResult {
  items: MasteryStageItem[];
  counts: { iKnow: number; iCan: number; iMaster: number };
}

interface TopicAgg {
  subjectKey: string;
  topic: string;
  mastery: number | null; // from KnowledgeRecord
  problemsAttempted: number;
  problemsCorrect: number;
  hintsUsed: number;
  explainBacks: number;
  bestExplainScore: number | null;
  aiFreeCorrect: number;
  challengeScores: number[];
}

export async function getMasteryStages(studentId: string): Promise<MasteryStagesResult> {
  const [knowledge, sessions, explainBacks, challenges] = await Promise.all([
    prisma.knowledgeRecord.findMany({ where: { studentId } }),
    prisma.attemptSession.findMany({
      where: { studentId },
      include: {
        problem: { select: { subject: true, topic: true } },
        attempts: { select: { isCorrect: true } },
        hintEvents: { select: { id: true } },
      },
    }),
    prisma.explainBack.findMany({
      where: { studentId },
      select: { subjectKey: true, topic: true, understandingScore: true },
    }),
    prisma.challenge.findMany({
      where: { studentId, status: "GRADED" },
      select: { subjectKey: true, topic: true, score: true },
    }),
  ]);

  const topics = new Map<string, TopicAgg>();
  const keyOf = (subjectKey: string | null | undefined, topic: string) =>
    `${(subjectKey ?? "").toLowerCase()}::${topic.toLowerCase()}`;

  for (const k of knowledge) {
    const key = keyOf(k.subjectKey, k.topic);
    const agg = topics.get(key) ?? emptyAgg(k.subjectKey, k.topic);
    agg.mastery = k.masteryPct;
    topics.set(key, agg);
  }

  for (const s of sessions) {
    const subjectKey = s.problem.subject.toLowerCase();
    const key = keyOf(subjectKey, s.problem.topic);
    const agg = topics.get(key) ?? emptyAgg(subjectKey, s.problem.topic);
    agg.problemsAttempted += 1;
    if (s.attempts.some((a) => a.isCorrect)) agg.problemsCorrect += 1;
    agg.hintsUsed += s.hintEvents.length;
    if (s.isAiFree && s.attempts.some((a) => a.isCorrect)) agg.aiFreeCorrect += 1;
    topics.set(key, agg);
  }

  for (const e of explainBacks) {
    const key = keyOf(e.subjectKey, e.topic);
    const agg = topics.get(key) ?? emptyAgg(e.subjectKey, e.topic);
    agg.explainBacks += 1;
    agg.bestExplainScore = Math.max(agg.bestExplainScore ?? 0, e.understandingScore);
    topics.set(key, agg);
  }

  for (const c of challenges) {
    if (!c.subjectKey || !c.topic) continue;
    const key = keyOf(c.subjectKey, c.topic);
    const agg = topics.get(key) ?? emptyAgg(c.subjectKey, c.topic);
    if (c.score !== null) agg.challengeScores.push(c.score);
    topics.set(key, agg);
  }

  const items: MasteryStageItem[] = [];
  let iKnow = 0;
  let iCan = 0;
  let iMaster = 0;

  for (const agg of topics.values()) {
    // Synthesize mastery when only problem-practice evidence exists
    let mastery = agg.mastery;
    if (mastery === null) {
      const evidenceScores = [...agg.challengeScores];
      if (agg.problemsAttempted > 0) {
        const ratio = agg.problemsCorrect / agg.problemsAttempted;
        evidenceScores.push(agg.problemsCorrect > 0 ? 40 + ratio * 40 : 15);
      }
      mastery = evidenceScores.length > 0 ? evidenceScores.reduce((a, b) => a + b, 0) / evidenceScores.length : 10;
    }

    const depthShown =
      (agg.bestExplainScore !== null && agg.bestExplainScore >= 70) ||
      (agg.aiFreeCorrect >= 1 && agg.problemsCorrect >= 2) ||
      agg.aiFreeCorrect >= 2;

    let stage: MasteryStage;
    if (mastery >= 75 && depthShown) stage = "I_MASTER";
    else if (mastery >= 40 || agg.problemsCorrect >= 1) stage = "I_CAN";
    else stage = "I_KNOW";

    const progressPct =
      stage === "I_MASTER"
        ? 100
        : stage === "I_CAN"
          ? Math.min(100, Math.max(0, ((mastery - 40) / 35) * 100))
          : Math.min(100, (mastery / 40) * 100);

    if (stage === "I_MASTER") iMaster++;
    else if (stage === "I_CAN") iCan++;
    else iKnow++;

    items.push({
      subjectKey: agg.subjectKey,
      topic: agg.topic,
      stage,
      masteryPct: mastery,
      progressPct,
      evidence: {
        problemsAttempted: agg.problemsAttempted,
        problemsCorrect: agg.problemsCorrect,
        hintsUsed: agg.hintsUsed,
        explainBacks: agg.explainBacks,
        bestExplainScore: agg.bestExplainScore,
        aiFreeCorrect: agg.aiFreeCorrect,
      },
    });
  }

  // Weakest topics first so the student sees what to work on
  const order: Record<MasteryStage, number> = { I_KNOW: 0, I_CAN: 1, I_MASTER: 2 };
  items.sort((a, b) => order[a.stage] - order[b.stage] || a.masteryPct - b.masteryPct);

  return { items, counts: { iKnow, iCan, iMaster } };
}

function emptyAgg(subjectKey: string | null | undefined, topic: string): TopicAgg {
  return {
    subjectKey: (subjectKey ?? "").toLowerCase(),
    topic,
    mastery: null,
    problemsAttempted: 0,
    problemsCorrect: 0,
    hintsUsed: 0,
    explainBacks: 0,
    bestExplainScore: null,
    aiFreeCorrect: 0,
    challengeScores: [],
  };
}

// ─── Mastery evidence writer ──────────────────────────────────────
// Blends a new 0-100 evidence score into the topic's KnowledgeRecord.
// Used by problem-session completion (and reusable by future flows).

export async function applyMasteryEvidence(
  studentId: string,
  subjectKey: string,
  topic: string,
  score: number,
): Promise<void> {
  // Subject keys are stored lowercase everywhere so records from different
  // sources (sessions, explain-backs, challenges) upsert onto the same row.
  subjectKey = subjectKey.toLowerCase();
  const existing = await prisma.knowledgeRecord.findUnique({
    where: { studentId_subjectKey_topic: { studentId, subjectKey, topic } },
  });

  await prisma.knowledgeRecord.upsert({
    where: { studentId_subjectKey_topic: { studentId, subjectKey, topic } },
    update: {
      masteryPct: existing ? (existing.masteryPct + score) / 2 : score,
      evidenceCount: { increment: 1 },
    },
    create: {
      studentId,
      subjectKey,
      topic,
      masteryPct: score,
      evidenceCount: 1,
    },
  });
}

function startOfWeek(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = (day + 6) % 7;
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - diff);
  return date;
}
