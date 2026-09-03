"use client";

import { clsx } from "clsx";
import { Pause, Play, Volume2, VolumeX, RotateCcw } from "lucide-react";
import { VOICE_PRESETS } from "@/lib/voice/presets";

interface VoiceControlsProps {
  rate: number;
  onRateChange: (rate: number) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onReplay: () => void;
  canReplay: boolean;
  isSpeaking: boolean;
  isPaused: boolean;
  onPause: () => void;
  onResume: () => void;
  preset: string;
  onPresetChange: (preset: string) => void;
}

const RATES = [0.75, 1, 1.25, 1.5, 1.75, 2];

export function VoiceControls({
  rate,
  onRateChange,
  isMuted,
  onToggleMute,
  onReplay,
  canReplay,
  isSpeaking,
  isPaused,
  onPause,
  onResume,
  preset,
  onPresetChange,
}: VoiceControlsProps) {
  return (
    <div className="flex flex-col items-center gap-3 px-4">
      {/* Voice preset selector */}
      <div className="flex items-center gap-1.5 flex-wrap justify-center">
        <span className="text-xs font-bold uppercase tracking-wider text-ink-500 mr-1">Voice:</span>
        {Object.values(VOICE_PRESETS).map((p) => (
          <button
            key={p.id}
            onClick={() => onPresetChange(p.id)}
            title={p.description}
            className={clsx(
              "rounded-xl px-2.5 py-1 text-xs font-semibold transition-colors",
              preset === p.id
                ? "bg-mint-500 text-white"
                : "bg-ink-100 text-ink-600 hover:bg-ink-200",
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3">
        {/* Rate selector */}
        <div className="flex items-center gap-1">
          <span className="text-xs font-bold uppercase tracking-wider text-ink-500 mr-1">Speed:</span>
          {RATES.map((r) => (
            <button
              key={r}
              onClick={() => onRateChange(r)}
              className={clsx(
                "rounded-xl px-2 py-1 text-xs font-semibold transition-colors",
                rate === r
                  ? "bg-sky-500 text-white"
                  : "bg-ink-100 text-ink-600 hover:bg-ink-200",
              )}
            >
              {r}x
            </button>
          ))}
        </div>

        {/* Pause / Resume */}
        {isSpeaking && (
          <button
            onClick={isPaused ? onResume : onPause}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-400/15 text-purple-500 hover:bg-purple-400/25 transition-colors"
            aria-label={isPaused ? "Resume" : "Pause"}
          >
            {isPaused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
          </button>
        )}

        {/* Mute toggle */}
        <button
          onClick={onToggleMute}
          className={clsx(
            "flex h-9 w-9 items-center justify-center rounded-xl transition-colors",
            isMuted
              ? "bg-amber-400/15 text-amber-500"
              : "bg-ink-100 text-ink-600 hover:bg-ink-200",
          )}
          aria-label={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </button>

        {/* Replay */}
        <button
          onClick={onReplay}
          disabled={!canReplay}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-400/15 text-sky-500 hover:bg-sky-400/25 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Replay last response"
        >
          <RotateCcw className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
