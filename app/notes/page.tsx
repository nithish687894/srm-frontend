"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { notesAPI } from "@/lib/api";
import { useNotesStore, type Note, type SortMode, type ViewFilter } from "@/lib/notesStore";
import {
  Plus, Search, StickyNote, Pin, Star, Archive, Trash2, RotateCcw,
  X, ChevronDown, ArrowLeft, Loader2, FileText, CheckSquare,
  Bold, Italic, List, ListOrdered, Code, Quote, Hash, Eye, Edit3,
  Download, Upload, BarChart3, Clock, BookOpen, Cpu, Globe, Shield,
  Bookmark, Filter, SortAsc, Sparkles, Check, AlertCircle
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────
const LABEL_CONFIG = {
  subject:    { emoji: "📘", label: "Subject",    color: "#00d4ff", bg: "rgba(0,212,255,0.12)" },
  assignment: { emoji: "📝", label: "Assignment", color: "#00ff88", bg: "rgba(0,255,136,0.12)" },
  important:  { emoji: "⭐", label: "Important",  color: "#FFCC00", bg: "rgba(255,204,0,0.12)" },
  todo:       { emoji: "✔",  label: "To-do",      color: "#bf00ff", bg: "rgba(191,0,255,0.12)" },
} as const;

const SUBJECT_CONFIG: Record<string, { emoji: string; color: string }> = {
  "Maths":            { emoji: "📘", color: "#4A90D9" },
  "Programming":      { emoji: "💻", color: "#A855F7" },
  "CN":               { emoji: "🌐", color: "#22C55E" },
  "Cyber Security":   { emoji: "🛡", color: "#EF4444" },
  "DBMS":             { emoji: "📊", color: "#F59E0B" },
  "OS":               { emoji: "⚙️", color: "#F97316" },
  "DSA":              { emoji: "🧮", color: "#06B6D4" },
  "Software Engg":    { emoji: "🏗", color: "#8B5CF6" },
  "AI/ML":            { emoji: "🤖", color: "#EC4899" },
  "Physics":          { emoji: "⚛️", color: "#14B8A6" },
  "Chemistry":        { emoji: "🧪", color: "#84CC16" },
  "English":          { emoji: "📖", color: "#6366F1" },
};

const SMART_TEMPLATES = [
  { name: "Lecture Notes", emoji: "📘", label: "subject" as const, content: "# Lecture Notes\n\n## Topic\n\n\n## Key Points\n\n- \n- \n\n## Summary\n\n\n## Questions\n\n- " },
  { name: "Assignment", emoji: "📝", label: "assignment" as const, content: "# Assignment\n\n**Subject:** \n**Due Date:** \n\n## Requirements\n\n- [ ] \n- [ ] \n- [ ] \n\n## Notes\n\n\n## References\n\n- " },
  { name: "To-do List", emoji: "✔", label: "todo" as const, content: "# To-do\n\n- [ ] \n- [ ] \n- [ ] \n- [ ] \n- [ ] " },
  { name: "Exam Prep", emoji: "🎯", label: "important" as const, content: "# Exam Preparation\n\n## Subject: \n## Exam Date: \n\n## Units to Cover\n\n- [ ] Unit 1: \n- [ ] Unit 2: \n- [ ] Unit 3: \n- [ ] Unit 4: \n- [ ] Unit 5: \n\n## Important Topics\n\n1. \n2. \n3. \n\n## Formulas / Key Points\n\n```\n\n```\n\n## Previous Year Questions\n\n- " },
  { name: "Lab Report", emoji: "🔬", label: "subject" as const, content: "# Lab Experiment\n\n**Subject:** \n**Date:** \n**Experiment No:** \n\n## Aim\n\n\n## Apparatus Required\n\n- \n\n## Procedure\n\n1. \n2. \n3. \n\n## Observations\n\n| S.No | Parameter | Value |\n|------|-----------|-------|\n| 1    |           |       |\n\n## Result\n\n\n## Inference\n\n" },
  { name: "Meeting Notes", emoji: "🤝", label: "subject" as const, content: "# Meeting Notes\n\n**Date:** \n**Attendees:** \n\n## Agenda\n\n- \n\n## Discussion\n\n\n## Action Items\n\n- [ ] \n- [ ] \n\n## Next Meeting\n\n" },
];

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: "pinned", label: "Pinned First" },
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "az", label: "A → Z" },
  { value: "edited", label: "Recently Edited" },
];

