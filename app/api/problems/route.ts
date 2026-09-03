import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionStudent } from "@/lib/auth";
import type { Difficulty, Subject } from "@/types/prisma-enums";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const student = await getSessionStudent();
  if (!student) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const subject = searchParams.get("subject") as Subject | null;
  const difficulty = searchParams.get("difficulty") as Difficulty | null;

  const problems = await prisma.problem.findMany({
    where: {
      ...(subject ? { subject } : {}),
      ...(difficulty ? { difficulty } : {}),
    },
    orderBy: [{ subject: "asc" }, { difficulty: "asc" }, { createdAt: "asc" }],
  });
  return NextResponse.json(problems);
}
