"use client";

import { useState, useRef, useCallback, memo } from "react";
import { clsx } from "clsx";

interface MessageBubbleProps {
  role: "USER" | "ASSISTANT";
  content: string;
  language?: string | null;
  isStreaming?: boolean;
  messageId?: string;
}

export const MessageBubble = memo(function MessageBubble({ role, content, language, isStreaming, messageId }: MessageBubbleProps) {
  const isUser = role === "USER";
  const isUrdu = language === "UR";
  const isAssistant = role === "ASSISTANT";

  const [feedback, setFeedback] = useState<"UP" | "DOWN" | null>(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [ttsPlaying, setTtsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stopTts = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    setTtsPlaying(false);
  }, []);

  const playTts = useCallback(async () => {
    if (ttsPlaying) {
      stopTts();
      return;
    }
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: content }),
      });
      if (!res.ok) throw new Error("tts_failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      setTtsPlaying(true);
      audio.onended = () => {
        URL.revokeObjectURL(url);
        setTtsPlaying(false);
        audioRef.current = null;
      };
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        setTtsPlaying(false);
        audioRef.current = null;
      };
      await audio.play();
    } catch {
      setTtsPlaying(false);
    }
  }, [content, ttsPlaying, stopTts]);

  async function submitFeedback(rating: "UP" | "DOWN") {
    if (!messageId || feedbackLoading) return;

    if (feedback === rating) {
      setFeedbackLoading(true);
      try {
        await fetch(`/api/messages/${messageId}/feedback`, { method: "DELETE" });
        setFeedback(null);
      } finally {
        setFeedbackLoading(false);
      }
      return;
    }

    setFeedbackLoading(true);
    try {
      await fetch(`/api/messages/${messageId}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating }),
      });
      setFeedback(rating);
    } finally {
      setFeedbackLoading(false);
    }
  }

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
      {isAssistant && messageId && !isStreaming && (
        <div className="flex flex-col gap-0.5 ml-1.5 self-end mb-1">
          <button
            type="button"
            onClick={playTts}
            className={clsx(
              "p-1 rounded transition-colors",
              ttsPlaying
                ? "text-blue-600 bg-blue-50"
                : "text-ink-300 hover:text-blue-500 hover:bg-blue-50",
            )}
            aria-label={ttsPlaying ? "Stop reading" : "Read aloud"}
            title={ttsPlaying ? "Stop reading" : "Read aloud"}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {ttsPlaying ? (
                <>
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </>
              ) : (
                <>
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                </>
              )}
            </svg>
          </button>
          <button
            type="button"
            onClick={() => submitFeedback("UP")}
            disabled={feedbackLoading}
            className={clsx(
              "p-1 rounded transition-colors",
              feedback === "UP"
                ? "text-emerald-600 bg-emerald-50"
                : "text-ink-300 hover:text-emerald-500 hover:bg-emerald-50",
            )}
            aria-label="Helpful response"
            title="This was helpful"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 10v12" />
              <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => submitFeedback("DOWN")}
            disabled={feedbackLoading}
            className={clsx(
              "p-1 rounded transition-colors",
              feedback === "DOWN"
                ? "text-red-500 bg-red-50"
                : "text-ink-300 hover:text-red-400 hover:bg-red-50",
            )}
            aria-label="Not helpful"
            title="This wasn't helpful"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 14V2" />
              <path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
});