const LINKED_PAGES = [
  { value: null, label: "None" },
  { value: "attendance", label: "📋 Attendance" },
  { value: "marks", label: "📊 Marks" },
  { value: "timetable", label: "🕒 Timetable" },
  { value: "dashboard", label: "🏠 Dashboard" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function readingTime(words: number): string {
  const mins = Math.ceil(words / 200);
  return mins < 1 ? "< 1 min read" : `${mins} min read`;
}

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function renderMarkdownPreview(md: string): string {
  let html = md
    .replace(/^### (.+)$/gm, '<h3 class="text-xs font-black text-white/90 mt-2 mb-1">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-sm font-black text-white/90 mt-2 mb-1">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-base font-black text-white mt-2 mb-1">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-white">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em class="italic text-white/80">$1</em>')
    .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-white/10 text-[#00d4ff] text-[10px] font-mono">$1</code>')
    .replace(/^- \[x\] (.+)$/gm, '<div class="flex items-center gap-2 my-0.5"><div class="w-3.5 h-3.5 rounded border border-[#00ff88] bg-[#00ff88]/20 flex items-center justify-center"><svg class="w-2.5 h-2.5 text-[#00ff88]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg></div><span class="text-white/50 line-through text-xs">$1</span></div>')
    .replace(/^- \[ \] (.+)$/gm, '<div class="flex items-center gap-2 my-0.5"><div class="w-3.5 h-3.5 rounded border border-white/20"></div><span class="text-white/80 text-xs">$1</span></div>')
    .replace(/^- (.+)$/gm, '<div class="flex items-start gap-2 my-0.5"><span class="text-white/30 mt-0.5">•</span><span class="text-white/80 text-xs">$1</span></div>')
    .replace(/^\d+\. (.+)$/gm, '<div class="text-white/80 text-xs my-0.5 pl-4">$1</div>')
    .replace(/^> (.+)$/gm, '<blockquote class="border-l-2 border-[#00d4ff]/40 pl-3 my-1 text-white/60 text-xs italic">$1</blockquote>')
    .replace(/```([\s\S]*?)```/g, '<pre class="bg-white/5 rounded-lg p-3 my-2 overflow-x-auto"><code class="text-[10px] font-mono text-[#00d4ff]">$1</code></pre>')
    .replace(/\n{2,}/g, '<div class="h-2"></div>')
    .replace(/\n/g, '<br/>');

  // Tables
  html = html.replace(
    /\|(.+)\|\n\|[-| ]+\|\n((?:\|.+\|\n?)+)/g,
    (_, header, body) => {
      const headers = header.split("|").map((h: string) => h.trim()).filter(Boolean);
      const rows = body.trim().split("\n").map((row: string) =>
        row.split("|").map((c: string) => c.trim()).filter(Boolean)
      );
      return `<table class="w-full text-[10px] my-2 border-collapse"><thead><tr>${headers.map((h: string) => `<th class="border border-white/10 px-2 py-1 text-left text-white/70 bg-white/5">${h}</th>`).join("")}</tr></thead><tbody>${rows.map((row: string[]) => `<tr>${row.map((c: string) => `<td class="border border-white/10 px-2 py-1 text-white/60">${c}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
    }
  );

  return html;
}

// ─── Page Component ───────────────────────────────────────────────────────────
export default function NotesPage() {
  const { ready } = useAuth();
  const router = useRouter();

  const {
    notes, stats, searchQuery, sortMode, viewFilter, activeLabel, activeSubject, syncStatus,
    setNotes, setSearchQuery, setSortMode, setViewFilter, setActiveLabel, setActiveSubject,
    addNote, updateNote, removeNote, togglePin, toggleFavorite, archiveNote, restoreNote,
    syncFromServer, syncStatsFromServer, getFilteredNotes, getSubjects, setSyncStatus,
  } = useNotesStore();

  // ─── Editor State ─────────────────────────────────────────────────────
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [editorTitle, setEditorTitle] = useState("");
  const [editorContent, setEditorContent] = useState("");
  const [editorLabel, setEditorLabel] = useState<keyof typeof LABEL_CONFIG>("subject");
  const [editorSubject, setEditorSubject] = useState("");
  const [editorLinkedPage, setEditorLinkedPage] = useState<string | null>(null);
  const [editorCheckItems, setEditorCheckItems] = useState<{ text: string; checked: boolean }[]>([]);
  const [editorMode, setEditorMode] = useState<"edit" | "preview" | "reading">("edit");
  const [saveStatus, setSaveStatus] = useState<"idle" | "typing" | "saving" | "saved">("idle");
  const [showTemplates, setShowTemplates] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showSubjectPicker, setShowSubjectPicker] = useState(false);
  const [customSubject, setCustomSubject] = useState("");
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const editorTextareaRef = useRef<HTMLTextAreaElement>(null);

  // ─── Load Notes on Mount ──────────────────────────────────────────────
  useEffect(() => {
    if (!ready) return;
    syncFromServer().finally(() => setIsInitialLoad(false));
    syncStatsFromServer();
  }, [ready]);

  // ─── Auto-save (1s debounce) ──────────────────────────────────────────
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
  }, [editingNote, editorTitle, editorContent, editorLabel, editorSubject, editorLinkedPage, editorCheckItems]);

  const triggerAutoSave = useCallback(() => {
    setSaveStatus("typing");
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(autoSave, 1000);
  }, [autoSave]);

  // ─── Editor Open / Close ──────────────────────────────────────────────
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

  // ─── Markdown Toolbar ─────────────────────────────────────────────────
  const insertMarkdown = (before: string, after: string = "") => {
    const ta = editorTextareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = editorContent.slice(start, end);
    const newContent = editorContent.slice(0, start) + before + selected + after + editorContent.slice(end);
    setEditorContent(newContent);
    triggerAutoSave();
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(start + before.length, start + before.length + selected.length);
    }, 0);
  };

  // ─── Delete Handler ───────────────────────────────────────────────────
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

  // ─── Export ───────────────────────────────────────────────────────────
  const exportNote = (note: Note, format: "md" | "txt") => {
    const content = format === "md"
      ? `# ${note.title}\n\n${note.content}`
      : `${note.title}\n${"=".repeat(note.title.length)}\n\n${note.content.replace(/[#*`>\-\[\]]/g, "")}`;

    const blob = new Blob([content], { type: format === "md" ? "text/markdown" : "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${note.title.replace(/[^a-zA-Z0-9]/g, "_")}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ─── Import ───────────────────────────────────────────────────────────
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
          color: "#00d4ff",
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
    e.target.value = "";
  };

  // ─── Keyboard Shortcuts ───────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "n" && !editorOpen) { e.preventDefault(); openEditor(); }
        if (e.key === "f" && !editorOpen) { e.preventDefault(); document.getElementById("notes-search")?.focus(); }
        if (e.key === "s" && editorOpen && editingNote) { e.preventDefault(); autoSave(); }
      }
      if (e.key === "Escape" && editorOpen) closeEditor();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [editorOpen, editingNote, autoSave]);

  // ─── Computed ─────────────────────────────────────────────────────────
  const filteredNotes = getFilteredNotes();
  const subjects = getSubjects();
  const wc = editorContent ? wordCount(editorContent) : 0;

  const viewLabels: Record<ViewFilter, string> = {
    all: "All Notes",
    favorites: "⭐ Favorites",
    pinned: "📌 Pinned",
    archived: "📦 Archived",
    trash: "🗑 Trash",
  };

  if (!ready) {
    return (
      <div className="min-h-screen bg-[#050507] flex flex-col items-center justify-center text-white/50 gap-4">
        <Loader2 className="animate-spin text-[#00d4ff]" size={40} />
        <p className="text-xs uppercase tracking-widest font-black">Loading Notes...</p>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0c] via-[#050507] to-[#020203] text-white">
      <main className="max-w-7xl mx-auto px-4 pt-20 md:pt-24 pb-32 md:pl-[320px]">

        {/* ── Header ─────────────────────────────────────────────────── */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/dashboard")} className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-white/70 hover:text-white shrink-0">
              <ArrowLeft size={16} />
            </button>
            <div>
              <h1 className="text-lg md:text-xl font-black uppercase tracking-wider flex items-center gap-2">
                <StickyNote size={20} className="text-[#FFCC00]" />
                My Notes
                <Sparkles size={14} className="text-[#00d4ff] animate-pulse" />
              </h1>
              <p className="text-[10px] text-white/40 font-medium mt-0.5">
                {syncStatus === "synced" && <span className="text-green-400">🟢 Synced</span>}
                {syncStatus === "syncing" && <span className="text-yellow-400">🟡 Syncing...</span>}
                {syncStatus === "offline" && <span className="text-orange-400">🟠 Working offline</span>}
                {syncStatus === "error" && <span className="text-red-400">🔴 Sync error</span>}
                {" · "}{filteredNotes.length} notes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Stats Button */}
            <button onClick={() => { syncStatsFromServer(); setShowStatsModal(true); }} className="px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-all text-[10px] font-bold text-white/60 uppercase tracking-wider flex items-center gap-1.5">
              <BarChart3 size={12} /> Stats
            </button>

            {/* Import */}
            <label className="px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-all text-[10px] font-bold text-white/60 uppercase tracking-wider flex items-center gap-1.5 cursor-pointer">
              <Upload size={12} /> Import
              <input type="file" accept=".md,.txt" onChange={handleImport} className="hidden" />
            </label>

            {/* Templates */}
            <div className="relative">
              <button onClick={() => setShowTemplates(!showTemplates)} className="px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-all text-[10px] font-bold text-white/60 uppercase tracking-wider flex items-center gap-1.5">
                <FileText size={12} /> Templates
              </button>
              {showTemplates && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-[#141418] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden">
                  {SMART_TEMPLATES.map((t) => (
                    <button key={t.name} onClick={() => openFromTemplate(t)} className="w-full px-4 py-3 text-left hover:bg-white/5 transition-all flex items-center gap-3 border-b border-white/5 last:border-0">
                      <span className="text-lg">{t.emoji}</span>
                      <div>
                        <p className="text-xs font-bold text-white/90">{t.name}</p>
                        <p className="text-[9px] text-white/40">{LABEL_CONFIG[t.label].label}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* New Note FAB */}
            <button onClick={() => openEditor()} className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#00d4ff] to-[#00b2fe] hover:scale-105 active:scale-95 transition-all text-black font-black uppercase tracking-wider text-[10px] flex items-center gap-1.5 shadow-[0_0_20px_rgba(0,212,255,0.25)]">
              <Plus size={14} strokeWidth={3} /> New Note
            </button>
          </div>
        </header>

        {/* ── Search + Filters Bar ────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              id="notes-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes... (title: subject: label: pinned favorite today)"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#00d4ff]/40 focus:ring-1 focus:ring-[#00d4ff]/20 transition-all font-medium"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white">
                <X size={12} />
              </button>
            )}
          </div>

          {/* View Filter */}
          <div className="relative">
            <button onClick={() => setShowFilterMenu(!showFilterMenu)} className="px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-all text-[10px] font-bold text-white/60 uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap">
              <Filter size={12} /> {viewLabels[viewFilter]} <ChevronDown size={10} />
            </button>
            {showFilterMenu && (
              <div className="absolute right-0 top-full mt-2 w-44 bg-[#141418] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden">
                {(Object.keys(viewLabels) as ViewFilter[]).map((f) => (
                  <button key={f} onClick={() => { setViewFilter(f); setShowFilterMenu(false); }} className={`w-full px-4 py-2.5 text-left text-xs font-medium transition-all flex items-center justify-between ${viewFilter === f ? "bg-[#00d4ff]/10 text-[#00d4ff]" : "text-white/60 hover:bg-white/5"}`}>
                    {viewLabels[f]}
                    {viewFilter === f && <Check size={12} />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sort */}
          <div className="relative">
            <button onClick={() => setShowSortMenu(!showSortMenu)} className="px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-all text-[10px] font-bold text-white/60 uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap">
              <SortAsc size={12} /> Sort <ChevronDown size={10} />
            </button>
            {showSortMenu && (
              <div className="absolute right-0 top-full mt-2 w-44 bg-[#141418] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden">
                {SORT_OPTIONS.map((opt) => (
                  <button key={opt.value} onClick={() => { setSortMode(opt.value); setShowSortMenu(false); }} className={`w-full px-4 py-2.5 text-left text-xs font-medium transition-all flex items-center justify-between ${sortMode === opt.value ? "bg-[#00d4ff]/10 text-[#00d4ff]" : "text-white/60 hover:bg-white/5"}`}>
                    {opt.label}
                    {sortMode === opt.value && <Check size={12} />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Label Chips ────────────────────────────────────────────── */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-none" style={{ scrollbarWidth: "none" }}>
          <button onClick={() => setActiveLabel(null)} className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all border ${!activeLabel ? "bg-white/10 border-white/20 text-white" : "bg-white/[0.02] border-white/5 text-white/40 hover:bg-white/5"}`}>
            All
          </button>
          {Object.entries(LABEL_CONFIG).map(([key, cfg]) => (
            <button key={key} onClick={() => setActiveLabel(activeLabel === key ? null : key)} className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all border flex items-center gap-1 ${activeLabel === key ? `border-[${cfg.color}]/40 text-[${cfg.color}]` : "bg-white/[0.02] border-white/5 text-white/40 hover:bg-white/5"}`} style={activeLabel === key ? { backgroundColor: cfg.bg, borderColor: `${cfg.color}40`, color: cfg.color } : {}}>
              {cfg.emoji} {cfg.label}
            </button>
          ))}
          {subjects.length > 0 && (
            <>
              <div className="w-px bg-white/10 mx-1" />
              {subjects.slice(0, 5).map((subj) => {
                const sc = SUBJECT_CONFIG[subj] || { emoji: "📚", color: "#888" };
                return (
                  <button key={subj} onClick={() => setActiveSubject(activeSubject === subj ? null : subj)} className="px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all border bg-white/[0.02] border-white/5 text-white/40 hover:bg-white/5 flex items-center gap-1" style={activeSubject === subj ? { backgroundColor: `${sc.color}15`, borderColor: `${sc.color}40`, color: sc.color } : {}}>
                    {sc.emoji} {subj}
                  </button>
                );
              })}
            </>
          )}
        </div>

        {/* ── Notes Grid ─────────────────────────────────────────────── */}
        {isInitialLoad ? (
          <div className="flex flex-col items-center justify-center py-20 text-white/30 gap-3">
            <Loader2 className="animate-spin text-[#00d4ff]" size={32} />
            <span className="text-[10px] font-black uppercase tracking-widest">Loading your notes...</span>
          </div>
        ) : filteredNotes.length === 0 ? (
          /* ── Empty State ──────────────────────────────────────────── */
          <div className="flex flex-col items-center justify-center py-16 text-center max-w-md mx-auto">
            <div className="w-20 h-20 rounded-3xl bg-[#FFCC00]/10 border border-[#FFCC00]/20 flex items-center justify-center text-[#FFCC00] mb-6 shadow-[0_0_30px_rgba(255,204,0,0.1)] animate-pulse">
              <StickyNote size={36} />
            </div>
            <h3 className="text-sm font-black uppercase tracking-wider text-white mb-2">
              {searchQuery ? "No matching notes" : viewFilter !== "all" ? `No ${viewFilter} notes` : "Start Your Academic Journal"}
            </h3>
            <p className="text-[11px] text-white/40 mb-8 leading-relaxed">
              {searchQuery ? "Try a different search term" : "Create your first note or pick a template to get started. Your notes sync across devices."}
            </p>
            {!searchQuery && viewFilter === "all" && (
              <div className="w-full grid grid-cols-2 sm:grid-cols-3 gap-3">
                {SMART_TEMPLATES.slice(0, 6).map((t) => (
                  <button key={t.name} onClick={() => openFromTemplate(t)} className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.05] hover:border-white/10 transition-all text-left group">
                    <span className="text-2xl block mb-2">{t.emoji}</span>
                    <p className="text-[10px] font-bold text-white/80 group-hover:text-white">{t.name}</p>
                    <p className="text-[8px] text-white/30 mt-0.5">{LABEL_CONFIG[t.label].label}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredNotes.map((note) => {
              const labelCfg = LABEL_CONFIG[note.label] || LABEL_CONFIG.subject;
              const subjCfg = SUBJECT_CONFIG[note.subject] || null;
              const completedChecks = note.checkItems?.filter(c => c.checked).length || 0;
              const totalChecks = note.checkItems?.length || 0;
              const preview = note.content.replace(/[#*`>\-\[\]]/g, "").trim().slice(0, 120);

              return (
                <div
                  key={note._id}
                  onClick={() => openEditor(note)}
                  className="group relative p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] hover:border-white/10 transition-all cursor-pointer active:scale-[0.98]"
                  style={{ borderLeftColor: labelCfg.color, borderLeftWidth: "3px" }}
                >
                  {/* Top Row */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-xs font-black text-white/90 leading-tight line-clamp-2 flex-1">{note.title}</h3>
                    <div className="flex items-center gap-1 shrink-0">
                      {note.isPinned && <Pin size={10} className="text-[#00d4ff]" />}
                      {note.isFavorite && <Star size={10} className="text-[#FFCC00] fill-[#FFCC00]" />}
                    </div>
                  </div>

                  {/* Preview */}
                  {preview && (
                    <p className="text-[10px] text-white/40 leading-relaxed line-clamp-2 mb-3">{preview}</p>
                  )}

                  {/* Checklist progress */}
                  {totalChecks > 0 && (
                    <div className="mb-3">
                      <div className="flex items-center gap-2 mb-1">
                        <CheckSquare size={10} className="text-white/30" />
                        <span className="text-[9px] font-bold text-white/40">{completedChecks}/{totalChecks} tasks</span>
                      </div>
                      <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-[#00d4ff] to-[#00ff88] transition-all" style={{ width: `${totalChecks > 0 ? (completedChecks / totalChecks) * 100 : 0}%` }} />
                      </div>
                    </div>
                  )}

                  {/* Bottom Row */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider" style={{ backgroundColor: labelCfg.bg, color: labelCfg.color }}>
                        {labelCfg.emoji} {labelCfg.label}
                      </span>
                      {subjCfg && (
                        <span className="px-2 py-0.5 rounded-full text-[8px] font-bold bg-white/5 text-white/50 truncate">
                          {subjCfg.emoji} {note.subject}
                        </span>
                      )}
                    </div>
                    <span className="text-[8px] font-bold text-white/20 whitespace-nowrap">{timeAgo(note.updatedAt)}</span>
                  </div>

                  {/* Quick actions (visible on hover) */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    <button onClick={(e) => { e.stopPropagation(); togglePin(note._id); }} className="w-6 h-6 rounded-full bg-black/60 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all" title="Pin">
                      <Pin size={9} className={note.isPinned ? "text-[#00d4ff]" : "text-white/40"} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); toggleFavorite(note._id); }} className="w-6 h-6 rounded-full bg-black/60 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all" title="Favorite">
                      <Star size={9} className={note.isFavorite ? "text-[#FFCC00] fill-[#FFCC00]" : "text-white/40"} />
                    </button>
                    {viewFilter === "trash" ? (
                      <button onClick={(e) => { e.stopPropagation(); restoreNote(note._id); }} className="w-6 h-6 rounded-full bg-black/60 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all" title="Restore">
                        <RotateCcw size={9} className="text-green-400" />
                      </button>
                    ) : viewFilter === "archived" ? (
                      <button onClick={(e) => { e.stopPropagation(); restoreNote(note._id); }} className="w-6 h-6 rounded-full bg-black/60 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all" title="Unarchive">
                        <RotateCcw size={9} className="text-green-400" />
                      </button>
                    ) : (
                      <button onClick={(e) => { e.stopPropagation(); archiveNote(note._id); }} className="w-6 h-6 rounded-full bg-black/60 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all" title="Archive">
                        <Archive size={9} className="text-white/40" />
                      </button>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(note); }} className="w-6 h-6 rounded-full bg-black/60 border border-white/10 flex items-center justify-center hover:bg-red-500/20 transition-all" title="Delete">
                      <Trash2 size={9} className="text-red-400/60" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Mobile FAB ─────────────────────────────────────────────── */}
        <button onClick={() => openEditor()} className="md:hidden fixed bottom-24 right-4 z-40 w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#00d4ff] to-[#00b2fe] flex items-center justify-center text-black shadow-[0_4px_20px_rgba(0,212,255,0.4)] hover:scale-110 active:scale-95 transition-all">
          <Plus size={24} strokeWidth={2.5} />
        </button>

        {/* ════════════════════════════════════════════════════════════ */}
        {/* EDITOR MODAL                                                */}
        {/* ════════════════════════════════════════════════════════════ */}
        {editorOpen && (
          <div className="fixed inset-0 z-[9999] bg-[#0a0a0c]/95 backdrop-blur-xl flex flex-col">
            {/* Editor Header */}
            <header className="shrink-0 flex items-center justify-between px-4 md:px-8 py-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-3">
                <button onClick={closeEditor} className="w-9 h-9 rounded-full flex items-center justify-center bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-white/70">
                  <X size={16} />
                </button>
                <div className="flex items-center gap-2">
                  {/* Save Status */}
                  <span className={`text-[9px] font-bold uppercase tracking-widest ${saveStatus === "typing" ? "text-yellow-400" : saveStatus === "saving" ? "text-[#00d4ff] animate-pulse" : saveStatus === "saved" ? "text-green-400" : "text-white/20"}`}>
                    {saveStatus === "typing" ? "Typing..." : saveStatus === "saving" ? "Saving..." : saveStatus === "saved" ? "✓ Saved" : ""}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Mode Toggle */}
                <div className="flex items-center rounded-xl bg-white/[0.03] border border-white/[0.06] overflow-hidden">
                  {(["edit", "preview", "reading"] as const).map((mode) => (
                    <button key={mode} onClick={() => setEditorMode(mode)} className={`px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider transition-all ${editorMode === mode ? "bg-white/10 text-white" : "text-white/40 hover:text-white/60"}`}>
                      {mode === "edit" ? <Edit3 size={12} /> : mode === "preview" ? <Eye size={12} /> : <BookOpen size={12} />}
                    </button>
                  ))}
                </div>

                {/* Export */}
                {editingNote && (
                  <div className="flex items-center gap-1">
                    <button onClick={() => exportNote(editingNote, "md")} className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[9px] font-bold text-white/50 hover:text-white transition-all" title="Export Markdown">.md</button>
                    <button onClick={() => exportNote(editingNote, "txt")} className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[9px] font-bold text-white/50 hover:text-white transition-all" title="Export Text">.txt</button>
                  </div>
                )}

                {/* Save / Create */}
                {!editingNote ? (
                  <button onClick={saveNewNote} className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#00d4ff] to-[#00b2fe] text-black font-black uppercase tracking-wider text-[10px] hover:scale-105 active:scale-95 transition-all">
                    Create
                  </button>
                ) : (
                  <button onClick={() => { togglePin(editingNote._id); setEditingNote({ ...editingNote, isPinned: !editingNote.isPinned }); }} className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all ${editingNote.isPinned ? "bg-[#00d4ff]/10 border-[#00d4ff]/30 text-[#00d4ff]" : "bg-white/5 border-white/10 text-white/40"}`}>
                    <Pin size={14} />
                  </button>
                )}
              </div>
            </header>

            {/* Editor Body */}
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-4xl mx-auto px-4 md:px-8 py-6">

                {/* Title */}
                <input
                  type="text"
                  value={editorTitle}
                  onChange={(e) => { setEditorTitle(e.target.value); if (editingNote) triggerAutoSave(); }}
                  placeholder="Note title..."
                  className="w-full bg-transparent border-none text-xl md:text-2xl font-black text-white placeholder-white/20 focus:outline-none focus:ring-0 mb-4"
                  autoFocus
                />

                {/* Meta Row */}
                <div className="flex flex-wrap items-center gap-2 mb-6">
                  {/* Label Picker */}
                  {Object.entries(LABEL_CONFIG).map(([key, cfg]) => (
                    <button key={key} onClick={() => { setEditorLabel(key as keyof typeof LABEL_CONFIG); if (editingNote) triggerAutoSave(); }} className={`px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-wider transition-all border ${editorLabel === key ? "border-transparent" : "bg-white/[0.02] border-white/5 text-white/40"}`} style={editorLabel === key ? { backgroundColor: cfg.bg, color: cfg.color, borderColor: `${cfg.color}40` } : {}}>
                      {cfg.emoji} {cfg.label}
                    </button>
                  ))}

                  <div className="w-px h-5 bg-white/10 mx-1" />

                  {/* Subject Picker */}
                  <div className="relative">
                    <button onClick={() => setShowSubjectPicker(!showSubjectPicker)} className="px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-white/[0.03] border border-white/[0.06] text-white/50 hover:bg-white/5 transition-all flex items-center gap-1">
                      {editorSubject ? `${SUBJECT_CONFIG[editorSubject]?.emoji || "📚"} ${editorSubject}` : "➕ Subject"} <ChevronDown size={8} />
                    </button>
                    {showSubjectPicker && (
                      <div className="absolute left-0 top-full mt-2 w-52 bg-[#141418] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden max-h-64 overflow-y-auto">
                        <button onClick={() => { setEditorSubject(""); setShowSubjectPicker(false); if (editingNote) triggerAutoSave(); }} className="w-full px-4 py-2.5 text-left text-xs text-white/40 hover:bg-white/5 transition-all">None</button>
                        {Object.entries(SUBJECT_CONFIG).map(([name, cfg]) => (
                          <button key={name} onClick={() => { setEditorSubject(name); setShowSubjectPicker(false); if (editingNote) triggerAutoSave(); }} className={`w-full px-4 py-2.5 text-left text-xs font-medium transition-all flex items-center gap-2 ${editorSubject === name ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5"}`}>
                            <span>{cfg.emoji}</span> {name}
                          </button>
                        ))}
                        <div className="p-2 border-t border-white/5">
                          <input type="text" value={customSubject} onChange={(e) => setCustomSubject(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && customSubject.trim()) { setEditorSubject(customSubject.trim()); setCustomSubject(""); setShowSubjectPicker(false); if (editingNote) triggerAutoSave(); } }} placeholder="Custom subject..." className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder-white/30 focus:outline-none" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Linked Page */}
                  <select value={editorLinkedPage || ""} onChange={(e) => { setEditorLinkedPage(e.target.value || null); if (editingNote) triggerAutoSave(); }} className="px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-white/[0.03] border border-white/[0.06] text-white/50 focus:outline-none cursor-pointer appearance-none">
                    {LINKED_PAGES.map((lp) => (
                      <option key={lp.value || "none"} value={lp.value || ""}>{lp.label}</option>
                    ))}
                  </select>
                </div>

                {/* Markdown Toolbar (edit mode only) */}
                {editorMode === "edit" && (
                  <div className="flex items-center gap-1 mb-3 flex-wrap p-2 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                    <button onClick={() => insertMarkdown("**", "**")} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all" title="Bold (Ctrl+B)"><Bold size={13} /></button>
                    <button onClick={() => insertMarkdown("*", "*")} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all" title="Italic"><Italic size={13} /></button>
                    <div className="w-px h-5 bg-white/10 mx-0.5" />
                    <button onClick={() => insertMarkdown("# ")} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all" title="Heading"><Hash size={13} /></button>
                    <button onClick={() => insertMarkdown("- ")} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all" title="Bullet List"><List size={13} /></button>
                    <button onClick={() => insertMarkdown("1. ")} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all" title="Numbered List"><ListOrdered size={13} /></button>
                    <button onClick={() => insertMarkdown("- [ ] ")} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all" title="Checklist"><CheckSquare size={13} /></button>
                    <div className="w-px h-5 bg-white/10 mx-0.5" />
                    <button onClick={() => insertMarkdown("`", "`")} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all" title="Code"><Code size={13} /></button>
                    <button onClick={() => insertMarkdown("> ")} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all" title="Quote"><Quote size={13} /></button>
                    <button onClick={() => insertMarkdown("```\n", "\n```")} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-[10px] font-mono text-white/50 hover:text-white transition-all" title="Code Block">{"{ }"}</button>
                    <button onClick={() => insertMarkdown("| Header | Header |\n|--------|--------|\n| Cell   | Cell   |\n")} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-[10px] font-mono text-white/50 hover:text-white transition-all" title="Table">⊞</button>
                  </div>
                )}

                {/* Content Area */}
                {editorMode === "edit" ? (
                  <textarea
                    ref={editorTextareaRef}
                    value={editorContent}
                    onChange={(e) => { setEditorContent(e.target.value); if (editingNote) triggerAutoSave(); }}
                    placeholder="Start writing... (Markdown supported)"
                    className="w-full min-h-[50vh] bg-transparent border-none text-sm text-white/80 placeholder-white/20 focus:outline-none focus:ring-0 font-mono leading-relaxed resize-none"
                    style={{ tabSize: 2 }}
                  />
                ) : editorMode === "preview" ? (
                  <div className="min-h-[50vh] prose-invert">
                    <div className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: renderMarkdownPreview(editorContent) }} />
                  </div>
                ) : (
                  /* Reading mode - clean, distraction-free */
                  <div className="min-h-[50vh] max-w-2xl mx-auto">
                    <div className="text-sm leading-loose text-white/80" dangerouslySetInnerHTML={{ __html: renderMarkdownPreview(editorContent) }} />
                  </div>
                )}
              </div>
            </div>

            {/* Editor Footer */}
            <footer className="shrink-0 px-4 md:px-8 py-2 border-t border-white/[0.06] flex items-center justify-between text-[9px] font-bold text-white/30 uppercase tracking-widest">
              <div className="flex items-center gap-4">
                <span>{wc} words</span>
                <span>{readingTime(wc)}</span>
                {editingNote && <span>v{editingNote.version || 1}</span>}
              </div>
              <div className="flex items-center gap-2">
                {editingNote && <span>Updated {timeAgo(editingNote.updatedAt)}</span>}
                <span className="text-[8px] text-white/15">Ctrl+S save · Esc close</span>
              </div>
            </footer>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════ */}
        {/* STATS MODAL                                                 */}
        {/* ════════════════════════════════════════════════════════════ */}
        {showStatsModal && (
          <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md" onClick={() => setShowStatsModal(false)}>
            <div className="relative w-full max-w-md p-6 md:p-8 rounded-[32px] bg-gradient-to-b from-[#121324] to-[#0c0d17] border border-white/10 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setShowStatsModal(false)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all">
                <X size={14} />
              </button>

              <h3 className="text-sm font-black uppercase tracking-wider text-white mb-6 flex items-center gap-2">
                <BarChart3 size={16} className="text-[#00d4ff]" /> Notes Statistics
              </h3>

              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { label: "Total Notes", value: stats?.total ?? notes.filter(n => !n.deletedAt && !n.archivedAt).length, color: "#00d4ff" },
                  { label: "Assignments", value: stats?.assignments ?? 0, color: "#00ff88" },
                  { label: "Pinned", value: stats?.pinned ?? notes.filter(n => n.isPinned).length, color: "#FFCC00" },
                  { label: "Favorites", value: stats?.favorites ?? 0, color: "#bf00ff" },
                  { label: "Archived", value: stats?.archived ?? 0, color: "#888" },
                  { label: "Trash", value: stats?.trashed ?? 0, color: "#EF4444" },
                ].map((s) => (
                  <div key={s.label} className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-center">
                    <p className="text-lg font-black" style={{ color: s.color }}>{s.value}</p>
                    <p className="text-[8px] font-bold text-white/40 uppercase tracking-wider mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

              {stats && (
                <>
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-white/50">Tasks Completed</span>
                      <span className="text-xs font-black text-[#00ff88]">{stats.completedCheckItems}/{stats.totalCheckItems}</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-[#00d4ff] to-[#00ff88] transition-all" style={{ width: `${stats.totalCheckItems > 0 ? (stats.completedCheckItems / stats.totalCheckItems) * 100 : 0}%` }} />
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                    <span className="text-[10px] font-bold text-white/50">Total Words Written</span>
                    <p className="text-lg font-black text-white mt-1">{stats.totalWords.toLocaleString()}</p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
