export type ExamReadiness = "Ready" | "Needs OCR" | "Partial";

export type ExamAvailableContent = {
  notes: boolean;
  pyqs: boolean;
  importantQuestions: boolean;
  revision: boolean;
};

export type ExamSubjectSummary = {
  slug: string;
  name: string;
  readiness: ExamReadiness;
  availableContent: ExamAvailableContent;
  questionCount: number;
  sourceCount: number;
  path: string;
};

export type ExamSemester = {
  id: string;
  label: string;
  subjectCount: number;
  subjects: ExamSubjectSummary[];
};

export type ExamManifest = {
  generatedAt: string;
  semesters: ExamSemester[];
};

export type ExamSubjectMetadata = {
  semester: string;
  semesterLabel: string;
  subject: string;
  subjectSlug: string;
  readiness: ExamReadiness;
  statusMessage: string;
  availableContent: ExamAvailableContent;
  sourceCount: number;
  questionCount: number;
  updatedAt: string;
};

export type ExamQuestion = {
  id: string;
  text: string;
  unit: string;
  topic: string;
  marks: number | null;
  badges: string[];
  source: string;
};

const manifestCache: { value?: Promise<ExamManifest> } = {};
const metadataCache = new Map<string, Promise<ExamSubjectMetadata>>();
const materialsCache = new Map<string, Promise<string>>();
const pyqCache = new Map<string, Promise<string>>();
const questionsCache = new Map<string, Promise<ExamQuestion[]>>();

async function fetchText(path: string) {
  const response = await fetch(path);
  if (!response.ok) return "";
  return response.text();
}

async function fetchJson<T>(path: string, fallback: T): Promise<T> {
  const response = await fetch(path);
  if (!response.ok) return fallback;
  return response.json() as Promise<T>;
}

export function getSemesters() {
  manifestCache.value ||= fetchJson<ExamManifest>("/exam-library/manifest.json", {
    generatedAt: "",
    semesters: [],
  });
  return manifestCache.value.then((manifest) => manifest.semesters);
}

export async function getSubjectsBySemester(semester: string) {
  const semesters = await getSemesters();
  return semesters.find((item) => item.id === semester)?.subjects || [];
}

export function getSubjectMetadata(semester: string, subjectSlug: string) {
  const key = `${semester}/${subjectSlug}/metadata`;
  if (!metadataCache.has(key)) {
    metadataCache.set(
      key,
      fetchJson<ExamSubjectMetadata>(`/exam-library/${semester}/${subjectSlug}/metadata.json`, {
        semester,
        semesterLabel: semester,
        subject: subjectSlug,
        subjectSlug,
        readiness: "Partial",
        statusMessage: "This content is not available in uploaded resources yet.",
        availableContent: { notes: false, pyqs: false, importantQuestions: false, revision: false },
        sourceCount: 0,
        questionCount: 0,
        updatedAt: "",
      }),
    );
  }
  return metadataCache.get(key)!;
}

export function getSubjectMaterials(semester: string, subjectSlug: string) {
  const key = `${semester}/${subjectSlug}/materials`;
  if (!materialsCache.has(key)) {
    materialsCache.set(key, fetchText(`/exam-library/${semester}/${subjectSlug}/combined_materials.txt`));
  }
  return materialsCache.get(key)!;
}

export function getSubjectPyqs(semester: string, subjectSlug: string) {
  const key = `${semester}/${subjectSlug}/pyqs`;
  if (!pyqCache.has(key)) {
    pyqCache.set(key, fetchText(`/exam-library/${semester}/${subjectSlug}/pyq_question_bank.md`));
  }
  return pyqCache.get(key)!;
}

export function getSubjectQuestions(semester: string, subjectSlug: string) {
  const key = `${semester}/${subjectSlug}/questions`;
  if (!questionsCache.has(key)) {
    questionsCache.set(key, fetchJson<ExamQuestion[]>(`/exam-library/${semester}/${subjectSlug}/questions.json`, []));
  }
  return questionsCache.get(key)!;
}
