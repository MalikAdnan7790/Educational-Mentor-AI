import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionStudent } from "@/lib/auth";
import { getNextBestAction } from "@/lib/analytics";

export const dynamic = "force-dynamic";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const student = await getSessionStudent();
  if (!student) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const action = await prisma.nextBestAction.findUnique({ where: { id: params.id } });
  if (!action || action.studentId !== student.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  await prisma.nextBestAction.update({
    where: { id: params.id },
    data: { status: "DONE" },
  });

  // Generate a fresh next action
  const next = await getNextBestAction(student.id);
  return NextResponse.json({ completed: true, next });
}
