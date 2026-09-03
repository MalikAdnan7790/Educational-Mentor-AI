import { prisma } from "@/lib/db";
import { getOpenAI, getFastModel } from "./client";

const MEMORY_CATEGORIES = ["STRENGTH", "WEAKNESS", "PREFERENCE", "MISCONCEPTION", "GOAL"] as const;
type MemoryCategory = (typeof MEMORY_CATEGORIES)[number];

interface ExtractedMemory {
  category: MemoryCategory;
  topic: string | null;
  content: string;
}

export async function extractMemories(studentId: string, conversationId: string): Promise<void> {
  const client = getOpenAI();
  if (!client) return;

  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    select: { role: true, content: true },
    take: 30,
  });

  if (messages.length < 4) return;

  const transcript = messages
    .map((m) => `${m.role}: ${m.content.slice(0, 500)}`)
    .join("\n");

  try {
    const resp = await client.chat.completions.create({
      model: getFastModel(),
      messages: [
        {
          role: "system",
          content: `Analyze this student-teacher conversation and extract lasting memories about the student.
Focus on:
- STRENGTH: What the student clearly understands or does well
- WEAKNESS: Specific concepts the student struggles with
- PREFERENCE: How the student likes to learn (e.g., "prefers visual examples", "likes step-by-step")
- MISCONCEPTION: A specific misunderstanding the student has
- GOAL: What the student is working toward (e.g., "preparing for calculus exam")

Only extract memories that are clearly evidenced in the conversation. Don't infer vaguely.
Each memory should be a specific, actionable fact — not a general observation.

Respond with JSON: { "memories": [{ "category": "STRENGTH|WEAKNESS|PREFERENCE|MISCONCEPTION|GOAL", "topic": "subject or topic or null", "content": "one sentence describing the memory" }] }
Return at most 3 memories. If nothing noteworthy, return { "memories": [] }.`,
        },
        { role: "user", content: transcript },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
      max_tokens: 500,
    });

    const raw = resp.choices[0]?.message?.content;
    if (!raw) return;

    const parsed = JSON.parse(raw);
    const memories: ExtractedMemory[] = Array.isArray(parsed.memories)
      ? parsed.memories.filter(
          (m: any) =>
            m.content &&
            MEMORY_CATEGORIES.includes(m.category),
        )
      : [];

    for (const mem of memories.slice(0, 3)) {
      await upsertMemory(studentId, mem);
    }
  } catch {
    // Non-blocking: memory extraction failure shouldn't affect the user
  }
}

async function upsertMemory(studentId: string, mem: ExtractedMemory): Promise<void> {
  const existing = await prisma.teacherMemory.findFirst({
    where: {
      studentId,
      category: mem.category,
      topic: mem.topic ?? null,
    },
  });

  if (existing) {
    await prisma.teacherMemory.update({
      where: { id: existing.id },
      data: {
        content: mem.content,
        confidence: Math.min(existing.confidence + 0.1, 1.0),
      },
    });
  } else {
    await prisma.teacherMemory.create({
      data: {
        studentId,
        category: mem.category,
        topic: mem.topic,
        content: mem.content,
        confidence: 0.5,
      },
    });
  }
}

export async function getRelevantMemories(
  studentId: string,
  topic?: string | null,
  limit = 5,
): Promise<{ category: string; content: string; topic: string | null }[]> {
  const memories = await prisma.teacherMemory.findMany({
    where: { studentId },
    orderBy: [{ confidence: "desc" }, { updatedAt: "desc" }],
    take: 20,
    select: { category: true, content: true, topic: true },
  });

  if (!topic) return memories.slice(0, limit);

  const topicLower = topic.toLowerCase();
  const topicMatches = memories.filter(
    (m) => m.topic?.toLowerCase().includes(topicLower) || topicLower.includes(m.topic?.toLowerCase() ?? ""),
  );
  const others = memories.filter((m) => !topicMatches.includes(m));

  return [...topicMatches, ...others].slice(0, limit);
}
