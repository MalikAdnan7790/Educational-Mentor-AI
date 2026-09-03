"use client";

import { useEffect, useState, useCallback } from "react";
import { ScoreRing } from "@/components/dashboard/score-ring";
import { MetricsGrid } from "@/components/dashboard/metrics-grid";
import { HintTrend } from "@/components/dashboard/hint-trend";
import { AchievementsList } from "@/components/dashboard/achievements-list";
import { DependencyMeter } from "@/components/dashboard/dependency-meter";
import { MistakeDNA } from "@/components/dashboard/mistake-dna";
import { KnowledgeConfidence } from "@/components/dashboard/knowledge-confidence";
import { NextActionCard } from "@/components/dashboard/next-action-card";
import { ErrorJournal } from "@/components/dashboard/error-journal";
import { LearningDna } from "@/components/dashboard/learning-dna";
import { MasteryStages } from "@/components/dashboard/mastery-stages";
import { LearningPathCard } from "@/components/dashboard/learning-path-card";
import { StudyStreakCard } from "@/components/dashboard/study-streak-card";
import type { IndependenceMetrics } from "@/lib/scoring";

interface Achievement {
  key: string;
  title: string;
  description: string;
  unlockedAt: string;
}

interface AIDependency {
  score: number;
  thisWeek: number;
  lastWeek: number;
  trend: "improving" | "stable" | "declining";
}

interface MistakeDNAData {
  total: number;
  byType: { type: string; count: number; pct: number }[];
  recent: any[];
}

interface KCData {
  items: { topic: string; subjectKey: string; masteryPct: number; confidencePct: number; classification: string }[];
  summary: { underConfident: number; overConfident: number; balanced: number };
}

interface NextAction {
  id: string;
  title: string;
  description: string;
  why: string;
  estMinutes: number;
  actionType: string;
}

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lessonsCompleted: number;
  roadmapsActive: number;
  conversationsTotal: number;
}

