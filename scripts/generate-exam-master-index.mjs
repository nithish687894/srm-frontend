import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const publicDir = path.join(root, "public");
const libraryDir = path.join(publicDir, "exam-library");
const manifestPath = path.join(libraryDir, "manifest.json");
const outputPath = path.join(libraryDir, "master-index.json");

const helperPattern = /(^|[\\/])(srm[-_\s]*helper|helper|gemini|drive|watermark)([\\/]|$)|watermarked|the helpers/i;

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function publicPath(filePath) {
  return "/" + path.relative(publicDir, filePath).replace(/\\/g, "/");
}

function cleanTitle(value) {
  return value
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase())
    .replace(/\bPyq\b/g, "PYQ")
    .replace(/\bCgpa\b/g, "CGPA")
    .replace(/\bGpa\b/g, "GPA")
    .trim();
}

function tagsFor(name, available = {}) {
  const value = name.toLowerCase();
  const tags = new Set();
  if (available.pyqs || /pyq|question/.test(value)) tags.add("PYQ");
  if (available.notes || /note|material|book|chapter|unit/.test(value)) tags.add("Notes");
  if (available.revision || /revision|last|important/.test(value)) tags.add("Revision");
  if (available.importantQuestions || /important/.test(value)) tags.add("Important");
  if (/chapter/.test(value)) tags.add("Chapter");
  if (/book/.test(value)) tags.add("Book");
  if (!tags.size) tags.add("Resource");
  return [...tags];
}

function walkFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (helperPattern.test(full)) continue;
    if (entry.isDirectory()) out.push(...walkFiles(full));
    else out.push(full);
  }
  return out;
}

const manifest = readJson(manifestPath, { semesters: [] });
const allFiles = walkFiles(libraryDir).filter((file) => {
  if (path.extname(file).toLowerCase() !== ".pdf") return false;
  if (!/[\\/]pyqs[\\/]/i.test(file)) return false;
  return !helperPattern.test(file);
});

const fileByKey = new Map();
for (const file of allFiles) {
  const rel = publicPath(file);
  const parts = rel.split("/");
  const sem = parts[2];
  const subject = parts[3]?.replace(/\.[^.]+$/, "");
  if (!sem || !subject) continue;
  const key = `${sem}/${subject}`;
  if (!fileByKey.has(key)) fileByKey.set(key, []);
  fileByKey.get(key).push(file);
}

const resources = [];

for (const semester of manifest.semesters || []) {
  for (const subject of semester.subjects || []) {
    const key = `${semester.id}/${subject.slug}`;
    const files = (fileByKey.get(key) || [])
      .sort((a, b) => path.basename(a).localeCompare(path.basename(b)))
      .slice(0, 3);
    const basePath = subject.path || `/exam-library/${semester.id}/${subject.slug}`;
    const baseTags = tagsFor(`${subject.name} ${subject.readiness}`, subject.availableContent);

    resources.push({
      id: `${key}/folder`,
      semester: semester.label,
      semesterId: semester.id,
      subject: subject.name,
      subjectSlug: subject.slug,
      category: "Subject Folder",
      title: `${subject.name} PYQ Folder`,
      path: `${basePath}/`,
      type: "folder",
      isPremium: subject.readiness !== "Needs OCR",
      tags: ["PYQ", ...baseTags.filter((tag) => tag !== "PYQ")].slice(0, 3),
      resourceCount: files.length,
      questionCount: subject.questionCount || 0,
      sourceCount: subject.sourceCount || 0,
    });

    for (const [index, file] of files.entries()) {
      const name = path.basename(file);
      const rel = publicPath(file);
      resources.push({
        id: rel,
        semester: semester.label,
        semesterId: semester.id,
        subject: subject.name,
        subjectSlug: subject.slug,
        category: "PYQs",
        title: cleanTitle(name),
        fileName: name,
        path: rel,
        type: "pdf",
        isPremium: index > 0,
        tags: index === 0 ? ["PYQ", "Question Paper", "Sample"] : ["PYQ", "Question Paper"],
      });
    }
  }
}

const master = {
  generatedAt: new Date().toISOString(),
  source: "local-public-exam-library",
  noGoogleDrive: true,
  noGeminiForViewing: true,
  semesters: manifest.semesters || [],
  resources,
};

fs.writeFileSync(outputPath, `${JSON.stringify(master, null, 2)}\n`);
console.log(`Generated ${path.relative(root, outputPath)} with ${resources.length} resources.`);
