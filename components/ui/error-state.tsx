export function ErrorState({ title = "Something went wrong", message, onRetry }: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-coral-500/20 bg-coral-500/5 p-8 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-coral-500/10">
        <svg className="h-5 w-5 text-coral-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
        </svg>
      </div>
      <h3 className="mt-3 text-sm font-semibold text-ink-900">{title}</h3>
      {message && <p className="mt-1 text-sm text-ink-600">{message}</p>}
      {onRetry && (
        <button onClick={onRetry} className="btn-ghost mt-4 text-xs">
          Try again
        </button>
      )}
    </div>
  );
}
