import { NextResponse } from "next/server";
import { getSessionStudent } from "@/lib/auth";
import mammoth from "mammoth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 3 * 1024 * 1024;
const MAX_TEXT_CHARS = 60_000;

const ALLOWED: Record<string, "DOCX" | "TXT" | "MD"> = {
  docx: "DOCX",
  txt: "TXT",
  md: "MD",
  markdown: "MD",
};

export async function POST(req: Request) {
  const student = await getSessionStudent();
  if (!student) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { filename?: string; fileBase64?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "file_too_large", message: "Request body too large. Try a smaller file (max 3 MB)." }, { status: 413 });
  }

  const { filename, fileBase64 } = body;
  if (!filename || !fileBase64) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  const sourceType = ALLOWED[ext];
  if (!sourceType) {
    return NextResponse.json({ error: "unsupported_type" }, { status: 400 });
  }

  const cleanB64 = fileBase64.replace(/^data:[^;]+;base64,/, "").replace(/\s+/g, "");
  let buffer: Buffer;
  try {
    buffer = Buffer.from(cleanB64, "base64");
  } catch {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  if (buffer.length === 0) {
    return NextResponse.json({ error: "empty_file" }, { status: 400 });
  }
  if (buffer.length > MAX_BYTES) {
    return NextResponse.json({ error: "file_too_large" }, { status: 413 });
  }

  try {
    let text: string;
    if (sourceType === "DOCX") {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else {
      text = buffer.toString("utf-8");
    }

    text = text.replace(/\u0000/g, "").trim();

    if (!text) {
      return NextResponse.json({ error: "no_text_extracted" }, { status: 422 });
    }

    const truncated = text.length > MAX_TEXT_CHARS;
    return NextResponse.json({
      text: truncated ? text.slice(0, MAX_TEXT_CHARS) : text,
      sourceType,
      charCount: text.length,
      truncated,
    });
  } catch {
    return NextResponse.json({ error: "extraction_failed" }, { status: 422 });
  }
}
