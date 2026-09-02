import { useState } from "react";

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
      <div className="card p-5">
        <div className="text-xs font-medium uppercase tracking-wider text-ink-500">
          Reflection
        </div>
        <p className="mt-2 text-sm font-medium text-ink-800">{question}</p>
        <p className="mt-2 whitespace-pre-wrap text-sm text-ink-600">{answer}</p>
        <p className="mt-3 text-xs text-mint-600">Saved to your learning history.</p>
      </div>
    );
  }

  return (
    <div className="card p-5">
      <div className="text-xs font-medium uppercase tracking-wider text-ink-500">
        Quick Reflection
      </div>
      <p className="mt-2 text-sm font-medium text-ink-800">{question}</p>
      <textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        className="textarea mt-3"
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
        className="btn-mint mt-3 w-full"
      >
        {loading ? "Saving…" : "Save reflection"}
      </button>
      <button
        onClick={() => setSubmitted(true)}
        className="mt-2 w-full text-xs text-ink-500 hover:text-ink-700"
      >
        Skip for now
      </button>
    </div>
  );
}
