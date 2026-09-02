import { NextResponse } from "next/server";
import { getSessionStudent } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const student = await getSessionStudent();
  if (!student) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  return NextResponse.json({
    student: {
      id: student.id,
      name: student.name,
      email: student.email,
      educationLevel: student.educationLevel,
      preferredLanguage: student.preferredLanguage,
      preferredMode: student.preferredMode,
      teacherAvatar: student.teacherAvatar,
      voiceRate: student.voiceRate,
      currentDifficulty: student.currentDifficulty,
    },
  });
}
