import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionStudent } from "@/lib/auth";
import { analyzeNote } from "@/lib/ai/notes";
import { noteCreateSchema } from "@/lib/validation";
import { isAIEnabled } from "@/lib/ai/client";

export const dynamic = "force-dynamic";

function chunkText(text: string, target = 1200): string[] {
  const paragraphs = text.split(/\n\s*\n/);
  const chunks: string[] = [];
  let cur = "";

  const flush = () => {
    if (cur.trim()) chunks.push(cur.trim());
    cur = "";
  };

  for (const p of paragraphs) {
    const para = p.trim();
    if (!para) continue;

    if (cur.length + para.length + 2 <= target) {
      cur = cur ? `${cur}\n\n${para}` : para;
      continue;
    }

    if (para.length <= target * 1.5) {
      flush();
      cur = para;
      continue;
    }

    flush();
    const sentences = para.split(/(?<=[.!?۔])\s+/);
    for (const s of sentences) {
      if (cur.length + s.length + 1 > target) flush();
      cur = cur ? `${cur} ${s}` : s;
    }
  }
  flush();
  return chunks.length > 0 ? chunks : [text.slice(0, target)];
}

export async function POST(req: Request) {
  const student = await getSessionStudent();
  if (!student) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = noteCreateSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input", details: parsed.error.flatten() }, { status: 400 });
  }
  const { title, sourceType, text } = parsed.data;

  const chunks = chunkText(text);

  const note = await prisma.noteDocument.create({
    data: {
      studentId: student.id,
      title,
      sourceType,
      charCount: text.length,
    },
  });
  await prisma.noteChunk.createMany({
    data: chunks.map((content, idx) => ({ docId: note.id, idx, content })),
  });

  let analysis = null;
  if (isAIEnabled()) {
    analysis = await analyzeNote(text, title);
    if (analysis) {
      await prisma.noteDocument.update({
        where: { id: note.id },
        data: {
          summary: analysis.summary,
          keyPointsJson: JSON.stringify(analysis.keyPoints),
          flashcardsJson: JSON.stringify(analysis.flashcards),
        },
      });
    }
  }

  return NextResponse.json({ note: { ...note, summary: analysis?.summary ?? null }, analysis }, { status: 201 });
}

export async function GET() {
  const student = await getSessionStudent();
  if (!student) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const notes = await prisma.noteDocument.findMany({
    where: { studentId: student.id },
    orderBy: { createdAt: "desc" },
    take: 30,
    select: {
      id: true,
      title: true,
      sourceType: true,
      charCount: true,
      summary: true,
      createdAt: true,
      _count: { select: { chunks: true, exams: true } },
    },
  });
  return NextResponse.json(notes);
}
