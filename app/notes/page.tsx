"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { useAuth } from "@/hooks/useAuth";
import { notesAPI } from "@/lib/api";
import { useNotesStore, type Note, type SortMode, type ViewFilter } from "@/lib/notesStore";
import {
  Plus, Search, StickyNote, Pin, Star, Archive, Trash2, RotateCcw,
  X, ChevronDown, ArrowLeft, Loader2, FileText, CheckSquare,
  Bold, Italic, List, ListOrdered, Code, Quote, Hash, Eye, Edit3,
  Download, Upload, BarChart3, Clock, BookOpen, Sparkles, Check,
  MoreVertical, Settings, Folder
} from "lucide-react";

// ─── Constants & Configurations ──────────────────────────────────────────────
const LABEL_CONFIG = {
  subject:    { emoji: "📘", label: "Subject",    color: "#3b82f6", bg: "rgba(59,130,246,0.15)" },
  assignment: { emoji: "📝", label: "Assignment", color: "#10b981", bg: "rgba(16,185,129,0.15)" },
  important:  { emoji: "⭐", label: "Important",  color: "#f59e0b", bg: "rgba(245,158,11,0.15)" },
  todo:       { emoji: "🟣", label: "To-Do",      color: "#a855f7", bg: "rgba(168,85,247,0.15)" },
} as const;

const SUBJECT_CONFIG: Record<string, { emoji: string; color: string }> = {
  "Maths":            { emoji: "📘", color: "#3b82f6" },
  "Programming":      { emoji: "💻", color: "#a855f7" },
  "CN":               { emoji: "🌐", color: "#10b981" },
  "Cyber Security":   { emoji: "🛡️", color: "#ef4444" },
  "DBMS":             { emoji: "📊", color: "#f59e0b" },
  "OS":               { emoji: "⚙️", color: "#f97316" },
  "DSA":              { emoji: "🧮", color: "#06b6d4" },
  "Software Engg":    { emoji: "🏗️", color: "#8b5cf6" },
  "AI/ML":            { emoji: "🤖", color: "#ec4899" },
  "Physics":          { emoji: "⚛️", color: "#14b8a6" },
  "Chemistry":        { emoji: "🧪", color: "#84cc16" },
  "English":          { emoji: "📖", color: "#6366f1" },
};

const SMART_TEMPLATES = [
  { name: "Lecture Notes", emoji: "📘", label: "subject" as const, content: "# Lecture Notes\n\n## Topic\n\n\n## Key Points\n\n- \n- \n\n## Summary\n\n\n## Questions\n\n- " },
  { name: "Assignment", emoji: "📝", label: "assignment" as const, content: "# Assignment\n\n**Subject:** \n**Due Date:** \n\n## Requirements\n\n- [ ] \n- [ ] \n\n## Notes\n\n" },
  { name: "To-do List", emoji: "🟣", label: "todo" as const, content: "# To-do\n\n- [ ] \n- [ ] \n- [ ] " },
  { name: "Exam Prep", emoji: "🎯", label: "important" as const, content: "# Exam Preparation\n\n## Subject: \n## Exam Date: \n\n## Units to Cover\n\n- [ ] Unit 1: \n- [ ] Unit 2: \n\n## Important Topics\n\n1. \n2. " },
  { name: "Lab Report", emoji: "🔬", label: "subject" as const, content: "# Lab Experiment\n\n**Subject:** \n**Date:** \n**Experiment No:** \n\n## Aim\n\n\n## Procedure\n\n1. \n2. \n" },
];

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: "pinned", label: "📌 Pinned First" },
  { value: "newest", label: "⏱ Newest" },
  { value: "oldest", label: "⌛ Oldest" },
  { value: "az", label: "🔤 A → Z" },
  { value: "edited", label: "✏️ Recently Edited" },
];

// ─── Utility Helpers ──────────────────────────────────────────────────────────
function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

