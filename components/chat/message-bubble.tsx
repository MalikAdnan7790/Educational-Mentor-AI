"use client";

import { clsx } from "clsx";

interface MessageBubbleProps {
  role: "USER" | "ASSISTANT";
  content: string;
  language?: string | null;
  isStreaming?: boolean;
}

export function MessageBubble({ role, content, language, isStreaming }: MessageBubbleProps) {
  const isUser = role === "USER";
  const isUrdu = language === "UR";

  return (
    <div className={clsx("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={clsx(
          "max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm",
          isUser
            ? "bg-ink-900 text-white rounded-br-md"
            : "bg-white border border-ink-100 text-ink-800 rounded-bl-md",
        )}
        dir={isUrdu ? "rtl" : "ltr"}
        lang={isUrdu ? "ur" : language === "ROMAN_UR" ? "ur-Latn" : "en"}
      >
        <div className={clsx(isUrdu && "rtl-text font-urdu text-[15px]")}>
          {content}
          {isStreaming && (
            <span className="inline-block w-1.5 h-4 ml-0.5 bg-current opacity-60 animate-pulse align-text-bottom" />
          )}
        </div>
      </div>
    </div>
  );
}
