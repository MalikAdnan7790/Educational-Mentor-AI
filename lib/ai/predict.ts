import { chatCompletion, getFastModel } from "./client";
import { extractJson } from "./json";
import {
  predictMistakeResponseSchema,
  predictMistakeJsonSchema,
} from "./schemas";

export interface MistakePrediction {
  likelyMistake: string;
  warning: string;
  tip: string;
}

export interface PredictSource {
  problemContent: string;
  topic: string;
  subject: string;
  difficulty: string;
  commonMistakes: { name: string; description: string }[];
  studentMistakes: { mistakeType: string; description: string; occurrences: number }[];
}

export async function predictMistake(
  source: PredictSource,
  language = "en"
): Promise<MistakePrediction | null> {
  const langName =
    { en: "English", ur: "Urdu (اردو)", roman: "Roman Urdu" }[language] ?? "English";

  const system = `You are a master teacher who knows exactly where students slip up.

You will receive a problem plus a profile of common mistakes for this subject and the specific mistakes this student has made before.

Your job: predict the ONE mistake this particular student is most likely to make on this problem, then warn them and give one concrete tip to avoid it.

Rules:
- Ground the prediction in the student's own mistake history first (if they keep making the same type of mistake, say so).
- If they have no history, use the subject's common mistakes + the problem itself.
- likelyMistake: one specific, concrete mistake (e.g. "forgetting to flip the inequality sign when multiplying by a negative"). Never generic ("careless errors").
- warning: 1-2 sentences, direct and personal ("You've done this 3 times before...").
- tip: one actionable thing to do BEFORE solving to avoid it.
- Do NOT give away the answer or any solution step.
- Output in ${langName}.`;

  const mistakesBlock =
    source.studentMistakes.length > 0
      ? source.studentMistakes
          .map(
            (m) =>
              `- ${m.mistakeType}: ${m.description} (happened ${m.occurrences} times)`
          )
          .join("\n")
      : "(no recorded mistakes yet)";

  const commonBlock =
    source.commonMistakes.length > 0
      ? source.commonMistakes
          .map((m) => `- ${m.name}: ${m.description}`)
          .join("\n")
      : "(no teacher profile available)";

  const user = `Problem:
${source.problemContent}

Subject: ${source.subject}
Topic: ${source.topic}
Difficulty: ${source.difficulty}

Common mistakes for this subject (from teacher profiles):
${commonBlock}

This student's recorded mistakes (their personal pattern):
${mistakesBlock}

Predict their most likely mistake on THIS problem.`;

  try {
    const resp = await chatCompletion<{ choices?: { message?: { content?: string } }[] }>({
      model: getFastModel(),
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "mistake_prediction",
          schema: predictMistakeJsonSchema,
          strict: true,
        },
      },
      temperature: 0.4,
      max_tokens: 3000,
    });

    const raw = resp.choices?.[0]?.message?.content;
    if (!raw) return null;
    const parsed = predictMistakeResponseSchema.safeParse(extractJson(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
