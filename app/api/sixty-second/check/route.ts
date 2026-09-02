import { NextResponse } from "next/server";
import { getSessionStudent } from "@/lib/auth";
import { checkSixtySecondAnswer } from "@/lib/ai/sixty-second";
import { sixtySecondCheckSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const student = await getSessionStudent();
  if (!student) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = sixtySecondCheckSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input", details: parsed.error.flatten() }, { status: 400 });
  }

  const result = await checkSixtySecondAnswer({
    topic: parsed.data.topic,
    question: parsed.data.question,
    studentAnswer: parsed.data.answer,
  });

  if (!result) return NextResponse.json({ error: "generation_failed" }, { status: 503 });
  return NextResponse.json(result);
}
