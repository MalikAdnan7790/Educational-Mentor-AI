import { z } from "zod";
import { getOpenAI, getFastModel } from "./client";
import { detectResponseSchema, detectJsonSchema } from "./schemas";
import { detectLanguage } from "@/lib/language";
import { prisma } from "@/lib/db";

import type { PedagogicalMode } from "./prompts";

export interface DetectionResult {
  language: "EN" | "UR" | "ROMAN_UR";
  educationLevel: "SCHOOL" | "COLLEGE" | "UNIVERSITY" | "PROFESSIONAL" | null;
  subjectKey: string | null;
  topic: string | null;
  intent: "ASK" | "PRACTICE" | "EXPLAIN" | "CHAT";
  difficulty: "EASY" | "MEDIUM" | "HARD" | null;
  pedagogicalMode: PedagogicalMode | null;
}

export async function detect(message: string): Promise<DetectionResult> {
  const localLang = detectLanguage(message);

  const client = getOpenAI();
  if (!client) {
    return {
      language: localLang,
      educationLevel: null,
      subjectKey: null,
      topic: null,
      intent: "ASK",
      difficulty: null,
      pedagogicalMode: null,
    };
  }

  try {
    const resp = await client.chat.completions.create({
      model: getFastModel(),
      messages: [
        {
          role: "system",
          content: `Analyze the student's message and detect:
1. language: EN (English), UR (Urdu script), ROMAN_UR (Urdu in Latin script like "mujhe samjhao")
2. educationLevel: SCHOOL, COLLEGE, UNIVERSITY, PROFESSIONAL (or null if unclear)
3. subjectKey: the most likely subject from the catalog below, or null
4. topic: a specific subtopic, or null
5. intent: ASK (asking a question), PRACTICE (wants problems), EXPLAIN (wants explanation), CHAT (casual)
6. difficulty: EASY, MEDIUM, HARD (or null)
7. pedagogicalMode: Infer the best teaching mode from the student's intent:
   - EXPLAIN: "explain X", "what is X", "help me understand"
   - PRACTICE: "give me problems", "let me practice"
   - HINT: "give me a hint", "I'm stuck"
   - QUIZ: "quiz me", "test me"
   - EXAM: "exam practice", "mock test"
   - STEP_SOLVER: "solve this step by step", "walk me through"
   - TEACHER_CHAT: casual subject questions, "tell me about"
   - REVISION: "review", "revise", "what did I learn"
   - null: if no specific mode is implied

Respond ONLY with the JSON object.`,
        },
        { role: "user", content: message },
      ],
      response_format: { type: "json_schema", json_schema: { name: "detect", schema: detectJsonSchema, strict: true } },
      temperature: 0.1,
      max_tokens: 200,
    });

    const raw = resp.choices[0]?.message?.content;
    if (!raw) throw new Error("Empty response");

    const parsed = detectResponseSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) throw new Error("Parse failed");

    const result = parsed.data;

    // Fuzzy-match subjectKey against catalog
    const matchedKey = await matchSubjectKey(result.subjectKey);

    return {
      ...result,
      language: result.language || localLang,
      subjectKey: matchedKey,
    };
  } catch {
    return {
      language: localLang,
      educationLevel: null,
      subjectKey: null,
      topic: null,
      intent: "ASK",
      difficulty: null,
      pedagogicalMode: null,
    };
  }
}

async function matchSubjectKey(raw: string | null): Promise<string | null> {
  if (!raw) return null;

  const normalized = raw.toLowerCase().replace(/[^a-z0-9]/g, "");
  const subjects = await prisma.subjectCatalog.findMany({
    where: { isActive: true },
    select: { key: true, name: true },
  });

  // Exact match on key
  const exact = subjects.find((s) => s.key === raw);
  if (exact) return exact.key;

  // Key without underscores matches
  const keyMatch = subjects.find((s) => s.key.replace(/[^a-z0-9]/g, "") === normalized);
  if (keyMatch) return keyMatch.key;

  // Name contains the raw input
  const nameMatch = subjects.find(
    (s) => s.name.toLowerCase().includes(raw.toLowerCase()) || raw.toLowerCase().includes(s.name.toLowerCase()),
  );
  if (nameMatch) return nameMatch.key;

  // Word overlap
  const rawWords = new Set(raw.toLowerCase().split(/\s+/));
  let bestMatch: { key: string; score: number } | null = null;
  for (const s of subjects) {
    const nameWords = s.name.toLowerCase().split(/\s+/);
    let score = 0;
    for (const w of nameWords) {
      if (rawWords.has(w)) score++;
    }
    if (score > 0 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { key: s.key, score };
    }
  }
  return bestMatch?.key ?? null;
}
