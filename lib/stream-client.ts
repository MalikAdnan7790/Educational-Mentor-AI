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
  let accumulated = "";
  let doneReceived = false;

  function processLine(trimmed: string) {
    if (!trimmed.startsWith("data: ")) return;
    const jsonStr = trimmed.slice(6);
    let data: Record<string, unknown>;
    try {
      data = JSON.parse(jsonStr);
    } catch {
      return; // Partial JSON — will be completed in next chunk
    }
    if (typeof data.delta === "string" && data.delta) {
      accumulated += data.delta;
      callbacks.onDelta(data.delta);
    }
    if (data.done) {
      doneReceived = true;
      const text = typeof data.text === "string" ? data.text : accumulated;
      const messageId = typeof data.messageId === "string" ? data.messageId : undefined;
      callbacks.onDone(text, messageId);
    }
    if (typeof data.error === "string" && data.error) {
      callbacks.onError(data.error);
    }
  }

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        processLine(line.trim());
      }
    }

    // Process any remaining data in the buffer
    if (buffer.trim()) {
      processLine(buffer.trim());
    }

    // If the stream ended without a done event, commit whatever we accumulated
    if (!doneReceived && !signal?.aborted) {
      callbacks.onDone(accumulated);
    }
  } catch (err) {
    if (signal?.aborted) return;
    if (doneReceived) return;
    // If we have accumulated text, commit it rather than showing an error
    if (accumulated) {
      callbacks.onDone(accumulated);
    } else {
      callbacks.onError("stream_interrupted");
    }
  }
}
