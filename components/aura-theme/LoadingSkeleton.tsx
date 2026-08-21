"use client";

import React from "react";
import { Sparkles, Activity, Clock, MapPin, Calendar } from "lucide-react";

export default function LoadingSkeleton() {
  return (
    <div className="skeleton-root w-full min-h-screen relative overflow-x-hidden bg-[#050508] text-white flex flex-col justify-start">
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
        className="max-w-3xl mx-auto w-full relative z-10 flex flex-col gap-4 md:gap-5"
        style={{
          padding: "calc(env(safe-area-inset-top, 0px) + 120px) 16px 96px",
        }}
      >
        {/* 1. TOP BRANDING / INSTANT SYNC BANNER */}
        <div className="w-full flex items-center justify-between p-3.5 md:p-4 rounded-2xl bg-white/[0.04] border border-white/[0.10] backdrop-blur-xl shadow-lg">
          <div className="flex items-center gap-3">
            <div className="relative w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Sparkles size={15} className="animate-spin" style={{ animationDuration: "4s" }} />
              <div className="absolute inset-0 rounded-xl bg-purple-500/20 animate-ping opacity-25" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black tracking-wider text-white">SRM NEXUS</span>
                <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-[9px] font-black text-purple-300 border border-purple-500/30 tracking-wider">
                  INSTANT SYNC
                </span>
              </div>
              <p className="text-[11px] text-white/50 font-medium">Syncing academic records in real-time...</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-purple-300 text-xs font-bold px-2.5 py-1 rounded-xl bg-purple-500/15 border border-purple-500/25">
            <Activity size={12} className="animate-pulse text-purple-400" />
            <span className="text-[9.5px] uppercase font-black tracking-widest text-purple-300">Live</span>
          </div>
        </div>

        {/* 2. TODAY COMMAND CENTER (Real UI Framework + Skeleton Values) */}
        <div className="rounded-[28px] md:rounded-[32px] bg-white/[0.045] border border-white/[0.10] backdrop-blur-2xl p-5 md:p-6 shadow-2xl relative overflow-hidden flex flex-col gap-4">
          {/* Top Rim Accent */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-purple-500/50 via-cyan-500/40 to-purple-500/50 opacity-90" />

          {/* Header Row: Real Academic Command Badge + Real Greeting Label */}
          <div className="flex items-center justify-between gap-3">
            <div className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center gap-1.5">
              <Sparkles size={11} className="text-purple-400" />
              <span className="text-[9.5px] font-black text-purple-300 tracking-wider uppercase">Academic Command</span>
            </div>
            <span className="text-[11px] text-white/50 font-bold uppercase tracking-wider">Good Evening, Student</span>
          </div>

          {/* Headline Placeholder */}
          <div className="sk-bar w-52 h-7 rounded-xl" />

          {/* Class Card (Real Structure + Skeleton Data) */}
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.07] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-lg bg-cyan-500/15 text-cyan-300 text-[10px] font-black border border-cyan-500/30 uppercase tracking-wider">
                Up Next
              </span>
              <div className="sk-bar w-24 h-3.5 rounded-md" />
            </div>

            {/* Course Title Placeholder */}
            <div className="sk-bar w-3/4 h-5 rounded-lg" />

            {/* Real Meta Icons + Skeleton Meta */}
            <div className="flex items-center gap-4 text-xs text-white/50 font-semibold pt-0.5">
              <div className="flex items-center gap-1">
                <Clock size={13} className="text-cyan-400" />
                <div className="sk-bar w-16 h-3 rounded-md" />
              </div>
              <span>•</span>
              <div className="flex items-center gap-1">
                <MapPin size={13} className="text-cyan-400" />
                <div className="sk-bar w-14 h-3 rounded-md" />
              </div>
              <span>•</span>
              <div className="sk-bar w-10 h-3 rounded-md" />
            </div>
          </div>

          {/* 3 Quick Stat Columns (Real Labels + Skeleton Values) */}
          <div className="grid grid-cols-3 gap-2.5 pt-0.5">
            <div className="p-3 rounded-2xl bg-white/[0.025] border border-white/[0.06] flex flex-col gap-1.5">
              <span className="text-[8.5px] font-black tracking-wider text-white/40 uppercase">ATTENDANCE</span>
              <div className="sk-bar w-14 h-5 rounded-lg" />
            </div>
            <div className="p-3 rounded-2xl bg-white/[0.025] border border-white/[0.06] flex flex-col gap-1.5">
              <span className="text-[8.5px] font-black tracking-wider text-white/40 uppercase">STATUS</span>
              <div className="sk-bar w-12 h-5 rounded-lg" />
            </div>
            <div className="p-3 rounded-2xl bg-white/[0.025] border border-white/[0.06] flex flex-col gap-1.5">
              <span className="text-[8.5px] font-black tracking-wider text-white/40 uppercase">DAY ORDER</span>
              <div className="sk-bar w-12 h-5 rounded-lg" />
            </div>
          </div>
        </div>

        {/* 3. 2-COLUMN ANALYTICS CARDS (Real Titles + Skeleton Numbers) */}
        <div className="grid grid-cols-2 gap-3.5 md:gap-4">
          {/* Card 1: Attendance */}
          <div className="p-4 md:p-5 rounded-3xl bg-white/[0.04] border border-white/[0.09] backdrop-blur-xl flex flex-col justify-between gap-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] md:text-[11px] font-black tracking-wider text-white/50 uppercase">Overall Attendance</span>
              <div className="w-4 h-4 rounded-full border border-purple-500/40 flex items-center justify-center">
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
          <div className="p-4 md:p-5 rounded-3xl bg-white/[0.04] border border-white/[0.09] backdrop-blur-xl flex flex-col justify-between gap-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] md:text-[11px] font-black tracking-wider text-white/50 uppercase">Internal Marks</span>
              <Calendar size={13} className="text-white/30" />
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
        <div className="flex items-center justify-between px-1 pt-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black tracking-wider text-white/70 uppercase">Today&apos;s Schedule</span>
            <span className="px-2 py-0.5 rounded-full bg-white/[0.06] text-[9px] font-bold text-white/50 border border-white/10">
              3 classes
            </span>
          </div>
        </div>

        {/* 5. 3 REALISTIC SCHEDULE ITEMS (Fills page cleanly down to navbar) */}
        <div className="flex flex-col gap-2.5">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="p-3.5 md:p-4 rounded-2xl bg-white/[0.03] border border-white/[0.07] backdrop-blur-xl flex items-center justify-between gap-3.5 shadow-sm"
            >
              {/* Left Time Box */}
              <div className="w-13 h-11 rounded-xl bg-white/[0.04] border border-white/[0.08] flex flex-col items-center justify-center gap-0.5 flex-shrink-0">
                <div className="sk-bar w-8 h-3 rounded-xs" />
                <div className="sk-bar w-5 h-2 rounded-xs opacity-50" />
              </div>

              {/* Middle Subject Details */}
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="sk-bar w-14 h-3 rounded-md" />
                  <div className="sk-bar w-10 h-3 rounded-full opacity-60" />
                </div>
                <div className="sk-bar w-4/5 h-4 rounded-lg" />
                <div className="sk-bar w-24 h-2.5 rounded-md opacity-50" />
              </div>

              {/* Right Attendance Badge */}
              <div className="px-2.5 py-1 rounded-full bg-purple-500/15 border border-purple-500/25 flex-shrink-0">
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
        }
      `,
        }}
      />
    </div>
  );
}
