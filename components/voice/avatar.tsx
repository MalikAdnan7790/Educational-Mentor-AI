"use client";

import { clsx } from "clsx";

interface AvatarProps {
  gender: "MALE" | "FEMALE";
  state: "idle" | "listening" | "thinking" | "speaking";
  className?: string;
}

export function Avatar({ gender, state, className }: AvatarProps) {
  const isFemale = gender === "FEMALE";

  return (
    <div className={clsx("relative flex items-center justify-center", className)}>
      {/* Glow ring */}
      <div
        className={clsx(
          "absolute inset-0 rounded-full transition-all duration-700",
          state === "listening" && "animate-pulse bg-sky-200/40 scale-110",
          state === "thinking" && "animate-pulse bg-amber-200/40 scale-105",
          state === "speaking" && "bg-mint-200/40 scale-110",
          state === "idle" && "bg-ink-100/60 scale-100",
        )}
      />

      {/* Mint border ring */}
      <div
        className={clsx(
          "absolute inset-0 rounded-full border-3 transition-all duration-500",
          state === "speaking" && "border-mint-400",
          state === "listening" && "border-sky-400",
          state === "thinking" && "border-amber-400",
          state === "idle" && "border-ink-200",
        )}
      />

      {/* Avatar SVG */}
      <svg
        viewBox="0 0 120 120"
        className={clsx(
          "relative z-10 h-full w-full transition-transform duration-500",
          state === "speaking" && "animate-avatar-speak",
          state === "thinking" && "animate-avatar-think",
        )}
      >
        {/* Head */}
        <circle cx="60" cy="45" r="28" fill={isFemale ? "#F5D0B0" : "#E8C39E"} />

        {/* Hair */}
        {isFemale ? (
          <path
            d="M32 42 C32 22, 88 22, 88 42 L88 55 C88 55, 85 48, 78 45 C78 35, 42 35, 42 45 C35 48, 32 55, 32 55 Z"
            fill="#4A3728"
          />
        ) : (
          <path
            d="M35 40 C35 24, 85 24, 85 40 L85 38 C85 28, 35 28, 35 38 Z"
            fill="#3D2B1F"
          />
        )}

        {/* Eyes */}
        <ellipse cx="48" cy="44" rx="3" ry={state === "thinking" ? 2 : 3.5} fill="#2D1810" />
        <ellipse cx="72" cy="44" rx="3" ry={state === "thinking" ? 2 : 3.5} fill="#2D1810" />

        {/* Eyebrows */}
        <path d="M42 37 Q48 34 54 37" stroke="#3D2B1F" strokeWidth="1.5" fill="none" />
        <path d="M66 37 Q72 34 78 37" stroke="#3D2B1F" strokeWidth="1.5" fill="none" />

        {/* Mouth */}
        {state === "speaking" ? (
          <ellipse cx="60" cy="56" rx="5" ry="4" fill="#C0392B" />
        ) : state === "thinking" ? (
          <path d="M54 56 Q60 54 66 56" stroke="#8B6F5E" strokeWidth="1.5" fill="none" />
        ) : (
          <path d="M52 55 Q60 61 68 55" stroke="#8B6F5E" strokeWidth="2" fill="none" />
        )}

        {/* Body */}
        <path
          d="M30 95 C30 75, 45 68, 60 68 C75 68, 90 75, 90 95 L90 120 L30 120 Z"
          fill={isFemale ? "#6366F1" : "#1E40AF"}
        />

        {/* Collar */}
        <path
          d="M45 70 L60 78 L75 70"
          stroke="white"
          strokeWidth="1.5"
          fill="none"
        />
      </svg>

      {/* Sound waves when speaking */}
      {state === "speaking" && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
          <div className="w-1 h-3 bg-mint-400 rounded-full animate-sound-wave" style={{ animationDelay: "0ms" }} />
          <div className="w-1 h-5 bg-mint-400 rounded-full animate-sound-wave" style={{ animationDelay: "150ms" }} />
          <div className="w-1 h-4 bg-mint-400 rounded-full animate-sound-wave" style={{ animationDelay: "300ms" }} />
          <div className="w-1 h-6 bg-mint-400 rounded-full animate-sound-wave" style={{ animationDelay: "100ms" }} />
          <div className="w-1 h-3 bg-mint-400 rounded-full animate-sound-wave" style={{ animationDelay: "250ms" }} />
        </div>
      )}
    </div>
  );
}
