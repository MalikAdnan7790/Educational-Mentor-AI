"use client";

import { clsx } from "clsx";

interface VoiceControlsProps {
  rate: number;
  onRateChange: (rate: number) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onReplay: () => void;
  canReplay: boolean;
}

const RATES = [0.75, 1, 1.25, 1.5];

export function VoiceControls({
  rate,
  onRateChange,
  isMuted,
  onToggleMute,
  onReplay,
  canReplay,
}: VoiceControlsProps) {
  return (
    <div className="flex items-center gap-4 px-4">
      {/* Rate selector */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-ink-500 mr-1">Speed:</span>
        {RATES.map((r) => (
          <button
            key={r}
            onClick={() => onRateChange(r)}
            className={clsx(
              "rounded-lg px-2 py-1 text-xs font-medium transition-colors",
              rate === r
                ? "bg-blue-600 text-white"
                : "bg-ink-100 text-ink-600 hover:bg-ink-200",
            )}
          >
            {r}x
          </button>
        ))}
      </div>

      {/* Mute toggle */}
      <button
        onClick={onToggleMute}
        className={clsx(
          "rounded-lg p-2 transition-colors",
          isMuted ? "bg-amber-100 text-amber-600" : "bg-ink-100 text-ink-600 hover:bg-ink-200",
        )}
        aria-label={isMuted ? "Unmute" : "Mute"}
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          {isMuted ? (
            <>
              <path d="M11 5L6 9H2v6h4l5 4V5z" />
              <line x1="23" y1="9" x2="17" y2="15" />
              <line x1="17" y1="9" x2="23" y2="15" />
            </>
          ) : (
            <>
              <path d="M11 5L6 9H2v6h4l5 4V5z" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            </>
          )}
        </svg>
      </button>

      {/* Replay */}
      <button
        onClick={onReplay}
        disabled={!canReplay}
        className="rounded-lg p-2 bg-ink-100 text-ink-600 hover:bg-ink-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        aria-label="Replay last response"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="1 4 1 10 7 10" />
          <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
        </svg>
      </button>
    </div>
  );
}
