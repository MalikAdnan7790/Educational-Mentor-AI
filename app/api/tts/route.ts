import { NextResponse } from "next/server";
import { getSessionStudent } from "@/lib/auth";
import { synthesizeSpeech } from "@/lib/voice/tts-server";

export async function POST(req: Request) {
  const student = await getSessionStudent();
  if (!student) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { text?: string; preset?: string | null; speed?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const { text, preset, speed } = body;

  if (!text || typeof text !== "string" || text.length > 5000) {
    return NextResponse.json(
      { error: "text must be 1-5000 characters" },
      { status: 400 },
    );
  }

  try {
    const wav = await synthesizeSpeech({
      text,
      presetId: preset ?? student.voicePreset,
      speed,
    });

    return new Response(new Uint8Array(wav), {
      headers: {
        "Content-Type": "audio/wav",
        "Content-Length": wav.length.toString(),
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "tts_failed";
    console.error("TTS error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
