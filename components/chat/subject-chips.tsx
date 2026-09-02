"use client";

interface SubjectChipsProps {
  subjectKey: string | null;
  topic: string | null;
  onSubjectChange?: (key: string | null) => void;
  onTopicChange?: (topic: string | null) => void;
  subjects: { key: string; name: string }[];
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
        <span className="chip">
          <span className="text-ink-400">Subject:</span>
          {subjects.find((s) => s.key === subjectKey)?.name ?? subjectKey}
          {onSubjectChange && (
            <button
              type="button"
              onClick={() => onSubjectChange(null)}
              className="ml-1 text-ink-400 hover:text-ink-600"
            >
              ×
            </button>
          )}
        </span>
      )}
      {topic && (
        <span className="chip">
          <span className="text-ink-400">Topic:</span>
          {topic}
          {onTopicChange && (
            <button
              type="button"
              onClick={() => onTopicChange(null)}
              className="ml-1 text-ink-400 hover:text-ink-600"
            >
              ×
            </button>
          )}
        </span>
      )}
    </div>
  );
}
