import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionStudent } from "@/lib/auth";
import { generateRoadmap } from "@/lib/ai/roadmap";
import { z } from "zod";

export const dynamic = "force-dynamic";

const generateSchema = z.object({
  subjectKey: z.string().optional(),
  topic: z.string().optional(),
  weekCount: z.number().min(1).max(12).default(4),
});

export async function GET() {
  const student = await getSessionStudent();
  if (!student) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const roadmaps = await prisma.studyRoadmap.findMany({
    where: { studentId: student.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json({
    roadmaps: roadmaps.map((r) => ({
      id: r.id,
      title: r.title,
      subjectKey: r.subjectKey,
      status: r.status,
      createdAt: r.createdAt,
      roadmap: JSON.parse(r.roadmapJson),
    })),
  });
}

export async function POST(req: Request) {
  const student = await getSessionStudent();
  if (!student) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const parsed = generateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input", details: parsed.error.flatten() }, { status: 400 });
  }

  const { subjectKey, topic, weekCount } = parsed.data;

  const [knowledge, mistakes, exams] = await Promise.all([
    prisma.knowledgeRecord.findMany({
      where: { studentId: student.id, ...(subjectKey ? { subjectKey } : {}) },
      orderBy: { updatedAt: "desc" },
      take: 30,
    }),
    prisma.mistakeRecord.findMany({
      where: { studentId: student.id, status: "OPEN", ...(subjectKey ? { subjectKey } : {}) },
      orderBy: { lastSeenAt: "desc" },
      take: 20,
    }),
    prisma.exam.findMany({
      where: { studentId: student.id, status: "GRADED", ...(subjectKey ? { subjectKey } : {}) },
      orderBy: { submittedAt: "desc" },
      take: 10,
      select: { topic: true, score: true },
    }),
  ]);

  const strengths = knowledge
    .filter((k) => k.masteryPct >= 70)
    .sort((a, b) => b.masteryPct - a.masteryPct)
    .slice(0, 5)
    .map((k) => k.topic);

  const weaknesses = mistakes
    .sort((a, b) => b.occurrences - a.occurrences)
    .slice(0, 5)
    .map((m) => m.topic ?? m.description.slice(0, 40));

  const recentScores = exams
    .filter((e) => e.topic && e.score != null)
    .slice(0, 5)
    .map((e) => ({ topic: e.topic!, score: Math.round(e.score!) }));

  const roadmap = await generateRoadmap({
    subjectKey,
    topic,
    weekCount,
    strengths,
    weaknesses,
    recentScores,
  });

  if (!roadmap) {
    return NextResponse.json({ error: "generation_failed" }, { status: 502 });
  }

  const saved = await prisma.studyRoadmap.create({
    data: {
      studentId: student.id,
      title: roadmap.title,
      subjectKey: subjectKey ?? null,
      roadmapJson: JSON.stringify(roadmap),
    },
  });

  return NextResponse.json({
    id: saved.id,
    title: saved.title,
    subjectKey: saved.subjectKey,
    status: saved.status,
    createdAt: saved.createdAt,
    roadmap,
  });
}
