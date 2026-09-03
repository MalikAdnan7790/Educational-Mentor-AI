import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionStudent } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const student = await getSessionStudent();
  if (!student) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const streak = await prisma.studyStreak.findUnique({
    where: { studentId: student.id },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let currentStreak = streak?.currentStreak ?? 0;
  let longestStreak = streak?.longestStreak ?? 0;

  if (streak?.lastActiveDate) {
    const lastActive = new Date(streak.lastActiveDate);
    lastActive.setHours(0, 0, 0, 0);
    const diffDays = (today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays > 1) currentStreak = 0;
  } else {
    currentStreak = 0;
  }

  const lessonsCompleted = await prisma.miniLesson.count({
    where: { studentId: student.id, status: "COMPLETED" },
  });

  const roadmapsActive = await prisma.studyRoadmap.count({
    where: { studentId: student.id, status: "ACTIVE" },
  });

  const conversationsTotal = await prisma.conversation.count({
    where: { studentId: student.id },
  });

  return NextResponse.json({
    currentStreak,
    longestStreak,
    lessonsCompleted,
    roadmapsActive,
    conversationsTotal,
  });
}
