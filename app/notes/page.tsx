"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { useAuth } from "@/hooks/useAuth";
import { notesAPI } from "@/lib/api";
import { useNotesStore, type Note, type SortMode, type ViewFilter } from "@/lib/notesStore";
import {
  Plus, Search, StickyNote, Pin, Star, Archive, Trash2, RotateCcw,
  X, ChevronDown, ArrowLeft, Loader2, FileText, CheckSquare,
  Bold, Italic, List, ListOrdered, Code, Quote, Hash, Eye, Edit3,
  Download, Upload, BarChart3, Clock, BookOpen, Cpu, Globe, Shield,
  Bookmark, Filter, SortAsc, Sparkles, Check, AlertCircle, Sparkle
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────
const LABEL_CONFIG = {
  subject:    { emoji: "📘", label: "Subject",    color: "#00d4ff", bg: "rgba(0,212,255,0.14)" },
  assignment: { emoji: "📝", label: "Assignment", color: "#00ff88", bg: "rgba(0,255,136,0.14)" },
  important:  { emoji: "⭐", label: "Important",  color: "#FFCC00", bg: "rgba(255,204,0,0.14)" },
  todo:       { emoji: "✔",  label: "To-do",      color: "#bf00ff", bg: "rgba(191,0,255,0.14)" },
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
  if (!md) return '<p class="text-white/30 italic">Empty note content...</p>';

  let html = md
    .replace(/^### (.+)$/gm, '<h3 class="text-sm font-black text-white/95 mt-3 mb-1.5">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-base font-black text-[#00d4ff] mt-4 mb-2">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-lg md:text-xl font-black text-white mt-4 mb-2 border-b border-white/10 pb-1">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-white">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em class="italic text-white/80">$1</em>')
    .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-white/10 text-[#00d4ff] text-[11px] font-mono">$1</code>')
    .replace(/^- \[x\] (.+)$/gm, '<div class="flex items-center gap-2 my-1"><div class="w-4 h-4 rounded border border-[#00ff88] bg-[#00ff88]/20 flex items-center justify-center shrink-0"><svg class="w-3 h-3 text-[#00ff88]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg></div><span class="text-white/50 line-through text-xs">$1</span></div>')
    .replace(/^- \[ \] (.+)$/gm, '<div class="flex items-center gap-2 my-1"><div class="w-4 h-4 rounded border border-white/30 bg-white/5 shrink-0"></div><span class="text-white/80 text-xs">$1</span></div>')
    .replace(/^- (.+)$/gm, '<div class="flex items-start gap-2 my-1"><span class="text-[#00d4ff] font-bold mt-0.5">•</span><span class="text-white/80 text-xs leading-relaxed">$1</span></div>')
    .replace(/^\d+\. (.+)$/gm, '<div class="text-white/80 text-xs my-1 pl-4 leading-relaxed">$1</div>')
    .replace(/^> (.+)$/gm, '<blockquote class="border-l-3 border-[#00d4ff] pl-3 my-2 text-white/70 text-xs italic bg-white/[0.02] py-1.5 rounded-r-lg">$1</blockquote>')
    .replace(/```([\s\S]*?)```/g, '<pre class="bg-black/50 border border-white/10 rounded-xl p-3 my-3 overflow-x-auto"><code class="text-xs font-mono text-[#00d4ff] leading-relaxed">$1</code></pre>')
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
      return `<div class="overflow-x-auto my-3"><table class="w-full text-xs border-collapse rounded-xl overflow-hidden border border-white/10"><thead><tr class="bg-white/10">${headers.map((h: string) => `<th class="border border-white/10 px-3 py-1.5 text-left font-bold text-white/80">${h}</th>`).join("")}</tr></thead><tbody>${rows.map((row: string[]) => `<tr class="hover:bg-white/5">${row.map((c: string) => `<td class="border border-white/10 px-3 py-1.5 text-white/70">${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
    }
  );

  return html;
}

// ─── Page Component ───────────────────────────────────────────────────────────
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
  }, [editingNote, editorTitle, editorContent, editorLabel, editorSubject, editorLinkedPage, editorCheckItems, updateNote]);

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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-16 sm:pt-20 md:pt-24 pb-32 md:pl-72 lg:pl-80">

        {/* ── Header ─────────────────────────────────────────────────── */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/dashboard")}
              className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] transition-all text-white/70 hover:text-white shrink-0 active:scale-95 shadow-md"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wider flex items-center gap-2 text-white">
                <div className="w-8 h-8 rounded-xl bg-[#FFCC00]/15 border border-[#FFCC00]/30 flex items-center justify-center text-[#FFCC00] shadow-[0_0_15px_rgba(255,204,0,0.2)]">
                  <StickyNote size={18} />
                </div>
                My Notes
                <Sparkles size={16} className="text-[#00d4ff] animate-pulse" />
              </h1>
              <p className="text-[10.5px] text-white/40 font-bold mt-1 flex items-center gap-2">
                {syncStatus === "synced" && <span className="text-emerald-400 flex items-center gap-1">🟢 Synced</span>}
                {syncStatus === "syncing" && <span className="text-amber-400 flex items-center gap-1">🟡 Syncing...</span>}
                {syncStatus === "offline" && <span className="text-orange-400 flex items-center gap-1">🟠 Working offline</span>}
                {syncStatus === "error" && <span className="text-rose-400 flex items-center gap-1">🔴 Sync error</span>}
                <span>·</span>
                <span className="text-white/60">{filteredNotes.length} notes</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Stats Button */}
            <button
              onClick={() => { syncStatsFromServer(); setShowStatsModal(true); }}
              className="px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] hover:border-white/20 transition-all text-[10px] font-extrabold text-white/80 uppercase tracking-wider flex items-center gap-1.5 active:scale-95 shadow-md"
            >
              <BarChart3 size={13} className="text-[#00d4ff]" /> Stats
            </button>

            {/* Import */}
            <label className="px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] hover:border-white/20 transition-all text-[10px] font-extrabold text-white/80 uppercase tracking-wider flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-md">
              <Upload size={13} className="text-[#00ff88]" /> Import
              <input type="file" accept=".md,.txt" onChange={handleImport} className="hidden" />
            </label>

            {/* Templates */}
            <div className="relative">
              <button
                onClick={() => setShowTemplates(!showTemplates)}
                className="px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] hover:border-white/20 transition-all text-[10px] font-extrabold text-white/80 uppercase tracking-wider flex items-center gap-1.5 active:scale-95 shadow-md"
              >
                <FileText size={13} className="text-[#FFCC00]" /> Templates
              </button>
              {showTemplates && (
                <div className="absolute right-0 top-full mt-2 w-60 bg-[#121318] border border-white/15 rounded-2xl shadow-2xl z-50 overflow-hidden backdrop-blur-2xl">
                  {SMART_TEMPLATES.map((t) => (
                    <button
                      key={t.name}
                      onClick={() => openFromTemplate(t)}
                      className="w-full px-4 py-3 text-left hover:bg-white/10 transition-all flex items-center gap-3 border-b border-white/5 last:border-0"
                    >
                      <span className="text-xl">{t.emoji}</span>
                      <div>
                        <p className="text-xs font-bold text-white">{t.name}</p>
                        <p className="text-[9px] text-white/40">{LABEL_CONFIG[t.label].label}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* New Note Button (Header CTA) */}
            <button
              onClick={() => openEditor()}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#00d4ff] to-[#00a3fe] hover:brightness-110 active:scale-95 transition-all text-black font-black uppercase tracking-wider text-[10.5px] flex items-center gap-1.5 shadow-[0_0_20px_rgba(0,212,255,0.3)] shrink-0"
            >
              <Plus size={15} strokeWidth={3} /> New Note
            </button>
          </div>
        </header>

        {/* ── Search + Filters Bar ────────────────────────────────────── */}
        <div className="flex flex-col gap-3 mb-6">
          {/* Full Width Search Input */}
          <div className="relative w-full">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              id="notes-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes... (title, content, subject, label)"
              className="w-full pl-11 pr-10 py-3 rounded-2xl bg-white/[0.03] border border-white/10 text-xs sm:text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#00d4ff]/60 focus:ring-1 focus:ring-[#00d4ff]/30 transition-all font-medium backdrop-blur-md shadow-inner"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white p-1">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filter & Sort Controls Row */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none" style={{ scrollbarWidth: "none" }}>
            {/* View Filter Dropdown */}
            <div className="relative shrink-0">
              <button
                onClick={() => setShowFilterMenu(!showFilterMenu)}
                className="px-3.5 py-2 rounded-xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.07] transition-all text-[10px] font-bold text-white/80 uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap shadow-sm"
              >
                <Filter size={12} className="text-[#00d4ff]" /> {viewLabels[viewFilter]} <ChevronDown size={12} className="text-white/40" />
              </button>
              {showFilterMenu && (
                <div className="absolute left-0 top-full mt-2 w-48 bg-[#121318] border border-white/15 rounded-2xl shadow-2xl z-50 overflow-hidden backdrop-blur-2xl">
                  {(Object.keys(viewLabels) as ViewFilter[]).map((f) => (
                    <button
                      key={f}
                      onClick={() => { setViewFilter(f); setShowFilterMenu(false); }}
                      className={`w-full px-4 py-2.5 text-left text-xs font-bold transition-all flex items-center justify-between ${viewFilter === f ? "bg-[#00d4ff]/15 text-[#00d4ff]" : "text-white/70 hover:bg-white/5"}`}
                    >
                      {viewLabels[f]}
                      {viewFilter === f && <Check size={14} />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="relative shrink-0">
              <button
                onClick={() => setShowSortMenu(!showSortMenu)}
                className="px-3.5 py-2 rounded-xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.07] transition-all text-[10px] font-bold text-white/80 uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap shadow-sm"
              >
                <SortAsc size={12} className="text-[#00ff88]" /> Sort <ChevronDown size={12} className="text-white/40" />
              </button>
              {showSortMenu && (
                <div className="absolute left-0 top-full mt-2 w-48 bg-[#121318] border border-white/15 rounded-2xl shadow-2xl z-50 overflow-hidden backdrop-blur-2xl">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => { setSortMode(opt.value); setShowSortMenu(false); }}
                      className={`w-full px-4 py-2.5 text-left text-xs font-bold transition-all flex items-center justify-between ${sortMode === opt.value ? "bg-[#00d4ff]/15 text-[#00d4ff]" : "text-white/70 hover:bg-white/5"}`}
                    >
                      {opt.label}
                      {sortMode === opt.value && <Check size={14} />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="w-px h-5 bg-white/10 mx-1 shrink-0" />

            {/* Label Chips */}
            <button
              onClick={() => setActiveLabel(null)}
              className={`px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all border shrink-0 ${!activeLabel ? "bg-white/15 border-white/30 text-white shadow-sm" : "bg-white/[0.02] border-white/10 text-white/50 hover:bg-white/5 hover:text-white"}`}
            >
              All
            </button>
            {Object.entries(LABEL_CONFIG).map(([key, cfg]) => (
              <button
                key={key}
                onClick={() => setActiveLabel(activeLabel === key ? null : key)}
                className="px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all border shrink-0 flex items-center gap-1"
                style={activeLabel === key ? { backgroundColor: cfg.bg, borderColor: `${cfg.color}60`, color: cfg.color, boxShadow: `0 0 12px ${cfg.color}30` } : { backgroundColor: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}
              >
                {cfg.emoji} {cfg.label}
              </button>
            ))}

            {/* Subject Chips */}
            {subjects.length > 0 && (
              <>
                <div className="w-px h-5 bg-white/10 mx-1 shrink-0" />
                {subjects.map((subj) => {
                  const sc = SUBJECT_CONFIG[subj] || { emoji: "📚", color: "#888" };
                  const isSel = activeSubject === subj;
                  return (
                    <button
                      key={subj}
                      onClick={() => setActiveSubject(isSel ? null : subj)}
                      className="px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all border shrink-0 flex items-center gap-1"
                      style={isSel ? { backgroundColor: `${sc.color}25`, borderColor: `${sc.color}60`, color: sc.color, boxShadow: `0 0 12px ${sc.color}30` } : { backgroundColor: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}
                    >
                      {sc.emoji} {subj}
                    </button>
                  );
                })}
              </>
            )}
          </div>
        </div>

        {/* ── Notes Grid ─────────────────────────────────────────────── */}
        {isInitialLoad ? (
          <div className="flex flex-col items-center justify-center py-20 text-white/40 gap-3">
            <Loader2 className="animate-spin text-[#00d4ff]" size={36} />
            <span className="text-[11px] font-black uppercase tracking-widest">Loading your notes...</span>
          </div>
        ) : filteredNotes.length === 0 ? (
          /* ── Empty State ──────────────────────────────────────────── */
          <div className="flex flex-col items-center justify-center py-16 text-center max-w-md mx-auto">
            <div className="w-20 h-20 rounded-3xl bg-[#FFCC00]/10 border border-[#FFCC00]/20 flex items-center justify-center text-[#FFCC00] mb-6 shadow-[0_0_30px_rgba(255,204,0,0.15)] animate-pulse">
              <StickyNote size={36} />
            </div>
            <h3 className="text-base font-black uppercase tracking-wider text-white mb-2">
              {searchQuery ? "No matching notes found" : viewFilter !== "all" ? `No ${viewFilter} notes` : "Start Your Academic Journal"}
            </h3>
            <p className="text-xs text-white/40 mb-8 leading-relaxed">
              {searchQuery ? "Try refining your search query or clear filters." : "Create your first note or pick a smart template to organize your studies."}
            </p>
            {!searchQuery && viewFilter === "all" && (
              <div className="w-full grid grid-cols-2 sm:grid-cols-3 gap-3">
                {SMART_TEMPLATES.slice(0, 6).map((t) => (
                  <button
                    key={t.name}
                    onClick={() => openFromTemplate(t)}
                    className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.08] hover:border-white/20 transition-all text-left group shadow-md"
                  >
                    <span className="text-2xl block mb-2">{t.emoji}</span>
                    <p className="text-xs font-bold text-white/90 group-hover:text-white">{t.name}</p>
                    <p className="text-[9px] text-white/40 mt-0.5">{LABEL_CONFIG[t.label].label}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {filteredNotes.map((note) => {
              const labelCfg = LABEL_CONFIG[note.label] || LABEL_CONFIG.subject;
              const subjCfg = SUBJECT_CONFIG[note.subject] || null;
              const completedChecks = note.checkItems?.filter(c => c.checked).length || 0;
              const totalChecks = note.checkItems?.length || 0;
              const preview = note.content.replace(/[#*`>\-\[\]]/g, "").trim().slice(0, 110);

              return (
                <div
                  key={note._id}
                  onClick={() => openEditor(note)}
                  className="group relative p-4.5 rounded-2xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] hover:border-white/20 transition-all duration-200 cursor-pointer active:scale-[0.99] shadow-lg hover:shadow-2xl flex flex-col justify-between"
                  style={{ borderLeftColor: labelCfg.color, borderLeftWidth: "4px" }}
                >
                  <div>
                    {/* Top Row: Title + Status Icons */}
                    <div className="flex items-start justify-between gap-2 mb-2 pr-16">
                      <h3 className="text-sm font-black text-white leading-snug line-clamp-2">{note.title}</h3>
                      <div className="flex items-center gap-1 shrink-0">
                        {note.isPinned && <Pin size={12} className="text-[#00d4ff] drop-shadow-[0_0_8px_rgba(0,212,255,0.6)]" />}
                        {note.isFavorite && <Star size={12} className="text-[#FFCC00] fill-[#FFCC00] drop-shadow-[0_0_8px_rgba(255,204,0,0.6)]" />}
                      </div>
                    </div>

                    {/* Preview Text */}
                    {preview && (
                      <p className="text-[11px] text-white/50 leading-relaxed line-clamp-2 mb-3">{preview}</p>
                    )}

                    {/* Checklist progress */}
                    {totalChecks > 0 && (
                      <div className="mb-3 bg-white/[0.02] p-2 rounded-xl border border-white/5">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[9.5px] font-bold text-white/50 flex items-center gap-1">
                            <CheckSquare size={11} className="text-[#00ff88]" /> Checklist
                          </span>
                          <span className="text-[9.5px] font-extrabold text-[#00ff88]">{completedChecks}/{totalChecks}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#00d4ff] to-[#00ff88] transition-all"
                            style={{ width: `${totalChecks > 0 ? (completedChecks / totalChecks) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Bottom Row */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/5 mt-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="px-2.5 py-0.5 rounded-full text-[8.5px] font-extrabold uppercase tracking-wider" style={{ backgroundColor: labelCfg.bg, color: labelCfg.color }}>
                        {labelCfg.emoji} {labelCfg.label}
                      </span>
                      {subjCfg && (
                        <span className="px-2 py-0.5 rounded-full text-[8.5px] font-extrabold bg-white/5 text-white/60 truncate">
                          {subjCfg.emoji} {note.subject}
                        </span>
                      )}
                    </div>
                    <span className="text-[9px] font-bold text-white/30 whitespace-nowrap">{timeAgo(note.updatedAt)}</span>
                  </div>

                  {/* Quick actions bar (visible on hover) */}
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-black/80 backdrop-blur-md p-1 rounded-xl border border-white/15 shadow-xl">
                    <button
                      onClick={(e) => { e.stopPropagation(); togglePin(note._id); }}
                      className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10 transition-all"
                      title={note.isPinned ? "Unpin" : "Pin"}
                    >
                      <Pin size={11} className={note.isPinned ? "text-[#00d4ff]" : "text-white/50"} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(note._id); }}
                      className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10 transition-all"
                      title={note.isFavorite ? "Unfavorite" : "Favorite"}
                    >
                      <Star size={11} className={note.isFavorite ? "text-[#FFCC00] fill-[#FFCC00]" : "text-white/50"} />
                    </button>
                    {viewFilter === "trash" ? (
                      <button
                        onClick={(e) => { e.stopPropagation(); restoreNote(note._id); }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10 transition-all"
                        title="Restore"
                      >
                        <RotateCcw size={11} className="text-emerald-400" />
                      </button>
                    ) : viewFilter === "archived" ? (
                      <button
                        onClick={(e) => { e.stopPropagation(); restoreNote(note._id); }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10 transition-all"
                        title="Unarchive"
                      >
                        <RotateCcw size={11} className="text-emerald-400" />
                      </button>
                    ) : (
                      <button
                        onClick={(e) => { e.stopPropagation(); archiveNote(note._id); }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10 transition-all"
                        title="Archive"
                      >
                        <Archive size={11} className="text-white/50" />
                      </button>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(note); }}
                      className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-rose-500/20 transition-all"
                      title="Delete"
                    >
                      <Trash2 size={11} className="text-rose-400" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Mobile FAB (Rendered via Portal to avoid SwipeLayout containing block issues) ── */}
        {mounted && createPortal(
          <button
            onClick={() => openEditor()}
            className="md:hidden fixed bottom-24 right-5 z-[99999] w-13 h-13 rounded-2xl bg-gradient-to-tr from-[#00d4ff] to-[#00a3fe] flex items-center justify-center text-black shadow-[0_8px_25px_rgba(0,212,255,0.4)] hover:scale-110 active:scale-95 transition-all border border-white/20"
            aria-label="Create New Note"
          >
            <Plus size={26} strokeWidth={3} />
          </button>,
          document.body
        )}

        {/* ════════════════════════════════════════════════════════════ */}
        {/* EDITOR MODAL (Portal to document.body)                       */}
        {/* ════════════════════════════════════════════════════════════ */}
        {editorOpen && mounted && createPortal(
          <div className="fixed inset-0 z-[99999] bg-black/85 backdrop-blur-2xl flex flex-col p-2 sm:p-6 overflow-hidden">
            <div className="w-full max-w-4xl mx-auto h-full max-h-[92vh] rounded-3xl bg-[#0d0e12] border border-white/15 flex flex-col overflow-hidden shadow-2xl">
              
              {/* Editor Header */}
              <header className="shrink-0 flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/10 bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <button onClick={closeEditor} className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-white/70 hover:text-white">
                    <X size={18} />
                  </button>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-extrabold uppercase tracking-widest ${saveStatus === "typing" ? "text-amber-400" : saveStatus === "saving" ? "text-[#00d4ff] animate-pulse" : saveStatus === "saved" ? "text-emerald-400" : "text-white/30"}`}>
                      {saveStatus === "typing" ? "Typing..." : saveStatus === "saving" ? "Saving..." : saveStatus === "saved" ? "✓ Saved" : ""}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Mode Toggle */}
                  <div className="flex items-center rounded-xl bg-white/5 border border-white/10 p-0.5">
                    {(["edit", "preview", "reading"] as const).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setEditorMode(mode)}
                        className={`px-3 py-1.5 rounded-lg text-[9.5px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 ${editorMode === mode ? "bg-[#00d4ff] text-black shadow-md" : "text-white/50 hover:text-white"}`}
                      >
                        {mode === "edit" ? <><Edit3 size={11} /> Edit</> : mode === "preview" ? <><Eye size={11} /> Preview</> : <><BookOpen size={11} /> Read</>}
                      </button>
                    ))}
                  </div>

                  {/* Export */}
                  {editingNote && (
                    <div className="hidden sm:flex items-center gap-1">
                      <button onClick={() => exportNote(editingNote, "md")} className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[9px] font-bold text-white/60 hover:text-white hover:bg-white/10 transition-all" title="Export Markdown">.md</button>
                      <button onClick={() => exportNote(editingNote, "txt")} className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[9px] font-bold text-white/60 hover:text-white hover:bg-white/10 transition-all" title="Export Text">.txt</button>
                    </div>
                  )}

                  {/* Save / Create */}
                  {!editingNote ? (
                    <button onClick={saveNewNote} className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#00d4ff] to-[#00a3fe] text-black font-black uppercase tracking-wider text-[10px] hover:brightness-110 active:scale-95 transition-all shadow-[0_0_15px_rgba(0,212,255,0.3)]">
                      Create Note
                    </button>
                  ) : (
                    <button onClick={() => { togglePin(editingNote._id); setEditingNote({ ...editingNote, isPinned: !editingNote.isPinned }); }} className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all ${editingNote.isPinned ? "bg-[#00d4ff]/20 border-[#00d4ff]/40 text-[#00d4ff]" : "bg-white/5 border-white/10 text-white/40 hover:text-white"}`}>
                      <Pin size={15} />
                    </button>
                  )}
                </div>
              </header>

              {/* Editor Body */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                {/* Title Input */}
                <input
                  type="text"
                  value={editorTitle}
                  onChange={(e) => { setEditorTitle(e.target.value); if (editingNote) triggerAutoSave(); }}
                  placeholder="Note title..."
                  className="w-full bg-transparent border-none text-xl sm:text-3xl font-black text-white placeholder-white/25 focus:outline-none focus:ring-0"
                  autoFocus
                />

                {/* Meta Row (Labels, Subject, Linked Page) */}
                <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-white/10">
                  {Object.entries(LABEL_CONFIG).map(([key, cfg]) => (
                    <button
                      key={key}
                      onClick={() => { setEditorLabel(key as keyof typeof LABEL_CONFIG); if (editingNote) triggerAutoSave(); }}
                      className="px-3 py-1.5 rounded-full text-[9.5px] font-bold uppercase tracking-wider transition-all border"
                      style={editorLabel === key ? { backgroundColor: cfg.bg, color: cfg.color, borderColor: `${cfg.color}60` } : { backgroundColor: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" }}
                    >
                      {cfg.emoji} {cfg.label}
                    </button>
                  ))}

                  <div className="w-px h-5 bg-white/10 mx-1" />

                  {/* Subject Picker */}
                  <div className="relative">
                    <button
                      onClick={() => setShowSubjectPicker(!showSubjectPicker)}
                      className="px-3 py-1.5 rounded-full text-[9.5px] font-bold uppercase tracking-wider bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 transition-all flex items-center gap-1.5"
                    >
                      {editorSubject ? `${SUBJECT_CONFIG[editorSubject]?.emoji || "📚"} ${editorSubject}` : "➕ Add Subject"} <ChevronDown size={10} />
                    </button>
                    {showSubjectPicker && (
                      <div className="absolute left-0 top-full mt-2 w-56 bg-[#16171d] border border-white/15 rounded-2xl shadow-2xl z-50 overflow-hidden max-h-64 overflow-y-auto backdrop-blur-2xl">
                        <button onClick={() => { setEditorSubject(""); setShowSubjectPicker(false); if (editingNote) triggerAutoSave(); }} className="w-full px-4 py-2.5 text-left text-xs text-white/40 hover:bg-white/5 transition-all">None</button>
                        {Object.entries(SUBJECT_CONFIG).map(([name, cfg]) => (
                          <button
                            key={name}
                            onClick={() => { setEditorSubject(name); setShowSubjectPicker(false); if (editingNote) triggerAutoSave(); }}
                            className={`w-full px-4 py-2.5 text-left text-xs font-bold transition-all flex items-center gap-2 ${editorSubject === name ? "bg-[#00d4ff]/20 text-[#00d4ff]" : "text-white/70 hover:bg-white/5"}`}
                          >
                            <span>{cfg.emoji}</span> {name}
                          </button>
                        ))}
                        <div className="p-2 border-t border-white/10">
                          <input
                            type="text"
                            value={customSubject}
                            onChange={(e) => setCustomSubject(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter" && customSubject.trim()) { setEditorSubject(customSubject.trim()); setCustomSubject(""); setShowSubjectPicker(false); if (editingNote) triggerAutoSave(); } }}
                            placeholder="Custom subject..."
                            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder-white/30 focus:outline-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Linked Page */}
                  <select
                    value={editorLinkedPage || ""}
                    onChange={(e) => { setEditorLinkedPage(e.target.value || null); if (editingNote) triggerAutoSave(); }}
                    className="px-3 py-1.5 rounded-full text-[9.5px] font-bold uppercase tracking-wider bg-white/5 border border-white/10 text-white/70 focus:outline-none cursor-pointer appearance-none"
                  >
                    {LINKED_PAGES.map((lp) => (
                      <option key={lp.value || "none"} value={lp.value || ""} className="bg-[#121318] text-white">{lp.label}</option>
                    ))}
                  </select>
                </div>

                {/* Markdown Toolbar (edit mode only) */}
                {editorMode === "edit" && (
                  <div className="flex items-center gap-1 flex-wrap p-2 rounded-2xl bg-white/[0.02] border border-white/10">
                    <button onClick={() => insertMarkdown("**", "**")} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all" title="Bold"><Bold size={14} /></button>
                    <button onClick={() => insertMarkdown("*", "*")} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all" title="Italic"><Italic size={14} /></button>
                    <div className="w-px h-5 bg-white/10 mx-0.5" />
                    <button onClick={() => insertMarkdown("# ")} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all" title="Heading 1"><Hash size={14} /></button>
                    <button onClick={() => insertMarkdown("## ")} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-[10px] font-black text-white/60 hover:text-white transition-all" title="Heading 2">H2</button>
                    <button onClick={() => insertMarkdown("- ")} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all" title="Bullet List"><List size={14} /></button>
                    <button onClick={() => insertMarkdown("1. ")} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all" title="Numbered List"><ListOrdered size={14} /></button>
                    <button onClick={() => insertMarkdown("- [ ] ")} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all" title="Checklist"><CheckSquare size={14} /></button>
                    <div className="w-px h-5 bg-white/10 mx-0.5" />
                    <button onClick={() => insertMarkdown("`", "`")} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all" title="Code"><Code size={14} /></button>
                    <button onClick={() => insertMarkdown("> ")} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all" title="Quote"><Quote size={14} /></button>
                    <button onClick={() => insertMarkdown("```\n", "\n```")} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-[10px] font-mono text-white/60 hover:text-white transition-all" title="Code Block">{"{ }"}</button>
                    <button onClick={() => insertMarkdown("| Header | Header |\n|--------|--------|\n| Cell   | Cell   |\n")} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-[10px] font-mono text-white/60 hover:text-white transition-all" title="Table">⊞</button>
                  </div>
                )}

                {/* Content Area */}
                {editorMode === "edit" ? (
                  <textarea
                    ref={editorTextareaRef}
                    value={editorContent}
                    onChange={(e) => { setEditorContent(e.target.value); if (editingNote) triggerAutoSave(); }}
                    placeholder="Start writing note... (Markdown formatting supported)"
                    className="w-full min-h-[45vh] bg-transparent border-none text-sm text-white/90 placeholder-white/20 focus:outline-none focus:ring-0 font-mono leading-relaxed resize-none p-2"
                    style={{ tabSize: 2 }}
                  />
                ) : editorMode === "preview" ? (
                  <div className="min-h-[45vh] p-4 rounded-2xl bg-white/[0.02] border border-white/5 overflow-y-auto">
                    <div className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: renderMarkdownPreview(editorContent) }} />
                  </div>
                ) : (
                  /* Reading mode */
                  <div className="min-h-[45vh] max-w-2xl mx-auto p-4">
                    <div className="text-sm leading-loose text-white/90" dangerouslySetInnerHTML={{ __html: renderMarkdownPreview(editorContent) }} />
                  </div>
                )}
              </div>

              {/* Editor Footer */}
              <footer className="shrink-0 px-4 sm:px-6 py-2.5 border-t border-white/10 bg-white/[0.02] flex items-center justify-between text-[9.5px] font-bold text-white/40 uppercase tracking-widest">
                <div className="flex items-center gap-4">
                  <span>{wc} words</span>
                  <span>{readingTime(wc)}</span>
                  {editingNote && <span>v{editingNote.version || 1}</span>}
                </div>
                <div className="flex items-center gap-2">
                  {editingNote && <span>Updated {timeAgo(editingNote.updatedAt)}</span>}
                </div>
              </footer>
            </div>
          </div>,
          document.body
        )}

        {/* ════════════════════════════════════════════════════════════ */}
        {/* STATS MODAL (Portal to document.body)                        */}
        {/* ════════════════════════════════════════════════════════════ */}
        {showStatsModal && mounted && createPortal(
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" onClick={() => setShowStatsModal(false)}>
            <div className="relative w-full max-w-md p-6 sm:p-8 rounded-[32px] bg-[#12131a] border border-white/15 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setShowStatsModal(false)} className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all">
                <X size={16} />
              </button>

              <h3 className="text-sm font-black uppercase tracking-wider text-white mb-6 flex items-center gap-2">
                <BarChart3 size={18} className="text-[#00d4ff]" /> Notes Analytics
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
                  <div key={s.label} className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 text-center">
                    <p className="text-xl font-black" style={{ color: s.color }}>{s.value}</p>
                    <p className="text-[8.5px] font-bold text-white/40 uppercase tracking-wider mt-1">{s.label}</p>
                  </div>
                ))}
              </div>

              {stats && (
                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-white/60">Tasks Completion Rate</span>
                      <span className="text-xs font-black text-[#00ff88]">{stats.completedCheckItems}/{stats.totalCheckItems}</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-[#00d4ff] to-[#00ff88] transition-all" style={{ width: `${stats.totalCheckItems > 0 ? (stats.completedCheckItems / stats.totalCheckItems) * 100 : 0}%` }} />
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-white/60">Total Words Written</span>
                    <p className="text-base font-black text-white">{stats.totalWords.toLocaleString()}</p>
                  </div>
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
      </main>
    </div>
  );
}
