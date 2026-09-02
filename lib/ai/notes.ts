import { chatCompletion, getFastModel, isAIEnabled } from "./client";
import { extractJson } from "./json";
import { noteAnalysisResponseSchema, noteAnalysisJsonSchema } from "./schemas";

export interface NoteAnalysis {
  summary: string;
  keyPoints: string[];
  flashcards: { front: string; back: string }[];
}

/**
 * Summarize uploaded study material into a cached teaching pack:
 * summary, key points and flashcards.
 */
export async function analyzeNote(text: string, title: string): Promise<NoteAnalysis | null> {
  if (!isAIEnabled()) return null;

  const sample = text.length > 24_000 ? text.slice(0, 12_000) + "\n[...]\n" + text.slice(-8_000) : text;

  const resp = await chatCompletion<{ choices?: { message?: { content?: string } }[] }>({
    model: getFastModel(),
    messages: [
      {
        role: "system",
        content:
          "You are a teacher preparing study material for a student. Analyze their notes and produce a summary, key points and flashcards. Flashcard fronts must be self-contained questions or terms; backs must be concise answers. Produce 6-10 key points and 6-12 flashcards.",
      },
      { role: "user", content: `Note title: ${title}\n\n${sample}` },
    ],
    response_format: { type: "json_schema", json_schema: { name: "note_analysis", schema: noteAnalysisJsonSchema, strict: true } },
    temperature: 0.3,
    max_tokens: 3000,
  });

  const raw = resp.choices?.[0]?.message?.content;
  if (!raw) return null;

  const parsed = noteAnalysisResponseSchema.safeParse(extractJson(raw));
  if (!parsed.success) return null;
  return parsed.data;
}
