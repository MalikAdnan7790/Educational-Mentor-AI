/**
 * SSE stream client — parses `data:` frames from a fetch Response body.
 */

export interface StreamCallbacks {
  onDelta: (delta: string) => void;
  onDone: (fullText: string, messageId?: string) => void;
  onError: (error: string) => void;
}

export async function streamMessage(
  url: string,
  body: Record<string, unknown>,
  callbacks: StreamCallbacks,
  signal?: AbortSignal,
): Promise<void> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "request_failed" }));
    callbacks.onError(err.message || err.error || "request_failed");
    return;
  }

  const reader = res.body?.getReader();
  if (!reader) {
    callbacks.onError("no_body");
    return;
  }

  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data: ")) continue;

        const jsonStr = trimmed.slice(6);
        try {
          const data = JSON.parse(jsonStr);
          if (data.delta) callbacks.onDelta(data.delta);
          if (data.done) callbacks.onDone(data.text ?? "", data.messageId);
          if (data.error) callbacks.onError(data.error);
        } catch {
          // Partial JSON — will be completed in next chunk
        }
      }
    }
  } catch (err) {
    if (signal?.aborted) return;
    callbacks.onError("stream_interrupted");
  }
}
