import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const datasetRoot =
  process.env.SRM_AI_DATASET_DIR ||
  path.join(process.env.USERPROFILE || "", "OneDrive", "Desktop", "srm_ai_training_dataset");
const libraryRoot = path.join(projectRoot, "public", "exam-library");
const manifestPath = path.join(libraryRoot, "manifest.json");

function slug(value) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

function titleFromFile(fileName) {
  return path.basename(fileName, ".txt").replaceAll("_", " ");
}

function semesterInfo(folderName) {
  const raw = folderName.replace(/^Sem_/i, "");
  return {
    id: `sem-${raw.toLowerCase().replaceAll("_", "-")}`,
    label: raw.includes("_") ? `Sem ${raw.replaceAll("_", "/")}` : `Sem ${raw}`,
    sourceKey: folderName,
  };
}

function normalizeText(raw) {
  return raw.replace(/\r\n/g, "\n").replace(/\n{4,}/g, "\n\n\n").trim();
}

function splitBySource(text) {
  const marker = /^===== SOURCE_FILE: (.+?) =====$/gm;
  const matches = [...text.matchAll(marker)];
  if (!matches.length) return [{ source: "combined_materials", body: text, category: "Notes", status: "ok" }];

  return matches.map((match, index) => {
    const start = match.index + match[0].length;
    const end = matches[index + 1]?.index ?? text.length;
    const body = text.slice(start, end).trim();
    const category = body.match(/^CATEGORY:\s*(.+)$/m)?.[1]?.trim() || "Notes";
    const status = body.match(/^STATUS:\s*(.+)$/m)?.[1]?.trim() || "ok";
    return { source: match[1].trim(), body, category, status };
  });
}

function isQuestionLine(line) {
  const cleaned = line.trim();
  if (cleaned.length < 18 || cleaned.length > 700) return false;
  if (/^(part|page|marks|answer all|time|max\.?|reg\.?)/i.test(cleaned)) return false;
  return /^(\(?\d{1,2}\)?[.)\s-]+|[a-z][.)]\s+)/i.test(cleaned) || /\?$/.test(cleaned);
}

function marksFromText(text) {
  if (/\b10\s*marks?\b|\b10\s*mark\b/i.test(text)) return 10;
  if (/\b5\s*marks?\b|\b5\s*mark\b/i.test(text)) return 5;
  if (/\b2\s*marks?\b|\b2\s*mark\b/i.test(text)) return 2;
  if (/\b15\s*marks?\b|\b15\s*mark\b/i.test(text)) return 10;
  return null;
}

function unitFromText(text, fallbackIndex) {
  const unit = text.match(/\bunit\s*[-:]?\s*([ivx]+|\d+)/i)?.[1];
  if (unit) return `Unit ${unit.toUpperCase()}`;
  return fallbackIndex ? `Topic ${fallbackIndex}` : "Ungrouped";
}

function extractQuestions(sections) {
  const questions = [];
  let id = 1;

  for (const section of sections) {
    if (!/pyq|question|qb|important/i.test(section.category + " " + section.source + " " + section.body)) continue;

    const lines = section.body
      .split("\n")
      .map((line) => line.replace(/\s+/g, " ").trim())
      .filter(Boolean);

    for (const line of lines) {
      if (!isQuestionLine(line)) continue;
      const text = line.replace(/^\(?\d{1,2}\)?[.)\s-]+/, "").trim();
      const marks = marksFromText(line);
      const repeated = /repeated|appeared|asked/i.test(section.source + " " + line);
      const important = /important|must|probable|expected/i.test(section.source + " " + line);
      questions.push({
        id: `q-${id++}`,
        text,
        unit: unitFromText(line, null),
        topic: unitFromText(section.source, null),
        marks,
        badges: [
          "PYQ",
          ...(repeated ? ["Repeated"] : []),
          ...(important ? ["Important"] : []),
          ...(marks ? [`${marks} Mark`] : []),
        ],
        source: section.source,
      });
      if (questions.length >= 220) return questions;
    }
  }

  return questions;
}

function makePyqMarkdown(sections) {
  const pyqSections = sections.filter((section) => /pyq|question|qb/i.test(section.category + " " + section.source));
  if (!pyqSections.length) return "";
  return pyqSections
    .map((section) => `## ${section.source}\n\n${section.body}`)
    .join("\n\n---\n\n")
    .trim();
}

