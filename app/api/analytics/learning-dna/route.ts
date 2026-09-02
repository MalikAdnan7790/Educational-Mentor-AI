import { NextResponse } from "next/server";
import { getSessionStudent } from "@/lib/auth";
import { getLearningDNA, getMasteryStages } from "@/lib/analytics";

export const dynamic = "force-dynamic";

export async function GET() {
  const student = await getSessionStudent();
  if (!student) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const [dna, stages] = await Promise.all([
    getLearningDNA(student.id),
    getMasteryStages(student.id),
  ]);

  return NextResponse.json({ dna, stages });
}
