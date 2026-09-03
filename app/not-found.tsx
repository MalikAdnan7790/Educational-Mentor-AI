import Link from "next/link";
import { Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-amber-400/5 via-white to-ink-50 px-4">
      <div className="max-w-md rounded-2xl border-2 border-ink-100 bg-white p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-400/15">
          <Search className="h-7 w-7 text-amber-500" />
        </div>
        <h1 className="mt-4 text-xl font-extrabold text-ink-900">Page not found</h1>
        <p className="mt-2 text-sm text-ink-600">
          The page you&apos;re looking for doesn&apos;t exist or has been moved. Let&apos;s get you back on track!
        </p>
        <Link href="/" className="btn-primary mt-6 inline-block rounded-xl">
          Back to home
        </Link>
      </div>
    </div>
  );
}
