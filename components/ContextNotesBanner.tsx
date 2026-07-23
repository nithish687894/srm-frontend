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
    <div className="w-full mb-6 relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-md transition-all">
      {/* Header Bar */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-white/5 bg-black/20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/70">
            <StickyNote size={14} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-widest text-white/80">
                Linked Notes
              </span>
              <span className="px-2 py-0.5 rounded-full bg-white/10 text-[9px] font-bold text-white/60">
                {pageDisplayName}
              </span>
              {notes.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-white/10 text-[9px] font-bold text-white/60">
                  {notes.length}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push("/notes")}
            className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-[10px] font-bold text-white/60 hover:text-white transition-all group"
          >
            <span>View All</span>
            <ArrowRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all"
            aria-label={expanded ? "Collapse notes" : "Expand notes"}
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Body Content */}
      <div className="p-4 space-y-4 bg-black/10">
        {/* Existing Notes List */}
        {notes.length > 0 && (
          <div className="space-y-2 max-h-52 overflow-y-auto pr-1 custom-scrollbar">
            {notes.map((note) => (
              <div
                key={note._id}
                onClick={() => router.push("/notes")}
                className="group relative p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 cursor-pointer transition-all duration-200 flex items-start justify-between gap-3"
              >
                <div className="flex-1 min-w-0">
                  <h5 className="text-[13px] font-semibold text-white/90 group-hover:text-white truncate">
                    {note.title}
                  </h5>
                  <p className="text-[11px] font-normal text-white/40 group-hover:text-white/60 mt-1 line-clamp-2 leading-relaxed">
                    {note.content.replace(/[#*`>\-\[\]]/g, "").trim()}
                  </p>
                </div>
                <div className="shrink-0 text-[10px] font-semibold text-white/30 group-hover:text-white/60 flex items-center gap-1 pt-1">
                  <span>Open</span>
                  <ArrowRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Add Note Input Form */}
        <div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={quickNote}
                onChange={(e) => setQuickNote(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleQuickSave(); }}
                placeholder={`Type a quick note for ${pageDisplayName}...`}
                className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-[13px] text-white placeholder-white/30 focus:outline-none focus:border-white/20 focus:bg-white/10 transition-all font-medium"
              />
              {savedSuccess && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-lg border border-emerald-400/20">
                  <Check size={11} />
                  <span>Saved</span>
                </div>
              )}
            </div>

            <button
              onClick={handleQuickSave}
              disabled={saving || !quickNote.trim()}
              className="px-6 py-3 rounded-2xl bg-white text-black hover:bg-gray-200 text-[11px] font-black uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 shrink-0 flex items-center justify-center gap-2"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Plus size={14} />
                  <span>Save</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
