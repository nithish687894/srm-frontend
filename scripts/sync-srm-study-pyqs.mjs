import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const sourceRoot = path.resolve(root, "..", "..", "srm study");
const publicLibrary = path.join(root, "public", "exam-library");
const manifestPath = path.join(publicLibrary, "manifest.json");

const BLOCKED_NAME = /watermark|watermarked|helper|srm[-_\s]*helper|drive link|gemini|upload guide|semester index|master catalog|manifest/i;
const MONTH_SCORE = {
  dec: 12,
  december: 12,
  nov: 11,
  november: 11,
  jul: 7,
  july: 7,
  jun: 6,
  june: 6,
  may: 5,
  apr: 4,
  april: 4,
  jan: 1,
  january: 1,
};

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/\bfoe\b/g, "fundamental of economics")
    .replace(/\bfds\b/g, "foundation of data science")
    .replace(/\biot\b/g, "internet of things")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function cleanFileName(value) {
  return value
    .replace(/[<>:"/\\|?*]+/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function walkFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkFiles(full));
    else out.push(full);
  }
  return out;
}

function sourceSemesterId(filePath) {
  const match = filePath.match(/[\\/](Sem)_(\d+)[\\/]/i);
  if (!match) return null;
  const number = Number(match[2]);
  if (number === 5 || number === 6) return "sem-5-6";
  return `sem-${number}`;
}

function sourceSubjectName(filePath) {
  const parts = filePath.split(/[\\/]+/);
  const pyqIndex = parts.findIndex((part) => /^PYQs$/i.test(part));
  if (pyqIndex <= 0) return null;
  const subject = parts[pyqIndex - 1];
  if (/^Sem_\d+$/i.test(subject)) return null;
  return subject;
}

function yearScore(name) {
  const years = [...name.matchAll(/\b(20\d{2}|19\d{2})\b/g)].map((match) => Number(match[1]));
  return years.length ? Math.max(...years) : 0;
}

function monthScore(name) {
  const lower = name.toLowerCase();
  for (const [month, score] of Object.entries(MONTH_SCORE)) {
    if (new RegExp(`\\b${month}\\b`, "i").test(lower)) return score;
  }
  return 0;
}

function qualityScore(filePath) {
  const name = path.basename(filePath);
  const lower = name.toLowerCase();
  let score = yearScore(name) * 100 + monthScore(name);
  if (/^pyq\b/i.test(name)) score += 100000;
  if (/question|paper/i.test(name)) score += 5000;
  if (/more pyq|important topic|writing format|ct paper|compilation|model/i.test(lower)) score -= 10000;
  return score;
}

function ensureInside(parent, child) {
  const relative = path.relative(parent, child);
  return relative && !relative.startsWith("..") && !path.isAbsolute(relative);
}

const manifest = readJson(manifestPath, { semesters: [] });
const subjectMap = new Map();
for (const semester of manifest.semesters || []) {
  for (const subject of semester.subjects || []) {
    const keys = new Set([subject.slug, slugify(subject.name)]);
    if (subject.slug === "foundation-of-data-science-fds") keys.add("foundation-of-data-science");
    if (subject.slug === "numerical-methods-analysis") keys.add("numerical-methods-and-analysis");
    if (subject.slug === "electromagnetic-thoery-and-interference") keys.add("electromagnetic-thoery-and-interference");
    if (subject.slug === "semester-6") {
      keys.add("compiler-design");
      keys.add("data-science");
      keys.add("software-engineering-and-project-management");
    }
    for (const key of keys) {
      subjectMap.set(`${semester.id}/${key}`, { semester, subject });
    }
  }
}

const candidates = walkFiles(sourceRoot).filter((file) => {
  if (!/\.pdf$/i.test(file)) return false;
  if (!/[\\/]PYQs[\\/]/i.test(file)) return false;
  if (BLOCKED_NAME.test(path.relative(sourceRoot, file))) return false;
  return true;
});

const grouped = new Map();
const skipped = [];

for (const file of candidates) {
  const semesterId = sourceSemesterId(file);
  const subjectName = sourceSubjectName(file);
  const subjectSlug = subjectName ? slugify(subjectName) : null;
  const match = semesterId && subjectSlug ? subjectMap.get(`${semesterId}/${subjectSlug}`) : null;
  if (!match) {
    skipped.push(path.relative(sourceRoot, file));
    continue;
  }
  const key = `${match.semester.id}/${match.subject.slug}`;
  if (!grouped.has(key)) grouped.set(key, { ...match, files: [] });
  grouped.get(key).files.push(file);
}

let copied = 0;
const selectedReport = [];

for (const group of grouped.values()) {
  const destinationDir = path.join(publicLibrary, group.semester.id, group.subject.slug, "pyqs");
  if (!ensureInside(publicLibrary, destinationDir)) {
    throw new Error(`Refusing to write outside exam library: ${destinationDir}`);
  }
  fs.rmSync(destinationDir, { recursive: true, force: true });
  fs.mkdirSync(destinationDir, { recursive: true });

  const selected = [...group.files]
    .sort((a, b) => qualityScore(b) - qualityScore(a) || path.basename(a).localeCompare(path.basename(b)))
    .slice(0, 3);

  selected.forEach((file, index) => {
    const destinationName = `${String(index + 1).padStart(2, "0")}_${cleanFileName(path.basename(file))}`;
    fs.copyFileSync(file, path.join(destinationDir, destinationName));
    copied += 1;
  });

  selectedReport.push({
    subject: `${group.semester.label} / ${group.subject.name}`,
    files: selected.map((file) => path.basename(file)),
  });
}

const report = {
  sourceRoot,
  candidatePdfs: candidates.length,
  matchedSubjects: grouped.size,
  copied,
  skipped: skipped.length,
  selected: selectedReport,
};

fs.writeFileSync(path.join(publicLibrary, "pyq-sync-report.json"), `${JSON.stringify(report, null, 2)}\n`);
console.log(`Copied ${copied} curated PYQ PDFs across ${grouped.size} subjects.`);
console.log(`Skipped ${skipped.length} PDFs without a manifest subject match.`);
