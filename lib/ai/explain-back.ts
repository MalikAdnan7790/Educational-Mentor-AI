import { z } from "zod";
import { getOpenAI, getFastModel } from "./client";
import { explainBackResponseSchema, explainBackJsonSchema } from "./schemas";

export interface ExplainBackResult {
  accuracyPct: number;
  completenessPct: number;
  reasoningPct: number;
  understandingScore: number;
  misconceptions: { name: string; description: string }[];
  feedback: string;
}

export async function analyzeExplainBack(
  studentExplanation: string,
  subjectKey: string | null,
  topic: string,
  originalContext: string,
): Promise<ExplainBackResult> {
  const client = getOpenAI();

  if (!client) {
    return fallbackResult();
  }

  try {
    const resp = await client.chat.completions.create({
      model: getFastModel(),
      messages: [
        {
          role: "system",
          content: `You evaluate a student's explanation of a concept they just learned.
Score their understanding on three dimensions (0-100):
- accuracyPct: factual correctness
- completenessPct: coverage of key aspects
- reasoningPct: quality of reasoning/logic
- understandingScore: overall understanding (weighted average)

Identify any misconceptions as {name, description} pairs.
Give constructive feedback (2-3 sentences) highlighting what they got right and what to improve.`,
        },
        {
          role: "user",
          content: `Subject: ${subjectKey || "General"}\nTopic: ${topic}\n\nContext (what was taught):\n${originalContext.slice(0, 2000)}\n\nStudent's explanation:\n${studentExplanation}`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: { name: "explain_back", schema: explainBackJsonSchema, strict: true },
      },
      temperature: 0.2,
      max_tokens: 500,
    });

    const raw = resp.choices[0]?.message?.content;
    if (!raw) return fallbackResult();

    const parsed = explainBackResponseSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return fallbackResult();

    return parsed.data;
  } catch {
    return fallbackResult();
  }
}

function fallbackResult(): ExplainBackResult {
  return {
    accuracyPct: 0,
    completenessPct: 0,
    reasoningPct: 0,
    understandingScore: 0,
    misconceptions: [],
    feedback: "AI analysis is unavailable right now. Try again later.",
  };
}
