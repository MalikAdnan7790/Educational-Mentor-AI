import "server-only";
import { getPreset } from "./presets";

const GEMINI_TTS_MODEL = "gemini-2.5-flash-preview-tts";
const TTS_SAMPLE_RATE = 24000;
const TTS_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";

function getApiKey(): string {
  const key = process.env.OPENAI_API_KEY;
  if (!key || key === "ollama") {
    throw new Error("TTS requires OPENAI_API_KEY to be set");
  }
  return key;
}

function stripMarkdown(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, "code block omitted. ")
    .replace(/`[^`]+`/g, (m) => m.slice(1, -1) + ". ")
    .replace(/!\[.*?\]\(.*?\)/g, "")
    .replace(/\[([^\]]+)\]\(.*?\)/g, "$1")
    .replace(/#{1,6}\s*/g, "")
    .replace(/[*_~]{1,3}/g, "")
    .replace(/>\s*/g, "")
    .replace(/[-*+]\s+/g, "")
    .replace(/\n{2,}/g, ". ")
    .replace(/\n/g, " ")
    .trim();
}

function splitIntoChunks(text: string, maxLen = 800): string[] {
  const sentences = text.match(/[^.!?۔]+[.!?۔]+\s*/g) ?? [text];
  const chunks: string[] = [];
  let current = "";

  for (const sentence of sentences) {
    if ((current + sentence).length > maxLen && current) {
      chunks.push(current.trim());
      current = sentence;
    } else {
      current += sentence;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

function encodeWav(pcmData: Buffer, sampleRate: number): Buffer {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = pcmData.length;
  const headerSize = 44;

  const buffer = Buffer.alloc(headerSize + dataSize);
  const view = new DataView(buffer.buffer, buffer.byteOffset, headerSize);

  view.setUint32(0, 0x52494646, false); // "RIFF"
  view.setUint32(4, 36 + dataSize, true);
  view.setUint32(8, 0x57415645, false); // "WAVE"
  view.setUint32(12, 0x666d7420, false); // "fmt "
  view.setUint32(16, 16, true); // PCM header size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  view.setUint32(36, 0x64617461, false); // "data"
  view.setUint32(40, dataSize, true);

  pcmData.copy(buffer, headerSize);
  return buffer;
}

async function synthesizeChunk(
  text: string,
  voiceName: string,
  apiKey: string,
): Promise<Buffer> {
  const url = `${TTS_ENDPOINT}/${GEMINI_TTS_MODEL}:generateContent?key=${apiKey}`;

  const body = {
    contents: [{ parts: [{ text }] }],
    generationConfig: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName },
        },
      },
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`TTS API error ${res.status}: ${err.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{
          inlineData?: {
            data?: string;
            mimeType?: string;
          };
        }>;
      };
    }>;
  };

  const audioData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!audioData) {
    throw new Error("TTS API returned no audio data");
  }

  return Buffer.from(audioData, "base64");
}

export interface TTSOptions {
  text: string;
  presetId?: string | null;
  speed?: number;
}

export async function synthesizeSpeech(options: TTSOptions): Promise<Buffer> {
  const apiKey = getApiKey();
  const preset = getPreset(options.presetId);
  const voiceName = preset.voiceName;
  const cleaned = stripMarkdown(options.text);

  if (!cleaned) {
    throw new Error("No text to synthesize");
  }

  const chunks = splitIntoChunks(cleaned);
  const pcmBuffers: Buffer[] = [];

  for (const chunk of chunks) {
    const pcm = await synthesizeChunk(chunk, voiceName, apiKey);
    pcmBuffers.push(pcm);
  }

  const combined = Buffer.concat(pcmBuffers);
  return encodeWav(combined, TTS_SAMPLE_RATE);
}

export { splitIntoChunks, stripMarkdown };
