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
            "rounded-2xl px-4 py-2.5 text-sm max-w-[85%]",
            msg.role === "user"
              ? "self-end bg-mint-500 text-white"
              : "self-start bg-white border-2 border-ink-100 text-ink-800",
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
            "self-end rounded-2xl px-4 py-2.5 text-sm max-w-[85%] bg-mint-100 text-mint-700 italic",
          )}
          dir={isRTL ? "rtl" : "ltr"}
        >
          {interimTranscript}
        </div>
      )}
    </div>
  );
}
