"use client";

import React from "react";
import { Sparkles, Activity } from "lucide-react";

export default function LoadingSkeleton() {
  return (
    <div className="skeleton-root w-full min-h-screen relative overflow-x-hidden bg-[#050508] text-white flex flex-col justify-start">
      {/* Background Ambient Glow Orbs */}
      <div
        className="fixed -top-40 -right-32 w-[520px] h-[520px] rounded-full pointer-events-none z-0"
        style={{
          background: "radial-gradient(circle, rgba(168, 85, 247, 0.12) 0%, rgba(0, 0, 0, 0) 70%)",
          filter: "blur(80px)",
        }}
      />
      <div
        className="fixed -bottom-40 -left-32 w-[520px] h-[520px] rounded-full pointer-events-none z-0"
        style={{
          background: "radial-gradient(circle, rgba(56, 189, 248, 0.09) 0%, rgba(0, 0, 0, 0) 70%)",
          filter: "blur(80px)",
        }}
      />

      <main
        className="max-w-3xl mx-auto w-full relative z-10 flex flex-col gap-5 md:gap-6"
        style={{
          padding: "calc(env(safe-area-inset-top, 0px) + 128px) 16px 140px",
        }}
      >
        {/* 1. TOP BRANDING / INSTANT SYNC BANNER */}
        <div className="skeleton-card w-full flex items-center justify-between p-3.5 md:p-4 rounded-2xl bg-white/[0.038] border border-white/[0.09] backdrop-blur-xl shadow-lg relative overflow-hidden">
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

        {/* 2. HERO / TODAY COMMAND CENTER GHOST CARD */}
        <div className="skeleton-card rounded-[28px] md:rounded-[32px] bg-white/[0.045] border border-white/[0.10] backdrop-blur-2xl p-6 md:p-7 shadow-2xl relative overflow-hidden flex flex-col gap-5">
          {/* Ambient Top Border Accent */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-purple-500/50 via-cyan-500/40 to-purple-500/50 opacity-90" />

          {/* Header Row: Academic Command Badge & Greeting Ghost */}
          <div className="flex items-center justify-between gap-3">
            <div className="ghost-pill w-32 h-6 rounded-full bg-purple-500/15 border border-purple-500/20" />
            <div className="ghost-box w-24 h-4 rounded-md" />
          </div>

          {/* Main Headline Ghost: Class status */}
          <div className="space-y-2">
            <div className="ghost-box w-52 h-7 md:h-8 rounded-xl" />
          </div>

          {/* Class Silhouette Box */}
          <div className="p-4 md:p-5 rounded-2xl bg-white/[0.03] border border-white/[0.07] space-y-3">
            <div className="flex items-center justify-between">
              <div className="ghost-pill w-20 h-5 rounded-lg bg-cyan-500/15 border border-cyan-500/25" />
              <div className="ghost-box w-24 h-3.5 rounded-md" />
            </div>

            {/* Subject Title Ghost */}
            <div className="ghost-box w-3/4 h-5 rounded-lg" />

            {/* Meta Tags: Room & Faculty Ghost */}
            <div className="flex items-center gap-4 pt-0.5">
              <div className="ghost-box w-24 h-3.5 rounded-md opacity-80" />
              <div className="ghost-box w-20 h-3.5 rounded-md opacity-80" />
            </div>
          </div>

          {/* 3-Pill Quick Stats Row */}
          <div className="grid grid-cols-3 gap-2.5 md:gap-3 pt-1">
            {[1, 2, 3].map((idx) => (
              <div
                key={idx}
                className="p-3 md:p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex flex-col gap-2"
              >
                <div className="ghost-box w-12 h-2.5 rounded-sm opacity-60" />
                <div className="ghost-box w-14 md:w-16 h-5 md:h-6 rounded-lg" />
              </div>
            ))}
          </div>
        </div>

        {/* 3. 2-COLUMN KEY ANALYTICS CARDS (Attendance & Marks) */}
        <div className="grid grid-cols-2 gap-3.5 md:gap-4">
          {/* Card 1: Attendance Snapshot Ghost */}
          <div className="skeleton-card p-5 rounded-3xl bg-white/[0.04] border border-white/[0.09] backdrop-blur-xl flex flex-col justify-between gap-4 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="ghost-box w-24 h-3 rounded-md opacity-70" />
              <div className="w-5 h-5 rounded-full border border-purple-500/30 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-purple-400 animate-ping opacity-50" />
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="ghost-box w-16 md:w-20 h-7 md:h-8 rounded-xl" />
              <div className="ghost-box w-20 h-3 rounded-md opacity-60" />
            </div>
            <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
              <div className="w-3/4 h-full rounded-full bg-gradient-to-r from-purple-500/40 to-cyan-500/40" />
            </div>
          </div>

          {/* Card 2: Internal Marks Ghost */}
          <div className="skeleton-card p-5 rounded-3xl bg-white/[0.04] border border-white/[0.09] backdrop-blur-xl flex flex-col justify-between gap-4 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="ghost-box w-20 h-3 rounded-md opacity-70" />
              <div className="ghost-box w-4 h-4 rounded-md opacity-50" />
            </div>
            <div className="space-y-1.5">
              <div className="ghost-box w-14 md:w-16 h-7 md:h-8 rounded-xl" />
              <div className="ghost-box w-16 h-3 rounded-md opacity-60" />
            </div>
            <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
              <div className="w-2/3 h-full rounded-full bg-gradient-to-r from-purple-500/40 to-cyan-500/40" />
            </div>
          </div>
        </div>

        {/* 4. SECTION DIVIDER & HEADER GHOST */}
        <div className="flex items-center justify-between px-1 pt-1">
          <div className="flex items-center gap-2">
            <div className="ghost-box w-28 h-4 rounded-md" />
            <div className="ghost-pill w-12 h-4 rounded-full opacity-60" />
          </div>
          <div className="ghost-box w-14 h-3 rounded-md opacity-40" />
        </div>

        {/* 5. REALISTIC SCHEDULE CONTENT GHOST CARD */}
        <div className="skeleton-card p-4 md:p-4.5 rounded-2xl bg-white/[0.035] border border-white/[0.08] backdrop-blur-xl flex items-center justify-between gap-4 shadow-md relative overflow-hidden">
          {/* Left Time Badge Ghost */}
          <div className="w-13 h-12 rounded-xl bg-white/[0.04] border border-white/[0.07] flex flex-col items-center justify-center gap-1 flex-shrink-0">
            <div className="ghost-box w-8 h-3 rounded-sm" />
            <div className="ghost-box w-6 h-2 rounded-xs opacity-50" />
          </div>

          {/* Middle Course Details Ghost */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-2">
              <div className="ghost-box w-14 h-3 rounded-md" />
              <div className="ghost-pill w-8 h-3 rounded-full opacity-60" />
            </div>
            <div className="ghost-box w-3/4 h-4 rounded-lg" />
            <div className="ghost-box w-24 h-2.5 rounded-md opacity-50" />
          </div>

          {/* Right Attendance Status Chip Ghost */}
          <div className="ghost-pill w-12 h-6 rounded-full flex-shrink-0" />
        </div>
      </main>

      {/* Bottom Safe Area Masking Gradient (Prevents navbar bleed) */}
      <div
        aria-hidden="true"
        className="fixed bottom-0 left-0 right-0 h-28 pointer-events-none z-20"
        style={{
          background: "linear-gradient(to top, #050508 0%, rgba(5, 5, 8, 0.92) 55%, transparent 100%)",
        }}
      />

      {/* Single Unified Card Shimmer & Global Scrollbar Suppression */}
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

        .ghost-box {
          background: rgba(255, 255, 255, 0.08);
        }

        .ghost-pill {
          background: rgba(255, 255, 255, 0.08);
        }

        /* Unified Single Diagonal Sweep Across Each Card */
        .skeleton-card::after {
          content: "";
          position: absolute;
          top: 0;
          left: -150%;
          width: 150%;
          height: 100%;
          background: linear-gradient(
            110deg,
            transparent 25%,
            rgba(255, 255, 255, 0.08) 45%,
            rgba(255, 255, 255, 0.14) 50%,
            rgba(255, 255, 255, 0.08) 55%,
            transparent 75%
          );
          pointer-events: none;
          animation: nexusCardSweep 2.2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }

        @keyframes nexusCardSweep {
          0% {
            left: -150%;
          }
          100% {
            left: 150%;
          }
        }
      `,
        }}
      />
    </div>
  );
}



