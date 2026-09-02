import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-50 px-4">
      <div className="max-w-md rounded-2xl border border-ink-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-400/15">
          <svg className="h-6 w-6 text-amber-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
        </div>
        <h1 className="mt-4 text-lg font-semibold text-ink-900">Page not found</h1>
        <p className="mt-2 text-sm text-ink-600">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link href="/" className="btn-primary mt-6 inline-block">
          Back to home
        </Link>
      </div>
    </div>
  );
}
