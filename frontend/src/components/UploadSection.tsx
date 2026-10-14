"use client";

import { useCallback, useRef, useState } from "react";
import { Upload, Camera, ImagePlus, ChevronDown, X } from "lucide-react";

interface UploadSectionProps {
  onSubmit: (file: File, problemStatement?: string) => void;
  isLoading: boolean;
}

const MAX_SIZE_MB = 8;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

export default function UploadSection({ onSubmit, isLoading }: UploadSectionProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [problemStatement, setProblemStatement] = useState("");
  const [showProblem, setShowProblem] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const validateAndSet = useCallback((f: File) => {
    setError(null);

    if (!ACCEPTED.includes(f.type)) {
      setError("Тек JPEG, PNG немесе WebP форматтары қабылданады.");
      return;
    }
    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`Файл өлшемі ${MAX_SIZE_MB} МБ-тан аспауы керек.`);
      return;
    }

    setFile(f);
    const url = URL.createObjectURL(f);
    setPreview(url);
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) validateAndSet(f);
      e.target.value = "";
    },
    [validateAndSet],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files?.[0];
      if (f) validateAndSet(f);
    },
    [validateAndSet],
  );

  const reset = useCallback(() => {
    setFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setError(null);
  }, [preview]);

  const handleSubmit = () => {
    if (!file) return;
    onSubmit(file, problemStatement || undefined);
  };

  return (
    <div className="space-y-4">
      {/* ── Drop zone or Preview ─────────────────────────────────── */}
      {!preview ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`
            relative flex flex-col items-center justify-center gap-4
            rounded-2xl border-2 border-dashed p-8 sm:p-12
            transition-colors duration-200 cursor-pointer
            ${
              dragOver
                ? "border-indigo-400 bg-indigo-50"
                : "border-zinc-300 bg-zinc-50 hover:border-zinc-400 hover:bg-zinc-100"
            }
          `}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
            <ImagePlus className="h-7 w-7" />
          </div>

          <div className="text-center">
            <p className="text-sm font-medium text-zinc-700">
              Суретті осында сүйреңіз немесе түймені басыңыз
            </p>
            <p className="mt-1 text-xs text-zinc-400">
              JPEG, PNG, WebP · Максимум {MAX_SIZE_MB} МБ
            </p>
          </div>

          {/* Action buttons — stop click propagation so they work independently */}
          <div className="flex gap-3 mt-2" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 shadow-sm ring-1 ring-zinc-200 hover:bg-zinc-50 transition-colors"
            >
              <Upload className="h-4 w-4" />
              Файл таңдау
            </button>
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 transition-colors"
            >
              <Camera className="h-4 w-4" />
              Камерамен түсіру
            </button>
          </div>
        </div>
      ) : (
        /* ── Image Preview ──────────────────────────────────────── */
        <div className="relative rounded-2xl overflow-hidden bg-zinc-100 ring-1 ring-zinc-200">
          <img
            src={preview}
            alt="Жүктелген сурет"
            className="w-full max-h-[400px] object-contain"
          />
          <button
            type="button"
            onClick={reset}
            className="absolute top-3 right-3 flex items-center gap-1.5 rounded-lg bg-white/90 backdrop-blur px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-sm ring-1 ring-zinc-200 hover:bg-white transition-colors"
          >
            <X className="h-3.5 w-3.5" />
            Басқа сурет таңдау
          </button>
        </div>
      )}

      {/* Hidden inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Validation error */}
      {error && (
        <div className="rounded-lg bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* ── Problem statement accordion ──────────────────────────── */}
      <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
        <button
          type="button"
          onClick={() => setShowProblem(!showProblem)}
          className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
        >
          <span>Есептің шартын енгізу (міндетті емес)</span>
          <ChevronDown
            className={`h-4 w-4 text-zinc-400 transition-transform duration-200 ${
              showProblem ? "rotate-180" : ""
            }`}
          />
        </button>
        {showProblem && (
          <div className="px-4 pb-4">
            <textarea
              value={problemStatement}
              onChange={(e) => setProblemStatement(e.target.value)}
              placeholder="Мысалы: Массасы 5 кг дене 10 м биіктіктен құлайды..."
              rows={3}
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-800 placeholder:text-zinc-400 focus:border-indigo-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all resize-none"
            />
          </div>
        )}
      </div>

      {/* ── Submit button ────────────────────────────────────────── */}
      <button
        type="button"
        disabled={!file || isLoading}
        onClick={handleSubmit}
        className={`
          w-full flex items-center justify-center gap-2.5 rounded-xl px-6 py-3.5 text-sm font-semibold
          shadow-sm transition-all duration-200
          ${
            file && !isLoading
              ? "bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.98]"
              : "bg-zinc-200 text-zinc-400 cursor-not-allowed"
          }
        `}
      >
        {isLoading ? (
          <>
            <svg
              className="h-5 w-5 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="3"
                className="opacity-25"
              />
              <path
                d="M4 12a8 8 0 018-8"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                className="opacity-75"
              />
            </svg>
            Жасанды интеллект талдауда... (~3-5 сек)
          </>
        ) : (
          <>
            <Upload className="h-4.5 w-4.5" />
            Есепті тексеру
          </>
        )}
      </button>
    </div>
  );
}
