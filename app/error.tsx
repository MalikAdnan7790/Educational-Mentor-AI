"use client";

import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-coral-500/5 via-white to-ink-50 px-4">
      <div className="max-w-md rounded-2xl border-2 border-ink-100 bg-white p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-coral-500/15">
          <AlertCircle className="h-7 w-7 text-coral-500" />
        </div>
        <h1 className="mt-4 text-xl font-extrabold text-ink-900">Oops! Something went wrong</h1>
        <p className="mt-2 text-sm text-ink-600">
          {error.message || "An unexpected error occurred. Don't worry — let's try again!"}
        </p>
        <div className="mt-6 flex gap-2">
          <button onClick={() => router.push("/")} className="btn-ghost flex-1 rounded-xl">
            Go home
          </button>
          <button onClick={reset} className="btn-primary flex-1 rounded-xl">
            Try again
          </button>
        </div>
      </div>
    </div>
  );
}
