import { NextResponse } from "next/server";
import { getSessionStudent } from "@/lib/auth";
import { analyzeUploadSchema } from "@/lib/validation";
import { analyzeQuestionUpload } from "@/lib/ai/analyze";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const student = await getSessionStudent();
  if (!student) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = analyzeUploadSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input", details: parsed.error.flatten() }, { status: 400 });
  }

  const { imageBase64, content, stuckOn } = parsed.data;

  const analysis = await analyzeQuestionUpload({
    imageBase64: imageBase64 ?? null,
    content: content ?? null,
    stuckOn: stuckOn ?? null,
  });

  return NextResponse.json({ analysis });
}
