import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionStudent } from "@/lib/auth";
import { settingsSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET() {
  const student = await getSessionStudent();
  if (!student) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  return NextResponse.json({
    name: student.name,
    email: student.email,
    educationLevel: student.educationLevel,
    preferredLanguage: student.preferredLanguage,
    teacherAvatar: student.teacherAvatar,
    voiceRate: student.voiceRate,
    preferredMode: student.preferredMode,
    currentDifficulty: student.currentDifficulty,
    preferredSubject: student.preferredSubject,
  });
}

export async function PUT(req: Request) {
  const student = await getSessionStudent();
  if (!student) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = settingsSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input", details: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await prisma.student.update({
    where: { id: student.id },
    data: parsed.data,
  });

  return NextResponse.json({
    name: updated.name,
    email: updated.email,
    educationLevel: updated.educationLevel,
    preferredLanguage: updated.preferredLanguage,
    teacherAvatar: updated.teacherAvatar,
    voiceRate: updated.voiceRate,
    preferredMode: updated.preferredMode,
    currentDifficulty: updated.currentDifficulty,
    preferredSubject: updated.preferredSubject,
  });
}
