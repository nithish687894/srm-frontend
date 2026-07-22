"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { notesAPI } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { StickyNote, Plus, ChevronDown, ChevronUp, Sparkles, ArrowRight, Check } from "lucide-react";

interface ContextNotesBannerProps {
  page: string;
}

interface LinkedNote {
  _id: string;
  title: string;
  content: string;
  updatedAt: string;
}

export default function ContextNotesBanner({ page }: ContextNotesBannerProps) {
  const router = useRouter();
  const { authToken } = useAuthStore();
  const [notes, setNotes] = useState<LinkedNote[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [quickNote, setQuickNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (!authToken) return;
    notesAPI.linked(page)
      .then((res) => {
        if (res.success && Array.isArray(res.notes)) setNotes(res.notes);
      })
      .catch(() => {});
  }, [authToken, page]);

  const handleQuickSave = async () => {
    if (!quickNote.trim() || saving) return;
    setSaving(true);
    try {
      const res = await notesAPI.create({
        title: quickNote.trim().slice(0, 60),
        content: quickNote.trim(),
        label: "subject",
        linkedPage: page,
      });
      if (res.success && res.note) {
        setNotes((prev) => [res.note, ...prev]);
        setQuickNote("");
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 2000);
      }
    } catch { /* fallback handled by store */ }
    setSaving(false);
  };

  const pageDisplayName = page.charAt(0).toUpperCase() + page.slice(1);

  if (notes.length === 0 && !expanded) {
    return (
      <div className="w-full mb-6">
        <button
          onClick={() => setExpanded(true)}
          className="w-full relative group overflow-hidden rounded-2xl p-[1px] transition-all duration-300 hover:scale-[1.008] active:scale-[0.995]"
        >
          {/* Animated gradient border track */}
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/30 via-purple-500/30 to-cyan-500/30 rounded-2xl opacity-60 group-hover:opacity-100 transition-opacity blur-[1px]" />
          
          <div className="relative rounded-2xl bg-neutral-950/80 backdrop-blur-xl px-4 py-3 flex items-center justify-between gap-3 border border-white/10 shadow-lg group-hover:border-purple-500/40 transition-colors">
            {/* Ambient Background Glow */}
            <div className="absolute -left-10 top-0 bottom-0 w-32 bg-amber-500/10 blur-xl pointer-events-none group-hover:bg-purple-500/15 transition-all" />
            
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500/20 via-purple-500/20 to-pink-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 group-hover:rotate-6 transition-transform shadow-[0_0_12px_rgba(245,158,11,0.25)]">
                <StickyNote size={15} />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-extrabold tracking-wide text-white group-hover:text-amber-300 transition-colors">
                    Add a Note for {pageDisplayName}
                  </span>
                  <Sparkles size={11} className="text-amber-400 animate-pulse" />
                </div>
                <p className="text-[10px] font-medium text-white/40 group-hover:text-white/60 transition-colors">
                  Keep track of quick reminders, targets & thoughts for this page
                </p>
              </div>
            </div>

            <div className="relative z-10 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-[10px] font-black uppercase tracking-wider group-hover:bg-amber-500/20 transition-all shadow-sm">
              <Plus size={12} className="group-hover:rotate-90 transition-transform duration-300" />
              <span>Add Note</span>
            </div>
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className="w-full mb-6 relative overflow-hidden rounded-2xl border border-white/10 bg-neutral-950/85 backdrop-blur-2xl shadow-2xl transition-all">
      {/* Background Neon Accent Glows */}
      <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="px-4 py-3.5 flex items-center justify-between border-b border-white/5 bg-white/[0.015]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500/20 via-purple-500/20 to-cyan-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.2)]">
            <StickyNote size={15} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-white">
                Linked Notes
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-[9.5px] font-extrabold text-amber-300">
                {pageDisplayName}
              </span>
              {notes.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/30 text-[9.5px] font-extrabold text-purple-300">
                  {notes.length} {notes.length === 1 ? "note" : "notes"}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push("/notes")}
            className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-bold text-white/70 hover:text-white transition-all group"
          >
            <span>All Notes</span>
            <ArrowRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all"
            aria-label={expanded ? "Collapse notes" : "Expand notes"}
          >
            {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
        </div>
      </div>

      {/* Body Content */}
      <div className="p-4 space-y-3.5">
        {/* Existing Notes List */}
        {notes.length > 0 && (
          <div className="space-y-2 max-h-52 overflow-y-auto pr-1 custom-scrollbar">
            {notes.map((note) => (
              <div
                key={note._id}
                onClick={() => router.push("/notes")}
                className="group relative p-3 rounded-xl bg-white/[0.025] hover:bg-white/[0.06] border border-white/10 hover:border-purple-500/40 cursor-pointer transition-all duration-200 shadow-sm flex items-start justify-between gap-3"
              >
                {/* Left Gradient Strip */}
                <div className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-gradient-to-b from-amber-400 to-purple-500 opacity-70 group-hover:opacity-100 transition-opacity" />
                
                <div className="pl-2.5 flex-1 min-w-0">
                  <h5 className="text-xs font-bold text-white/90 group-hover:text-white truncate">
                    {note.title}
                  </h5>
                  <p className="text-[11px] font-medium text-white/50 group-hover:text-white/70 mt-0.5 line-clamp-2 leading-relaxed">
                    {note.content.replace(/[#*`>\-\[\]]/g, "").trim()}
                  </p>
                </div>

                <div className="shrink-0 text-[10px] font-semibold text-purple-400/80 group-hover:text-purple-300 flex items-center gap-1 pt-0.5">
                  <span>View</span>
                  <ArrowRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Add Note Input Form */}
        <div className="pt-1">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={quickNote}
                onChange={(e) => setQuickNote(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleQuickSave(); }}
                placeholder={`Type a quick note for ${pageDisplayName}...`}
                className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/12 text-xs text-white placeholder-white/35 focus:outline-none focus:border-purple-400/80 focus:ring-2 focus:ring-purple-500/20 transition-all font-medium"
              />
              {savedSuccess && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                  <Check size={11} />
                  <span>Saved</span>
                </div>
              )}
            </div>

            <button
              onClick={handleQuickSave}
              disabled={saving || !quickNote.trim()}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-pink-500 to-purple-600 hover:from-amber-400 hover:to-purple-500 text-white text-[11px] font-black uppercase tracking-wider shadow-lg shadow-purple-500/20 transition-all disabled:opacity-35 disabled:cursor-not-allowed active:scale-95 shrink-0 flex items-center justify-center gap-1.5"
            >
              {saving ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Plus size={13} />
                  <span>Save Note</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
