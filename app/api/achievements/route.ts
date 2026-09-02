import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionStudent } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const student = await getSessionStudent();
  if (!student) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const achievements = await prisma.achievement.findMany({
    where: { studentId: student.id },
    orderBy: { unlockedAt: "desc" },
  });
  return NextResponse.json(achievements);
}