function readiness(sections, combinedText) {
  const statuses = sections.map((section) => section.status.toLowerCase());
  const hasPending = statuses.some((status) => /timeout|no-text|ocr|skipped|url_reference_only/i.test(status));
  const hasOk = statuses.some((status) => status === "ok");
  if (hasPending && hasOk) return "Partial";
  if (hasPending || combinedText.length < 900) return "Needs OCR";
  return "Ready";
}

function availability({ notes, pyqMarkdown, questions }) {
  return {
    notes: notes.length > 0,
    pyqs: pyqMarkdown.length > 0,
    importantQuestions: questions.some((question) => question.badges.includes("Important")),
    revision: notes.length > 1200,
  };
}

async function exists(target) {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  if (!(await exists(datasetRoot))) throw new Error(`Dataset folder not found: ${datasetRoot}`);

  await fs.rm(libraryRoot, { recursive: true, force: true });
  await fs.mkdir(libraryRoot, { recursive: true });

  const semesterFolders = (await fs.readdir(datasetRoot, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory() && /^Sem_/i.test(entry.name))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

  const manifest = { generatedAt: new Date().toISOString(), semesters: [] };

  for (const folder of semesterFolders) {
    const info = semesterInfo(folder.name);
    const subjectsDir = path.join(datasetRoot, folder.name, "subjects");
    if (!(await exists(subjectsDir))) continue;

    const semDir = path.join(libraryRoot, info.id);
    await fs.mkdir(semDir, { recursive: true });
    const semEntry = { id: info.id, label: info.label, subjectCount: 0, subjects: [] };

    const subjectFiles = (await fs.readdir(subjectsDir, { withFileTypes: true }))
      .filter((entry) => entry.isFile() && entry.name.endsWith(".txt"))
      .sort((a, b) => a.name.localeCompare(b.name));

    for (const file of subjectFiles) {
      const subject = titleFromFile(file.name);
      const subjectSlug = slug(subject);
      const subjectDir = path.join(semDir, subjectSlug);
      await fs.mkdir(subjectDir, { recursive: true });

      const raw = await fs.readFile(path.join(subjectsDir, file.name), "utf8");
      const combined = normalizeText(raw);
      const sections = splitBySource(combined);
      const pyqMarkdown = makePyqMarkdown(sections);
      const questions = extractQuestions(sections);
      const status = readiness(sections, combined);
      const available = availability({ notes: combined, pyqMarkdown, questions });

      const metadata = {
        semester: info.id,
        semesterLabel: info.label,
        subject,
        subjectSlug,
        readiness: status,
        statusMessage:
          status === "Ready"
            ? "Ready"
            : status === "Partial"
              ? "Some scanned resources still need OCR, so this subject may be partial."
              : "Some scanned resources still need OCR, so this subject may be partial.",
        availableContent: available,
        sourceCount: sections.length,
        questionCount: questions.length,
        updatedAt: manifest.generatedAt,
      };

      await fs.writeFile(path.join(subjectDir, "combined_materials.txt"), `${combined}\n`, "utf8");
      await fs.writeFile(path.join(subjectDir, "pyq_question_bank.md"), `${pyqMarkdown}\n`, "utf8");
      await fs.writeFile(path.join(subjectDir, "questions.json"), `${JSON.stringify(questions, null, 2)}\n`, "utf8");
      await fs.writeFile(path.join(subjectDir, "metadata.json"), `${JSON.stringify(metadata, null, 2)}\n`, "utf8");

      semEntry.subjects.push({
        slug: subjectSlug,
        name: subject,
        readiness: status,
        availableContent: available,
        questionCount: questions.length,
        sourceCount: sections.length,
        path: `/exam-library/${info.id}/${subjectSlug}`,
      });
    }

    semEntry.subjectCount = semEntry.subjects.length;
    manifest.semesters.push(semEntry);
  }

  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  console.log(`Generated Exam Library: ${manifest.semesters.length} semesters, ${manifest.semesters.reduce((sum, sem) => sum + sem.subjectCount, 0)} subjects`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
