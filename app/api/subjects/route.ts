import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionStudent } from "@/lib/auth";
import { subjectCache } from "@/lib/cache";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const student = await getSessionStudent();
  if (!student) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const level = searchParams.get("level");

  const cacheKey = `subjects:${category ?? "all"}:${level ?? "all"}`;
  const cached = subjectCache.get<unknown>(cacheKey);
  if (cached) return NextResponse.json(cached);

  const subjects = await prisma.subjectCatalog.findMany({
    where: {
      isActive: true,
      ...(category ? { category } : {}),
      ...(level ? { level: level as any } : {}),
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { topics: { orderBy: { slug: "asc" } } },
  });

  subjectCache.set(cacheKey, subjects);
  return NextResponse.json(subjects);
}
