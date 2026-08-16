"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, Activity } from "lucide-react";

const PHRASES = [
  "Decrypting academic profile...",
  "Warming up database records...",
  "Aligning timetable day orders...",
  "Securing Academia connection...",
  "Syncing grades and attendance..."
];

export default function LoadingSkeleton() {
  const [phraseIdx, setPhraseIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setPhraseIdx((prev) => (prev + 1) % PHRASES.length);
    }, 1800);
    return () => clearInterval(timer);
  }, []);

  return (
    <main
      className="w-full min-h-screen relative overflow-hidden bg-[#050505] text-white flex flex-col justify-between"
      style={{
        padding: "calc(env(safe-area-inset-top, 0px) + 64px) 24px calc(env(safe-area-inset-bottom, 0px) + 40px)",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      {/* Background Aura Blobs */}
      <div
        className="fixed -top-32 -right-32 w-[500px] h-[500px] rounded-full pointer-events-none z-0"
        style={{
          background: "radial-gradient(circle, rgba(143, 146, 255, 0.08) 0%, rgba(0, 0, 0, 0) 70%)",
          filter: "blur(70px)",
        }}
      />
      <div
        className="fixed -bottom-32 -left-32 w-[500px] h-[500px] rounded-full pointer-events-none z-0"
        style={{
          background: "radial-gradient(circle, rgba(0, 212, 255, 0.06) 0%, rgba(0, 0, 0, 0) 70%)",
          filter: "blur(70px)",
        }}
      />

      <div style={{ flex: 1 }} />

      {/* Centered Premium Loader */}
      <div className="flex-grow flex flex-col items-center justify-center relative z-10 max-w-sm w-full mx-auto px-6 text-center">
        {/* Glowing Orb Outer Wrapper */}
        <div className="relative w-24 h-24 mb-8 flex items-center justify-center">
          {/* Pulsing Glow Rings */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#FF75C3] via-[#8F92FF] to-[#00d4ff] opacity-15 blur-lg animate-pulse" />
          <div className="absolute -inset-1 rounded-full border border-white/5 animate-spin" style={{ animationDuration: "8s" }} />
          <div className="absolute -inset-3.5 rounded-full border border-dashed border-white/5 animate-spin" style={{ animationDuration: "16s", animationDirection: "reverse" }} />

          {/* Central Glass Sphere */}
          <div className="absolute inset-2 rounded-full bg-white/[0.02] border border-white/10 backdrop-blur-2xl flex items-center justify-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
            <Sparkles size={26} className="text-[#8F92FF] animate-pulse" />
          </div>
        </div>

        {/* Brand Header */}
        <div className="space-y-2 mb-8">
          <h1 className="text-sm font-black tracking-[0.45em] uppercase text-white mr-[-0.45em]">SRM NEXUS</h1>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/[0.04] border border-white/10 text-[9px] font-black text-white/50 tracking-wider uppercase">
            <Activity size={10} className="text-[#00d4ff] animate-pulse" /> INSTANT LOAD
          </div>
        </div>

        {/* Dynamic Phrase Indicator */}
        <div className="w-full h-8 flex items-center justify-center overflow-hidden mb-4">
          <p className="text-[11px] text-[#FF75C3] font-extrabold tracking-wide animate-pulse-soft">
            {PHRASES[phraseIdx]}
          </p>
        </div>

        {/* High-Fidelity Progress Loader */}
        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden relative mb-4">
          <div 
            className="h-full bg-gradient-to-r from-[#FF75C3] via-[#8F92FF] to-[#00d4ff] rounded-full absolute left-0 top-0"
            style={{
              animation: "shimmerProgress 2s infinite linear",
            }}
          />
        </div>
        
        {/* Security / Privacy Subtext */}
        <p className="text-[9.5px] text-white/30 font-semibold max-w-[260px] leading-relaxed">
          Connecting directly via secure gateway. Credentials remain encrypted on your device.
        </p>
      </div>

      <div style={{ flex: 1 }} />

      {/* Styled animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shimmerProgress {
          0% { left: -100%; width: 30%; }
          50% { left: 35%; width: 40%; }
          100% { left: 100%; width: 30%; }
        }
        @keyframes pulseSoft {
          0%, 100% { opacity: 0.55; transform: scale(0.98); }
          50% { opacity: 0.95; transform: scale(1.02); }
        }
        .animate-pulse-soft {
          animation: pulseSoft 1.8s infinite ease-in-out;
        }
      `}} />
    </main>
  );
}
