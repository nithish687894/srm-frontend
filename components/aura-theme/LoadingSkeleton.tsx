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
          padding: "calc(env(safe-area-inset-top, 0px) + 128px) 16px 110px",
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

        {/* 2. HERO / TODAY COMMAND CENTER GHOST CARD */}
        <div className="rounded-[28px] md:rounded-[32px] bg-white/[0.038] border border-white/[0.09] backdrop-blur-2xl p-5 md:p-7 shadow-2xl relative overflow-hidden flex flex-col gap-5">
          {/* Ambient Top Border Accent */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-purple-500/50 via-cyan-500/40 to-purple-500/50 opacity-90" />

          {/* Header Row: Badge Ghost & Greeting Ghost */}
          <div className="flex items-center justify-between gap-3">
            <div className="shimmer-box w-32 h-6 rounded-full" />
            <div className="shimmer-box w-24 h-4 rounded-md" />
          </div>

          {/* Main Headline Ghost */}
          <div className="space-y-2">
            <div className="shimmer-box w-3/5 h-7 md:h-8 rounded-xl" />
            <div className="shimmer-box w-2/5 h-3.5 rounded-md opacity-70" />
          </div>

          {/* Ongoing / Next Class Ghost Box */}
          <div className="p-4 md:p-5 rounded-2xl bg-white/[0.025] border border-white/[0.07] space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="shimmer-box w-20 h-5 rounded-lg" />
              <div className="shimmer-box w-24 h-3.5 rounded-md" />
            </div>

            {/* Subject Title Ghost */}
            <div className="space-y-2">
              <div className="shimmer-box w-4/5 h-5 rounded-lg" />
              <div className="shimmer-box w-1/2 h-3.5 rounded-md opacity-70" />
            </div>

            {/* Meta Tags: Room & Faculty Ghost */}
            <div className="flex items-center gap-4 pt-1">
              <div className="shimmer-box w-20 h-3.5 rounded-md" />
              <div className="shimmer-box w-24 h-3.5 rounded-md" />
            </div>
          </div>

          {/* 3-Pill Quick Stats Row (Pure Ghost Blocks) */}
          <div className="grid grid-cols-3 gap-2.5 md:gap-3 pt-1">
            {[1, 2, 3].map((idx) => (
              <div
                key={idx}
                className="p-3 md:p-3.5 rounded-2xl bg-white/[0.025] border border-white/[0.06] flex flex-col gap-2"
              >
                <div className="shimmer-box w-12 h-2.5 rounded-sm opacity-60" />
                <div className="shimmer-box w-14 md:w-16 h-5 md:h-6 rounded-lg" />
              </div>
            ))}
          </div>
        </div>

        {/* 3. 2-COLUMN KEY ANALYTICS CARDS (Attendance & Marks) */}
        <div className="grid grid-cols-2 gap-3.5 md:gap-4">
          {/* Card 1: Attendance Snapshot Ghost */}
          <div className="p-4 md:p-5 rounded-3xl bg-white/[0.038] border border-white/[0.09] backdrop-blur-xl flex flex-col justify-between gap-4">
            <div className="flex items-center justify-between">
              <div className="shimmer-box w-28 h-3 rounded-md opacity-70" />
              <div className="w-5 h-5 rounded-full border border-purple-500/30 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-purple-400 animate-ping opacity-50" />
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="shimmer-box w-16 md:w-20 h-7 md:h-8 rounded-xl" />
              <div className="shimmer-box w-24 h-3 rounded-md opacity-60" />
            </div>
            <div className="w-full h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
              <div className="shimmer-bar w-3/4 h-full rounded-full" />
            </div>
          </div>

          {/* Card 2: Internal Marks Ghost */}
          <div className="p-4 md:p-5 rounded-3xl bg-white/[0.038] border border-white/[0.09] backdrop-blur-xl flex flex-col justify-between gap-4">
            <div className="flex items-center justify-between">
              <div className="shimmer-box w-24 h-3 rounded-md opacity-70" />
              <div className="shimmer-box w-4 h-4 rounded-md opacity-50" />
            </div>
            <div className="space-y-1.5">
              <div className="shimmer-box w-14 md:w-16 h-7 md:h-8 rounded-xl" />
              <div className="shimmer-box w-20 h-3 rounded-md opacity-60" />
            </div>
            <div className="w-full h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
              <div className="shimmer-bar w-2/3 h-full rounded-full" />
            </div>
          </div>
        </div>

        {/* 4. SECTION DIVIDER & HEADER GHOST */}
        <div className="flex items-center justify-between px-1 pt-1">
          <div className="flex items-center gap-2">
            <div className="shimmer-box w-32 h-4 rounded-md" />
            <div className="shimmer-box w-14 h-4 rounded-full opacity-60" />
          </div>
          <div className="shimmer-box w-16 h-3 rounded-md opacity-40" />
        </div>

        {/* 5. REALISTIC SCHEDULE CONTENT GHOST CARDS */}
        <div className="flex flex-col gap-3">
          {[1, 2].map((item) => (
            <div
              key={item}
              className="p-4 md:p-4.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl flex items-center justify-between gap-4 shadow-md"
            >
              {/* Left Time Badge Ghost */}
              <div className="w-13 h-12 rounded-xl bg-white/[0.035] border border-white/[0.07] flex flex-col items-center justify-center gap-1 flex-shrink-0">
                <div className="shimmer-box w-8 h-3 rounded-sm" />
                <div className="shimmer-box w-6 h-2 rounded-xs opacity-50" />
              </div>

              {/* Middle Course Details Ghost */}
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="shimmer-box w-16 h-3 rounded-md" />
                  <div className="shimmer-box w-10 h-3 rounded-full opacity-60" />
                </div>
                <div className="shimmer-box w-4/5 h-4 rounded-lg" />
                <div className="shimmer-box w-28 h-2.5 rounded-md opacity-50" />
              </div>

              {/* Right Attendance Status Chip Ghost */}
              <div className="shimmer-box w-12 h-6 rounded-full flex-shrink-0" />
            </div>
          ))}
        </div>
      </main>

      {/* Sleek Custom Shimmer Styling */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .skeleton-root {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .skeleton-root::-webkit-scrollbar {
          display: none;
        }

        @keyframes nexusGhostSweep {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }

        .shimmer-box {
          background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0.06) 0%,
            rgba(255, 255, 255, 0.18) 50%,
            rgba(255, 255, 255, 0.06) 100%
          );
          background-size: 200% 100%;
          animation: nexusGhostSweep 1.8s infinite ease-in-out;
        }

        .shimmer-bar {
          background: linear-gradient(
            90deg,
            rgba(168, 85, 247, 0.35) 0%,
            rgba(56, 189, 248, 0.65) 50%,
            rgba(168, 85, 247, 0.35) 100%
          );
          background-size: 200% 100%;
          animation: nexusGhostSweep 2s infinite ease-in-out;
        }
      `,
        }}
      />
    </div>
  );
}


