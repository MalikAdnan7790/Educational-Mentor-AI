"use client";

import { clsx } from "clsx";

interface MicButtonProps {
  isListening: boolean;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}

export function MicButton({ isListening, onClick, disabled, className }: MicButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        "relative flex h-20 w-20 items-center justify-center rounded-full transition-all",
        "shadow-lg active:scale-95",
        isListening
          ? "bg-red-500 hover:bg-red-600 text-white"
          : "bg-blue-600 hover:bg-blue-700 text-white",
        disabled && "opacity-50 cursor-not-allowed",
        className,
      )}
      aria-label={isListening ? "Stop listening" : "Start listening"}
    >
      {/* Pulse ring when listening */}
      {isListening && (
        <>
          <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-30" />
          <span className="absolute -inset-2 rounded-full border-2 border-red-300 animate-pulse" />
        </>
      )}

      {/* Mic icon */}
      <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        {isListening ? (
          <>
            <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" />
          </>
        ) : (
          <>
            <rect x="9" y="2" width="6" height="12" rx="3" />
            <path d="M5 10a7 7 0 0 0 14 0" />
            <line x1="12" y1="19" x2="12" y2="22" />
            <line x1="8" y1="22" x2="16" y2="22" />
          </>
        )}
      </svg>
    </button>
  );
}
