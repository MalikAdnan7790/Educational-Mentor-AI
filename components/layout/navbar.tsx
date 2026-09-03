"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/ask", label: "Ask Anything" },
  { href: "/voice", label: "Voice Teacher" },
  { href: "/notes", label: "My Notes" },
  { href: "/viva", label: "AI Viva" },
  { href: "/exam", label: "Exams" },
  { href: "/roadmap", label: "Roadmap" },
  { href: "/coding", label: "Coding" },
  { href: "/challenge", label: "Challenge" },
  { href: "/teach", label: "Teach Me" },
  { href: "/lessons", label: "Lessons" },
  { href: "/sixty-second", label: "60-Sec" },
  { href: "/missions", label: "Missions" },
  { href: "/coach", label: "Coach" },
  { href: "/dashboard", label: "My Learning" },
  { href: "/history", label: "History" },
  { href: "/settings", label: "Settings" },
];

export function Navbar({ studentName }: { studentName: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  async function logout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }

  const initials = studentName
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-40 border-b border-ink-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2 font-semibold text-ink-900">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-mint-500/15 text-base">🎓</span>
          <span className="hidden sm:inline">Educational Mentor AI</span>
          <span className="sm:hidden">EMAI</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden flex-1 items-center gap-1 lg:flex" aria-label="Main navigation">
          {LINKS.map((link) => {
            const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={
                  "whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors " +
                  (active ? "bg-ink-100 text-ink-900" : "text-ink-500 hover:bg-ink-50 hover:text-ink-800")
                }
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Spacer for desktop */}
        <div className="hidden flex-1 lg:block" />

        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          className="lg:hidden flex items-center justify-center h-9 w-9 rounded-lg text-ink-600 hover:bg-ink-50 transition-colors"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>

        <div className="flex shrink-0 items-center gap-3">
          <span className="hidden items-center gap-2 text-sm text-ink-600 md:flex">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink-900 text-xs font-semibold text-white">
              {initials || "S"}
            </span>
            {studentName}
          </span>
          <button onClick={logout} disabled={loggingOut} aria-label="Sign out" className="btn-ghost px-3 py-1.5 text-xs">
            {loggingOut ? "…" : "Sign out"}
          </button>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-ink-100 bg-white fade-in">
          <nav className="mx-auto max-w-6xl px-4 py-3 flex flex-col gap-0.5" aria-label="Mobile navigation">
            {LINKS.map((link) => {
              const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={
                    "rounded-lg px-3 py-2.5 text-sm font-medium transition-colors " +
                    (active ? "bg-ink-100 text-ink-900" : "text-ink-500 hover:bg-ink-50 hover:text-ink-800")
                  }
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
