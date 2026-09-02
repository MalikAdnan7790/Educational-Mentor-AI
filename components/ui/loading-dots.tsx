export function LoadingDots({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex gap-1">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-400 [animation-delay:0ms]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-400 [animation-delay:150ms]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-400 [animation-delay:300ms]" />
      </span>
      {label && <span className="text-xs text-ink-500">{label}</span>}
    </div>
  );
}
