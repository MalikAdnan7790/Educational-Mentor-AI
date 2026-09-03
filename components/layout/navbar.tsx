"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { GraduationCap, X, Menu } from "lucide-react";

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
    <header className="sticky top-0 z-40 border-b-2 border-ink-100 bg-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-mint-400 text-white shadow-[0_3px_0_0_#368a00]">
            <GraduationCap className="h-5 w-5" />
          </span>
          <span className="hidden text-lg font-extrabold text-ink-900 sm:inline">
            EMAI
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden flex-1 items-center gap-1 overflow-x-auto lg:flex" aria-label="Main navigation">
          {LINKS.map((link) => {
            const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={
                  "whitespace-nowrap rounded-xl px-3 py-2 text-sm font-semibold transition-colors " +
                  (active
                    ? "bg-mint-400/10 text-mint-500"
                    : "text-ink-400 hover:bg-ink-50 hover:text-ink-700")
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
          className="flex h-10 w-10 items-center justify-center rounded-xl text-ink-500 hover:bg-ink-50 transition-colors lg:hidden"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        <div className="flex shrink-0 items-center gap-3">
          <span className="hidden items-center gap-2.5 text-sm font-semibold text-ink-600 md:flex">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-mint-400 text-sm font-bold text-white">
              {initials || "S"}
            </span>
            {studentName}
          </span>
          <button
            onClick={logout}
            disabled={loggingOut}
            aria-label="Sign out"
            className="btn-ghost px-3 py-1.5 text-xs"
          >
            {loggingOut ? "..." : "Sign out"}
          </button>
        </div>
      </div>

      {/* Mobile menu drawer */}
      {mobileOpen && (
        <div className="border-t-2 border-ink-100 bg-white fade-in lg:hidden">
          <nav className="mx-auto max-w-6xl px-4 py-4 flex flex-col gap-1" aria-label="Mobile navigation">
            {LINKS.map((link) => {
              const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={
                    "rounded-xl px-4 py-3 text-sm font-semibold transition-colors " +
                    (active
                      ? "bg-mint-400/10 text-mint-500"
                      : "text-ink-500 hover:bg-ink-50 hover:text-ink-800")
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
