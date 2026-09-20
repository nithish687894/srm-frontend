"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/lib/store";
import { notesAPI } from "@/lib/api";
import { useNotesStore, type Note, type SortMode, type ViewFilter } from "@/lib/notesStore";
import "./notes.css";
import {
  Plus, Search, StickyNote, Pin, Star, Archive, Trash2, RotateCcw,
  X, ChevronDown, ArrowLeft, Loader2, FileText, CheckSquare,
  Bold, Italic, List, ListOrdered, Code, Quote, Hash, Eye, Edit3,
  Download, Upload, BarChart3, Clock, BookOpen, Sparkles, Check,
  Settings, BookMarked
} from "lucide-react";

// ─── Constants & Configurations ──────────────────────────────────────────────
const LABEL_CONFIG = {
  subject:    { emoji: "📘", label: "Subject",    color: "#3b82f6", bg: "rgba(59,130,246,0.15)" },
  assignment: { emoji: "📝", label: "Assignment", color: "#10b981", bg: "rgba(16,185,129,0.15)" },
  important:  { emoji: "⭐", label: "Important",  color: "#f59e0b", bg: "rgba(245,158,11,0.15)" },
  todo:       { emoji: "🟣", label: "To-Do",      color: "#a855f7", bg: "rgba(168,85,247,0.15)" },
} as const;

const EMOJI_PALETTE = ["📘", "💻", "🌐", "🛡️", "📊", "⚙️", "🧮", "🏗️", "🤖", "⚛️", "🧪", "📖", "🔬", "🎯"];
const COLOR_PALETTE = ["#3b82f6", "#a855f7", "#10b981", "#ef4444", "#f59e0b", "#f97316", "#06b6d4", "#8b5cf6", "#ec4899", "#14b8a6", "#84cc16", "#6366f1"];

/** Dynamic subject metadata resolution */
export function getSubjectMeta(subjectName: string): { emoji: string; color: string } {
  if (!subjectName) return { emoji: "📚", color: "#94a3b8" };
  
  const lower = subjectName.toLowerCase();
  if (lower.includes("math") || lower.includes("calculus") || lower.includes("algebra")) return { emoji: "📐", color: "#3b82f6" };
  if (lower.includes("program") || lower.includes("code") || lower.includes("python") || lower.includes("java") || lower.includes("c++")) return { emoji: "💻", color: "#a855f7" };
  if (lower.includes("network") || lower.includes("cn") || lower.includes("cloud")) return { emoji: "🌐", color: "#10b981" };
  if (lower.includes("cyber") || lower.includes("security") || lower.includes("crypto")) return { emoji: "🛡️", color: "#ef4444" };
  if (lower.includes("dbms") || lower.includes("data") || lower.includes("sql")) return { emoji: "📊", color: "#f59e0b" };
  if (lower.includes("os") || lower.includes("operating")) return { emoji: "⚙️", color: "#f97316" };
  if (lower.includes("dsa") || lower.includes("algorithm") || lower.includes("structure")) return { emoji: "🧮", color: "#06b6d4" };
  if (lower.includes("software") || lower.includes("engineering")) return { emoji: "🏗️", color: "#8b5cf6" };
  if (lower.includes("ai") || lower.includes("machine") || lower.includes("ml")) return { emoji: "🤖", color: "#ec4899" };
  if (lower.includes("physic")) return { emoji: "⚛️", color: "#14b8a6" };
  if (lower.includes("chem")) return { emoji: "🧪", color: "#84cc16" };
  if (lower.includes("english") || lower.includes("comm")) return { emoji: "📖", color: "#6366f1" };

  let hash = 0;
  for (let i = 0; i < subjectName.length; i++) hash = subjectName.charCodeAt(i) + ((hash << 5) - hash);
  const index = Math.abs(hash);
  return {
    emoji: EMOJI_PALETTE[index % EMOJI_PALETTE.length],
    color: COLOR_PALETTE[index % COLOR_PALETTE.length],
  };
}

