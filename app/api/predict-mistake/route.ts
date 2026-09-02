import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionStudent } from "@/lib/auth";
import { predictMistakeQuerySchema } from "@/lib/validation";
import { predictMistake } from "@/lib/ai/predict";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const student = await getSessionStudent();
  if (!student) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const parsed = predictMistakeQuerySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const { problem, subject, topic, difficulty } = parsed.data;

  // Subject-wide common mistakes from teacher profiles
  let commonMistakes: { name: string; description: string }[] = [];
  if (subject) {
    const profile = await prisma.teacherProfile.findFirst({
      where: { subject: { key: subject.toLowerCase() } },
      select: { commonMistakesJson: true },
    });
    if (profile?.commonMistakesJson) {
      try {
        const arr = JSON.parse(profile.commonMistakesJson);
        if (Array.isArray(arr)) commonMistakes = arr;
      } catch {
        // leave empty
      }
    }
  }

  // The student's own recurring mistakes in this subject/topic
  const studentMistakes = await prisma.mistakeRecord.findMany({
    where: {
      studentId: student.id,
      status: { in: ["OPEN", "REVIEWED"] },
      ...(subject ? { subjectKey: subject.toLowerCase() } : {}),
    },
    orderBy: { occurrences: "desc" },
    take: 8,
    select: { mistakeType: true, description: true, occurrences: true },
  });

  const prediction = await predictMistake({
    problemContent: problem,
    topic: topic ?? "General",
    subject: subject ?? "General",
    difficulty,
    commonMistakes,
    studentMistakes,
  });

  if (!prediction) {
    return NextResponse.json({ error: "prediction_failed" }, { status: 503 });
  }

  return NextResponse.json(prediction);
}
