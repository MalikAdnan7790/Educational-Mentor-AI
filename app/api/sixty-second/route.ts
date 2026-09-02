import { NextResponse } from "next/server";
import { getSessionStudent } from "@/lib/auth";
import { generateSixtySecondLesson } from "@/lib/ai/sixty-second";
import { sixtySecondStartSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const student = await getSessionStudent();
  if (!student) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = sixtySecondStartSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input", details: parsed.error.flatten() }, { status: 400 });
  }

  const lesson = await generateSixtySecondLesson({
    subjectKey: parsed.data.subject?.toLowerCase() ?? null,
    topic: parsed.data.topic,
    studentLevel: student.educationLevel,
  });

  if (!lesson) return NextResponse.json({ error: "generation_failed" }, { status: 503 });
  return NextResponse.json(lesson);
}
