import { ACHIEVEMENT_CATALOGUE } from "@/lib/scoring";

interface AchievementRecord {
  key: string;
  title: string;
  description: string;
  unlockedAt: string;
}

export function AchievementsList({ earned }: { earned: AchievementRecord[] }) {
  const earnedKeys = new Set(earned.map((a) => a.key));

  return (
    <div className="card p-5">
      <div className="text-xs font-medium uppercase tracking-wider text-ink-500">
        Achievements
      </div>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {ACHIEVEMENT_CATALOGUE.map((def) => {
          const unlocked = earnedKeys.has(def.key);
          return (
            <div
              key={def.key}
              className={
                "flex items-start gap-3 rounded-xl border p-3 transition " +
                (unlocked
                  ? "border-mint-500/30 bg-mint-500/5"
                  : "border-ink-100 bg-white/60 opacity-60")
              }
            >
              <div className="text-2xl">{def.icon}</div>
              <div>
                <div className="text-sm font-semibold text-ink-900">
                  {def.title}
                  {unlocked && <span className="ml-2 text-xs text-mint-600">Unlocked</span>}
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
