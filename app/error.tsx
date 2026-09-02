"use client";

import { useRouter } from "next/navigation";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-50 px-4">
      <div className="max-w-md rounded-2xl border border-ink-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-coral-500/10">
          <svg className="h-6 w-6 text-coral-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
          </svg>
        </div>
        <h1 className="mt-4 text-lg font-semibold text-ink-900">Something went wrong</h1>
        <p className="mt-2 text-sm text-ink-600">
          {error.message || "An unexpected error occurred. Please try again."}
        </p>
        <div className="mt-6 flex gap-2">
          <button onClick={() => router.push("/")} className="btn-ghost flex-1">
            Go home
          </button>
          <button onClick={reset} className="btn-primary flex-1">
            Try again
          </button>
        </div>
      </div>
    </div>
  );
}
