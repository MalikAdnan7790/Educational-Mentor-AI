import "server-only";
import OpenAI from "openai";

let _client: OpenAI | null = null;

export function getOpenAI(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  const baseUrl = process.env.OPENAI_BASE_URL;

  if (!apiKey && !baseUrl) return null;

  if (!_client) {
    _client = new OpenAI({
      apiKey: apiKey || "ollama",
      baseURL: baseUrl || undefined,
      timeout: 60_000,
    });
  }
  return _client;
}

export function getModel(): string {
  return process.env.OPENAI_MODEL || "gpt-4o-mini";
}

export function getFastModel(): string {
  return process.env.OPENAI_MODEL_FAST || process.env.OPENAI_MODEL || "gpt-4o-mini";
}

export function isAIEnabled(): boolean {
  return !!(process.env.OPENAI_API_KEY || process.env.OPENAI_BASE_URL);
}

function getFallbackModels(): string[] {
  const raw = process.env.OPENAI_MODEL_FALLBACKS;
  if (raw) {
    return raw.split(",").map((m) => m.trim()).filter(Boolean);
  }
  return [];
}

interface CompletionBody {
  model: string;
  messages: unknown;
  temperature?: number;
  max_tokens?: number;
  response_format?: unknown;
  stream?: boolean;
}

function isRetryable(err: unknown): boolean {
  const status = (err as { status?: number })?.status;
  if (status === 429 || status === 503 || status === 500) return true;
  // OpenAI SDK wraps network failures; retry those too
  return err instanceof Error && /fetch failed|ECONNRESET|ETIMEDOUT|socket hang up/i.test(err.message);
}

/**
 * Wrapper around chat.completions.create that retries against fallback
 * models when the primary is rate-limited (429) or overloaded (503).
 * Free-tier Gemini keys give each model its own daily quota, so falling
 * over to a sibling model keeps the app usable when one quota runs dry.
 */
export async function chatCompletion<T>(body: CompletionBody): Promise<T> {
  const client = getOpenAI();
  if (!client) throw new Error("ai_not_configured");

  const models = [body.model, ...getFallbackModels().filter((m) => m !== body.model)];
  let lastErr: unknown;

  for (const model of models) {
    try {
      // Typed loosely on purpose: call sites own their message shapes
      // (text or multimodal) and their streaming vs. non-streaming result.
      return (await client.chat.completions.create({ ...body, model } as never)) as T;
    } catch (err) {
      lastErr = err;
      if (!isRetryable(err) || model === models[models.length - 1]) throw err;
      // brief pause before switching models
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  throw lastErr;
}
