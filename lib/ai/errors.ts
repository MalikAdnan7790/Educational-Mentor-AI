export type AIErrorCode =
  | "no_key"
  | "timeout"
  | "rate_limit"
  | "overloaded"
  | "context_too_long"
  | "content_filter"
  | "parse"
  | "unknown";

export class AIError extends Error {
  constructor(
    message: string,
    public code: AIErrorCode,
    public retryable = false,
  ) {
    super(message);
    this.name = "AIError";
  }
}

export function toAIError(err: unknown): AIError {
  if (err instanceof AIError) return err;
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    const status = (err as { status?: number }).status;

    if (msg.includes("timeout") || msg.includes("aborted")) {
      return new AIError("The AI took too long to respond. Try again.", "timeout", true);
    }
    if (status === 429 || msg.includes("rate limit") || msg.includes("429")) {
      return new AIError("AI is rate-limited. Please wait a moment.", "rate_limit", true);
    }
    if (status === 503 || msg.includes("overloaded") || msg.includes("503")) {
      return new AIError("AI is overloaded right now. Try in a few seconds.", "overloaded", true);
    }
    if (status === 400 && (/context.length|too.long|token.limit|max.*context/i.test(msg))) {
      return new AIError("Conversation is too long. Trimming older messages…", "context_too_long", true);
    }
    if (status === 400 && (/content.*filter|safety|blocked/i.test(msg))) {
      return new AIError("Response was blocked by content filter. Try rephrasing.", "content_filter");
    }
    if (msg.includes("api key")) {
      return new AIError("AI is not configured. Check your API key.", "no_key");
    }
    if (/fetch failed|econnreset|etimedout|socket hang up|network/i.test(msg)) {
      return new AIError("Network error connecting to AI. Check your connection.", "overloaded", true);
    }
    return new AIError(`AI error: ${err.message}`, "unknown", false);
  }
  return new AIError("An unexpected AI error occurred.", "unknown", false);
}

export function friendlyAIMessage(): string {
  return "AI mentor is temporarily unavailable. Please try again shortly.";
}

export function errorCardMessage(code: AIErrorCode): string {
  switch (code) {
    case "rate_limit": return "Rate limited. Please wait a moment and try again.";
    case "overloaded": return "AI is temporarily unavailable. Please try again.";
    case "timeout": return "The AI took too long. Please try again.";
    case "context_too_long": return "This conversation is getting long. Try starting a new one.";
    case "content_filter": return "Response was blocked by a content filter. Try rephrasing.";
    case "no_key": return "AI is not configured. Please contact support.";
    default: return "Something went wrong. Please try again.";
  }
}
