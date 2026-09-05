"use client";

import { useState, useEffect } from "react";
import { X, Sparkles } from "lucide-react";

interface WelcomeCardProps {
  onAskQuestion?: () => void;
}

export function WelcomeCard({ onAskQuestion }: WelcomeCardProps) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("welcome-card-dismissed");
    if (stored === "true") {
      setDismissed(true);
      return;
    }
    const timer = setTimeout(() => setVisible(true), 300);
    return () => clearTimeout(timer);
  }, []);

  function handleClose() {
    setVisible(false);
    setDismissed(true);
    localStorage.setItem("welcome-card-dismissed", "true");
  }

  function handleAsk() {
    if (onAskQuestion) {
      onAskQuestion();
    }
    handleClose();
  }

  if (dismissed || !visible) return null;

  return (
    <div className="fade-in-up mb-4">
      <div
        className="relative overflow-hidden rounded-2xl border-2 border-mint-400/30 bg-white/80 p-5 backdrop-blur-md"
        style={{
          boxShadow: "0 8px 32px rgba(88, 204, 2, 0.12), 0 2px 8px rgba(0, 0, 0, 0.06)",
        }}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-600"
          aria-label="Dismiss welcome message"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Content */}
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-mint-400/15 text-mint-500">
            <Sparkles className="h-6 w-6" />
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-extrabold text-ink-900">
              👋 Welcome to Educational Mentor AI!
            </h3>
            <p className="mt-1 text-sm font-medium text-ink-500 leading-relaxed">
              I&apos;m here to help you learn, understand concepts, and solve your questions.
            </p>

            {/* CTA Button */}
            <button
              onClick={handleAsk}
              className="btn-primary mt-3 text-xs px-4 py-2"
            >
              Ask a Question
            </button>
          </div>
        </div>

        {/* Decorative gradient */}
        <div
          className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-20"
          style={{
            background: "radial-gradient(circle, #58cc02 0%, transparent 70%)",
          }}
        />
      </div>
    </div>
  );
}
