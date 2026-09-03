"use client";

import { useState, useRef, useCallback, memo } from "react";
import { clsx } from "clsx";
import { Volume2, Pause, ThumbsUp, ThumbsDown } from "lucide-react";

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
          "max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm border-2",
          isUser
            ? "bg-mint-400 text-white rounded-br-sm border-mint-500"
            : "bg-ink-50 text-ink-800 rounded-bl-sm border-ink-100",
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
              "p-1.5 rounded-xl transition-colors",
              ttsPlaying
                ? "text-sky-500 bg-sky-50"
                : "text-ink-300 hover:text-sky-500 hover:bg-sky-50",
            )}
            aria-label={ttsPlaying ? "Stop reading" : "Read aloud"}
            title={ttsPlaying ? "Stop reading" : "Read aloud"}
          >
            {ttsPlaying ? <Pause className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
          </button>
          <button
            type="button"
            onClick={() => submitFeedback("UP")}
            disabled={feedbackLoading}
            className={clsx(
              "p-1.5 rounded-xl transition-colors",
              feedback === "UP"
                ? "text-mint-500 bg-mint-50"
                : "text-ink-300 hover:text-mint-500 hover:bg-mint-50",
            )}
            aria-label="Helpful response"
            title="This was helpful"
          >
            <ThumbsUp className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => submitFeedback("DOWN")}
            disabled={feedbackLoading}
            className={clsx(
              "p-1.5 rounded-xl transition-colors",
              feedback === "DOWN"
                ? "text-coral-500 bg-coral-50"
                : "text-ink-300 hover:text-coral-500 hover:bg-coral-50",
            )}
            aria-label="Not helpful"
            title="This wasn't helpful"
          >
            <ThumbsDown className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
});
