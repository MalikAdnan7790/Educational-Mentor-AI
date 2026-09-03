import { ACHIEVEMENT_CATALOGUE } from "@/lib/scoring";
import { Brain, Flame, Lightbulb, Rocket, Trophy, Target, Shield, Star, Zap, Award, type LucideIcon } from "lucide-react";

const EMOJI_TO_ICON: Record<string, LucideIcon> = {
  "🧠": Brain,
  "🔥": Flame,
  "💡": Lightbulb,
  "🚀": Rocket,
  "🏆": Trophy,
  "🎯": Target,
  "🛡️": Shield,
  "⭐": Star,
  "⚡": Zap,
  "🏅": Award,
};

interface AchievementRecord {
  key: string;
  title: string;
  description: string;
  unlockedAt: string;
}

export function AchievementsList({ earned }: { earned: AchievementRecord[] }) {
  const earnedKeys = new Set(earned.map((a) => a.key));

  return (
    <div className="rounded-2xl border-2 border-ink-100 bg-white p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/15">
          <Trophy className="h-5 w-5 text-amber-500" />
        </div>
        <div className="text-xs font-bold uppercase tracking-wider text-ink-500">
          Achievements
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {ACHIEVEMENT_CATALOGUE.map((def) => {
          const unlocked = earnedKeys.has(def.key);
          const Icon = EMOJI_TO_ICON[def.icon] ?? Star;
          return (
            <div
              key={def.key}
              className={
                "flex items-start gap-3 rounded-2xl border-2 p-3 transition " +
                (unlocked
                  ? "border-amber-400/40 bg-amber-400/5"
                  : "border-ink-100 bg-white/60 opacity-60")
              }
            >
              <div className={
                "flex h-10 w-10 items-center justify-center rounded-xl " +
                (unlocked ? "bg-amber-400/15 text-amber-500" : "bg-ink-100 text-ink-400")
              }>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-ink-900">
                  {def.title}
                  {unlocked && <span className="ml-2 text-xs font-semibold text-amber-500">Unlocked</span>}
                </div>
                <div className="mt-0.5 text-xs text-ink-600">{def.description}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
