export function LoadingDots({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex gap-1.5">
        <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-mint-500 [animation-delay:0ms]" />
        <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-mint-400 [animation-delay:150ms]" />
        <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-mint-300 [animation-delay:300ms]" />
      </span>
      {label && <span className="text-xs font-medium text-ink-500">{label}</span>}
    </div>
  );
}
