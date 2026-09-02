import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionStudent } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const student = await getSessionStudent();
  if (!student) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const subjectKey = searchParams.get("subjectKey");
  if (!subjectKey) {
    return NextResponse.json({ error: "subjectKey_required" }, { status: 400 });
  }

  const subject = await prisma.subjectCatalog.findUnique({
    where: { key: subjectKey },
    include: { topics: { orderBy: { slug: "asc" } } },
  });

  if (!subject) {
    return NextResponse.json({ error: "subject_not_found" }, { status: 404 });
  }

  return NextResponse.json(subject.topics);
}
