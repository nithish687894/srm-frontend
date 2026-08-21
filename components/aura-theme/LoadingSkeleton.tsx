"use client";

import React from "react";
import { Sparkles, Activity, Clock, MapPin, Calendar } from "lucide-react";

export default function LoadingSkeleton() {
  return (
    <div className="skeleton-root w-full min-h-screen relative bg-[#050508] text-white flex flex-col justify-start" style={{ maxWidth: "100%", minWidth: 0 }}>
      {/* Background Ambient Glow Orbs */}
      <div
        className="fixed -top-40 -right-32 w-[520px] h-[520px] rounded-full pointer-events-none z-0"
        style={{
          background: "radial-gradient(circle, rgba(168, 85, 247, 0.10) 0%, rgba(0, 0, 0, 0) 70%)",
          filter: "blur(80px)",
        }}
      />
      <div
        className="fixed -bottom-40 -left-32 w-[520px] h-[520px] rounded-full pointer-events-none z-0"
        style={{
          background: "radial-gradient(circle, rgba(56, 189, 248, 0.08) 0%, rgba(0, 0, 0, 0) 70%)",
          filter: "blur(80px)",
        }}
      />

      <main
        className="w-full max-w-3xl mx-auto relative z-10 flex flex-col"
        style={{
          padding: `calc(env(safe-area-inset-top, 0px) + 120px) clamp(12px, 4vw, 16px) 96px`,
          gap: "clamp(16px, 4vw, 20px)",
          maxWidth: "100%",
          minWidth: 0,
        }}
      >
        {/* 1. TOP BRANDING / INSTANT SYNC BANNER */}
        <div
          className="w-full flex items-center justify-between rounded-2xl bg-white/[0.04] border border-white/[0.10] backdrop-blur-xl shadow-lg"
          style={{ padding: "clamp(12px, 3vw, 16px)", maxWidth: "100%", minWidth: 0 }}
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="relative w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
              <Sparkles size={15} className="animate-spin" style={{ animationDuration: "4s" }} />
              <div className="absolute inset-0 rounded-xl bg-purple-500/20 animate-ping opacity-25" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black tracking-wider text-white whitespace-nowrap">SRM NEXUS</span>
                <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-[9px] font-black text-purple-300 border border-purple-500/30 tracking-wider whitespace-nowrap">
                  INSTANT SYNC
                </span>
              </div>
              <p className="text-[11px] text-white/50 font-medium truncate">Syncing academic records in real-time...</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-purple-300 text-xs font-bold px-2.5 py-1 rounded-xl bg-purple-500/15 border border-purple-500/25 shrink-0 ml-2">
            <Activity size={12} className="animate-pulse text-purple-400" />
            <span className="text-[9.5px] uppercase font-black tracking-widest text-purple-300">Live</span>
          </div>
        </div>

        {/* 2. TODAY COMMAND CENTER (Real UI Framework + Skeleton Values) */}
        <div
          className="rounded-[28px] md:rounded-[32px] bg-white/[0.045] border border-white/[0.10] backdrop-blur-2xl shadow-2xl relative overflow-hidden flex flex-col"
          style={{ padding: "clamp(16px, 5vw, 24px)", gap: "clamp(14px, 3.5vw, 18px)", maxWidth: "100%", minWidth: 0 }}
        >
          {/* Top Rim Accent */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-purple-500/50 via-cyan-500/40 to-purple-500/50 opacity-90" />

          {/* Header Row: Real Academic Command Badge + Real Greeting Label */}
          <div className="flex items-center justify-between gap-2 min-w-0 flex-wrap">
            <div className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center gap-1.5 shrink-0">
              <Sparkles size={11} className="text-purple-400" />
              <span className="text-[9.5px] font-black text-purple-300 tracking-wider uppercase whitespace-nowrap">Academic Command</span>
            </div>
            <span className="text-[11px] text-white/50 font-bold uppercase tracking-wider whitespace-nowrap">Good Evening, Student</span>
          </div>

          {/* Headline Placeholder */}
          <div className="sk-bar h-7 rounded-xl" style={{ width: "clamp(140px, 60%, 220px)" }} />

          {/* Class Card (Real Structure + Skeleton Data) */}
          <div className="rounded-2xl bg-white/[0.03] border border-white/[0.07] space-y-2.5" style={{ padding: "clamp(12px, 3.5vw, 16px)", minWidth: 0 }}>
            <div className="flex items-center justify-between min-w-0">
              <span className="px-2.5 py-0.5 rounded-lg bg-cyan-500/15 text-cyan-300 text-[10px] font-black border border-cyan-500/30 uppercase tracking-wider shrink-0">
                Up Next
              </span>
              <div className="sk-bar w-24 h-3.5 rounded-md" />
            </div>

            {/* Course Title Placeholder */}
            <div className="sk-bar w-3/4 h-5 rounded-lg" />

            {/* Real Meta Icons + Skeleton Meta */}
            <div className="flex items-center gap-3 text-xs text-white/50 font-semibold pt-0.5 flex-wrap min-w-0">
              <div className="flex items-center gap-1 shrink-0">
                <Clock size={13} className="text-cyan-400 shrink-0" />
                <div className="sk-bar w-16 h-3 rounded-md" />
              </div>
              <span>•</span>
              <div className="flex items-center gap-1 shrink-0">
                <MapPin size={13} className="text-cyan-400 shrink-0" />
                <div className="sk-bar w-14 h-3 rounded-md" />
              </div>
              <span>•</span>
              <div className="sk-bar w-10 h-3 rounded-md" />
            </div>
          </div>

          {/* 3 Quick Stat Columns (Real Labels + Skeleton Values) */}
          <div className="grid gap-2 pt-0.5" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
            <div className="rounded-2xl bg-white/[0.025] border border-white/[0.06] flex flex-col gap-1.5 min-w-0" style={{ padding: "clamp(8px, 2.5vw, 12px)" }}>
              <span className="text-[8.5px] font-black tracking-wider text-white/40 uppercase truncate">ATTENDANCE</span>
              <div className="sk-bar w-14 h-5 rounded-lg" />
            </div>
            <div className="rounded-2xl bg-white/[0.025] border border-white/[0.06] flex flex-col gap-1.5 min-w-0" style={{ padding: "clamp(8px, 2.5vw, 12px)" }}>
              <span className="text-[8.5px] font-black tracking-wider text-white/40 uppercase truncate">STATUS</span>
              <div className="sk-bar w-12 h-5 rounded-lg" />
            </div>
            <div className="rounded-2xl bg-white/[0.025] border border-white/[0.06] flex flex-col gap-1.5 min-w-0" style={{ padding: "clamp(8px, 2.5vw, 12px)" }}>
              <span className="text-[8.5px] font-black tracking-wider text-white/40 uppercase truncate">DAY ORDER</span>
              <div className="sk-bar w-12 h-5 rounded-lg" />
            </div>
          </div>
        </div>

        {/* 3. 2-COLUMN ANALYTICS CARDS (Real Titles + Skeleton Numbers) */}
        <div className="grid gap-3.5 md:gap-4" style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
          {/* Card 1: Attendance */}
          <div className="rounded-3xl bg-white/[0.04] border border-white/[0.09] backdrop-blur-xl flex flex-col justify-between gap-3.5 min-w-0" style={{ padding: "clamp(14px, 4vw, 20px)" }}>
            <div className="flex items-center justify-between min-w-0">
              <span className="text-[10px] md:text-[11px] font-black tracking-wider text-white/50 uppercase truncate">Overall Attendance</span>
              <div className="w-4 h-4 rounded-full border border-purple-500/40 flex items-center justify-center shrink-0">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping opacity-60" />
              </div>
            </div>
            <div className="space-y-1">
              <div className="sk-bar w-20 h-7 rounded-xl" />
              <div className="sk-bar w-24 h-3 rounded-md opacity-60" />
            </div>
            <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div className="w-3/4 h-full rounded-full bg-gradient-to-r from-purple-500/50 to-cyan-400/50 sk-bar" />
            </div>
          </div>

          {/* Card 2: Internal Marks */}
          <div className="rounded-3xl bg-white/[0.04] border border-white/[0.09] backdrop-blur-xl flex flex-col justify-between gap-3.5 min-w-0" style={{ padding: "clamp(14px, 4vw, 20px)" }}>
            <div className="flex items-center justify-between min-w-0">
              <span className="text-[10px] md:text-[11px] font-black tracking-wider text-white/50 uppercase truncate">Internal Marks</span>
              <Calendar size={13} className="text-white/30 shrink-0" />
            </div>
            <div className="space-y-1">
              <div className="sk-bar w-16 h-7 rounded-xl" />
              <div className="sk-bar w-20 h-3 rounded-md opacity-60" />
            </div>
            <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div className="w-2/3 h-full rounded-full bg-gradient-to-r from-purple-500/50 to-cyan-400/50 sk-bar" />
            </div>
          </div>
        </div>

        {/* 4. SECTION HEADER (Real Titles) */}
        <div className="flex items-center justify-between px-1 pt-1 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-black tracking-wider text-white/70 uppercase whitespace-nowrap">Today&apos;s Schedule</span>
            <span className="px-2 py-0.5 rounded-full bg-white/[0.06] text-[9px] font-bold text-white/50 border border-white/10 whitespace-nowrap shrink-0">
              3 classes
            </span>
          </div>
        </div>

        {/* 5. 3 REALISTIC SCHEDULE ITEMS */}
        <div className="flex flex-col gap-2.5" style={{ maxWidth: "100%", minWidth: 0 }}>
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="rounded-2xl bg-white/[0.03] border border-white/[0.07] backdrop-blur-xl flex items-center gap-3 shadow-sm"
              style={{ padding: "clamp(10px, 3vw, 16px)", maxWidth: "100%", minWidth: 0 }}
            >
              {/* Left Time Box */}
              <div className="w-12 h-11 rounded-xl bg-white/[0.04] border border-white/[0.08] flex flex-col items-center justify-center gap-0.5 shrink-0">
                <div className="sk-bar w-8 h-3 rounded-xs" />
                <div className="sk-bar w-5 h-2 rounded-xs opacity-50" />
              </div>

              {/* Middle Subject Details — flex-1 + min-w-0 = responsive center */}
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="sk-bar w-14 h-3 rounded-md" />
                  <div className="sk-bar w-10 h-3 rounded-full opacity-60" />
                </div>
                <div className="sk-bar w-4/5 h-4 rounded-lg" />
                <div className="sk-bar w-24 h-2.5 rounded-md opacity-50" />
              </div>

              {/* Right Attendance Badge — fixed width, no overflow */}
              <div className="px-2 py-1 rounded-full bg-purple-500/15 border border-purple-500/25 shrink-0">
                <div className="sk-bar w-8 h-3 rounded-xs" />
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Global Scrollbar Suppression & Low-Contrast Shimmer Sweep */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        html, body, .skeleton-root {
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }
        html::-webkit-scrollbar,
        body::-webkit-scrollbar,
        .skeleton-root::-webkit-scrollbar,
        *::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
        }

        @keyframes nexusShimmerSweep {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }

        .sk-bar {
          background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0.05) 0%,
            rgba(255, 255, 255, 0.18) 50%,
            rgba(255, 255, 255, 0.05) 100%
          );
          background-size: 200% 100%;
          animation: nexusShimmerSweep 2s infinite ease-in-out;
          max-width: 100%;
        }
      `,
        }}
      />
    </div>
  );
}

