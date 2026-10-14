"use client";

import { useEffect } from "react";
import { CheckCircle2, Lightbulb, AlertCircle, RefreshCw } from "lucide-react";
import confetti from "canvas-confetti";

import type { SolutionFeedback } from "@/types/evaluation";
import ScoreCircle from "./ScoreCircle";
import RubricBar from "./RubricBar";
import FeedbackCard from "./FeedbackCard";

interface ResultsViewProps {
  data: SolutionFeedback;
  onReset: () => void;
}

const RUBRIC_ITEMS: { key: keyof SolutionFeedback["rubric"]; label: string; max: number }[] = [
  { key: "si_units_and_given", label: "Берілгені мен ХБЖ", max: 15 },
  { key: "physics_laws_setup", label: "Физикалық заңдар мен сызба", max: 35 },
  { key: "math_derivations", label: "Математикалық өрнектеу", max: 30 },
  { key: "calculation_units", label: "Есептеу мен өлшем бірлік", max: 20 },
];

export default function ResultsView({ data, onReset }: ResultsViewProps) {
  // Confetti for high scores
  useEffect(() => {
    if (data.total_score >= 90) {
      const duration = 2000;
      const end = Date.now() + duration;

      function burst() {
        confetti({
          particleCount: 60,
          spread: 80,
          origin: { y: 0.6 },
          colors: ["#6366f1", "#059669", "#f59e0b", "#ec4899"],
        });
        if (Date.now() < end) {
          requestAnimationFrame(burst);
        }
      }
      burst();
    }
  }, [data.total_score]);

  return (
    <div className="space-y-5">
      {/* ── Score circle ───────────────────────────────────────── */}
      <div className="relative flex justify-center">
        <ScoreCircle score={data.total_score} />
      </div>

      {/* ── Error area badge ───────────────────────────────────── */}
      {data.error_area && (
        <div className="flex items-center gap-2 rounded-lg bg-rose-50 border border-rose-200 px-4 py-2.5">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
          <p className="text-sm text-rose-700">
            <span className="font-medium">Қате бағыты:</span> {data.error_area}
          </p>
        </div>
      )}

      {/* ── Rubric breakdown ───────────────────────────────────── */}
      <div className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 space-y-4">
        <h3 className="text-sm font-semibold text-zinc-800">
          Бағалау рубрикасы
        </h3>
        {RUBRIC_ITEMS.map(({ key, label, max }) => (
          <RubricBar key={key} label={label} score={data.rubric[key]} max={max} />
        ))}
      </div>

      {/* ── Strong points ──────────────────────────────────────── */}
      <FeedbackCard
        title="Дұрыс орындалған қадамдар"
        icon={<CheckCircle2 className="h-4.5 w-4.5" />}
        items={data.strong_points}
        accent={{
          bg: "bg-emerald-50/70",
          border: "border-emerald-200",
          iconBg: "bg-emerald-100",
          iconText: "text-emerald-600",
        }}
      />

      {/* ── Socratic hints ─────────────────────────────────────── */}
      <FeedbackCard
        title="Сократтық бағыттаулар мен сұрақтар"
        icon={<Lightbulb className="h-4.5 w-4.5" />}
        items={data.socratic_hints}
        accent={{
          bg: "bg-indigo-50/70",
          border: "border-indigo-200",
          iconBg: "bg-indigo-100",
          iconText: "text-indigo-600",
        }}
      />

      {/* ── Reset button ───────────────────────────────────────── */}
      <button
        type="button"
        onClick={onReset}
        className="w-full flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-6 py-3.5 text-sm font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50 active:scale-[0.98] transition-all"
      >
        <RefreshCw className="h-4 w-4" />
        Жаңа есепті тексеру
      </button>
    </div>
  );
}
