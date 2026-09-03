"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { Settings } from "lucide-react";

interface Settings {
  name: string;
  email: string | null;
  educationLevel: string | null;
  preferredLanguage: string;
  preferredMode: string;
  teacherAvatar: string;
  voiceRate: number;
}

const LEVELS = ["SCHOOL", "COLLEGE", "UNIVERSITY", "PROFESSIONAL"];
const LANGUAGES = [
  { value: "EN", label: "English" },
  { value: "UR", label: "اردو (Urdu)" },
  { value: "ROMAN_UR", label: "Roman Urdu" },
];
const MODES = [
  { value: "DEPENDENT", label: "Dependent", desc: "Full explanations and step-by-step guidance" },
  { value: "GUIDED", label: "Guided", desc: "Socratic method — questions to guide thinking" },
  { value: "ADAPTIVE", label: "Adaptive", desc: "Adjusts help as your progress changes" },
  { value: "INDEPENDENT", label: "Independent", desc: "Minimal hints, attempt problems first" },
];
const AVATARS = ["MALE", "FEMALE"];
const RATES = [0.75, 1, 1.25, 1.5];

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then(setSettings)
      .catch(() => {});
  }, []);

  async function save() {
    if (!settings) return;
    setSaving(true);
    setSaved(false);
    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          educationLevel: settings.educationLevel,
          preferredLanguage: settings.preferredLanguage,
          preferredMode: settings.preferredMode,
          teacherAvatar: settings.teacherAvatar,
          voiceRate: settings.voiceRate,
        }),
      });
      if (!response.ok) return;
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  if (!settings) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm text-ink-500">Loading settings…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink-400/15 text-ink-500">
          <Settings className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-ink-900">Settings</h1>
          <p className="text-sm text-ink-500 mt-0.5">Customize your learning experience.</p>
        </div>
      </div>

      {/* Profile */}
      <div className="rounded-2xl border-2 border-ink-100 bg-white p-5 space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-ink-500">Profile</h2>
        <div>
          <label className="text-xs text-ink-500 mb-1 block">Name</label>
          <p className="text-sm text-ink-800 font-medium">{settings.name}</p>
        </div>
        <div>
          <label className="text-xs text-ink-500 mb-1.5 block">Education Level</label>
          <div className="flex gap-1.5 flex-wrap">
            {LEVELS.map((l) => (
              <button
                key={l}
                onClick={() => setSettings({ ...settings, educationLevel: l })}
                className={clsx(
                  "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                  settings.educationLevel === l
                    ? "bg-ink-900 text-white"
                    : "border border-ink-200 text-ink-600 hover:bg-ink-50",
                )}
              >
                {l.charAt(0) + l.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Language */}
      <div className="rounded-2xl border-2 border-ink-100 bg-white p-5 space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-ink-500">Language</h2>
        <div className="flex gap-1.5 flex-wrap">
          {LANGUAGES.map((l) => (
            <button
              key={l.value}
              onClick={() => setSettings({ ...settings, preferredLanguage: l.value })}
              className={clsx(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                settings.preferredLanguage === l.value
                  ? "bg-ink-900 text-white"
                  : "border border-ink-200 text-ink-600 hover:bg-ink-50",
              )}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* Learning Mode */}
      <div className="rounded-2xl border-2 border-ink-100 bg-white p-5 space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-ink-500">Default Learning Mode</h2>
        <div className="space-y-2">
          {MODES.map((m) => (
            <button
              key={m.value}
              onClick={() => setSettings({ ...settings, preferredMode: m.value })}
              className={clsx(
                "w-full text-left rounded-2xl border-2 p-3 transition-colors",
                settings.preferredMode === m.value
                  ? "border-mint-400 bg-mint-50"
                  : "border-ink-100 hover:border-ink-300",
              )}
            >
              <p className="text-sm font-medium text-ink-800">{m.label}</p>
              <p className="text-xs text-ink-500 mt-0.5">{m.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Voice & Avatar */}
      <div className="rounded-2xl border-2 border-ink-100 bg-white p-5 space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-ink-500">Voice Teacher</h2>
        <div>
          <label className="text-xs text-ink-500 mb-1.5 block">Avatar</label>
          <div className="flex gap-2">
            {AVATARS.map((a) => (
              <button
                key={a}
                onClick={() => setSettings({ ...settings, teacherAvatar: a })}
                className={clsx(
                  "rounded-lg px-4 py-2 text-xs font-medium transition-colors",
                  settings.teacherAvatar === a
                    ? "bg-ink-900 text-white"
                    : "border border-ink-200 text-ink-600 hover:bg-ink-50",
                )}
              >
                {a === "MALE" ? "Male" : "Female"}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs text-ink-500 mb-1.5 block">Voice Speed</label>
          <div className="flex gap-1.5">
            {RATES.map((r) => (
              <button
                key={r}
                onClick={() => setSettings({ ...settings, voiceRate: r })}
                className={clsx(
                  "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                  settings.voiceRate === r
                    ? "bg-ink-900 text-white"
                    : "border border-ink-200 text-ink-600 hover:bg-ink-50",
                )}
              >
                {r}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Save */}
      <div className="flex items-center gap-3">
        <button onClick={save} disabled={saving} className="btn-primary text-sm">
          {saving ? "Saving…" : "Save changes"}
        </button>
        {saved && <span className="text-xs text-mint-600 font-medium">Saved!</span>}
      </div>
    </div>
  );
}
