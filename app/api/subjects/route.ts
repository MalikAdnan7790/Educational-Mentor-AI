import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionStudent } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const student = await getSessionStudent();
  if (!student) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const level = searchParams.get("level");

  const subjects = await prisma.subjectCatalog.findMany({
    where: {
      isActive: true,
      ...(category ? { category } : {}),
      ...(level ? { level: level as any } : {}),
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { topics: { orderBy: { slug: "asc" } } },
  });

  return NextResponse.json(subjects);
}
