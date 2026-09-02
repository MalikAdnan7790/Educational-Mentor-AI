import clsx from "clsx";

interface ScoreRingProps {
  value: number; // 0..1
  size?: number;
  label?: string;
  sublabel?: string;
}

export function ScoreRing({ value, size = 180, label, sublabel }: ScoreRingProps) {
  const pct = Math.round(value * 100);
  const stroke = 14;
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ * (1 - Math.max(0, Math.min(1, value)));

  const color =
    pct >= 75 ? "text-mint-500" : pct >= 50 ? "text-amber-500" : "text-coral-500";

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            className="fill-none stroke-ink-100"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            className={clsx("fill-none transition-all duration-700", color, "stroke-current")}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-semibold tabular-nums">{pct}%</span>
          {label && <span className="mt-1 text-xs font-medium uppercase tracking-wider text-ink-500">{label}</span>}
        </div>
      </div>
      {sublabel && <p className="mt-3 text-sm text-ink-600">{sublabel}</p>}
    </div>
  );
}
