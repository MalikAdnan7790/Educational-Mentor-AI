import { NextResponse } from "next/server";
import { getSessionStudent } from "@/lib/auth";
import { getNextBestAction } from "@/lib/analytics";

export const dynamic = "force-dynamic";

export async function GET() {
  const student = await getSessionStudent();
  if (!student) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const action = await getNextBestAction(student.id);
  if (!action) return NextResponse.json(null);

  return NextResponse.json(action);
}
