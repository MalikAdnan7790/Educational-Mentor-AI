"use client";

import { useState, useEffect } from "react";
import { VoiceConsole } from "@/components/voice/voice-console";
import { clsx } from "clsx";
import { Mic } from "lucide-react";

type Language = "EN" | "UR" | "ROMAN_UR";
type Mode = "DEPENDENT" | "GUIDED" | "ADAPTIVE" | "INDEPENDENT";

const MODES: { value: Mode; label: string; desc: string }[] = [
  { value: "GUIDED", label: "Guided", desc: "Socratic hints, no direct answers" },
  { value: "DEPENDENT", label: "Dependent", desc: "Full explanations with check questions" },
  { value: "ADAPTIVE", label: "Adaptive", desc: "Adjusts to your level" },
  { value: "INDEPENDENT", label: "Independent", desc: "Minimal hints, try first" },
];

const LANGUAGES: { value: Language; label: string }[] = [
  { value: "EN", label: "English" },
  { value: "UR", label: "اردو" },
  { value: "ROMAN_UR", label: "Roman Urdu" },
];

export default function VoicePage() {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("GUIDED");
  const [language, setLanguage] = useState<Language>("EN");
  const [avatarGender, setAvatarGender] = useState<"MALE" | "FEMALE">("MALE");
  const [voiceRate, setVoiceRate] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load settings
    fetch("/api/settings")
      .then((r) => r.json())
      .then((s) => {
        if (s.preferredMode) setMode(s.preferredMode);
        if (s.preferredLanguage) setLanguage(s.preferredLanguage);
        if (s.teacherAvatar) setAvatarGender(s.teacherAvatar);
        if (s.voiceRate) setVoiceRate(s.voiceRate);
      })
      .catch(() => {});
  }, []);

  const startConversation = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "VOICE",
          mode,
          language,
        }),
      });
      const data = await res.json();
      setConversationId(data.id);
    } catch {
      // Fall through
    } finally {
      setLoading(false);
    }
  };

  if (!conversationId) {
    return (
      <div className="mx-auto max-w-lg px-4 py-8">
        <div className="flex items-start gap-4 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-400/15 text-sky-500">
            <Mic className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-ink-900">Voice Teacher</h1>
            <p className="text-sm text-ink-500">
              Talk to your AI teacher. Ask questions, get explanations, and practice — all by voice.
            </p>
          </div>
        </div>

        {/* Mode selector */}
        <div className="mb-6 rounded-2xl border-2 border-ink-100 bg-white p-5">
          <label className="text-xs font-bold uppercase tracking-wider text-ink-500 mb-3 block">Learning Mode</label>
          <div className="grid grid-cols-2 gap-2">
            {MODES.map((m) => (
              <button
                key={m.value}
                onClick={() => setMode(m.value)}
                className={clsx(
                  "rounded-2xl border-2 p-3 text-left transition-all",
                  mode === m.value
                    ? "border-mint-400 bg-mint-50"
                    : "border-ink-100 bg-white hover:border-ink-300",
                )}
              >
                <div className="text-sm font-medium">{m.label}</div>
                <div className="text-xs text-ink-500">{m.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Language selector */}
        <div className="mb-6 rounded-2xl border-2 border-ink-100 bg-white p-5">
          <label className="text-xs font-bold uppercase tracking-wider text-ink-500 mb-3 block">Language</label>
          <div className="flex gap-2">
            {LANGUAGES.map((l) => (
              <button
                key={l.value}
                onClick={() => setLanguage(l.value)}
                className={clsx(
                  "rounded-2xl border-2 px-4 py-2 text-sm transition-all",
                  language === l.value
                    ? "border-mint-400 bg-mint-50 text-mint-600"
                    : "border-ink-100 bg-white hover:border-ink-300",
                )}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        {/* Avatar gender */}
        <div className="mb-8 rounded-2xl border-2 border-ink-100 bg-white p-5">
          <label className="text-xs font-bold uppercase tracking-wider text-ink-500 mb-3 block">Teacher Avatar</label>
          <div className="flex gap-2">
            <button
              onClick={() => setAvatarGender("MALE")}
              className={clsx(
                "rounded-2xl border-2 px-4 py-2 text-sm transition-all",
                avatarGender === "MALE"
                  ? "border-mint-400 bg-mint-50"
                  : "border-ink-100 bg-white hover:border-ink-300",
              )}
            >
              Male
            </button>
            <button
              onClick={() => setAvatarGender("FEMALE")}
              className={clsx(
                "rounded-2xl border-2 px-4 py-2 text-sm transition-all",
                avatarGender === "FEMALE"
                  ? "border-mint-400 bg-mint-50"
                  : "border-ink-100 bg-white hover:border-ink-300",
              )}
            >
              Female
            </button>
          </div>
        </div>

        <button
          onClick={startConversation}
          disabled={loading}
          className="btn btn-primary w-full py-3 text-base"
        >
          {loading ? "Starting..." : "Start Voice Session"}
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-400/15 text-sky-500">
            <Mic className="h-4 w-4" />
          </div>
          <h1 className="text-lg font-extrabold text-ink-900">Voice Teacher</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-ink-400">{MODES.find((m) => m.value === mode)?.label}</span>
          <button
            onClick={() => setConversationId(null)}
            className="text-xs text-ink-400 hover:text-ink-600 transition-colors"
          >
            New session
          </button>
        </div>
      </div>

      <VoiceConsole
        conversationId={conversationId}
        language={language}
        mode={mode}
        avatarGender={avatarGender}
        voiceRate={voiceRate}
      />
    </div>
  );
}
