import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionStudent } from "@/lib/auth";
import { generateLearningPath } from "@/lib/ai/path";

export const dynamic = "force-dynamic";

// Cheap overview: which subjects have real scored evidence
export async function GET() {
  const student = await getSessionStudent();
  if (!student) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const knowledge = await prisma.knowledgeRecord.findMany({
    where: { studentId: student.id },
    select: { subjectKey: true, topic: true, masteryPct: true },
  });

  const bySubject = new Map<string, { topics: number; total: number; weakest: { topic: string; masteryPct: number } | null }>();
  for (const k of knowledge) {
    const entry = bySubject.get(k.subjectKey) ?? { topics: 0, total: 0, weakest: null };
    entry.topics += 1;
    entry.total += k.masteryPct;
    if (!entry.weakest || k.masteryPct < entry.weakest.masteryPct) {
      entry.weakest = { topic: k.topic, masteryPct: k.masteryPct };
    }
    bySubject.set(k.subjectKey, entry);
  }
  const subjects = Array.from(bySubject.entries())
    .map(([key, v]) => ({
      key,
      topics: v.topics,
      avgMastery: Math.round(v.total / v.topics),
      weakestTopic: v.weakest?.topic ?? null,
    }))
    .sort((a, b) => a.avgMastery - b.avgMastery);

  return NextResponse.json({ subjects });
}

// Generate the path for one subject (defaults to the weakest)
export async function POST(req: Request) {
  const student = await getSessionStudent();
  if (!student) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const subjectParam = typeof body.subject === "string" ? body.subject : null;

  const knowledge = await prisma.knowledgeRecord.findMany({
    where: { studentId: student.id },
    select: { subjectKey: true, topic: true, masteryPct: true, evidenceCount: true },
  });

  if (knowledge.length === 0) {
    return NextResponse.json(
      { error: "no_data", message: "Complete a session, challenge, viva or exam to unlock your learning path." },
      { status: 400 }
    );
  }

  const available = Array.from(new Set(knowledge.map((k) => k.subjectKey)));
  const subjectKey =
    subjectParam && available.includes(subjectParam)
      ? subjectParam
      : // weakest subject: lowest average mastery
        available
          .map((key) => {
            const rows = knowledge.filter((k) => k.subjectKey === key);
            return { key, avg: rows.reduce((a, k) => a + k.masteryPct, 0) / rows.length };
          })
          .sort((a, b) => a.avg - b.avg)[0].key;

  const [subjectKnowledge, subjectMistakes] = await Promise.all([
    prisma.knowledgeRecord.findMany({
      where: { studentId: student.id, subjectKey },
      select: { topic: true, masteryPct: true, evidenceCount: true },
    }),
    prisma.mistakeRecord.findMany({
      where: { studentId: student.id, subjectKey, status: { in: ["OPEN", "REVIEWED"] } },
      orderBy: { occurrences: "desc" },
      take: 8,
      select: { mistakeType: true, description: true, occurrences: true },
    }),
  ]);

  const language =
    { EN: "en", UR: "ur", ROMAN_UR: "roman" }[student.preferredLanguage] ?? "en";

  const path = await generateLearningPath({
    subjectKey,
    knowledge: subjectKnowledge.map((k) => ({
      topic: k.topic,
      masteryPct: k.masteryPct,
      attempts: k.evidenceCount,
    })),
    mistakes: subjectMistakes,
    educationLevel: student.educationLevel,
    language,
  });

  if (!path) {
    return NextResponse.json({ error: "generation_failed" }, { status: 503 });
  }

  return NextResponse.json({ subject: subjectKey, path });
}
