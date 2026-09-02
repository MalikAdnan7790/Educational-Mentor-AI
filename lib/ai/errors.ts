export class AIError extends Error {
  constructor(
    message: string,
    public code: "no_key" | "timeout" | "rate_limit" | "overloaded" | "parse" | "unknown",
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
    if (msg.includes("timeout") || msg.includes("aborted")) {
      return new AIError("The AI took too long to respond. Try again.", "timeout", true);
    }
    if (msg.includes("rate limit") || msg.includes("429")) {
      return new AIError("AI is rate-limited. Please wait a moment.", "rate_limit", true);
    }
    if (msg.includes("overloaded") || msg.includes("503")) {
      return new AIError("AI is overloaded right now. Try in a few seconds.", "overloaded", true);
    }
    if (msg.includes("api key")) {
      return new AIError("AI is not configured. Check your API key.", "no_key");
    }
    return new AIError(`AI error: ${err.message}`, "unknown", false);
  }
  return new AIError("An unexpected AI error occurred.", "unknown", false);
}

export function friendlyAIMessage(): string {
  return "AI mentor is temporarily unavailable. You can still practice with the built-in engine.";
}