const SMART_TEMPLATES = [
  { name: "Lecture Notes", emoji: "📘", label: "subject" as const, content: "# Lecture Notes\n\n## Topic\n\n\n## Key Points\n\n- \n- \n\n## Summary\n\n\n## Questions\n\n- " },
  { name: "Assignment", emoji: "📝", label: "assignment" as const, content: "# Assignment\n\n**Subject:** \n**Due Date:** \n\n## Requirements\n\n- [ ] \n- [ ] \n\n## Notes\n\n" },
  { name: "To-do List", emoji: "🟣", label: "todo" as const, content: "# To-do\n\n- [ ] \n- [ ] \n- [ ] " },
  { name: "Exam Prep", emoji: "🎯", label: "important" as const, content: "# Exam Preparation\n\n## Subject: \n## Exam Date: \n\n## Units to Cover\n\n- [ ] Unit 1: \n- [ ] Unit 2: \n\n## Important Topics\n\n1. \n2. " },
  { name: "Lab Report", emoji: "🔬", label: "subject" as const, content: "# Lab Experiment\n\n**Subject:** \n**Date:** \n**Experiment No:** \n\n## Aim\n\n\n## Procedure\n\n1. \n2. \n" },
];

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: "pinned", label: "Pinned first" },
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "az", label: "Title A–Z" },
  { value: "edited", label: "Recently edited" },
];

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

  const { academicData, myTimetable } = useAuthStore();

  const {
    notes, stats, searchQuery, sortMode, viewFilter, activeLabel, activeSubject, syncStatus,
    setNotes, setSearchQuery, setSortMode, setViewFilter, setActiveLabel, setActiveSubject,
    addNote, updateNote, removeNote, togglePin, toggleFavorite, archiveNote, restoreNote,
    syncFromServer, syncStatsFromServer, getFilteredNotes, getSubjects, setSyncStatus,
  } = useNotesStore();

  // ─── Dynamically extract enrolled subjects from Academia Timetable & Attendance ───
  const academiaSubjects = useMemo(() => {
    const set = new Set<string>();

    // 1. From Academia MyTimetable courses
    const courses = myTimetable?.data?.courses || myTimetable?.data || [];
    if (Array.isArray(courses)) {
      courses.forEach((c: AnyValue) => {
        const name = c.courseTitle || c.courseName || c.title || c.subject;
        if (name && typeof name === "string") set.add(name.trim());
      });
    }

    // 2. From Academia Attendance. Master-grid cells are time/slot data, not course names.
    const att = academicData?.attendance;
    if (Array.isArray(att)) {
      att.forEach((a: AnyValue) => {
        const name = a.courseTitle || a.courseName || a.subject;
        if (name && typeof name === "string") set.add(name.trim());
      });
    }

    // 3. From existing saved notes
    const existingNotesSubjects = getSubjects();
    existingNotesSubjects.forEach((s) => {
      if (s && typeof s === "string") set.add(s.trim());
    });

    return Array.from(set);
  }, [myTimetable, academicData, getSubjects]);

  // ─── Local State ────────────────────────────────────────────────────────────
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [editorTitle, setEditorTitle] = useState("");
  const [editorContent, setEditorContent] = useState("");
  const [editorLabel, setEditorLabel] = useState<keyof typeof LABEL_CONFIG>("subject");
  const [editorSubject, setEditorSubject] = useState("");
  const [editorLinkedPage, setEditorLinkedPage] = useState<string | null>(null);
  const [editorCheckItems, setEditorCheckItems] = useState<{ text: string; checked: boolean }[]>([]);
  const [saveStatus, setSaveStatus] = useState<"idle" | "typing" | "saving" | "saved">("idle");
  
  // UI Dropdowns
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoSaveRef = useRef<() => void>(() => {});
  const creatingNoteRef = useRef(false);
  const editorTextareaRef = useRef<HTMLTextAreaElement>(null);

  // ─── Initial Load ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!ready) return;
    syncFromServer().finally(() => setIsInitialLoad(false));
    syncStatsFromServer();
  }, [ready]);

  // ─── Auto Save Handler ──────────────────────────────────────────────────────
  const saveNewNote = useCallback(async () => {
    if ((!editorTitle.trim() && !editorContent.trim()) || creatingNoteRef.current) return;

    creatingNoteRef.current = true;
    setSaveStatus("saving");
    try {
      const res = await notesAPI.create({
        title: editorTitle.trim() || "Untitled Note",
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
        title: editorTitle.trim() || "Untitled Note",
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
    } finally {
      creatingNoteRef.current = false;
    }
  }, [editorTitle, editorContent, editorLabel, editorSubject, editorLinkedPage, editorCheckItems, addNote, setSyncStatus]);

  const autoSave = useCallback(() => {
    if (!editingNote) {
      if (editorTitle.trim() || editorContent.trim()) saveNewNote();
      else setSaveStatus("idle");
      return;
    }
    setSaveStatus("saving");

    const payload = {
      title: editorTitle.trim() || "Untitled Note",
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
  }, [editingNote, editorTitle, editorContent, editorLabel, editorSubject, editorLinkedPage, editorCheckItems, updateNote, saveNewNote]);

  useEffect(() => {
    autoSaveRef.current = autoSave;
  }, [autoSave]);

  const triggerAutoSave = useCallback(() => {
    setSaveStatus("typing");
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => autoSaveRef.current(), 1000);
  }, []);

  // ─── Editor Actions ────────────────────────────────────────────────────────
  const openEditor = (note?: Note) => {
    if (note) {
      setEditingNote(note);
      setEditorTitle(note.title);
      setEditorContent(note.content);
      setEditorLabel(note.label);
      setEditorSubject(note.subject || "");
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
    setSaveStatus("idle");
    setShowTemplates(false);
    setShowMoreMenu(false);
    setEditorOpen(true);
  };

  const closeEditor = () => {
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    if (editorTitle.trim() || editorContent.trim()) {
      autoSaveRef.current();
    }
    setEditorOpen(false);
    setEditingNote(null);
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
        const res = await notesAPI.create({ title, content: text, label: "subject", subject: academiaSubjects[0] || "" });
        if (res.success && res.note) {
          addNote(res.note);
        }
      } catch {
        addNote({
          _id: `local_${Date.now()}`,
          title,
          content: text,
          label: "subject",
          subject: academiaSubjects[0] || "",
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

  const viewLabels: Record<ViewFilter, string> = {
    all: "All notes",
    favorites: "Favorites",
    pinned: "Pinned",
    archived: "Archived",
    trash: "Trash",
  };

  if (!ready) {
    return (
      <div className="min-h-screen bg-[#06070a] text-white selection:bg-[#3b82f6]/30">
        <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 sm:pt-20 pb-36 md:pl-72 lg:pl-80">
          <header className="flex items-center justify-between gap-4 mb-6 min-h-[48px]">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-white/[0.05] shrink-0" />
              <div className="min-w-0">
                <div className="h-8 w-40 rounded-xl bg-white/[0.06]" />
                <div className="h-4 w-32 rounded-lg bg-white/[0.04] mt-2" />
              </div>
            </div>
            <div className="h-10 w-28 rounded-2xl bg-white/[0.06]" />
          </header>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="min-h-[170px] rounded-3xl bg-white/[0.035] border border-white/[0.06] p-5">
                <div className="h-5 w-2/3 rounded-lg bg-white/[0.06]" />
                <div className="h-3 w-full rounded-lg bg-white/[0.04] mt-5" />
                <div className="h-3 w-4/5 rounded-lg bg-white/[0.04] mt-3" />
                <div className="h-8 w-24 rounded-xl bg-white/[0.05] mt-8" />
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="notes-page min-h-screen bg-[#09090F] text-white selection:bg-[#2563eb]/30">
      <main className="notes-main max-w-6xl mx-auto px-5 sm:px-6 pt-20 sm:pt-24 pb-36 md:pl-72 lg:pl-80">

        {/* ── 1. Clean Uncluttered Header ───────────────────────────────────────── */}
        <header className="flex items-start justify-between gap-3 mb-7 min-w-0">
          <div className="flex items-start gap-3 min-w-0">
            <button
              onClick={() => router.push("/dashboard")}
              className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-white/[0.06] transition-colors text-white/60 hover:text-white shrink-0"
              title="Back to Dashboard"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-white leading-9">
                Notes
              </h1>
              <p className="text-xs text-white/45 mt-0.5 whitespace-nowrap">
                {notes.length} {notes.length === 1 ? "note" : "notes"}
                {syncStatus === "syncing" ? " · Syncing" : syncStatus === "offline" || syncStatus === "error" ? " · Offline" : ""}
              </p>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-1 shrink-0">
            {/* New Note CTA Button */}
            {notes.length > 0 && <button
              onClick={() => openEditor()}
              className="notes-create-button px-3 sm:px-4 h-9 rounded-lg bg-[#2563eb] hover:bg-[#1d4ed8] transition-colors text-white font-medium text-xs sm:text-sm shrink-0"
            >
              <Plus size={17} strokeWidth={2.25} aria-hidden="true" />
              <span>New note</span>
            </button>}

            {/* Additional Notes actions */}
            <div className="relative">
              <button
                onClick={() => setShowMoreMenu(!showMoreMenu)}
                className="notes-more-button h-9 rounded-lg hover:bg-white/[0.06] transition-colors text-white/70 hover:text-white shrink-0"
                aria-expanded={showMoreMenu}
              >
                More
                <ChevronDown size={14} aria-hidden="true" />
              </button>

              {showMoreMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowMoreMenu(false)} />
                  <div className="notes-menu absolute right-0 top-full mt-2 w-56 bg-[#0f1117] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden backdrop-blur-2xl py-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
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
        {(notes.length > 0 || searchQuery || viewFilter !== "all" || activeLabel || activeSubject) && <div className="notes-search-filters space-y-4 mb-7">
          {/* Search Bar */}
          <div className="relative w-full">
            <Search size={18} className="absolute left-4.5 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              id="notes-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search title, content or tags..."
              className="w-full pl-12 pr-10 py-3 rounded-lg bg-[#12121A] border border-[#292532] focus:border-[#3b82f6] text-sm text-white placeholder-white/40 focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white p-1">
                <X size={16} />
              </button>
            )}
          </div>

          {/* ── 3. Filters: Large Touch-Friendly Pills ───────────────────────────── */}
          <div className="notes-filter-row">
            <div className="notes-filter-controls">
            {/* View Filter Dropdown Pill */}
            <div className="relative shrink-0">
              <button
                onClick={() => setShowFilterMenu(!showFilterMenu)}
                className="px-3 py-2 rounded-lg bg-[#12121A] border border-[#292532] hover:bg-white/[0.08] transition-colors text-xs font-medium text-white/80 flex items-center gap-2 whitespace-nowrap"
              >
                <span>{viewLabels[viewFilter]}</span>
                <ChevronDown size={14} className="text-white/50" />
              </button>
              {showFilterMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowFilterMenu(false)} />
                  <div className="notes-menu absolute left-0 top-full mt-2 w-52 bg-[#0f1117] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden backdrop-blur-2xl py-1">
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
                className="px-3 py-2 rounded-lg bg-[#12121A] border border-[#292532] hover:bg-white/[0.08] transition-colors text-xs font-medium text-white/80 flex items-center gap-2 whitespace-nowrap"
              >
                <span>Sort</span>
                <ChevronDown size={14} className="text-white/50" />
              </button>
              {showSortMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowSortMenu(false)} />
                  <div className="notes-menu absolute left-0 top-full mt-2 w-48 bg-[#0f1117] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden backdrop-blur-2xl py-1">
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

            </div>
            <div className="notes-label-strip" style={{ scrollbarWidth: "none" }}>
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
                style={activeLabel === key ? { backgroundColor: "rgba(37,99,235,0.18)", color: "#c7d9ff", fontWeight: 600 } : { backgroundColor: "rgba(255,255,255,0.02)", color: "rgba(255,255,255,0.6)" }}
              >
                <span>{cfg.label}</span>
              </button>
            ))}

            {/* Dynamic Academia Timetable Subjects Chips */}
            {getSubjects().length > 0 && (
              <>
                <div className="w-px h-6 bg-white/10 mx-1 shrink-0" />
                {getSubjects().map((subj) => {
                  const isSel = activeSubject === subj;
                  return (
                    <button
                      key={subj}
                      onClick={() => setActiveSubject(isSel ? null : subj)}
                      className="px-4 py-2.5 rounded-full text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5"
                      style={isSel ? { backgroundColor: "rgba(37,99,235,0.18)", color: "#c7d9ff", fontWeight: 600 } : { backgroundColor: "rgba(255,255,255,0.02)", color: "rgba(255,255,255,0.6)" }}
                    >
                      <span>{subj}</span>
                    </button>
                  );
                })}
              </>
            )}
            </div>
          </div>
        </div>}

        {/* ── Taller Note Cards with Metadata & Quick Actions ───────────────────── */}
        {isInitialLoad ? (
          <div className="flex flex-col items-center justify-center py-20 text-white/40 gap-3">
            <Loader2 className="animate-spin text-[#3b82f6]" size={36} />
            <span className="text-xs font-bold uppercase tracking-widest text-white/60">Loading notes...</span>
          </div>
        ) : filteredNotes.length === 0 ? (
          /* ── Empty State Layout ───────────────────────────────────────── */
          <div className="notes-empty py-16 px-5 text-center max-w-md mx-auto">
            <div className="w-12 h-12 rounded-xl bg-[#12121A] border border-[#292532] flex items-center justify-center text-white/50 mx-auto mb-5">
              <FileText size={23} />
            </div>
            <h3 className="text-lg font-bold text-white mb-1.5">
              {searchQuery ? "No matching notes" : viewFilter !== "all" || activeLabel || activeSubject ? "No notes in this view" : "Your notes start here"}
            </h3>
            <p className="text-xs text-white/50 mb-6 leading-relaxed">
              {searchQuery || viewFilter !== "all" || activeLabel || activeSubject ? "Try another search or filter." : "Keep lecture notes, assignments, and ideas together."}
            </p>

            {notes.length === 0 && <button onClick={() => openEditor()} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#2563eb] hover:bg-[#1d4ed8] text-sm font-medium text-white transition-colors"><Plus size={16} /> Create a note</button>}
          </div>
        ) : (
          <div className="notes-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredNotes.map((note) => {
              const labelCfg = LABEL_CONFIG[note.label] || LABEL_CONFIG.subject;
              const preview = note.content.replace(/[#*`>\-\[\]]/g, "").trim().slice(0, 100);

              return (
                <div
                  key={note._id}
                  onClick={() => openEditor(note)}
                  className="notes-card group relative p-5 rounded-xl bg-[#12121A] border border-[#292532] hover:border-white/20 transition-colors cursor-pointer flex flex-col justify-between min-h-[140px]"
                >
                  <div>
                    {/* Header: Title + Pin/Star Icons */}
                    <div className="flex items-start justify-between gap-3 mb-2.5">
                      <h3 className="text-base font-bold text-white leading-snug line-clamp-1 flex-1">{note.title}</h3>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={(e) => { e.stopPropagation(); togglePin(note._id); }}
                          className={`p-1 rounded-lg hover:bg-white/10 transition-colors ${note.isPinned ? "text-[#3b82f6]" : "text-white/30 hover:text-white"}`}
                          title={note.isPinned ? "Unpin note" : "Pin note"}
                        >
                          <Pin size={16} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleFavorite(note._id); }}
                          className={`p-1 rounded-lg hover:bg-white/10 transition-colors ${note.isFavorite ? "text-[#f59e0b] fill-[#f59e0b]" : "text-white/30 hover:text-white"}`}
                          title={note.isFavorite ? "Unfavorite" : "Favorite"}
                        >
                          <Star size={16} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(note); }}
                          className="p-1 rounded-lg text-white/20 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Delete note"
                        >
                          <Trash2 size={15} />
                        </button>
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
                      <span className="text-[11px] font-medium text-white/50 flex items-center gap-1">
                        <span>{labelCfg.label}</span>
                      </span>
                      {note.subject && (
                        <span className="text-[11px] text-white/50 truncate flex items-center gap-1">
                          <span>·</span>
                          <span>{note.subject}</span>
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-medium text-white/60 shrink-0">{timeAgo(note.updatedAt)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* STATISTICS MODAL                                                 */}
        {/* ════════════════════════════════════════════════════════════════ */}
        {showStatsModal && mounted && createPortal(
          <div className="notes-stats-overlay fixed inset-0 z-[99999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="notes-stats-panel w-full max-w-md bg-[#0e0f15] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-[#3b82f6]/15 text-[#3b82f6] flex items-center justify-center">
                    <BarChart3 size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Notes Insights</h3>
                    <p className="text-xs text-white/50">Usage and study activity breakdown</p>
                  </div>
                </div>
                <button onClick={() => setShowStatsModal(false)} className="text-white/40 hover:text-white p-1">
                  <X size={20} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 text-center">
                  <span className="text-2xl font-black text-white block">{notes.filter(n => !n.archivedAt && !n.deletedAt).length}</span>
                  <span className="text-xs text-white/50 font-medium">Active Notes</span>
                </div>
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 text-center">
                  <span className="text-2xl font-black text-[#3b82f6] block">{notes.filter(n => n.isPinned).length}</span>
                  <span className="text-xs text-white/50 font-medium">Pinned Notes</span>
                </div>
              </div>

              <div className="notes-stats-breakdown space-y-2 pt-2 border-t border-white/5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-white/60">Category Breakdown</h4>
                {Object.entries(LABEL_CONFIG).map(([key, cfg]) => {
                  const count = notes.filter(n => n.label === key && !n.archivedAt && !n.deletedAt).length;
                  return (
                    <div key={key} className="flex items-center justify-between py-1.5 px-3 rounded-xl bg-white/[0.02]">
                      <span className="text-xs text-white/80 flex items-center gap-2">
                        <span>{cfg.label}</span>
                      </span>
                      <span className="text-xs font-bold text-white">{count}</span>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={() => setShowStatsModal(false)}
                className="w-full py-3 rounded-2xl bg-[#3b82f6] text-white text-xs font-bold hover:bg-[#2563eb] transition-all"
              >
                Close Insights
              </button>
            </div>
          </div>,
          document.body
        )}

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* EDITOR MODAL WITH ACADEMIA SUBJECT SELECTOR                      */}
        {/* ════════════════════════════════════════════════════════════════ */}
        {editorOpen && mounted && createPortal(
          <div className="notes-editor-overlay fixed inset-0 z-[99999] bg-black/85 backdrop-blur-2xl flex flex-col p-3 sm:p-6 overflow-hidden">
            <div className="notes-editor-panel w-full max-w-4xl mx-auto h-full max-h-[92vh] rounded-3xl bg-[#0e0f15] border border-white/10 flex flex-col overflow-hidden shadow-2xl" role="dialog" aria-modal="true" aria-label={editingNote ? "Edit note" : "New note"}>
              
              {/* Modal Header */}
              <header className="notes-editor-header shrink-0 flex items-center justify-between px-5 py-4 border-b border-white/10 bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <button onClick={closeEditor} aria-label="Close note editor" className="notes-editor-close w-9 h-9 rounded-xl flex items-center justify-center bg-white/5 hover:bg-white/10 transition-all text-white/70 hover:text-white">
                    <X size={18} />
                  </button>
                  <span className="notes-save-status text-xs font-semibold text-white/50" aria-live="polite">
                    {saveStatus === "typing" ? "Typing..." : saveStatus === "saving" ? "Saving..." : saveStatus === "saved" ? "✓ Saved" : ""}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={closeEditor}
                    className="notes-editor-done px-4 py-2 rounded-xl bg-[#3b82f6] text-white text-xs font-bold hover:bg-[#2563eb] transition-all"
                  >
                    Done
                  </button>
                </div>
              </header>

              {/* Modal Body */}
              <div className="notes-editor-body flex-1 p-5 sm:p-6 overflow-y-auto space-y-4">
                <input
                  type="text"
                  value={editorTitle}
                  onChange={(e) => { setEditorTitle(e.target.value); triggerAutoSave(); }}
                  placeholder="Note Title..."
                  aria-label="Note title"
                  className="notes-editor-title w-full text-xl sm:text-2xl font-bold bg-transparent text-white placeholder-white/30 focus:outline-none"
                />

                {/* Academia Subject & Category Picker */}
                <div className="notes-editor-meta flex flex-wrap items-center gap-2.5 pb-2 border-b border-white/5">
                  {/* Category Label Selector */}
                  <div className="notes-category-picker flex items-center gap-1 bg-white/[0.03] p-1 rounded-2xl border border-white/5" role="group" aria-label="Note category">
                    {Object.entries(LABEL_CONFIG).map(([key, cfg]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => { setEditorLabel(key as keyof typeof LABEL_CONFIG); triggerAutoSave(); }}
                        className={`notes-category-option px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 ${editorLabel === key ? "is-selected bg-[#3b82f6] text-white font-bold shadow-md" : "text-white/60 hover:text-white"}`}
                        aria-pressed={editorLabel === key}
                      >
                        <span>{cfg.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Academia Subject Dropdown Selector */}
                  <label className="notes-subject-picker relative flex items-center gap-1.5 bg-white/[0.03] px-3 py-1.5 rounded-2xl border border-white/5">
                    <BookMarked size={16} className="text-white/50" />
                    <span className="text-xs text-white/50 font-medium">Course</span>
                    <select
                      value={editorSubject}
                      onChange={(e) => { setEditorSubject(e.target.value); triggerAutoSave(); }}
                      className="notes-subject-select bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer pr-2"
                    >
                      <option value="" className="bg-[#0e0f15] text-white">No course</option>
                      {academiaSubjects.map((s) => (
                        <option key={s} value={s} className="bg-[#0e0f15] text-white">
                          {s}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <textarea
                  ref={editorTextareaRef}
                  value={editorContent}
                  onChange={(e) => { setEditorContent(e.target.value); triggerAutoSave(); }}
                  placeholder="Start typing your note here..."
                  aria-label="Note content"
                  className="notes-editor-content w-full h-72 bg-transparent text-sm sm:text-base text-white/90 placeholder-white/30 focus:outline-none resize-none leading-relaxed"
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
