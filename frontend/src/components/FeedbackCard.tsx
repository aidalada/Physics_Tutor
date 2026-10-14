"use client";

import type { ReactNode } from "react";
import LatexText from "./LatexText";

interface FeedbackCardProps {
  title: string;
  icon: ReactNode;
  items: string[];
  /** Tailwind classes for accent color styling */
  accent: {
    bg: string;
    border: string;
    iconBg: string;
    iconText: string;
  };
}

export default function FeedbackCard({ title, icon, items, accent }: FeedbackCardProps) {
  if (items.length === 0) return null;

  return (
    <div className={`rounded-xl border ${accent.border} ${accent.bg} p-4 sm:p-5`}>
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-3">
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${accent.iconBg} ${accent.iconText}`}>
          {icon}
        </div>
        <h3 className="text-sm font-semibold text-zinc-800">{title}</h3>
      </div>

      {/* List */}
      <ul className="space-y-2.5">
        {items.map((item, i) => (
          <li
            key={i}
            className="flex gap-2.5 text-sm leading-relaxed text-zinc-700"
          >
            <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${accent.iconText} opacity-60`} />
            <span className="flex-1">
              <LatexText text={item} />
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
