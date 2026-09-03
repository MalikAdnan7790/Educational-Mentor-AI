"use client";

import { X } from "lucide-react";

interface SubjectChipsProps {
  subjectKey: string | null;
  topic: string | null;
  onSubjectChange?: (key: string | null) => void;
  onTopicChange?: (topic: string | null) => void;
  subjects: { key: string; name: string }[];
}

const PASTEL_COLORS = [
  "bg-mint-100 text-mint-700 border-mint-200",
  "bg-sky-100 text-sky-700 border-sky-200",
  "bg-purple-100 text-purple-700 border-purple-200",
  "bg-amber-100 text-amber-700 border-amber-200",
  "bg-coral-100 text-coral-700 border-coral-200",
];

function getColorForKey(key: string): string {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = key.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PASTEL_COLORS[Math.abs(hash) % PASTEL_COLORS.length];
}

export function SubjectChips({
  subjectKey,
  topic,
  onSubjectChange,
  onTopicChange,
  subjects,
}: SubjectChipsProps) {
  if (!subjectKey && !topic) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {subjectKey && (
        <span className={`inline-flex items-center gap-1 rounded-full border-2 px-2.5 py-0.5 text-xs font-bold ${getColorForKey(subjectKey)}`}>
          <span className="opacity-60">Subject:</span>
          {subjects.find((s) => s.key === subjectKey)?.name ?? subjectKey}
          {onSubjectChange && (
            <button
              type="button"
              onClick={() => onSubjectChange(null)}
              className="ml-0.5 opacity-60 hover:opacity-100 transition-opacity"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </span>
      )}
      {topic && (
        <span className="inline-flex items-center gap-1 rounded-full border-2 border-ink-200 bg-ink-50 px-2.5 py-0.5 text-xs font-bold text-ink-600">
          <span className="opacity-60">Topic:</span>
          {topic}
          {onTopicChange && (
            <button
              type="button"
              onClick={() => onTopicChange(null)}
              className="ml-0.5 opacity-60 hover:opacity-100 transition-opacity"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </span>
      )}
    </div>
  );
}
