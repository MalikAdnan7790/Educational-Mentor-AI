"use client";

import { clsx } from "clsx";
import { Mic, MicOff } from "lucide-react";

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
        "shadow-[0_4px_0_0_0] active:translate-y-1 active:shadow-none",
        isListening
          ? "bg-coral-500 hover:bg-coral-600 text-white shadow-[0_4px_0_0_#b91c1c]"
          : "bg-mint-500 hover:bg-mint-600 text-white shadow-[0_4px_0_0_#368a00]",
        disabled && "opacity-50 cursor-not-allowed",
        className,
      )}
      aria-label={isListening ? "Stop listening" : "Start listening"}
    >
      {/* Pulse ring when listening */}
      {isListening && (
        <>
          <span className="absolute inset-0 rounded-full bg-coral-400 animate-ping opacity-30" />
          <span className="absolute -inset-2 rounded-full border-2 border-coral-300 animate-pulse" />
        </>
      )}

      {/* Mic icon */}
      {isListening ? (
        <MicOff className="h-8 w-8" />
      ) : (
        <Mic className="h-8 w-8" />
      )}
    </button>
  );
}
