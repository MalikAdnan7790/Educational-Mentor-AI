import { chatCompletion, getModel } from "./client";
import { extractJson } from "./json";
import {
  learningPathResponseSchema,
  learningPathJsonSchema,
} from "./schemas";

export interface LearningPath {
  currentLevel: string;
  currentTopic: string;
  weakPrerequisite: string | null;
  practice: string;
  nextTopic: string;
  challenge: string;
  rationale: string;
}

export interface PathInput {
  subjectKey: string;
  knowledge: { topic: string; masteryPct: number; attempts: number }[];
  mistakes: { mistakeType: string; description: string; occurrences: number }[];
  educationLevel: string;
  language?: string;
}

export async function generateLearningPath(
  input: PathInput
): Promise<LearningPath | null> {
  const langName =
    { en: "English", ur: "Urdu (اردو)", roman: "Roman Urdu" }[input.language ?? "en"] ?? "English";

  const system = `You are a curriculum strategist building a personal learning path for one student.

You receive their mastery percentages per topic and their recurring mistakes for ONE subject.

Rules:
- currentLevel: honest stage label for where they actually are (e.g. "Foundation builder", "Confident intermediate").
- currentTopic: the topic they should be working on RIGHT NOW (weakest area that still matters).
- weakPrerequisite: if any underlying skill needed for currentTopic is shaky (mastery < 50 or a mistake pattern points to it), name it here. Otherwise null. NEVER let a student skip a weak prerequisite — the path must repair foundations first.
- practice: one concrete practice activity for currentTopic, doable today.
- nextTopic: what comes AFTER currentTopic is mastered (can only be advanced if prerequisites are solid).
- challenge: one slightly-hard problem idea that stretches them without being discouraging.
- rationale: 2-3 sentences explaining WHY this order, referencing their actual data.
- Output in ${langName}.`;

  const knowledgeBlock =
    input.knowledge.length > 0
      ? input.knowledge
          .map(
            (k) =>
              `- ${k.topic}: ${k.masteryPct}% mastery (from ${k.attempts} scored attempt${k.attempts === 1 ? "" : "s"})`
          )
          .join("\n")
      : "(no scored topics yet — they are just starting this subject)";

  const mistakeBlock =
    input.mistakes.length > 0
      ? input.mistakes
          .map(
            (m) =>
              `- ${m.mistakeType}: ${m.description} (${m.occurrences} times)`
          )
          .join("\n")
      : "(no recurring mistakes recorded)";

  const user = `Subject: ${input.subjectKey}
Student education level: ${input.educationLevel}

Topic mastery:
${knowledgeBlock}

Recurring mistakes:
${mistakeBlock}

Build their learning path. Repair foundations before advancing.`;

  try {
    const resp = await chatCompletion<{ choices?: { message?: { content?: string } }[] }>({
      model: getModel(),
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "learning_path",
          schema: learningPathJsonSchema,
          strict: true,
        },
      },
      temperature: 0.4,
      max_tokens: 3000,
    });

    const raw = resp.choices?.[0]?.message?.content;
    if (!raw) return null;
    const parsed = learningPathResponseSchema.safeParse(extractJson(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
