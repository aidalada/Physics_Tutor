"use client";

import { useCallback, useState } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

import type { SolutionFeedback } from "@/types/evaluation";
import { evaluateSolution, ApiError } from "@/lib/api";

import Header from "@/components/Header";
import UploadSection from "@/components/UploadSection";
import SkeletonLoader from "@/components/SkeletonLoader";
import ResultsView from "@/components/ResultsView";

type AppState = "idle" | "loading" | "results" | "error";

export default function Home() {
  const [state, setState] = useState<AppState>("idle");
  const [result, setResult] = useState<SolutionFeedback | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async (file: File, problemStatement?: string) => {
    setState("loading");
    setError(null);

    try {
      const data = await evaluateSolution(file, problemStatement);
      setResult(data);
      setState("results");
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Күтпеген қате орын алды. Қайта байқап көріңіз.";
      setError(message);
      setState("error");
    }
  }, []);

  const handleReset = useCallback(() => {
    setState("idle");
    setResult(null);
    setError(null);
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 mx-auto w-full max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
        {/* ── Upload (idle) ────────────────────────────────────── */}
        {state === "idle" && (
          <UploadSection onSubmit={handleSubmit} isLoading={false} />
        )}

        {/* ── Loading ──────────────────────────────────────────── */}
        {state === "loading" && (
          <div className="space-y-5">
            {/* Keep upload visible but disabled during loading */}
            <UploadSection onSubmit={handleSubmit} isLoading={true} />
            <div className="pt-2">
              <SkeletonLoader />
            </div>
          </div>
        )}

        {/* ── Results ──────────────────────────────────────────── */}
        {state === "results" && result && (
          <ResultsView data={result} onReset={handleReset} />
        )}

        {/* ── Error ────────────────────────────────────────────── */}
        {state === "error" && (
          <div className="space-y-5">
            <div className="animate-toast rounded-xl border border-rose-200 bg-rose-50 p-5">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 shrink-0 text-rose-500 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-rose-800">
                    Қате орын алды
                  </h3>
                  <p className="mt-1 text-sm text-rose-700">{error}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="mt-4 w-full flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-rose-700 ring-1 ring-rose-200 hover:bg-rose-50 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                Қайта байқап көру
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="border-t border-zinc-200 bg-white py-4">
        <p className="text-center text-xs text-zinc-400">
          PhysCheck AI · Сократтық оқыту жүйесі · {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}
