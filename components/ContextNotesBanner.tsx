"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { notesAPI } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { StickyNote, Plus, ChevronDown, ChevronUp, Sparkles } from "lucide-react";

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

  useEffect(() => {
    if (!authToken) return;
    notesAPI.linked(page)
      .then((res) => {
        if (res.success) setNotes(res.notes);
      })
      .catch(() => {});
  }, [authToken, page]);

  const handleQuickSave = async () => {
    if (!quickNote.trim()) return;
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
      }
    } catch { /* fallback handled by store */ }
    setSaving(false);
  };

  if (notes.length === 0 && !expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="w-full mb-4 px-4 py-3 rounded-2xl bg-white/[0.02] border border-dashed border-white/10 hover:bg-white/[0.05] hover:border-white/20 transition-all flex items-center gap-2.5 text-white/50 hover:text-white group backdrop-blur-md shadow-sm"
      >
        <div className="w-6 h-6 rounded-lg bg-[#FFCC00]/10 border border-[#FFCC00]/20 flex items-center justify-center text-[#FFCC00] group-hover:scale-110 transition-transform">
          <StickyNote size={13} />
        </div>
        <span className="text-[11px] font-bold uppercase tracking-wider">Add a note for this page</span>
        <Plus size={14} className="ml-auto text-white/30 group-hover:text-white" />
      </button>
    );
  }

  return (
    <div className="mb-5 rounded-2xl bg-white/[0.03] border border-white/10 overflow-hidden backdrop-blur-xl shadow-lg">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/[0.03] transition-all"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-[#FFCC00]/15 border border-[#FFCC00]/30 flex items-center justify-center text-[#FFCC00]">
            <StickyNote size={13} />
          </div>
          <span className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
            Linked Notes <span className="px-2 py-0.5 rounded-full bg-white/10 text-[9.5px] text-[#00d4ff]">{notes.length}</span>
          </span>
        </div>
        {expanded ? <ChevronUp size={14} className="text-white/40" /> : <ChevronDown size={14} className="text-white/40" />}
      </button>

      {expanded && (
        <div className="px-4 pb-3.5 space-y-2.5 border-t border-white/5 pt-2.5">
          {/* Linked Notes */}
          {notes.map((note) => (
            <div
              key={note._id}
              onClick={() => router.push("/notes")}
              className="px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.07] hover:border-white/20 cursor-pointer transition-all shadow-sm group"
            >
              <p className="text-xs font-bold text-white/90 group-hover:text-white line-clamp-1">{note.title}</p>
              <p className="text-[10px] text-white/40 mt-0.5 line-clamp-1">
                {note.content.replace(/[#*`>\-\[\]]/g, "").trim().slice(0, 80)}
              </p>
            </div>
          ))}

          {/* Quick Add Input */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="text"
              value={quickNote}
              onChange={(e) => setQuickNote(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleQuickSave(); }}
              placeholder={`Add a note for ${page}...`}
              className="flex-1 px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#FFCC00]/50 transition-all"
            />
            <button
              onClick={handleQuickSave}
              disabled={saving || !quickNote.trim()}
              className="px-3.5 py-2 rounded-xl bg-[#FFCC00]/15 border border-[#FFCC00]/30 text-[#FFCC00] text-[10px] font-black uppercase tracking-wider hover:bg-[#FFCC00]/25 transition-all disabled:opacity-30 active:scale-95"
            >
              {saving ? "..." : "Save"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
