import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionStudent } from "@/lib/auth";
import { reflectionSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const student = await getSessionStudent();
  if (!student) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = reflectionSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input", details: parsed.error.flatten() }, { status: 400 });
  }

  const session = await prisma.attemptSession.findUnique({ where: { id: params.id } });
  if (!session || session.studentId !== student.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const reflection = await prisma.reflection.create({
    data: {
      sessionId: session.id,
      studentId: session.studentId,
      question: parsed.data.question,
      answer: parsed.data.answer,
    },
  });

  return NextResponse.json(reflection, { status: 201 });
}
