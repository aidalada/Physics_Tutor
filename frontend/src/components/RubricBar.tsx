"use client";

interface RubricBarProps {
  label: string;
  score: number;
  max: number;
}

export default function RubricBar({ label, score, max }: RubricBarProps) {
  const pct = Math.round((score / max) * 100);

  let barColor: string;
  if (pct >= 80) {
    barColor = "bg-emerald-500";
  } else if (pct >= 50) {
    barColor = "bg-amber-500";
  } else {
    barColor = "bg-rose-500";
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-zinc-700 font-medium">{label}</span>
        <span className="tabular-nums text-zinc-500 font-medium">
          {score} / {max}
        </span>
      </div>
      <div className="h-2.5 w-full rounded-full bg-zinc-100 overflow-hidden">
        <div
          className={`h-full rounded-full ${barColor} transition-all duration-1000 ease-out`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
