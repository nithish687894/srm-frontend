"use client";

import React from "react";
import { Sparkles, Activity } from "lucide-react";

export default function LoadingSkeleton() {
  return (
    <main
      className="w-full min-h-screen relative overflow-hidden bg-[#f7f5ff] dark:bg-[#050505] text-gray-900 dark:text-white flex flex-col justify-start"
      style={{
        padding: "100px 24px 140px",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      {/* Background Aura Blobs */}
      <div
        className="fixed -top-32 -right-32 w-[500px] h-[500px] rounded-full pointer-events-none z-0"
        style={{
          background: "radial-gradient(circle, rgba(192, 132, 252, 0.15) 0%, rgba(0, 0, 0, 0) 70%)",
          filter: "blur(60px)",
        }}
      />
      <div
        className="fixed -bottom-32 -left-32 w-[500px] h-[500px] rounded-full pointer-events-none z-0"
        style={{
          background: "radial-gradient(circle, rgba(0, 212, 255, 0.12) 0%, rgba(0, 0, 0, 0) 70%)",
          filter: "blur(60px)",
        }}
      />

      <div className="max-w-4xl mx-auto w-full relative z-10 space-y-6">
        {/* Top Branding / Syncing Indicator Banner */}
        <div className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="relative w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <Sparkles size={16} className="animate-spin" style={{ animationDuration: "3s" }} />
              <div className="absolute inset-0 rounded-xl bg-purple-500/30 animate-ping opacity-30" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-white">SRM Nexus</span>
                <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-[9.5px] font-black text-purple-300 border border-purple-500/30">
                  INSTANT SYNC
                </span>
              </div>
              <p className="text-[10px] text-white/40 font-medium">Syncing academic records in real-time...</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-purple-400/80 text-xs font-bold px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/20">
            <Activity size={13} className="animate-pulse" />
            <span className="text-[10px] uppercase font-black tracking-wider">Fast Load</span>
          </div>
        </div>

        {/* Header Skeleton Block */}
        <div className="p-6 rounded-3xl bg-neutral-950/80 border border-white/10 backdrop-blur-2xl relative overflow-hidden shadow-2xl">
          <div className="space-y-3">
            <div className="w-28 h-3.5 rounded-lg bg-white/10 animate-pulse" />
            <div className="w-56 h-8 rounded-xl bg-white/15 animate-pulse" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6">
            {[1, 2, 3].map((idx) => (
              <div key={idx} className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2">
                <div className="w-16 h-2.5 rounded-md bg-white/10 animate-pulse" />
                <div className="w-24 h-6 rounded-lg bg-white/15 animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        {/* Main Content Card Skeletons */}
        <div className="space-y-4">
          {[1, 2, 3].map((card) => (
            <div
              key={card}
              className="p-6 rounded-3xl bg-neutral-950/70 border border-white/10 backdrop-blur-xl relative overflow-hidden space-y-4 shadow-xl"
              style={{ animationDelay: `${card * 100}ms` }}
            >
              {/* Header row inside card */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 animate-pulse" />
                  <div className="space-y-1.5">
                    <div className="w-40 h-4 rounded-md bg-white/15 animate-pulse" />
                    <div className="w-24 h-3 rounded-md bg-white/10 animate-pulse" />
                  </div>
                </div>
                <div className="w-14 h-7 rounded-full bg-purple-500/20 border border-purple-500/30 animate-pulse" />
              </div>

              {/* Progress bar skeleton */}
              <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                <div className="w-3/4 h-full bg-gradient-to-r from-purple-500/40 to-cyan-500/40 rounded-full animate-pulse" />
              </div>

              {/* Badges / test chips skeleton */}
              <div className="flex flex-wrap gap-2 pt-1">
                {[1, 2, 3, 4].map((chip) => (
                  <div key={chip} className="w-20 h-8 rounded-xl bg-white/[0.04] border border-white/5 animate-pulse" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes luminaShimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
        .animate-pulse {
          background: linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.03) 100%);
          background-size: 200% 100%;
          animation: luminaShimmer 1.6s infinite linear;
        }
      `}} />
    </main>
  );
}

