import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionStudent } from "@/lib/auth";
import { analyzeNote } from "@/lib/ai/notes";
import { isAIEnabled } from "@/lib/ai/client";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const student = await getSessionStudent();
  if (!student) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const note = await prisma.noteDocument.findUnique({
    where: { id: params.id },
    include: { chunks: { orderBy: { idx: "asc" } } },
  });
  if (!note || note.studentId !== student.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  // Backfill analysis if the original attempt failed (e.g. rate limit at upload time)
  if (!note.summary && isAIEnabled()) {
    const text = note.chunks.map((c) => c.content).join("\n\n");
    const analysis = await analyzeNote(text, note.title);
    if (analysis) {
      await prisma.noteDocument.update({
        where: { id: note.id },
        data: {
          summary: analysis.summary,
          keyPointsJson: JSON.stringify(analysis.keyPoints),
          flashcardsJson: JSON.stringify(analysis.flashcards),
        },
      });
      note.summary = analysis.summary;
      note.keyPointsJson = JSON.stringify(analysis.keyPoints);
      note.flashcardsJson = JSON.stringify(analysis.flashcards);
    }
  }

  const keyPoints = safelyParse(note.keyPointsJson) as string[];
  const flashcards = safelyParse(note.flashcardsJson) as { front: string; back: string }[];

  return NextResponse.json({
    id: note.id,
    title: note.title,
    sourceType: note.sourceType,
    charCount: note.charCount,
    summary: note.summary,
    keyPoints,
    flashcards,
    text: note.chunks.map((c) => c.content).join("\n\n"),
    createdAt: note.createdAt,
  });
}

function safelyParse(raw: string | null): unknown {
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const student = await getSessionStudent();
  if (!student) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const note = await prisma.noteDocument.findUnique({ where: { id: params.id } });
  if (!note || note.studentId !== student.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  await prisma.noteDocument.delete({ where: { id: note.id } });
  return NextResponse.json({ ok: true });
}
