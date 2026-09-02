import { NextResponse } from "next/server";
import { getSessionStudent } from "@/lib/auth";
import { getKnowledgeConfidence } from "@/lib/analytics";

export const dynamic = "force-dynamic";

export async function GET() {
  const student = await getSessionStudent();
  if (!student) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const result = await getKnowledgeConfidence(student.id);
  return NextResponse.json(result);
}