// ─── Notes Page Main Component ────────────────────────────────────────────────
export default function NotesPage() {
  const { ready } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    notes, stats, searchQuery, sortMode, viewFilter, activeLabel, activeSubject, syncStatus,
    setNotes, setSearchQuery, setSortMode, setViewFilter, setActiveLabel, setActiveSubject,
    addNote, updateNote, removeNote, togglePin, toggleFavorite, archiveNote, restoreNote,
    syncFromServer, syncStatsFromServer, getFilteredNotes, getSubjects, setSyncStatus,
  } = useNotesStore();

  // ─── Local State ────────────────────────────────────────────────────────────
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [editorTitle, setEditorTitle] = useState("");
  const [editorContent, setEditorContent] = useState("");
  const [editorLabel, setEditorLabel] = useState<keyof typeof LABEL_CONFIG>("subject");
  const [editorSubject, setEditorSubject] = useState("");
  const [editorLinkedPage, setEditorLinkedPage] = useState<string | null>(null);
  const [editorCheckItems, setEditorCheckItems] = useState<{ text: string; checked: boolean }[]>([]);
  const [editorMode, setEditorMode] = useState<"edit" | "preview">("edit");
  const [saveStatus, setSaveStatus] = useState<"idle" | "typing" | "saving" | "saved">("idle");
  
  // UI Dropdowns & Modals
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const editorTextareaRef = useRef<HTMLTextAreaElement>(null);

  // ─── Initial Load ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!ready) return;
    syncFromServer().finally(() => setIsInitialLoad(false));
    syncStatsFromServer();
  }, [ready]);

  // ─── Auto Save Handler ──────────────────────────────────────────────────────
  const autoSave = useCallback(() => {
    if (!editingNote) return;
    setSaveStatus("saving");

    const payload = {
      title: editorTitle.trim() || "Untitled",
      content: editorContent,
      label: editorLabel,
      subject: editorSubject,
      linkedPage: editorLinkedPage,
      checkItems: editorCheckItems,
    };

    notesAPI.update(editingNote._id, payload)
      .then((res) => {
        if (res.success && res.note) {
          updateNote(editingNote._id, res.note);
        }
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2000);
      })
      .catch(() => {
        updateNote(editingNote._id, payload);
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2000);
      });
  }, [editingNote, editorTitle, editorContent, editorLabel, editorSubject, editorLinkedPage, editorCheckItems, updateNote]);

  const triggerAutoSave = useCallback(() => {
    setSaveStatus("typing");
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(autoSave, 1000);
  }, [autoSave]);

  // ─── Editor Actions ────────────────────────────────────────────────────────
  const openEditor = (note?: Note) => {
    if (note) {
      setEditingNote(note);
      setEditorTitle(note.title);
      setEditorContent(note.content);
      setEditorLabel(note.label);
      setEditorSubject(note.subject);
      setEditorLinkedPage(note.linkedPage);
      setEditorCheckItems(note.checkItems?.map(c => ({ text: c.text, checked: c.checked })) || []);
    } else {
      setEditingNote(null);
      setEditorTitle("");
      setEditorContent("");
      setEditorLabel("subject");
      setEditorSubject("");
      setEditorLinkedPage(null);
      setEditorCheckItems([]);
    }
    setEditorMode("edit");
    setSaveStatus("idle");
    setEditorOpen(true);
  };

  const openFromTemplate = (template: typeof SMART_TEMPLATES[0]) => {
    setEditingNote(null);
    setEditorTitle(template.name);
    setEditorContent(template.content);
    setEditorLabel(template.label);
    setEditorSubject("");
    setEditorLinkedPage(null);
    setEditorCheckItems([]);
    setEditorMode("edit");
    setSaveStatus("idle");
    setShowTemplates(false);
    setShowMoreMenu(false);
    setEditorOpen(true);
  };

  const closeEditor = () => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      if (editingNote && saveStatus === "typing") autoSave();
    }
    setEditorOpen(false);
    setEditingNote(null);
  };

  const saveNewNote = async () => {
    if (!editorTitle.trim() && !editorContent.trim()) return;

    setSaveStatus("saving");
    try {
      const res = await notesAPI.create({
        title: editorTitle.trim() || "Untitled",
        content: editorContent,
        label: editorLabel,
        subject: editorSubject,
        linkedPage: editorLinkedPage,
        checkItems: editorCheckItems,
      });
      if (res.success && res.note) {
        addNote(res.note);
        setEditingNote(res.note);
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2000);
      }
    } catch {
      const tempNote: Note = {
        _id: `local_${Date.now()}`,
        title: editorTitle.trim() || "Untitled",
        content: editorContent,
        label: editorLabel,
        subject: editorSubject,
        tags: [],
        isPinned: false,
        isFavorite: false,
        linkedPage: editorLinkedPage as Note["linkedPage"],
        color: LABEL_CONFIG[editorLabel].color,
        checkItems: editorCheckItems,
        archivedAt: null,
        deletedAt: null,
        version: 1,
        reminderAt: null,
        syncedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      addNote(tempNote);
      setEditingNote(tempNote);
      setSyncStatus("offline");
      setSaveStatus("saved");
    }
  };

  const handleDelete = async (note: Note) => {
    if (note.deletedAt) {
      await notesAPI.delete(note._id).catch(() => {});
      removeNote(note._id);
    } else {
      try {
        await notesAPI.delete(note._id);
        updateNote(note._id, { deletedAt: new Date().toISOString() });
      } catch {
        updateNote(note._id, { deletedAt: new Date().toISOString() });
      }
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const text = ev.target?.result as string;
      const titleMatch = text.match(/^#\s+(.+)$/m);
      const title = titleMatch ? titleMatch[1] : file.name.replace(/\.(md|txt)$/, "");
      try {
        const res = await notesAPI.create({ title, content: text, label: "subject" });
        if (res.success && res.note) {
          addNote(res.note);
        }
      } catch {
        addNote({
          _id: `local_${Date.now()}`,
          title,
          content: text,
          label: "subject",
          subject: "",
          tags: [],
          isPinned: false,
          isFavorite: false,
          linkedPage: null,
          color: "#3b82f6",
          checkItems: [],
          archivedAt: null,
          deletedAt: null,
          version: 1,
          reminderAt: null,
          syncedAt: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    };
    reader.readAsText(file);
    setShowMoreMenu(false);
    e.target.value = "";
  };

  // ─── Filtered Notes ─────────────────────────────────────────────────────────
  const filteredNotes = getFilteredNotes();
  const subjects = getSubjects();

  const viewLabels: Record<ViewFilter, string> = {
    all: "📁 All Notes",
    favorites: "⭐ Favorites",
    pinned: "📌 Pinned",
    archived: "📦 Archived",
    trash: "🗑️ Trash",
  };

  if (!ready) {
    return (
      <div className="min-h-screen bg-[#06070a] flex flex-col items-center justify-center text-white/50 gap-4">
        <Loader2 className="animate-spin text-[#3b82f6]" size={40} />
        <p className="text-xs uppercase tracking-widest font-black text-white/70">Loading Notes...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#06070a] text-white selection:bg-[#3b82f6]/30">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 sm:pt-20 pb-36 md:pl-72 lg:pl-80">

        {/* ── 1. Clean Uncluttered Header ───────────────────────────────────────── */}
        <header className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/dashboard")}
              className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/[0.04] hover:bg-white/[0.08] transition-all text-white/70 hover:text-white shrink-0 active:scale-95 shadow-md"
              title="Back to Dashboard"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight flex items-center gap-2.5 text-white">
                MY NOTES
              </h1>
              <p className="text-xs text-white/60 font-semibold mt-1 flex items-center gap-2">
                {syncStatus === "synced" && <span className="text-emerald-400 font-bold flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Synced</span>}
                {syncStatus === "syncing" && <span className="text-amber-400 font-bold flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" /> Syncing...</span>}
                {syncStatus === "offline" && <span className="text-orange-400 font-bold flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-orange-400" /> Offline</span>}
                <span className="text-white/30">•</span>
                <span className="text-white/70 font-medium">{filteredNotes.length} {filteredNotes.length === 1 ? "Note" : "Notes"}</span>
              </p>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* New Note CTA Button */}
            <button
              onClick={() => openEditor()}
              className="px-4.5 py-2.5 rounded-2xl bg-gradient-to-r from-[#3b82f6] to-[#2563eb] hover:brightness-110 active:scale-95 transition-all text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-[0_0_20px_rgba(59,130,246,0.35)] shrink-0"
            >
              <Plus size={18} strokeWidth={2.5} />
              <span>New Note</span>
            </button>

            {/* ⋮ More Options Dropdown Button */}
            <div className="relative">
              <button
                onClick={() => setShowMoreMenu(!showMoreMenu)}
                className="w-10 h-10 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] transition-all flex items-center justify-center text-white/80 hover:text-white shrink-0 active:scale-95 shadow-md"
                title="More options"
              >
                <MoreVertical size={20} />
              </button>

              {/* More Options Sheet / Menu */}
              {showMoreMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowMoreMenu(false)} />
                  <div className="absolute right-0 top-full mt-2 w-56 bg-[#0f1117] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden backdrop-blur-2xl py-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
                    <button
                      onClick={() => { syncStatsFromServer(); setShowStatsModal(true); setShowMoreMenu(false); }}
                      className="w-full px-4 py-3 text-left hover:bg-white/5 transition-all flex items-center gap-3 text-xs font-semibold text-white/90"
                    >
                      <BarChart3 size={16} className="text-[#3b82f6]" />
                      <span>Statistics & Insights</span>
                    </button>

                    <button
                      onClick={() => setShowTemplates(!showTemplates)}
                      className="w-full px-4 py-3 text-left hover:bg-white/5 transition-all flex items-center justify-between text-xs font-semibold text-white/90"
                    >
                      <div className="flex items-center gap-3">
                        <FileText size={16} className="text-[#f59e0b]" />
                        <span>Smart Templates</span>
                      </div>
                      <ChevronDown size={14} className="text-white/40" />
                    </button>

                    {showTemplates && (
                      <div className="bg-white/[0.02] border-y border-white/5 py-1">
                        {SMART_TEMPLATES.map((t) => (
                          <button
                            key={t.name}
                            onClick={() => openFromTemplate(t)}
                            className="w-full px-8 py-2 text-left hover:bg-white/10 transition-all flex items-center gap-2.5 text-xs text-white/80"
                          >
                            <span>{t.emoji}</span>
                            <span>{t.name}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    <label className="w-full px-4 py-3 text-left hover:bg-white/5 transition-all flex items-center gap-3 text-xs font-semibold text-white/90 cursor-pointer">
                      <Upload size={16} className="text-[#10b981]" />
                      <span>Import Note (.md, .txt)</span>
                      <input type="file" accept=".md,.txt" onChange={handleImport} className="hidden" />
                    </label>

                    <button
                      onClick={() => {
                        const allTxt = notes.map(n => `# ${n.title}\n\n${n.content}`).join("\n\n---\n\n");
                        const blob = new Blob([allTxt], { type: "text/markdown" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `srm_notes_backup_${Date.now()}.md`;
                        a.click();
                        URL.revokeObjectURL(url);
                        setShowMoreMenu(false);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-white/5 transition-all flex items-center gap-3 text-xs font-semibold text-white/90 border-t border-white/5"
                    >
                      <Download size={16} className="text-white/60" />
                      <span>Export All Notes</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* ── 2. Search & Filter Bar with 16px Spacing ───────────────────────────── */}
        <div className="space-y-4 mb-7">
          {/* Search Bar */}
          <div className="relative w-full">
            <Search size={18} className="absolute left-4.5 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              id="notes-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search title, content or tags..."
              className="w-full pl-12 pr-10 py-3.5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.04] focus:bg-white/[0.04] text-sm text-white placeholder-white/40 focus:outline-none transition-all font-medium backdrop-blur-md shadow-sm"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white p-1">
                <X size={16} />
              </button>
            )}
          </div>

          {/* ── 3. Filters: Large Touch-Friendly Pills ───────────────────────────── */}
          <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none" style={{ scrollbarWidth: "none" }}>
            {/* View Filter Dropdown Pill */}
            <div className="relative shrink-0">
              <button
                onClick={() => setShowFilterMenu(!showFilterMenu)}
                className="px-4 py-2.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] transition-all text-xs font-semibold text-white/90 flex items-center gap-2 shadow-sm whitespace-nowrap"
              >
                <span>{viewLabels[viewFilter]}</span>
                <ChevronDown size={14} className="text-white/50" />
              </button>
              {showFilterMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowFilterMenu(false)} />
                  <div className="absolute left-0 top-full mt-2 w-52 bg-[#0f1117] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden backdrop-blur-2xl py-1">
                    {(Object.keys(viewLabels) as ViewFilter[]).map((f) => (
                      <button
                        key={f}
                        onClick={() => { setViewFilter(f); setShowFilterMenu(false); }}
                        className={`w-full px-4 py-2.5 text-left text-xs font-semibold transition-all flex items-center justify-between ${viewFilter === f ? "bg-[#3b82f6]/15 text-[#3b82f6]" : "text-white/80 hover:bg-white/5"}`}
                      >
                        <span>{viewLabels[f]}</span>
                        {viewFilter === f && <Check size={14} />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Sort Pill */}
            <div className="relative shrink-0">
              <button
                onClick={() => setShowSortMenu(!showSortMenu)}
                className="px-4 py-2.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] transition-all text-xs font-semibold text-white/90 flex items-center gap-2 shadow-sm whitespace-nowrap"
              >
                <span>⬇️ Sort</span>
                <ChevronDown size={14} className="text-white/50" />
              </button>
              {showSortMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowSortMenu(false)} />
                  <div className="absolute left-0 top-full mt-2 w-48 bg-[#0f1117] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden backdrop-blur-2xl py-1">
                    {SORT_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => { setSortMode(opt.value); setShowSortMenu(false); }}
                        className={`w-full px-4 py-2.5 text-left text-xs font-semibold transition-all flex items-center justify-between ${sortMode === opt.value ? "bg-[#3b82f6]/15 text-[#3b82f6]" : "text-white/80 hover:bg-white/5"}`}
                      >
                        <span>{opt.label}</span>
                        {sortMode === opt.value && <Check size={14} />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="w-px h-6 bg-white/10 mx-1 shrink-0" />

            {/* Label Chips */}
            <button
              onClick={() => setActiveLabel(null)}
              className={`px-4 py-2.5 rounded-full text-xs font-semibold transition-all shrink-0 ${!activeLabel ? "bg-white/15 text-white shadow-sm font-bold" : "bg-white/[0.02] text-white/60 hover:bg-white/5 hover:text-white"}`}
            >
              All
            </button>
            {Object.entries(LABEL_CONFIG).map(([key, cfg]) => (
              <button
                key={key}
                onClick={() => setActiveLabel(activeLabel === key ? null : key)}
                className="px-4 py-2.5 rounded-full text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5"
                style={activeLabel === key ? { backgroundColor: cfg.bg, color: cfg.color, fontWeight: 700 } : { backgroundColor: "rgba(255,255,255,0.02)", color: "rgba(255,255,255,0.6)" }}
              >
                <span>{cfg.emoji}</span>
                <span>{cfg.label}</span>
              </button>
            ))}

            {/* Subject Chips */}
            {subjects.length > 0 && (
              <>
                <div className="w-px h-6 bg-white/10 mx-1 shrink-0" />
                {subjects.map((subj) => {
                  const sc = SUBJECT_CONFIG[subj] || { emoji: "📚", color: "#94a3b8" };
                  const isSel = activeSubject === subj;
                  return (
                    <button
                      key={subj}
                      onClick={() => setActiveSubject(isSel ? null : subj)}
                      className="px-4 py-2.5 rounded-full text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5"
                      style={isSel ? { backgroundColor: `${sc.color}25`, color: sc.color, fontWeight: 700 } : { backgroundColor: "rgba(255,255,255,0.02)", color: "rgba(255,255,255,0.6)" }}
                    >
                      <span>{sc.emoji}</span>
                      <span>{subj}</span>
                    </button>
                  );
                })}
              </>
            )}
          </div>
        </div>

        {/* ── 5, 6, 7, 11, 15. Taller Note Cards with Metadata ───────────────────── */}
        {isInitialLoad ? (
          <div className="flex flex-col items-center justify-center py-20 text-white/40 gap-3">
            <Loader2 className="animate-spin text-[#3b82f6]" size={36} />
            <span className="text-xs font-bold uppercase tracking-widest text-white/60">Loading notes...</span>
          </div>
        ) : filteredNotes.length === 0 ? (
          /* ── 10. Empty State Layout ───────────────────────────────────────── */
          <div className="py-12 px-6 rounded-3xl bg-white/[0.01] text-center max-w-lg mx-auto border border-dashed border-white/10">
            <div className="w-16 h-16 rounded-2xl bg-[#3b82f6]/10 flex items-center justify-center text-[#3b82f6] mx-auto mb-4">
              <Folder size={32} />
            </div>
            <h3 className="text-lg font-bold text-white mb-1.5">
              {searchQuery ? "No matching notes found" : viewFilter !== "all" ? `No ${viewFilter} notes` : "Create your first note!"}
            </h3>
            <p className="text-xs text-white/50 mb-6 leading-relaxed">
              {searchQuery ? "Try searching for a different keyword or tag." : "Organize your study notes, assignments, and to-do lists in one place."}
            </p>

            <button
              onClick={() => openEditor()}
              className="px-5 py-2.5 rounded-2xl bg-[#3b82f6] text-white text-xs font-bold hover:bg-[#2563eb] transition-all inline-flex items-center gap-2 shadow-lg"
            >
              <Plus size={16} /> Create Note
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredNotes.map((note) => {
              const labelCfg = LABEL_CONFIG[note.label] || LABEL_CONFIG.subject;
              const subjCfg = SUBJECT_CONFIG[note.subject] || null;
              const preview = note.content.replace(/[#*`>\-\[\]]/g, "").trim().slice(0, 100);

              return (
                <div
                  key={note._id}
                  onClick={() => openEditor(note)}
                  className="group relative p-5 rounded-3xl bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-200 cursor-pointer shadow-md hover:shadow-xl flex flex-col justify-between min-h-[140px] border-l-4"
                  style={{ borderLeftColor: labelCfg.color }}
                >
                  <div>
                    {/* Header: Title + Pin/Star Icons */}
                    <div className="flex items-start justify-between gap-3 mb-2.5">
                      <h3 className="text-base font-bold text-white leading-snug line-clamp-1">{note.title}</h3>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {note.isPinned && <Pin size={16} className="text-[#3b82f6]" title="Pinned" />}
                        {note.isFavorite && <Star size={16} className="text-[#f59e0b] fill-[#f59e0b]" title="Favorite" />}
                      </div>
                    </div>

                    {/* Preview Content */}
                    {preview ? (
                      <p className="text-sm font-normal text-white/60 leading-relaxed line-clamp-2 mb-4">{preview}</p>
                    ) : (
                      <p className="text-xs italic text-white/30 mb-4">No content...</p>
                    )}
                  </div>

                  {/* Footer Metadata */}
                  <div className="flex items-center justify-between gap-2 pt-3 border-t border-white/5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1" style={{ backgroundColor: labelCfg.bg, color: labelCfg.color }}>
                        <span>{labelCfg.emoji}</span>
                        <span>{labelCfg.label}</span>
                      </span>
                      {subjCfg && (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/5 text-white/70 truncate">
                          {subjCfg.emoji} {note.subject}
                        </span>
                      )}
                    </div>
                    {/* 7. Clear Timestamp Visibility */}
                    <span className="text-xs font-medium text-white/60 shrink-0">{timeAgo(note.updatedAt)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── 8. Floating Action Button (+) Raised 24px Above Bottom Nav ──────── */}
        {mounted && createPortal(
          <button
            onClick={() => openEditor()}
            className="md:hidden fixed bottom-28 right-6 z-[9999] w-14 h-14 rounded-2xl bg-[#3b82f6] flex items-center justify-center text-white shadow-[0_8px_25px_rgba(59,130,246,0.5)] hover:scale-105 active:scale-95 transition-all"
            aria-label="Create New Note"
          >
            <Plus size={28} strokeWidth={2.5} />
          </button>,
          document.body
        )}

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* EDITOR MODAL                                                     */}
        {/* ════════════════════════════════════════════════════════════════ */}
        {editorOpen && mounted && createPortal(
          <div className="fixed inset-0 z-[99999] bg-black/85 backdrop-blur-2xl flex flex-col p-3 sm:p-6 overflow-hidden">
            <div className="w-full max-w-4xl mx-auto h-full max-h-[92vh] rounded-3xl bg-[#0e0f15] border border-white/10 flex flex-col overflow-hidden shadow-2xl">
              
              {/* Modal Header */}
              <header className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-white/10 bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <button onClick={closeEditor} className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/5 hover:bg-white/10 transition-all text-white/70 hover:text-white">
                    <X size={18} />
                  </button>
                  <span className="text-xs font-semibold text-white/50">
                    {saveStatus === "typing" ? "Typing..." : saveStatus === "saving" ? "Saving..." : saveStatus === "saved" ? "✓ Saved" : ""}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => saveNewNote()}
                    className="px-4 py-2 rounded-xl bg-[#3b82f6] text-white text-xs font-bold hover:bg-[#2563eb] transition-all"
                  >
                    Done
                  </button>
                </div>
              </header>

              {/* Modal Body */}
              <div className="flex-1 p-5 sm:p-6 overflow-y-auto space-y-4">
                <input
                  type="text"
                  value={editorTitle}
                  onChange={(e) => { setEditorTitle(e.target.value); triggerAutoSave(); }}
                  placeholder="Note Title..."
                  className="w-full text-xl sm:text-2xl font-bold bg-transparent text-white placeholder-white/30 focus:outline-none"
                />

                <textarea
                  ref={editorTextareaRef}
                  value={editorContent}
                  onChange={(e) => { setEditorContent(e.target.value); triggerAutoSave(); }}
                  placeholder="Start typing your note here..."
                  className="w-full h-80 bg-transparent text-sm sm:text-base text-white/90 placeholder-white/30 focus:outline-none resize-none leading-relaxed"
                />
              </div>
            </div>
          </div>,
          document.body
        )}
      </main>
    </div>
  );
}
