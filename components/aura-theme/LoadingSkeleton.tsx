"use client";

import React from "react";
import { Cpu, Zap } from "lucide-react";

export default function LoadingSkeleton() {
  return (
    <main
      className="w-full min-h-screen relative overflow-hidden bg-[#030305] text-white flex flex-col justify-start"
      style={{
        padding: "60px 16px 120px",
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Background Ambient Glow */}
      <div
        className="fixed -top-32 -right-32 w-[350px] h-[350px] rounded-full pointer-events-none z-0"
        style={{
          background: "radial-gradient(circle, rgba(255, 117, 195, 0.08) 0%, rgba(0, 0, 0, 0) 70%)",
        }}
      />
      <div
        className="fixed -bottom-32 -left-32 w-[350px] h-[350px] rounded-full pointer-events-none z-0"
        style={{
          background: "radial-gradient(circle, rgba(168, 194, 0, 0.06) 0%, rgba(0, 0, 0, 0) 70%)",
        }}
      />

      <div className="max-w-2xl mx-auto w-full relative z-10 space-y-4">
        {/* Top Branding / Syncing Indicator Banner */}
        <div className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-[#09090e] border border-white/10">
          <div className="flex items-center gap-3">
            <div className="relative w-8 h-8 rounded-xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400">
              <Cpu size={16} className="animate-spin" style={{ animationDuration: "2.5s" }} />
              <div className="absolute inset-0 rounded-xl bg-pink-500/20 animate-ping opacity-25" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-widest text-white">SRM NEXUS</span>
                <span className="px-2 py-0.5 rounded-full bg-pink-500/15 text-[9px] font-black text-pink-300 border border-pink-500/30">
                  ACADEMIC OS
                </span>
              </div>
              <p className="text-[10px] text-white/40 font-semibold mt-0.5">Connecting academic hub...</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-pink-400/90 text-xs font-bold px-3 py-1.5 rounded-xl bg-pink-500/10 border border-pink-500/20">
            <Zap size={12} className="animate-pulse" />
            <span className="text-[9.5px] uppercase font-black tracking-widest">LOADING</span>
          </div>
        </div>

        {/* Hero Card Skeleton Block */}
        <div className="p-5 rounded-3xl bg-[#0d0d14] border border-white/10 relative overflow-hidden space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/10 nexus-shimmer" />
              <div className="space-y-2">
                <div className="w-36 h-4 rounded-lg bg-white/15 nexus-shimmer" />
                <div className="w-24 h-3 rounded-md bg-white/10 nexus-shimmer" />
              </div>
            </div>
            <div className="w-16 h-8 rounded-xl bg-pink-500/15 border border-pink-500/25 nexus-shimmer" />
          </div>

          {/* Quick Metrics Grid Skeleton */}
          <div className="grid grid-cols-2 gap-2.5 pt-2">
            {[1, 2].map((idx) => (
              <div key={idx} className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2">
                <div className="w-14 h-2.5 rounded-md bg-white/10 nexus-shimmer" />
                <div className="w-20 h-5 rounded-lg bg-white/15 nexus-shimmer" />
              </div>
            ))}
          </div>
        </div>

        {/* Action Chips Grid */}
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map((chip) => (
            <div key={chip} className="h-11 rounded-2xl bg-[#0d0d14] border border-white/5 nexus-shimmer" />
          ))}
        </div>

        {/* Course / Attendance Item Cards Skeletons */}
        <div className="space-y-3">
          {[1, 2, 3].map((card) => (
            <div
              key={card}
              className="p-4.5 rounded-2xl bg-[#09090e] border border-white/10 relative overflow-hidden space-y-3 shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/10 nexus-shimmer" />
                  <div className="space-y-1.5">
                    <div className="w-32 h-3.5 rounded-md bg-white/15 nexus-shimmer" />
                    <div className="w-20 h-2.5 rounded-md bg-white/10 nexus-shimmer" />
                  </div>
                </div>
                <div className="w-12 h-6 rounded-full bg-white/10 nexus-shimmer" />
              </div>
              <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                <div className="w-2/3 h-full bg-gradient-to-r from-pink-500/50 to-purple-500/50 rounded-full nexus-shimmer" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes nexusShimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .nexus-shimmer {
          background: linear-gradient(90deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.09) 50%, rgba(255,255,255,0.02) 100%);
          background-size: 200% 100%;
          animation: nexusShimmer 1.5s infinite linear;
        }
      `}} />
    </main>
  );
}
