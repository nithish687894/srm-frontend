"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { notesAPI } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { StickyNote, Plus, ChevronDown, ChevronUp } from "lucide-react";

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
    } catch { /* offline fallback handled by store */ }
    setSaving(false);
  };

  if (notes.length === 0 && !expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="w-full mb-4 px-4 py-2.5 rounded-2xl bg-white/[0.02] border border-dashed border-white/[0.08] hover:bg-white/[0.04] hover:border-white/10 transition-all flex items-center gap-2 text-white/30 hover:text-white/50 group"
      >
        <StickyNote size={13} className="group-hover:text-[#FFCC00] transition-colors" />
        <span className="text-[10px] font-bold uppercase tracking-wider">Add a note for this page</span>
        <Plus size={12} className="ml-auto" />
      </button>
    );
  }

  return (
    <div className="mb-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-white/[0.02] transition-all"
      >
        <div className="flex items-center gap-2">
          <StickyNote size={13} className="text-[#FFCC00]" />
          <span className="text-[10px] font-black uppercase tracking-wider text-white/60">
            Your notes ({notes.length})
          </span>
        </div>
        {expanded ? <ChevronUp size={12} className="text-white/30" /> : <ChevronDown size={12} className="text-white/30" />}
      </button>

      {expanded && (
        <div className="px-4 pb-3 space-y-2">
          {/* Linked Notes */}
          {notes.map((note) => (
            <div
              key={note._id}
              onClick={() => router.push("/notes")}
              className="px-3 py-2 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] cursor-pointer transition-all"
            >
              <p className="text-[10px] font-bold text-white/80 line-clamp-1">{note.title}</p>
              <p className="text-[9px] text-white/30 mt-0.5 line-clamp-1">
                {note.content.replace(/[#*`>\-\[\]]/g, "").trim().slice(0, 80)}
              </p>
            </div>
          ))}

          {/* Quick Add */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="text"
              value={quickNote}
              onChange={(e) => setQuickNote(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleQuickSave(); }}
              placeholder={`Add a note for ${page}...`}
              className="flex-1 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] text-[10px] text-white placeholder-white/25 focus:outline-none focus:border-[#FFCC00]/30 transition-all"
            />
            <button
              onClick={handleQuickSave}
              disabled={saving || !quickNote.trim()}
              className="px-3 py-2 rounded-xl bg-[#FFCC00]/10 border border-[#FFCC00]/20 text-[#FFCC00] text-[9px] font-bold uppercase tracking-wider hover:bg-[#FFCC00]/20 transition-all disabled:opacity-30"
            >
              {saving ? "..." : "Save"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
