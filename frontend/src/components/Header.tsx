"use client";

import { Atom } from "lucide-react";

export default function Header() {
  return (
    <header className="w-full border-b border-zinc-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
      <div className="mx-auto max-w-3xl flex items-center justify-between px-4 py-3 sm:px-6">
        {/* Logo + Title */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white">
            <Atom className="h-5 w-5" />
          </div>
          <div className="flex items-baseline gap-2">
            <h1 className="text-lg font-bold tracking-tight text-zinc-900">
              PhysMentor
            </h1>
            <span className="hidden sm:inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-600 ring-1 ring-indigo-200">
              Socratic Beta
            </span>
          </div>
        </div>

        {/* Badge on mobile */}
        <span className="sm:hidden inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-600 ring-1 ring-indigo-200">
          Beta
        </span>
      </div>

      {/* Slogan */}
      <div className="mx-auto max-w-3xl px-4 pb-3 sm:px-6">
        <p className="text-sm text-zinc-500">
          Қолмен жазылған физика есептерін талдау және Сократтық бағыттау
        </p>
      </div>
    </header>
  );
}
