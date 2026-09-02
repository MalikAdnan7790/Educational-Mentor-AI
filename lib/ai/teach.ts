import { chatCompletion, getFastModel, getModel } from "./client";
import { extractJson } from "./json";
import {
  teachPromptResponseSchema,
  teachPromptJsonSchema,
  teachMeResponseSchema,
  teachMeJsonSchema,
} from "./schemas";

export interface TeachPrompt {
  prompt: string;
}

export interface TeachMeEvaluation {
  accuracyPct: number;
  missingConcepts: string[];
  misconceptions: string[];
  clarityPct: number;
  exampleQualityPct: number;
  understandingScore: number;
  feedback: string;
}

export async function generateTeachPrompt(input: {
  subjectKey: string | null;
  topic: string;
  studentLevel: string;
}): Promise<TeachPrompt | null> {
  const resp = await chatCompletion<{ choices?: { message?: { content?: string } }[] }>({
    model: getFastModel(),
    messages: [
      {
        role: "system",
        content: `You are a curious student asking a classmate to teach you a concept.
Write one short invitation (1-2 sentences, max ~40 words) asking them to teach you the given topic as if you were their student. Speak as "I". You may pick one specific aspect you most want explained. Friendly, genuine, never condescending. Do not explain the concept yourself.`,
      },
      {
        role: "user",
        content: `Subject: ${input.subjectKey ?? "General"}
Topic to be taught to me: ${input.topic}
My level: ${input.studentLevel}`,
      },
    ],
    response_format: { type: "json_schema", json_schema: { name: "teach_prompt", schema: teachPromptJsonSchema, strict: true } },
    temperature: 0.8,
    max_tokens: 3000,
  });

  const raw = resp.choices?.[0]?.message?.content;
  if (!raw) return null;
  const parsed = teachPromptResponseSchema.safeParse(extractJson(raw));
  return parsed.success ? parsed.data : null;
}

export async function evaluateTeachBack(input: {
  subjectKey: string | null;
  topic: string;
  explanation: string;
}): Promise<TeachMeEvaluation | null> {
  const resp = await chatCompletion<{ choices?: { message?: { content?: string } }[] }>({
    model: getModel(),
    messages: [
      {
        role: "system",
        content: `A student just acted as the teacher and explained a concept to you. Evaluate their teaching honestly but fairly:
- accuracyPct: factual correctness of what they said (0-100).
- missingConcepts: key ideas a good explanation of this topic should have covered but they left out (short phrases; empty array if nothing important is missing).
- misconceptions: things they stated that are actually wrong (short phrases with the correction implied; empty array if none).
- clarityPct: how clear and well-structured the explanation is (0-100).
- exampleQualityPct: quality of any example or analogy they gave, 50 if they gave none at all.
- understandingScore: overall demonstrated understanding (0-100), weighting accuracy most heavily.
- feedback: 2-4 sentences, warm and specific. Start from what they got right, then name the single most valuable improvement — e.g. "You understand the main idea, but your explanation didn't mention…". Never shame. Teach like a mentor reviewing a promising student teacher.`,
      },
      {
        role: "user",
        content: `Subject: ${input.subjectKey ?? "General"}
Topic they were teaching: ${input.topic}
Their explanation:
${input.explanation}`,
      },
    ],
    response_format: { type: "json_schema", json_schema: { name: "teach_me_eval", schema: teachMeJsonSchema, strict: true } },
    temperature: 0.3,
    max_tokens: 3000,
  });

  const raw = resp.choices?.[0]?.message?.content;
  if (!raw) return null;
  const parsed = teachMeResponseSchema.safeParse(extractJson(raw));
  return parsed.success ? parsed.data : null;
}
