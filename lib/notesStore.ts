// ─── Notes Store ──────────────────────────────────────────────────────────────
// Zustand store with localStorage persistence + background MongoDB sync.

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { notesAPI } from "./api";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface CheckItem {
  _id?: string;
  text: string;
  checked: boolean;
}

export interface Note {
  _id: string;
  userId?: string;
  title: string;
  content: string;
  label: "subject" | "assignment" | "important" | "todo";
  subject: string;
  tags: string[];
  isPinned: boolean;
  isFavorite: boolean;
  linkedPage: "attendance" | "marks" | "timetable" | "dashboard" | null;
  color: string;
  checkItems: CheckItem[];
  archivedAt: string | null;
  deletedAt: string | null;
  version: number;
  reminderAt: string | null;
  syncedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NoteStats {
  total: number;
  assignments: number;
  pinned: number;
  favorites: number;
  archived: number;
  trashed: number;
  totalCheckItems: number;
  completedCheckItems: number;
  totalWords: number;
}

export type SortMode = "newest" | "oldest" | "pinned" | "az" | "edited";
export type ViewFilter = "all" | "favorites" | "pinned" | "archived" | "trash";

export interface NotesStore {
  // Data
  notes: Note[];
  stats: NoteStats | null;

  // UI State
  searchQuery: string;
  sortMode: SortMode;
  viewFilter: ViewFilter;
  activeLabel: string | null;
  activeSubject: string | null;
  syncStatus: "synced" | "syncing" | "offline" | "error";
  lastSyncedAt: string | null;

  // Actions
  setNotes: (notes: Note[]) => void;
  setStats: (stats: NoteStats) => void;
  setSearchQuery: (q: string) => void;
  setSortMode: (mode: SortMode) => void;
  setViewFilter: (filter: ViewFilter) => void;
  setActiveLabel: (label: string | null) => void;
  setActiveSubject: (subject: string | null) => void;
  setSyncStatus: (status: "synced" | "syncing" | "offline" | "error") => void;

  // CRUD (with background sync)
  addNote: (note: Note) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  removeNote: (id: string) => void;
  togglePin: (id: string) => void;
  toggleFavorite: (id: string) => void;
  archiveNote: (id: string) => void;
  restoreNote: (id: string) => void;

  // Sync
  syncFromServer: () => Promise<void>;
  syncStatsFromServer: () => Promise<void>;

  // Computed helpers
  getFilteredNotes: () => Note[];
  getSubjects: () => string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function sortNotes(notes: Note[], mode: SortMode): Note[] {
  const sorted = [...notes];
  switch (mode) {
    case "newest":
      sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      break;
    case "oldest":
      sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      break;
    case "az":
      sorted.sort((a, b) => a.title.localeCompare(b.title));
      break;
    case "edited":
      sorted.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      break;
    case "pinned":
    default:
      // Pinned first, then by updatedAt
      sorted.sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
      break;
  }
  return sorted;
}

// ─── Store ────────────────────────────────────────────────────────────────────
export const useNotesStore = create<NotesStore>()(
  persist(
    (set, get) => ({
      notes: [],
      stats: null,
      searchQuery: "",
      sortMode: "pinned",
      viewFilter: "all",
      activeLabel: null,
      activeSubject: null,
      syncStatus: "synced",
      lastSyncedAt: null,

      setNotes: (notes) => set({ notes }),
      setStats: (stats) => set({ stats }),
      setSearchQuery: (searchQuery) => set({ searchQuery }),
      setSortMode: (sortMode) => set({ sortMode }),
      setViewFilter: (viewFilter) => set({ viewFilter }),
      setActiveLabel: (activeLabel) => set({ activeLabel }),
      setActiveSubject: (activeSubject) => set({ activeSubject }),
      setSyncStatus: (syncStatus) => set({ syncStatus }),

      addNote: (note) => {
        set((state) => ({ notes: [note, ...state.notes] }));
      },

      updateNote: (id, updates) => {
        set((state) => ({
          notes: state.notes.map((n) => (n._id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n)),
        }));
      },

      removeNote: (id) => {
        set((state) => ({ notes: state.notes.filter((n) => n._id !== id) }));
      },

      togglePin: (id) => {
        set((state) => ({
          notes: state.notes.map((n) => (n._id === id ? { ...n, isPinned: !n.isPinned } : n)),
        }));
        notesAPI.togglePin(id).catch(() => {});
      },

      toggleFavorite: (id) => {
        set((state) => ({
          notes: state.notes.map((n) => (n._id === id ? { ...n, isFavorite: !n.isFavorite } : n)),
        }));
        notesAPI.toggleFavorite(id).catch(() => {});
      },

      archiveNote: (id) => {
        set((state) => ({
          notes: state.notes.map((n) => (n._id === id ? { ...n, archivedAt: new Date().toISOString() } : n)),
        }));
        notesAPI.archive(id).catch(() => {});
      },

      restoreNote: (id) => {
        set((state) => ({
          notes: state.notes.map((n) => (n._id === id ? { ...n, archivedAt: null, deletedAt: null } : n)),
        }));
        notesAPI.restore(id).catch(() => {});
      },

      syncFromServer: async () => {
        try {
          set({ syncStatus: "syncing" });
          const res = await notesAPI.getAll();
          if (res.success) {
            set({ notes: res.notes, syncStatus: "synced", lastSyncedAt: new Date().toISOString() });
          }
        } catch {
          set({ syncStatus: "offline" });
        }
      },

      syncStatsFromServer: async () => {
        try {
          const res = await notesAPI.stats();
          if (res.success) set({ stats: res.stats });
        } catch { /* noop */ }
      },

      getFilteredNotes: () => {
        const { notes, searchQuery, sortMode, viewFilter, activeLabel, activeSubject } = get();

        let filtered = notes;

        // View filter
        switch (viewFilter) {
          case "favorites":
            filtered = filtered.filter((n) => n.isFavorite && !n.archivedAt && !n.deletedAt);
            break;
          case "pinned":
            filtered = filtered.filter((n) => n.isPinned && !n.archivedAt && !n.deletedAt);
            break;
          case "archived":
            filtered = filtered.filter((n) => n.archivedAt && !n.deletedAt);
            break;
          case "trash":
            filtered = filtered.filter((n) => n.deletedAt);
            break;
          case "all":
          default:
            filtered = filtered.filter((n) => !n.archivedAt && !n.deletedAt);
            break;
        }

        // Label filter
        if (activeLabel) {
          filtered = filtered.filter((n) => n.label === activeLabel);
        }

        // Subject filter
        if (activeSubject) {
          filtered = filtered.filter((n) => n.subject === activeSubject);
        }

        // Search
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          filtered = filtered.filter(
            (n) =>
              n.title.toLowerCase().includes(q) ||
              n.content.toLowerCase().includes(q) ||
              n.subject.toLowerCase().includes(q) ||
              n.tags.some((t) => t.toLowerCase().includes(q))
          );
        }

        return sortNotes(filtered, sortMode);
      },

      getSubjects: () => {
        const { notes } = get();
        const subjects = new Set<string>();
        notes.forEach((n) => {
          if (n.subject && !n.deletedAt) subjects.add(n.subject);
        });
        return Array.from(subjects).sort();
      },
    }),
    {
      name: "srmx-notes",
      partialize: (state) => ({
        notes: state.notes,
        sortMode: state.sortMode,
        lastSyncedAt: state.lastSyncedAt,
      }) as unknown as NotesStore,
    }
  )
);
