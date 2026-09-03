import clsx from "clsx";
import { Shield, Lightbulb, Target, RefreshCw, type LucideIcon } from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  Shield,
  Lightbulb,
  Target,
  RefreshCw,
};

const TONE_BADGE: Record<string, string> = {
  mint: "bg-mint-400/15 text-mint-500",
  amber: "bg-amber-400/15 text-amber-500",
  coral: "bg-coral-500/15 text-coral-500",
  ink: "bg-ink-100 text-ink-600",
};

interface Metric {
  label: string;
  value: string;
  sub?: string;
  tone?: "mint" | "amber" | "coral" | "ink";
  icon?: string;
}

export function MetricsGrid({ metrics }: { metrics: Metric[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {metrics.map((m) => {
        const Icon = m.icon ? ICON_MAP[m.icon] : null;
        const badgeClass = TONE_BADGE[m.tone ?? "ink"] ?? TONE_BADGE.ink;
        return (
          <div key={m.label} className="rounded-2xl border-2 border-ink-100 bg-white p-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink-500">
              {Icon && (
                <div className={clsx("flex h-10 w-10 items-center justify-center rounded-xl", badgeClass)}>
                  <Icon className="h-5 w-5" />
                </div>
              )}
              <span>{m.label}</span>
            </div>
            <div
              className={clsx(
                "mt-2 text-2xl font-extrabold tabular-nums",
                m.tone === "mint" && "text-mint-500",
                m.tone === "amber" && "text-amber-400",
                m.tone === "coral" && "text-coral-500",
                m.tone === "ink" && "text-ink-900",
                !m.tone && "text-ink-900"
              )}
            >
              {m.value}
            </div>
            {m.sub && <p className="mt-1 text-xs text-ink-500">{m.sub}</p>}
          </div>
        );
      })}
    </div>
  );
}
