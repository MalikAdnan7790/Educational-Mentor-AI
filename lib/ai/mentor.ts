import { getOpenAI, getModel, chatCompletion } from "./client";
import { buildSystemPrompt } from "./prompts";
import { prisma } from "@/lib/db";
import { retrieveNoteContext } from "@/lib/rag";
import type { LearningMode, LanguagePref, EducationLevel } from "@prisma/client";

const META_SENTINEL = "<<<META>>>";

interface MentorStreamOpts {
  conversationId: string;
  studentId: string;
  mode: LearningMode;
  language: LanguagePref;
  isAiFree: boolean;
  subjectKey?: string | null;
  topic?: string | null;
  educationLevel?: EducationLevel;
  userMessage: string;
  imageBase64?: string | null;
  teacherActionDirective?: string | null;
  hintLevel?: number;
  wasFullExplanation?: boolean;
}

export interface MentorMeta {
  hintLevel?: number;
  wasFullExplanation?: boolean;
  topic?: string | null;
  checkQuestion?: string;
}

export async function streamMentorReply(
  opts: MentorStreamOpts,
): Promise<AsyncGenerator<string>> {
  const client = getOpenAI();

  if (!client) {
    return (async function* () {
      yield "AI mentor is not configured. Set OPENAI_API_KEY or OPENAI_BASE_URL (for local models like Ollama) to enable AI-powered guidance.";
    })();
  }

  // Build conversation history (last 10 messages)
  const history = await prisma.message.findMany({
    where: { conversationId: opts.conversationId },
    orderBy: { createdAt: "asc" },
    take: 20,
  });

  const messages: ({ role: "system" | "user" | "assistant"; content: string } | {
    role: "user";
    content: ({ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } })[];
  })[] = [];

  // System prompt
  const teacherProfile = opts.subjectKey
    ? await prisma.teacherProfile.findFirst({
        where: { subject: { key: opts.subjectKey } },
      })
    : null;

  const studentContext = await buildStudentContext(opts.studentId);

  // Knowledge-base retrieval: when the student's uploaded notes are relevant
  // to the current question, they take priority over general knowledge.
  const noteContext = await retrieveNoteContext(
    opts.studentId,
    [opts.userMessage, opts.topic].filter(Boolean).join(" "),
  );

  const systemPrompt = buildSystemPrompt({
    mode: opts.mode,
    isAiFree: opts.isAiFree,
    language: opts.language,
    educationLevel: opts.educationLevel,
    teacherStyle: teacherProfile?.style,
    teacherFocus: safeJsonParse(teacherProfile?.focusJson),
    teacherRules: safeJsonParse(teacherProfile?.rulesJson),
    teacherCommonMistakes: safeJsonParse(teacherProfile?.commonMistakesJson),
    subjectKey: opts.subjectKey,
    topic: opts.topic,
    studentContext,
  });

  messages.push({ role: "system", content: noteContext ? `${systemPrompt}\n\n${noteContext}` : systemPrompt });

  // History (strip META sentinels, truncate to 2000 chars each)
  for (const msg of history.slice(-10)) {
    const content = stripMeta(msg.content).slice(0, 2000);
    if (msg.role === "USER") {
      messages.push({ role: "user", content });
    } else if (msg.role === "ASSISTANT") {
      messages.push({ role: "assistant", content });
    }
  }

  // Current user message (multimodal when an image is attached).
  // A teacher-action directive steers the reply without being persisted.
  const imageDataUrl = normalizeImageDataUrl(opts.imageBase64);
  const userText = [opts.teacherActionDirective, opts.userMessage || "Please look at this image and help me."]
    .filter(Boolean)
    .join("\n\n");
  if (imageDataUrl) {
    messages.push({
      role: "user",
      content: [
        { type: "text", text: userText },
        { type: "image_url", image_url: { url: imageDataUrl } },
      ],
    });
  } else {
    messages.push({ role: "user", content: userText });
  }

  let stream;
  try {
    stream = await chatCompletion<AsyncIterable<{ choices?: { delta?: { content?: string } }[] }>>({
      model: getModel(),
      messages,
      stream: true,
      temperature: 0.7,
      // Gemini's OpenAI-compatible endpoint bills hidden thinking tokens against
      // max_tokens; a low cap makes short answers come back empty.
      max_tokens: 4000,
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : "unknown error";
    return (async function* () {
      yield `I'm sorry, I encountered an issue connecting to the AI service. Please try again in a moment. (${detail})`;
    })();
  }

  return (async function* () {
    let fullText = "";
    try {
      for await (const chunk of stream) {
        const delta = chunk.choices?.[0]?.delta?.content;
        if (delta) {
          fullText += delta;
          yield delta;
        }
      }
    } catch {
      if (!fullText) {
        yield "I'm sorry, something went wrong while generating my response. Please try again.";
      }
    }
  })();
}

function stripMeta(text: string): string {
  const idx = text.indexOf(META_SENTINEL);
  return idx >= 0 ? text.slice(0, idx).trim() : text;
}

/**
 * The composer sends full data URLs; other callers may send raw base64.
 * Reject anything that isn't an inline image data URL.
 */
function normalizeImageDataUrl(input?: string | null): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (trimmed.startsWith("data:image/")) return trimmed;
  if (/^[A-Za-z0-9+/=\s]+$/.test(trimmed) && trimmed.length > 64) {
    return `data:image/jpeg;base64,${trimmed.replace(/\s+/g, "")}`;
  }
  return null;
}

function safeJsonParse<T>(raw: string | null | undefined): T | undefined {
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return undefined;
  }
}

async function buildStudentContext(studentId: string) {
  const [topKnowledge, topMistakes] = await Promise.all([
    prisma.knowledgeRecord.findMany({
      where: { studentId },
      orderBy: { masteryPct: "desc" },
      take: 5,
      select: { topic: true, masteryPct: true },
    }),
    prisma.mistakeRecord.findMany({
      where: { studentId, status: "OPEN" },
      orderBy: { occurrences: "desc" },
      take: 5,
      select: { mistakeType: true, occurrences: true, description: true },
    }),
  ]);

  if (topKnowledge.length === 0 && topMistakes.length === 0) return undefined;

  return {
    topKnowledge: topKnowledge.length > 0 ? topKnowledge : undefined,
    topMistakes: topMistakes.length > 0 ? topMistakes : undefined,
  };
}
