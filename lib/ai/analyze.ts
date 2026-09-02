import { getOpenAI, getFastModel, chatCompletion } from "./client";
import { extractJson } from "./json";
import { analyzeResponseSchema, analyzeJsonSchema } from "./schemas";
import type OpenAI from "openai";

export interface AnalyzeInput {
  imageBase64?: string | null;
  content?: string | null;
  stuckOn?: string | null;
}

export type AnalyzeResult = {
  subject: string;
  topic: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  questionDetected: string;
  studentAttempt: string | null;
  studentMistake: string | null;
  stuckAt: string | null;
  watchOuts: string[];
  suggestedFirstStep: string;
  aiPowered: boolean;
};

/**
 * Ask My Teacher: read an uploaded homework image / typed question and
 * extract the question, subject, topic, difficulty, the student's attempt,
 * the likely mistake, and where they're stuck. Never reveals the answer.
 */
export async function analyzeQuestionUpload(input: AnalyzeInput): Promise<AnalyzeResult> {
  const client = getOpenAI();
  if (!client) return heuristicAnalysis(input);

  const textPart = [
    input.content ? `Student says: ${input.content}` : null,
    input.stuckOn ? `Where they are stuck: ${input.stuckOn}` : null,
    !input.content && !input.stuckOn ? "The student uploaded an image of their work." : null,
  ]
    .filter(Boolean)
    .join("\n");

  const userContent: ({ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } })[] = [
    { type: "text", text: textPart },
  ];
  if (input.imageBase64) {
    userContent.push({ type: "image_url", image_url: { url: input.imageBase64 } });
  }

  try {
    const resp = await chatCompletion<OpenAI.Chat.Completions.ChatCompletion>({
      model: getFastModel(),
      messages: [
        {
          role: "system",
          content: `You are an expert teacher analyzing a student's uploaded homework or question (image and/or text).
Extract the structure of the problem. Rules:
- "questionDetected": restate the exact question the student needs to solve.
- "studentAttempt": what the student has tried so far, or null if none visible.
- "studentMistake": the mistake you can already see in their attempt, or null. Describe WHAT went wrong, never insult the student.
- "stuckAt": the specific point where they got stuck, or null.
- "watchOuts": 1-3 short common-mistake warnings for this type of problem ("⚠️ Watch out" items). Empty array if none.
- "suggestedFirstStep": ONE small first step they could take. Must NOT give away the answer.
- "difficulty": EASY, MEDIUM, or HARD.
NEVER include the solution or final answer in any field.`,
        },
        { role: "user", content: userContent },
      ],
      response_format: {
        type: "json_schema",
        json_schema: { name: "analyze_upload", schema: analyzeJsonSchema, strict: true },
      },
      temperature: 0.2,
      max_tokens: 3000,
    });

    const raw = resp.choices[0]?.message?.content;
    if (!raw) return heuristicAnalysis(input);

    const parsed = analyzeResponseSchema.safeParse(extractJson<unknown>(raw));
    if (!parsed.success) return heuristicAnalysis(input);

    const data = parsed.data;
    return {
      ...data,
      stuckAt: data.stuckAt ?? input.stuckOn ?? null,
      aiPowered: true,
    };
  } catch (err) {
    console.error("[analyze] AI call failed:", err instanceof Error ? err.message : err);
    return heuristicAnalysis(input);
  }
}

function heuristicAnalysis(input: AnalyzeInput): AnalyzeResult {
  const text = (input.content ?? "").trim();
  return {
    subject: "General",
    topic: "General problem-solving",
    difficulty: "MEDIUM",
    questionDetected: text || "Question in the uploaded image",
    studentAttempt: null,
    studentMistake: null,
    stuckAt: input.stuckOn ?? null,
    watchOuts: [],
    suggestedFirstStep: "Start by writing down what the question is asking and what you already know.",
    aiPowered: false,
  };
}
