"use client";

export default function SkeletonLoader() {
  return (
    <div className="space-y-5 animate-pulse" aria-label="Жүктелуде...">
      {/* Score skeleton */}
      <div className="rounded-2xl bg-zinc-100 p-6 flex flex-col items-center gap-3">
        <div className="h-[140px] w-[140px] rounded-full bg-zinc-200" />
        <div className="h-4 w-32 rounded bg-zinc-200" />
      </div>

      {/* Rubric skeleton */}
      <div className="rounded-xl bg-zinc-100 p-5 space-y-4">
        <div className="h-4 w-48 rounded bg-zinc-200" />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-2">
            <div className="flex justify-between">
              <div className="h-3 w-40 rounded bg-zinc-200" />
              <div className="h-3 w-12 rounded bg-zinc-200" />
            </div>
            <div className="h-2.5 w-full rounded-full bg-zinc-200" />
          </div>
        ))}
      </div>

      {/* Feedback cards skeleton */}
      {[1, 2].map((i) => (
        <div key={i} className="rounded-xl bg-zinc-100 p-5 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-zinc-200" />
            <div className="h-4 w-44 rounded bg-zinc-200" />
          </div>
          <div className="space-y-2">
            <div className="h-3 w-full rounded bg-zinc-200" />
            <div className="h-3 w-5/6 rounded bg-zinc-200" />
            <div className="h-3 w-4/6 rounded bg-zinc-200" />
          </div>
        </div>
      ))}
    </div>
  );
}
