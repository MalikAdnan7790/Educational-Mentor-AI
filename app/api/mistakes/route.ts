import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionStudent } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const student = await getSessionStudent();
  if (!student) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") as "OPEN" | "REVIEWED" | "RESOLVED" | null;

  const mistakes = await prisma.mistakeRecord.findMany({
    where: {
      studentId: student.id,
      ...(status ? { status } : {}),
    },
    orderBy: [{ occurrences: "desc" }, { lastSeenAt: "desc" }],
    take: 50,
  });

  return NextResponse.json(mistakes);
}
