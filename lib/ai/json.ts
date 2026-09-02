/**
 * Robust JSON extraction from LLM output. Models occasionally prefix
 * or fence JSON despite response_format instructions.
 */
export function extractJson<T>(raw: string): T | null {
  if (!raw) return null;
  const text = raw.trim();

  try {
    return JSON.parse(text) as T;
  } catch {
    // continue
  }

  // Strip markdown fences
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) {
    try {
      return JSON.parse(fenced[1].trim()) as T;
    } catch {
      // continue
    }
  }

  // First {...} or [...] block
  const start = text.search(/[[{]/);
  if (start >= 0) {
    const opener = text[start];
    const closer = opener === "{" ? "}" : "]";
    const end = text.lastIndexOf(closer);
    if (end > start) {
      try {
        return JSON.parse(text.slice(start, end + 1)) as T;
      } catch {
        // continue
      }
    }
  }

  return null;
}
