import { chatCompletion, getModel } from "./client";
import { extractJson } from "./json";
import { coachReportResponseSchema, coachReportJsonSchema } from "./schemas";

export interface CoachReport {
  didWell: string[];
  struggledWith: string[];
  commonMistake: string;
  revisionConcept: string;
  recommendedPractice: string;
  recommendedDifficulty: "EASY" | "MEDIUM" | "HARD";
  nextTopic: string;
  confidenceNote: string | null;
}

export interface CoachReportSource {
  studentLevel: string;
  subjectKey: string | null;
  totals: {
    sessions: number;
    completed: number;
    revealed: number;
    abandoned: number;
    attempts: number;
  };
  firstAttemptAccuracyPct: number; // 0-100
  avgHintsPerSession: number;
  recent: {
    subject: string;
    topic: string;
    status: string;
    attempts: number;
    hints: number;
    mistake: string | null;
  }[];
  openMistakes: { mistakeType: string; description: string; occurrences: number }[];
  knowledge: { subject: string; topic: string; masteryPct: number }[];
  confidence: { highConfidenceWrong: number; lowConfidenceRight: number; total: number };
}

export async function generateCoachReport(
  source: CoachReportSource,
): Promise<CoachReport | null> {
  const resp = await chatCompletion<{ choices?: { message?: { content?: string } }[] }>({
    model: getModel(),
    messages: [
      {
        role: "system",
        content: `You are the student's AI learning coach. Write a short, warm, honest coach report based ONLY on the real performance data provided.
Hard rules:
- NEVER invent a statistic, score, or topic that is not in the data. If a list is empty, say so plainly instead of guessing.
- didWell and struggledWith: 1-3 items each, drawn from the actual sessions/mistakes/knowledge data.
- commonMistake: name the single recurring mistake pattern in the data (or "none yet" if there is none).
- revisionConcept: the one concept most worth revising right now.
- recommendedPractice: one concrete practice action the student can do today (1-2 sentences).
- recommendedDifficulty: the honest next difficulty given their accuracy.
- nextTopic: the most sensible next topic from their knowledge data.
- confidenceNote: if confidence data exists, compare stated confidence with actual results (over-confident when wrong, under-confident when right). Never shame — nudge gently. Null if there is no confidence data.
Tone: a coach who believes in the student and is honest about the work.`,
      },
      {
        role: "user",
        content: `Student level: ${source.studentLevel}
Subject focus: ${source.subjectKey ?? "all subjects"}

SESSION TOTALS: ${source.totals.sessions} sessions (${source.totals.completed} solved, ${source.totals.revealed} solution revealed, ${source.totals.abandoned} abandoned), ${source.totals.attempts} total attempts.
First-attempt accuracy: ${Math.round(source.firstAttemptAccuracyPct)}%
Average hints per session: ${source.avgHintsPerSession.toFixed(1)}

RECENT SESSIONS (newest first):
${source.recent.length
  ? source.recent
      .map(
        (s) =>
          `- ${s.subject} / ${s.topic}: ${s.status}, ${s.attempts} attempt(s), ${s.hints} hint(s)${s.mistake ? `, mistake: ${s.mistake}` : ""}`,
      )
      .join("\n")
  : "- none yet"}

OPEN MISTAKES (unresolved):
${source.openMistakes.length
  ? source.openMistakes.map((m) => `- ${m.mistakeType} (seen ${m.occurrences}x): ${m.description}`).join("\n")
  : "- none"}

TOPIC MASTERY:
${source.knowledge.length
  ? source.knowledge.map((k) => `- ${k.subject} / ${k.topic}: ${Math.round(k.masteryPct)}%`).join("\n")
  : "- no recorded topics yet"}

CONFIDENCE CHECKS: ${source.confidence.total} total — ${source.confidence.highConfidenceWrong} were high-confidence but wrong, ${source.confidence.lowConfidenceRight} were low-confidence but right.`,
      },
    ],
    response_format: { type: "json_schema", json_schema: { name: "coach_report", schema: coachReportJsonSchema, strict: true } },
    temperature: 0.4,
    max_tokens: 3000,
  });

  const raw = resp.choices?.[0]?.message?.content;
  if (!raw) return null;
  const parsed = coachReportResponseSchema.safeParse(extractJson(raw));
  return parsed.success ? parsed.data : null;
}
