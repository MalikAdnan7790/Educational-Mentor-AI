import { NextResponse } from "next/server";
import { getSessionStudent } from "@/lib/auth";
import { generateTeachPrompt } from "@/lib/ai/teach";
import { teachStartSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const student = await getSessionStudent();
  if (!student) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = teachStartSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input", details: parsed.error.flatten() }, { status: 400 });
  }

  const result = await generateTeachPrompt({
    subjectKey: parsed.data.subject?.toLowerCase() ?? null,
    topic: parsed.data.topic,
    studentLevel: student.educationLevel,
  });

  if (!result) return NextResponse.json({ error: "generation_failed" }, { status: 503 });
  return NextResponse.json(result);
}
