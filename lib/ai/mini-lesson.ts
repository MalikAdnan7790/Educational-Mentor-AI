import { chatCompletion, getFastModel } from "./client";
import { extractJson } from "./json";
import { miniLessonResponseSchema, miniLessonJsonSchema } from "./schemas";

export interface MiniLessonSection {
  title: string;
  content: string;
  checkQuestion: string;
  checkAnswer: string;
}

export interface MiniLessonData {
  topic: string;
  sections: MiniLessonSection[];
}

export async function generateMiniLesson(input: {
  subjectKey?: string;
  topic: string;
  sectionCount: number;
}): Promise<MiniLessonData | null> {
  const subject = input.subjectKey ? `Subject: ${input.subjectKey}` : "";

  const resp = await chatCompletion<{ choices?: { message?: { content?: string } }[] }>({
    model: getFastModel(),
    messages: [
      {
        role: "system",
        content:
          "You are a teacher creating a mini-lesson. Break the topic into 2-8 progressive sections. Each section teaches one concept clearly in 2-4 short paragraphs, then asks a quick check question to verify understanding. The checkAnswer should be the expected correct response (1-2 sentences). Keep language simple and engaging. Use examples and analogies. Build from basics to application.",
      },
      {
        role: "user",
        content: `${subject}\nTopic: ${input.topic}\nCreate exactly ${input.sectionCount} sections for this mini-lesson.`,
      },
    ],
    response_format: { type: "json_schema", json_schema: { name: "mini_lesson", schema: miniLessonJsonSchema, strict: true } },
    temperature: 0.5,
    max_tokens: 4000,
  });

  const raw = resp.choices?.[0]?.message?.content;
  if (!raw) return null;
  const parsed = miniLessonResponseSchema.safeParse(extractJson(raw));
  if (!parsed.success) return null;
  return parsed.data;
}
