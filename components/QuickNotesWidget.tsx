"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useNotesStore, type Note } from "@/lib/notesStore";
import { notesAPI } from "@/lib/api";
import { StickyNote, Plus, Pin, Star, ArrowRight, Sparkles } from "lucide-react";

export default function QuickNotesWidget() {
  const router = useRouter();
  const { notes, addNote, syncFromServer } = useNotesStore();
  const [quickText, setQuickText] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    syncFromServer();
  }, []);

  const handleCreateQuickNote = async () => {
    if (!quickText.trim()) return;
    setSaving(true);
    const content = quickText.trim();
    const title = content.split("\n")[0].slice(0, 50) || "Quick Note";

    try {
      const res = await notesAPI.create({
        title,
        content,
        label: "subject",
      });
      if (res.success && res.note) {
        addNote(res.note);
      }
    } catch {
      const tempNote: Note = {
        _id: `local_${Date.now()}`,
        title,
        content,
        label: "subject",
        subject: "",
        tags: [],
        isPinned: false,
        isFavorite: false,
        linkedPage: null,
        color: "#00d4ff",
        checkItems: [],
        archivedAt: null,
        deletedAt: null,
        version: 1,
        reminderAt: null,
        syncedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      addNote(tempNote);
    }
    setQuickText("");
    setSaving(false);
  };

  const activeNotes = notes.filter((n) => !n.archivedAt && !n.deletedAt);
  const recentNotes = activeNotes.slice(0, 4);

  return (
    <div className="rounded-3xl bg-white/[0.03] border border-white/10 p-5 backdrop-blur-xl shadow-xl hover:border-white/20 transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-[#FFCC00]/15 border border-[#FFCC00]/30 flex items-center justify-center text-[#FFCC00] shadow-[0_0_15px_rgba(255,204,0,0.2)]">
            <StickyNote size={18} />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
              Quick Notes
              <Sparkles size={12} className="text-[#00d4ff]" />
            </h3>
            <p className="text-[9.5px] text-white/50 font-bold">{activeNotes.length} total notes</p>
          </div>
        </div>
        <button
          onClick={() => router.push("/notes")}
          className="text-[10px] font-black text-[#00d4ff] hover:text-white transition-colors flex items-center gap-1 uppercase tracking-wider hover:underline"
        >
          View All <ArrowRight size={13} />
        </button>
      </div>

      {/* Quick Input */}
      <div className="flex items-center gap-2 mb-4">
        <input
          type="text"
          value={quickText}
          onChange={(e) => setQuickText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleCreateQuickNote(); }}
          placeholder="Jot down a quick note..."
          className="flex-1 px-3.5 py-2.5 rounded-2xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#FFCC00]/50 transition-all font-medium"
        />
        <button
          onClick={handleCreateQuickNote}
          disabled={saving || !quickText.trim()}
          className="px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-[#FFCC00] to-[#FFAA00] text-black font-black text-xs uppercase tracking-wider hover:scale-105 active:scale-95 transition-all disabled:opacity-30 flex items-center gap-1 shrink-0 shadow-[0_0_15px_rgba(255,204,0,0.25)]"
        >
          <Plus size={15} strokeWidth={3} /> {saving ? "..." : "Add"}
        </button>
      </div>

      {/* Recent / Pinned List */}
      {recentNotes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {recentNotes.map((note) => {
            const preview = note.content.replace(/[#*`>\-\[\]]/g, "").trim().slice(0, 60);
            return (
              <div
                key={note._id}
                onClick={() => router.push("/notes")}
                className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.07] hover:border-white/20 transition-all cursor-pointer group shadow-md"
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h4 className="text-xs font-bold text-white/90 group-hover:text-white truncate flex-1">{note.title}</h4>
                  <div className="flex items-center gap-1 shrink-0">
                    {note.isPinned && <Pin size={10} className="text-[#00d4ff]" />}
                    {note.isFavorite && <Star size={10} className="text-[#FFCC00] fill-[#FFCC00]" />}
                  </div>
                </div>
                {preview && (
                  <p className="text-[10px] text-white/40 group-hover:text-white/60 line-clamp-1">{preview}</p>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-6 text-center text-white/40 text-xs font-medium bg-white/[0.01] rounded-2xl border border-dashed border-white/10">
          No notes yet. Jot down your first note above!
        </div>
      )}
    </div>
  );
}
