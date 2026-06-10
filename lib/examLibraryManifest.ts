export type ExamLibraryType = "folder" | "pdf" | "html" | "markdown" | "text" | "json" | "file";

export type ExamLibraryResource = {
  id: string;
  semester: string;
  semesterId: string;
  subject: string;
  subjectSlug: string;
  category: string;
  title: string;
  fileName?: string;
  path: string;
  type: ExamLibraryType;
  isPremium: boolean;
  tags: string[];
  resourceCount?: number;
  questionCount?: number;
  sourceCount?: number;
};

export type ExamLibrarySubject = {
  slug: string;
  name: string;
  readiness: "Ready" | "Needs OCR" | "Partial";
  questionCount: number;
  sourceCount: number;
  path: string;
  availableContent: {
    notes: boolean;
    pyqs: boolean;
    importantQuestions: boolean;
    revision: boolean;
  };
};

export type ExamLibrarySemester = {
  id: string;
  label: string;
  subjectCount: number;
  subjects: ExamLibrarySubject[];
};

export type ExamLibraryMasterIndex = {
  generatedAt: string;
  source: string;
  noGoogleDrive: boolean;
  noGeminiForViewing: boolean;
  semesters: ExamLibrarySemester[];
  resources: ExamLibraryResource[];
};

export const EXAM_LIBRARY_STORAGE_BASE =
  (process.env.NEXT_PUBLIC_EXAM_LIBRARY_STORAGE_BASE || "https://dqioqucinlgzftvtafgp.supabase.co/storage/v1/object/public/srm%20exam").replace(/\/$/, "");

const indexCache: { value?: Promise<ExamLibraryMasterIndex> } = {};

async function fetchJson<T>(path: string, fallback: T): Promise<T> {
  try {
    const response = await fetch(path, { cache: "no-store" });
    if (!response.ok) return fallback;
    return response.json() as Promise<T>;
  } catch {
    return fallback;
  }
}

export function resolveExamResourceUrl(path: string) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return `${EXAM_LIBRARY_STORAGE_BASE}/${path.replace(/^\/?exam-library\/?/, "").replace(/^\/+/, "").split("/").map(encodeURIComponent).join("/")}`;
}

export function getExamLibraryIndex() {
  const fallback: ExamLibraryMasterIndex = {
    generatedAt: "",
    source: "missing",
    noGoogleDrive: true,
    noGeminiForViewing: true,
    semesters: [],
    resources: [],
  };
  indexCache.value ||= fetchJson<ExamLibraryMasterIndex>(`${EXAM_LIBRARY_STORAGE_BASE}/master-index.json`, fallback).then((remoteIndex) => {
    if (remoteIndex.resources.length) return remoteIndex;
    return fetchJson<ExamLibraryMasterIndex>("/exam-library/master-index.json", fallback);
  });
  return indexCache.value;
}

export function searchExamResources(resources: ExamLibraryResource[], query: string) {
  const tokens = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (!tokens.length) return resources;
  return resources.filter((item) => {
    const haystack = [
      item.semester,
      item.semesterId,
      item.subject,
      item.subjectSlug,
      item.title,
      item.category,
      item.fileName,
      item.type,
      ...(item.tags || []),
    ].join(" ").toLowerCase();
    return tokens.every((token) => haystack.includes(token));
  });
}

export function resourceCanOpen(resource: ExamLibraryResource, isPremium: boolean) {
  if (!resource.isPremium) return true;
  return isPremium;
}

export function formatSemesterHref(semesterId: string) {
  return `/exam-library/${encodeURIComponent(semesterId)}`;
}

export function formatSubjectHref(semesterId: string, subjectSlug: string) {
  return `/exam-library/${encodeURIComponent(semesterId)}/${encodeURIComponent(subjectSlug)}`;
}

export function formatViewerHref(resource: ExamLibraryResource) {
  const params = new URLSearchParams({
    title: resource.title,
    path: resolveExamResourceUrl(resource.path),
    type: resource.type,
    semester: resource.semesterId,
    subject: resource.subjectSlug,
    premium: resource.isPremium ? "1" : "0",
  });
  return `/exam-library/viewer?${params.toString()}`;
}
