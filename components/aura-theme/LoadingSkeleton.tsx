"use client";

import React from "react";
import { LoaderCircle } from "lucide-react";

export default function LoadingSkeleton() {
  return (
    <div className="min-h-screen w-full bg-[#09090F] text-white flex items-center justify-center px-6" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
          <LoaderCircle size={20} className="animate-spin text-[#FF75C3]" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-bold text-white/90">Loading your workspace</p>
          <p className="mt-1 text-xs text-white/45">Your saved data will appear as soon as it is ready.</p>
        </div>
      </div>
    </div>
  );
}

