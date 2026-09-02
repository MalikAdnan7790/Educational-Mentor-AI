import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionStudent } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const student = await getSessionStudent();
  if (!student) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const conversation = await prisma.conversation.findUnique({
    where: { id: params.id },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!conversation || conversation.studentId !== student.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json(conversation);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const student = await getSessionStudent();
  if (!student) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const conversation = await prisma.conversation.findUnique({ where: { id: params.id } });
  if (!conversation || conversation.studentId !== student.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  await prisma.conversation.update({
    where: { id: params.id },
    data: { status: "ARCHIVED" },
  });

  return NextResponse.json({ ok: true });
}
