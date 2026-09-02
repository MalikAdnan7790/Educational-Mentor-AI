import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionStudent } from "@/lib/auth";
import { createConversationSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const student = await getSessionStudent();
  if (!student) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = createConversationSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input", details: parsed.error.flatten() }, { status: 400 });
  }

  const { kind, mode, isAiFree, language, subjectKey, topic, title } = parsed.data;

  const conversation = await prisma.conversation.create({
    data: {
      studentId: student.id,
      kind,
      mode,
      isAiFree,
      language,
      subjectKey: subjectKey ?? null,
      topic: topic ?? null,
      title: title ?? null,
      status: "ACTIVE",
    },
  });

  return NextResponse.json(conversation, { status: 201 });
}

export async function GET(req: Request) {
  const student = await getSessionStudent();
  if (!student) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const kind = searchParams.get("kind") as "VOICE" | "TEXT" | null;
  const status = searchParams.get("status") as "ACTIVE" | "ARCHIVED" | null;

  const conversations = await prisma.conversation.findMany({
    where: {
      studentId: student.id,
      ...(kind ? { kind } : {}),
      ...(status ? { status } : {}),
    },
    orderBy: { lastMessageAt: "desc" },
    take: 50,
    include: {
      _count: { select: { messages: true } },
    },
  });

  return NextResponse.json(conversations);
}
