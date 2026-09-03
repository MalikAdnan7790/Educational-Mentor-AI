import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionStudent } from "@/lib/auth";
import { messageFeedbackSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const student = await getSessionStudent();
  if (!student) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = messageFeedbackSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input", details: parsed.error.flatten() }, { status: 400 });
  }

  const message = await prisma.message.findUnique({
    where: { id: params.id },
    include: { conversation: true },
  });

  if (!message || message.conversation.studentId !== student.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  if (message.role !== "ASSISTANT") {
    return NextResponse.json({ error: "only_assistant_messages" }, { status: 400 });
  }

  const { rating, category, comment } = parsed.data;

  const feedback = await prisma.messageFeedback.upsert({
    where: { messageId: params.id },
    update: { rating, category, comment },
    create: {
      messageId: params.id,
      studentId: student.id,
      rating,
      category,
      comment,
    },
  });

  return NextResponse.json({ feedback });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const student = await getSessionStudent();
  if (!student) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const existing = await prisma.messageFeedback.findUnique({
    where: { messageId: params.id },
    include: { message: { include: { conversation: true } } },
  });

  if (!existing || existing.message.conversation.studentId !== student.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  await prisma.messageFeedback.delete({ where: { messageId: params.id } });
  return NextResponse.json({ deleted: true });
}
