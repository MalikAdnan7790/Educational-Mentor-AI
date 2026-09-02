"use client";

import { clsx } from "clsx";

interface TranscriptProps {
  messages: { role: "user" | "assistant"; text: string; isRTL?: boolean }[];
  interimTranscript: string;
  isRTL?: boolean;
}

export function Transcript({ messages, interimTranscript, isRTL }: TranscriptProps) {
  return (
    <div className="flex flex-col gap-3 overflow-y-auto max-h-[40vh] px-4 py-2">
      {messages.map((msg, i) => (
        <div
          key={i}
          className={clsx(
            "rounded-xl px-4 py-2.5 text-sm max-w-[85%]",
            msg.role === "user"
              ? "self-end bg-blue-600 text-white"
              : "self-start bg-white border border-ink-100 text-ink-800",
          )}
          dir={msg.isRTL ? "rtl" : "ltr"}
          lang={msg.isRTL ? "ur" : undefined}
        >
          {msg.text}
        </div>
      ))}

      {interimTranscript && (
        <div
          className={clsx(
            "self-end rounded-xl px-4 py-2.5 text-sm max-w-[85%] bg-blue-100 text-blue-600 italic",
          )}
          dir={isRTL ? "rtl" : "ltr"}
        >
          {interimTranscript}
        </div>
      )}
    </div>
  );
}
