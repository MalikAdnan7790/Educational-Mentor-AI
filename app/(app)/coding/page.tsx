"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { Code } from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const LANGUAGES = [
  { value: "PYTHON", label: "Python" },
  { value: "JAVASCRIPT", label: "JavaScript" },
  { value: "TYPESCRIPT", label: "TypeScript" },
  { value: "CPP", label: "C++" },
  { value: "JAVA", label: "Java" },
  { value: "HTML_CSS", label: "HTML/CSS" },
  { value: "SQL", label: "SQL" },
];

export default function CodingPage() {
  const [language, setLanguage] = useState("PYTHON");
  const [code, setCode] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamText]);

  const send = useCallback(async () => {
    if (!input.trim() || streaming) return;

    const userMsg: ChatMessage = { role: "user", content: input.trim() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setStreaming(true);
    setStreamText("");

    try {
      const res = await fetch("/api/coding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language,
          messages: updated,
          code: code.trim() || null,
        }),
      });

      if (!res.ok || !res.body) {
        setMessages((m) => [...m, { role: "assistant", content: "Something went wrong. Try again." }]);
        setStreaming(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        const lines = text.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.delta) {
              full += data.delta;
              setStreamText(full);
            }
          } catch {
            // skip malformed
          }
        }
      }

      setMessages((m) => [...m, { role: "assistant", content: full }]);
      setStreamText("");
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Connection failed. Try again." }]);
    } finally {
      setStreaming(false);
    }
  }, [input, streaming, messages, language, code]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-400/15 text-sky-500">
            <Code className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-ink-900">Coding Mentor</h1>
            <p className="text-sm text-ink-500">
              Get guided help with your code — we won&apos;t just give you the answer.
            </p>
          </div>
        </div>
        <select
          className="input w-auto"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
        >
          {LANGUAGES.map((l) => (
            <option key={l.value} value={l.value}>
              {l.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Code editor */}
        <div className="rounded-2xl border-2 border-ink-100 bg-white overflow-hidden">
          <div className="flex items-center justify-between border-b-2 border-ink-100 px-4 py-2">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-500">Your Code</span>
            <button
              onClick={() => setCode("")}
              className="text-xs text-ink-400 hover:text-ink-600"
            >
              Clear
            </button>
          </div>
          <textarea
            className="h-[300px] w-full resize-none bg-ink-950 p-4 font-mono text-sm text-green-300 placeholder-ink-600 focus:outline-none lg:h-[500px]"
            placeholder={`Write your ${LANGUAGES.find((l) => l.value === language)?.label ?? ""} code here…`}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
          />
        </div>

        {/* Chat panel */}
        <div className="rounded-2xl border-2 border-ink-100 bg-white flex flex-col">
          <div className="border-b-2 border-ink-100 px-4 py-2">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-500">Mentor Chat</span>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-4" style={{ minHeight: 300, maxHeight: 500 }}>
            {messages.length === 0 && !streaming && (
              <div className="flex h-full items-center justify-center text-sm text-ink-400">
                Ask your coding mentor anything — paste code, describe a bug, or ask for help.
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={clsx(
                  "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                  msg.role === "user"
                    ? "ml-auto bg-ink-900 text-white rounded-br-md"
                    : "bg-white border-2 border-ink-100 text-ink-800 rounded-bl-md",
                )}
              >
                <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
              </div>
            ))}

            {streaming && streamText && (
              <div className="max-w-[85%] rounded-2xl rounded-bl-md border-2 border-ink-100 bg-white px-4 py-2.5 text-sm leading-relaxed text-ink-800">
                <pre className="whitespace-pre-wrap font-sans">
                  {streamText}
                  <span className="inline-block w-1.5 h-4 ml-0.5 bg-current opacity-60 animate-pulse align-text-bottom" />
                </pre>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          <div className="border-t-2 border-ink-100 p-3">
            <div className="flex gap-2">
              <input
                className="input flex-1"
                placeholder="Ask about your code…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                disabled={streaming}
              />
              <button
                onClick={send}
                disabled={streaming || !input.trim()}
                className="btn-primary px-4 disabled:opacity-50"
              >
                {streaming ? "…" : "Send"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
