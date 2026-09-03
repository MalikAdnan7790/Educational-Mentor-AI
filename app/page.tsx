import Link from "next/link";
import {
  GraduationCap,
  Mic,
  MessageSquare,
  Image,
  FileText,
  Sparkles,
  BookOpen,
  Trophy,
  Brain,
  Code2,
  ArrowRight,
} from "lucide-react";

const FEATURES = [
  {
    icon: Mic,
    title: "Voice Teacher",
    desc: "Speak naturally in English, Urdu, or Roman Urdu. Your AI teacher listens and responds.",
    color: "bg-sky-400",
    iconColor: "text-white",
    border: "border-sky-400",
  },
  {
    icon: MessageSquare,
    title: "Ask Anything",
    desc: "Type any question and get guided, step-by-step help — never just the answer.",
    color: "bg-mint-400",
    iconColor: "text-white",
    border: "border-mint-400",
  },
  {
    icon: Image,
    title: "Image Questions",
    desc: "Snap a photo of a problem and get instant help from your AI mentor.",
    color: "bg-amber-400",
    iconColor: "text-ink-900",
    border: "border-amber-400",
  },
  {
    icon: FileText,
    title: "PDF Analysis",
    desc: "Upload a PDF and ask questions about its content. Great for textbooks and notes.",
    color: "bg-purple-500",
    iconColor: "text-white",
    border: "border-purple-500",
  },
  {
    icon: Brain,
    title: "Smart Quizzes",
    desc: "Adaptive quizzes that match your level and help you master each topic.",
    color: "bg-coral-500",
    iconColor: "text-white",
    border: "border-coral-500",
  },
  {
    icon: Code2,
    title: "Coding Mentor",
    desc: "Learn to code with guided exercises, hints, and real-time feedback.",
    color: "bg-ink-700",
    iconColor: "text-white",
    border: "border-ink-700",
  },
];

const STATS = [
  { icon: BookOpen, label: "Subjects", value: "All Major" },
  { icon: Trophy, label: "Learning Modes", value: "4 Types" },
  { icon: Sparkles, label: "AI-Powered", value: "Always" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-mint-400/10 via-white to-sky-400/5">
      {/* Nav */}
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-mint-400 text-white shadow-[0_3px_0_0_#368a00]">
            <GraduationCap className="h-5 w-5" />
          </div>
          <span className="text-lg font-extrabold text-ink-900 tracking-tight">
            Educational Mentor AI
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/login" className="btn-ghost text-xs px-3 py-2">
            Log in
          </Link>
          <Link href="/register" className="btn-primary text-xs px-3 py-2">
            Sign up free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pt-10 pb-16 text-center sm:px-6 sm:pt-16 sm:pb-20">
        <div className="fade-in-up">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-mint-400 text-white shadow-[0_6px_0_0_#368a00]">
            <GraduationCap className="h-10 w-10" />
          </div>
          <h1 className="text-4xl font-extrabold text-ink-900 sm:text-5xl lg:text-6xl tracking-tight leading-tight">
            Your personal AI teacher
            <br />
            <span className="text-mint-500">that actually teaches</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg font-medium text-ink-400 leading-relaxed">
            Ask questions, practice problems, and learn at your own pace — in English, Urdu, or
            Roman Urdu. Built to help you think, not just copy answers.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-4">
            <Link
              href="/register"
              className="btn-primary text-base px-8 py-3.5 w-full sm:w-auto"
            >
              Get started — it&apos;s free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="btn-ghost text-base px-8 py-3.5 w-full sm:w-auto"
            >
              I already have an account
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="mx-auto max-w-3xl px-4 pb-16 sm:px-6">
        <div className="grid grid-cols-3 gap-4">
          {STATS.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.label}
                className="card flex flex-col items-center p-5 text-center"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-mint-400/15">
                  <Icon className="h-5 w-5 text-mint-500" />
                </div>
                <p className="mt-2 text-lg font-extrabold text-ink-900">{s.value}</p>
                <p className="text-xs font-bold text-ink-400">{s.label}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-extrabold text-ink-900 sm:text-3xl">
            Everything you need to learn smarter
          </h2>
          <p className="mt-2 text-sm font-medium text-ink-400">
            Powerful AI tools designed for real understanding
          </p>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className={`card p-6 border-2 ${f.border}`}>
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl ${f.color} ${f.iconColor}`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-base font-extrabold text-ink-900">{f.title}</h3>
                <p className="mt-1.5 text-sm font-medium text-ink-400 leading-relaxed">
                  {f.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="card border-2 border-mint-400 bg-gradient-to-br from-mint-400/10 to-sky-400/10 p-8 text-center sm:p-12">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-mint-400 text-white shadow-[0_4px_0_0_#368a00]">
            <Sparkles className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-extrabold text-ink-900 sm:text-3xl">
            Ready to start learning?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm font-medium text-ink-400">
            Join thousands of students who are learning smarter with their personal AI mentor.
          </p>
          <Link
            href="/register"
            className="btn-primary mt-6 text-base px-8 py-3.5 inline-flex"
          >
            Create your free account
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t-2 border-ink-100 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6 sm:px-6">
          <p className="text-xs font-bold text-ink-400">
            &copy; {new Date().getFullYear()} Educational Mentor AI
          </p>
          <div className="flex gap-4">
            <Link href="/login" className="text-xs font-bold text-ink-400 hover:text-ink-600">
              Log in
            </Link>
            <Link href="/register" className="text-xs font-bold text-ink-400 hover:text-ink-600">
              Sign up
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
