import { useState } from "react";
import { Brain } from "lucide-react";

const QUESTIONS = [
  "What helped you solve this problem?",
  "What was the hardest step?",
  "Could you explain this solution to another student?",
  "What would you do differently next time?",
];

export function ReflectionForm({
  onSubmit,
  loading,
}: {
  onSubmit: (payload: { question: string; answer: string }) => void;
  loading: boolean;
}) {
  const [question] = useState(() => QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)]);
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="rounded-2xl border-2 border-ink-100 bg-white p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-400/15 text-sky-500">
            <Brain className="h-5 w-5" />
          </span>
          <div className="text-xs font-bold uppercase tracking-wider text-ink-500">
            Reflection
          </div>
        </div>
        <p className="mt-2 text-sm font-bold text-ink-800">{question}</p>
        <p className="mt-2 whitespace-pre-wrap text-sm text-ink-600">{answer}</p>
        <p className="mt-3 text-xs font-medium text-mint-600">Saved to your learning history.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border-2 border-ink-100 bg-white p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-400/15 text-sky-500">
          <Brain className="h-5 w-5" />
        </span>
        <div className="text-xs font-bold uppercase tracking-wider text-ink-500">
          Quick Reflection
        </div>
      </div>
      <p className="mt-2 text-sm font-bold text-ink-800">{question}</p>
      <textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        className="mt-3 w-full rounded-xl border-2 border-ink-200 px-4 py-3 text-sm text-ink-800 placeholder:text-ink-400 focus:border-sky-500 focus:outline-none"
        rows={3}
        placeholder="A sentence or two is enough."
      />
      <button
        disabled={loading || answer.trim().length === 0}
        onClick={() => {
          if (answer.trim().length === 0) return;
          setSubmitted(true);
          onSubmit({ question, answer: answer.trim() });
        }}
        className="btn-primary mt-3 w-full"
      >
        {loading ? "Saving…" : "Save reflection"}
      </button>
      <button
        onClick={() => setSubmitted(true)}
        className="mt-2 w-full text-xs font-medium text-ink-500 hover:text-ink-700"
      >
        Skip for now
      </button>
    </div>
  );
}
