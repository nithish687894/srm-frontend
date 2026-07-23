"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { notesAPI } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { StickyNote, Plus, ChevronDown, ChevronUp, ArrowRight, Check } from "lucide-react";

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
      <div className="w-full mb-4">
        <button
          onClick={() => setExpanded(true)}
          className="w-full rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] px-3 py-2.5 flex items-center justify-between gap-3 transition-colors hover:bg-[rgba(255,255,255,0.06)] active:scale-95"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-[rgba(255,255,255,0.08)] flex items-center justify-center text-white/70">
              <StickyNote size={12} />
            </div>
            <div className="text-left flex flex-col">
              <span className="text-[11px] font-bold text-white/90">Add a Note for {pageDisplayName}</span>
              <span className="text-[9px] text-white/40">Quick reminders & targets</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[rgba(255,255,255,0.05)] text-white/80 text-[9px] font-bold uppercase tracking-wider">
            <Plus size={10} />
            <span>Add</span>
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className="w-full mb-4 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] overflow-hidden">
      {/* Header Bar */}
      <div className="px-3 py-2 flex items-center justify-between border-b border-[rgba(255,255,255,0.05)] bg-[rgba(0,0,0,0.15)]">
        <div className="flex items-center gap-2">
          <StickyNote size={12} className="text-white/60" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/80">Linked Notes</span>
          <span className="px-1.5 py-0.5 rounded bg-[rgba(255,255,255,0.1)] text-[8px] font-bold text-white/60">
            {pageDisplayName} {notes.length > 0 && `(${notes.length})`}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => router.push("/notes")}
            className="flex items-center gap-1 px-2 py-1 rounded bg-[rgba(255,255,255,0.05)] text-[9px] font-bold text-white/60 hover:text-white"
          >
            <span>All</span>
            <ArrowRight size={9} />
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-6 h-6 rounded bg-[rgba(255,255,255,0.05)] flex items-center justify-center text-white/60 hover:text-white"
          >
            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        </div>
      </div>

      {/* Body Content */}
      <div className="p-3 space-y-3">
        {/* Notes List */}
        {notes.length > 0 && (
          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
            {notes.map((note) => (
              <div
                key={note._id}
                onClick={() => router.push("/notes")}
                className="p-2.5 rounded-lg bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.04)] hover:border-[rgba(255,255,255,0.1)] cursor-pointer flex items-center justify-between gap-3"
              >
                <div className="flex-1 min-w-0">
                  <h5 className="text-[11px] font-semibold text-white/90 truncate">{note.title}</h5>
                  <p className="text-[9px] text-white/50 mt-0.5 truncate">
                    {note.content.replace(/[#*`>\-\[\]]/g, "").trim()}
                  </p>
                </div>
                <ArrowRight size={10} className="text-white/30 shrink-0" />
              </div>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="flex items-center gap-1.5">
          <div className="relative flex-1">
            <input
              type="text"
              value={quickNote}
              onChange={(e) => setQuickNote(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleQuickSave(); }}
              placeholder="Type a quick note..."
              className="w-full px-3 py-2 rounded-lg bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-[11px] text-white placeholder-white/30 focus:outline-none focus:border-white/20"
            />
            {savedSuccess && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[9px] font-bold text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded border border-emerald-400/20">
                <Check size={9} /> Saved
              </div>
            )}
          </div>

          <button
            onClick={handleQuickSave}
            disabled={saving || !quickNote.trim()}
            className="px-4 py-2 rounded-lg bg-white text-black hover:bg-gray-200 text-[10px] font-bold uppercase disabled:opacity-50 flex items-center gap-1 shrink-0"
          >
            {saving ? <div className="w-3 h-3 border border-black border-t-transparent rounded-full animate-spin" /> : <Plus size={12} />}
            <span className="hidden sm:inline">Save</span>
          </button>
        </div>
      </div>
    </div>
  );
}