interface LearningDnaData {
  dna: {
    hasData: boolean;
    traits: { label: string; icon: string; evidence: string }[];
    stats: {
      totalProblems: number;
      totalAttempts: number;
      firstAttemptAccuracy: number;
      avgHintsPerProblem: number;
      retrySuccessRate: number;
      aiFreeSuccessRate: number;
      explainBackCount: number;
      explainBackAvg: number | null;
      chatConversations: number;
      activeDays: number;
      topSubjects: { subject: string; count: number }[];
    };
    topMistakes: { type: string; count: number }[];
    summaryLine: string | null;
  };
  stages: {
    items: {
      subjectKey: string;
      topic: string;
      stage: "I_KNOW" | "I_CAN" | "I_MASTER";
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
    }[];
    counts: { iKnow: number; iCan: number; iMaster: number };
  };
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<IndependenceMetrics | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [dependency, setDependency] = useState<AIDependency | null>(null);
  const [mistakeDNA, setMistakeDNA] = useState<MistakeDNAData | null>(null);
  const [kcData, setKcData] = useState<KCData | null>(null);
  const [nextAction, setNextAction] = useState<NextAction | null>(null);
  const [dnaData, setDnaData] = useState<LearningDnaData | null>(null);
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [mRes, aRes, dRes, dnaRes, kcRes, naRes, ldnaRes, streakRes] = await Promise.all([
        fetch("/api/independence"),
        fetch("/api/achievements"),
        fetch("/api/analytics/ai-dependency"),
        fetch("/api/analytics/mistake-dna"),
        fetch("/api/analytics/knowledge-confidence"),
        fetch("/api/next-action"),
        fetch("/api/analytics/learning-dna"),
        fetch("/api/analytics/streak"),
      ]);
      if (mRes.ok) setMetrics(await mRes.json());
      if (aRes.ok) setAchievements(await aRes.json());
      if (dRes.ok) setDependency(await dRes.json());
      if (dnaRes.ok) setMistakeDNA(await dnaRes.json());
      if (kcRes.ok) setKcData(await kcRes.json());
      if (naRes.ok) {
        const data = await naRes.json();
        if (data?.id) setNextAction(data);
      }
      if (ldnaRes.ok) setDnaData(await ldnaRes.json());
      if (streakRes.ok) setStreakData(await streakRes.json());
      setLoading(false);
    })();
  }, []);

  const completeAction = useCallback(async () => {
    if (!nextAction) return;
    const res = await fetch(`/api/next-action/${nextAction.id}/complete`, { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      setNextAction(data?.id ? data : null);
    }
  }, [nextAction]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="skeleton h-7 w-40" />
          <div className="skeleton mt-2 h-4 w-64" />
        </div>
        <div className="skeleton h-28 w-full" />
        <div className="skeleton h-20 w-full" />
        <div className="grid gap-6 md:grid-cols-2">
          <div className="skeleton h-48 w-full" />
          <div className="skeleton h-48 w-full" />
        </div>
        <div className="skeleton h-32 w-full" />
        <div className="grid gap-6 md:grid-cols-2">
          <div className="skeleton h-40 w-full" />
          <div className="skeleton h-40 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink-900">My Learning</h1>
        <p className="text-sm text-ink-500 mt-0.5">Track your progress and find what to work on next.</p>
      </div>

      {/* Next Best Action */}
      {nextAction && (
        <NextActionCard
          id={nextAction.id}
          title={nextAction.title}
          description={nextAction.description}
          why={nextAction.why}
          estMinutes={nextAction.estMinutes}
          actionType={nextAction.actionType}
          onComplete={completeAction}
        />
      )}

      {/* Study Streak + Activity */}
      {streakData && <StudyStreakCard data={streakData} />}

      {/* Independence + AI Dependency */}
      <div className="grid gap-6 md:grid-cols-2">
        {metrics && (
          <div className="card flex flex-col items-center gap-6 p-6 sm:flex-row sm:items-start">
            <ScoreRing
              value={metrics.independentSuccessRate}
              size={140}
              label="Independence"
              sublabel={`${metrics.solvedWithoutFull} / ${metrics.totalProblems}`}
            />
            <div className="flex-1">
              <MetricsGrid
                metrics={[
                  {
                    label: "AI-Free Success",
                    value: `${Math.round(metrics.aiFreeSuccessRate * 100)}%`,
                    icon: "🛡️",
                    tone: metrics.aiFreeSuccessRate >= 0.5 ? "mint" : "amber",
                  },
                  {
                    label: "Avg Hints",
                    value: metrics.hintDependency.toFixed(1),
                    icon: "💡",
                    tone: metrics.hintDependency <= 2 ? "mint" : "amber",
                  },
                  {
                    label: "First-Attempt",
                    value: `${Math.round(metrics.firstAttemptAccuracy * 100)}%`,
                    icon: "🎯",
                    tone: metrics.firstAttemptAccuracy >= 0.5 ? "mint" : "amber",
                  },
                  {
                    label: "Retry Success",
                    value: `${Math.round(metrics.retrySuccessRate * 100)}%`,
                    icon: "🔄",
                    tone: metrics.retrySuccessRate >= 0.6 ? "mint" : "amber",
                  },
                ]}
              />
            </div>
          </div>
        )}

        {dependency && (
          <DependencyMeter
            score={dependency.score}
            trend={dependency.trend}
            thisWeek={dependency.thisWeek}
            lastWeek={dependency.lastWeek}
          />
        )}
      </div>

      {/* Learning Path */}
      <LearningPathCard />

      {/* Hint Trend */}
      {metrics && (
        <HintTrend
          lastWeek={metrics.lastWeekAvgHints}
          thisWeek={metrics.thisWeekAvgHints}
          deltaPct={metrics.hintDeltaPct}
        />
      )}

      {/* Learning DNA + Mastery Journey */}
      {dnaData && (
        <div className="grid gap-6 md:grid-cols-2">
          <LearningDna
            hasData={dnaData.dna.hasData}
            traits={dnaData.dna.traits}
            stats={dnaData.dna.stats}
            topMistakes={dnaData.dna.topMistakes}
            summaryLine={dnaData.dna.summaryLine}
          />
          <MasteryStages items={dnaData.stages.items} counts={dnaData.stages.counts} />
        </div>
      )}

      {/* Mistake DNA + Knowledge vs Confidence */}
      <div className="grid gap-6 md:grid-cols-2">
        {mistakeDNA && <MistakeDNA total={mistakeDNA.total} byType={mistakeDNA.byType} />}
        {mistakeDNA && <ErrorJournal mistakes={mistakeDNA.recent} />}
      </div>

      {kcData && <KnowledgeConfidence items={kcData.items as any} summary={kcData.summary} />}

      {/* Achievements */}
      <AchievementsList earned={achievements} />
    </div>
  );
}
