"use client";

import { useEffect, useRef, useState } from "react";

interface ScoreCircleProps {
  score: number;
  max?: number;
}

export default function ScoreCircle({ score, max = 100 }: ScoreCircleProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const ref = useRef<SVGSVGElement>(null);

  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(score / max, 1);

  // Color based on score
  let strokeColor: string;
  let bgColor: string;
  let textColor: string;
  let label: string;

  if (score >= 85) {
    strokeColor = "#059669"; // emerald-600
    bgColor = "bg-emerald-50";
    textColor = "text-emerald-700";
    label = "Өте жақсы!";
  } else if (score >= 60) {
    strokeColor = "#d97706"; // amber-600
    bgColor = "bg-amber-50";
    textColor = "text-amber-700";
    label = "Жақсы, бірақ жұмыс бар";
  } else {
    strokeColor = "#e11d48"; // rose-600
    bgColor = "bg-rose-50";
    textColor = "text-rose-700";
    label = "Қосымша жұмыс қажет";
  }

  // Animate score counting up
  useEffect(() => {
    let frame: number;
    const duration = 1200;
    const start = performance.now();

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(eased * score));

      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [score]);

  const dashOffset = circumference * (1 - (animatedScore / max));

  return (
    <div className={`flex flex-col items-center gap-3 rounded-2xl ${bgColor} p-6`}>
      <div className="relative flex items-center justify-center">
        <svg
          ref={ref}
          width="140"
          height="140"
          viewBox="0 0 120 120"
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="10"
            className="text-white/60"
          />
          {/* Progress circle */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            className="transition-[stroke-dashoffset] duration-1000 ease-out"
          />
        </svg>

        {/* Score number perfectly centered over circle */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-4xl font-bold tabular-nums ${textColor}`}>
            {animatedScore}
          </span>
          <span className="text-xs font-medium text-zinc-500">/ {max}</span>
        </div>
      </div>

      <p className={`mt-1 text-sm font-medium ${textColor}`}>{label}</p>
    </div>
  );
}
