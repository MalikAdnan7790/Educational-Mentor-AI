import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionStudent } from "@/lib/auth";
import { generateChallenge, nextAdaptiveDifficulty } from "@/lib/ai/challenge";
import { challengeCreateSchema } from "@/lib/validation";
import type { Difficulty } from "@/types/prisma-enums";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const student = await getSessionStudent();
  if (!student) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = challengeCreateSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input", details: parsed.error.flatten() }, { status: 400 });
  }
  const { subjectKey, topic, adaptFrom } = parsed.data;
  let difficulty = parsed.data.difficulty;

  // Adaptive follow-up: build the next problem from how the student did on a
  // previous one — solved well moves up the ladder, struggling moves down.
  if (adaptFrom) {
    const source = await prisma.challenge.findUnique({ where: { id: adaptFrom } });
    if (!source || source.studentId !== student.id) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    if (source.status !== "GRADED" || source.score == null) {
      return NextResponse.json({ error: "not_graded" }, { status: 400 });
    }
    const next = nextAdaptiveDifficulty(source.difficulty as Difficulty, source.score);
    const harder = (["EASY", "MEDIUM", "HARD", "REAL_WORLD"] as Difficulty[]).indexOf(next) >
      (["EASY", "MEDIUM", "HARD", "REAL_WORLD"] as Difficulty[]).indexOf(source.difficulty as Difficulty);
    return createChallenge(
      student,
      source.subjectKey,
      source.topic,
      next,
      `Adaptive follow-up on the same topic. The student just scored ${Math.round(source.score)}/100 on ${source.difficulty === "REAL_WORLD" ? "a real-world" : `a ${source.difficulty.toLowerCase()}`} problem. ${harder ? "Step up the difficulty one notch and vary the scenario." : next === source.difficulty ? "Keep the same difficulty but change the scenario." : "Ease off one notch — build their confidence back with a cleaner, more guided version."}`
    );
  }

  // Personalization: when the student doesn't pick a topic, build the daily
  // challenge from their weakest real evidence and recurring mistakes.
  if (!subjectKey && !topic) {
    const [knowledge, mistakes] = await Promise.all([
      prisma.knowledgeRecord.findMany({
        where: { studentId: student.id },
        orderBy: { masteryPct: "asc" },
        take: 5,
      }),
      prisma.mistakeRecord.findFirst({
        where: { studentId: student.id, status: { in: ["OPEN", "REVIEWED"] } },
        orderBy: { occurrences: "desc" },
      }),
    ]);

    const weakest = knowledge[0];
    if (weakest) {
      // Slightly harder than their comfort zone, never trivial
      const comfort = weakest.masteryPct >= 85 ? "HARD" : weakest.masteryPct >= 60 ? "MEDIUM" : "EASY";
      const ladder: Record<string, Difficulty> = { EASY: "MEDIUM", MEDIUM: "HARD", HARD: "REAL_WORLD" };
      difficulty = difficulty ?? ladder[comfort];
      return createChallenge(
        student,
        weakest.subjectKey,
        weakest.topic,
        difficulty,
        mistakes ? `Watch for this recurring mistake: ${mistakes.mistakeType} — ${mistakes.description}` : undefined
      );
    }
    if (mistakes?.topic) {
      return createChallenge(student, mistakes.subjectKey, mistakes.topic, difficulty ?? "MEDIUM");
    }
  }

  return createChallenge(student, subjectKey ?? null, topic ?? null, difficulty ?? "MEDIUM");
}

async function createChallenge(
  student: { id: string; educationLevel: string },
  subjectKey: string | null,
  topic: string | null,
  difficulty: Difficulty,
  hint?: string
) {
  const result = await generateChallenge(
    subjectKey,
    topic,
    difficulty,
    student.educationLevel,
    hint,
  );

  if (!result) {
    return NextResponse.json({ error: "generation_failed" }, { status: 503 });
  }

  const challenge = await prisma.challenge.create({
    data: {
      studentId: student.id,
      subjectKey: subjectKey ?? null,
      topic: topic ?? null,
      difficulty: result.difficulty,
      problemText: result.problemText,
      solution: result.solution,
      status: "PENDING",
    },
  });

  // Never send solution to client
  const { solution: _, ...safe } = challenge;
  return NextResponse.json(safe, { status: 201 });
}

export async function GET() {
  const student = await getSessionStudent();
  if (!student) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const challenges = await prisma.challenge.findMany({
    where: { studentId: student.id },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      subjectKey: true,
      topic: true,
      difficulty: true,
      problemText: true,
      score: true,
      confidencePct: true,
      status: true,
      createdAt: true,
    },
  });

  return NextResponse.json(challenges);
}
