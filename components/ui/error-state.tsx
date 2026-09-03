import { AlertCircle } from "lucide-react";

export function ErrorState({ title = "Something went wrong", message, onRetry }: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-coral-500/20 bg-coral-500/5 p-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-coral-500/15">
        <AlertCircle className="h-6 w-6 text-coral-500" />
      </div>
      <h3 className="mt-3 text-sm font-extrabold text-ink-900">{title}</h3>
      {message && <p className="mt-1.5 text-sm text-ink-600">{message}</p>}
      {onRetry && (
        <button onClick={onRetry} className="btn-primary mt-4 rounded-xl text-xs">
          Try again
        </button>
      )}
    </div>
  );
}
