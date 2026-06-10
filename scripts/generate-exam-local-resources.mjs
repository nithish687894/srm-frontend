import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const datasetRoot =
  process.env.SRM_AI_DATASET_DIR ||
  path.join(process.env.USERPROFILE || "", "OneDrive", "Desktop", "srm_ai_training_dataset");
const outputRoot = path.join(projectRoot, "public", "exam-resources");
const catalogPath = path.join(projectRoot, "public", "exam-local-catalog.json");
const watermark = "srmnexus.app";

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function subjectNameFromFile(fileName) {
  return path.basename(fileName, ".txt").replaceAll("_", " ");
}

function slug(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

function semesterKeys(folderName) {
  const key = folderName.replace(/^Sem_/i, "");
  if (key.includes("_")) return key.split("_").filter(Boolean);
  return [key];
}

function normalizeText(raw) {
  return raw
    .replace(/\r\n/g, "\n")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();
}

function buildHtml({ semesterLabel, subjectName, content }) {
  const escapedContent = escapeHtml(content);
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(subjectName)} - ${escapeHtml(semesterLabel)} - SRM Nexus</title>
  <style>
    @page { margin: 18mm 14mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      color: #14121f;
      background: #f7f7fb;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      line-height: 1.58;
    }
    body::before {
      content: "${watermark}";
      position: fixed;
      inset: 0;
      z-index: 0;
      display: grid;
      place-items: center;
      color: rgba(191, 90, 242, 0.12);
      font-size: clamp(42px, 10vw, 110px);
      font-weight: 900;
      transform: rotate(-28deg);
      pointer-events: none;
      letter-spacing: 0;
    }
    .page {
      position: relative;
      z-index: 1;
      max-width: 960px;
      min-height: 100vh;
      margin: 0 auto;
      padding: 28px 20px 42px;
      background:
        linear-gradient(rgba(255,255,255,0.92), rgba(255,255,255,0.92)),
        repeating-linear-gradient(-28deg, transparent 0 120px, rgba(191,90,242,0.045) 120px 122px);
    }
    header {
      border-bottom: 1px solid rgba(20,20,40,0.12);
      padding-bottom: 18px;
      margin-bottom: 22px;
    }
    .brand {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      color: #6f6781;
      font-size: 12px;
      font-weight: 850;
      text-transform: uppercase;
    }
    h1 {
      margin: 10px 0 0;
      font-size: 30px;
      line-height: 1.08;
      letter-spacing: 0;
    }
    .meta {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 14px;
    }
    .pill {
      border: 1px solid rgba(20,20,40,0.12);
      border-radius: 999px;
      padding: 7px 10px;
      color: #574d68;
      background: rgba(255,255,255,0.72);
      font-size: 12px;
      font-weight: 800;
    }
    pre {
      white-space: pre-wrap;
      word-break: break-word;
      margin: 0;
      font: 13.5px/1.62 ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;
      color: #15131f;
    }
    footer {
      margin-top: 28px;
      padding-top: 16px;
      border-top: 1px solid rgba(20,20,40,0.12);
      color: #6f6781;
      font-size: 12px;
      font-weight: 750;
    }
    @media print {
      body { background: white; }
      .page { padding: 0; max-width: none; background: white; }
      body::before { color: rgba(191, 90, 242, 0.10); }
    }
  </style>
</head>
<body>
  <main class="page">
    <header>
      <div class="brand">
        <span>SRM Nexus Exam Resource</span>
        <span>${watermark}</span>
      </div>
      <h1>${escapeHtml(subjectName)}</h1>
      <div class="meta">
        <span class="pill">${escapeHtml(semesterLabel)}</span>
        <span class="pill">Watermarked study resource</span>
        <span class="pill">Generated from local SRM dataset</span>
      </div>
    </header>
    <pre>${escapedContent}</pre>
    <footer>${watermark} • Local dataset resource • Use with official course material where required.</footer>
  </main>
</body>
</html>`;
}

async function pathExists(target) {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

async function maybeGeneratePdf(htmlFiles) {
  let chromium;
  try {
    ({ chromium } = await import("playwright"));
  } catch {
    return new Set();
  }

  const generated = new Set();
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    for (const item of htmlFiles) {
      const pdfPath = item.htmlPath.replace(/\.html$/i, ".pdf");
      await page.goto(`file://${item.htmlPath.replaceAll("\\", "/")}`, { waitUntil: "load" });
      await page.pdf({
        path: pdfPath,
        format: "A4",
        printBackground: true,
        margin: { top: "12mm", right: "10mm", bottom: "12mm", left: "10mm" },
      });
      generated.add(pdfPath);
    }
  } finally {
    await browser.close();
  }
  return generated;
}

async function main() {
  if (!(await pathExists(datasetRoot))) {
    throw new Error(`Dataset folder not found: ${datasetRoot}`);
  }

  await fs.rm(outputRoot, { recursive: true, force: true });
  await fs.mkdir(outputRoot, { recursive: true });

  const semesterFolders = (await fs.readdir(datasetRoot, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory() && /^Sem_/i.test(entry.name))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

  const catalog = {};
  const htmlFiles = [];

  for (const folder of semesterFolders) {
    const subjectsDir = path.join(datasetRoot, folder.name, "subjects");
    if (!(await pathExists(subjectsDir))) continue;

    const semKeys = semesterKeys(folder.name);
    const semFolder = slug(folder.name);
    const outDir = path.join(outputRoot, semFolder);
    await fs.mkdir(outDir, { recursive: true });

    const subjectFiles = (await fs.readdir(subjectsDir, { withFileTypes: true }))
      .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".txt"))
      .sort((a, b) => a.name.localeCompare(b.name));

    for (const file of subjectFiles) {
      const subjectName = subjectNameFromFile(file.name);
      const content = normalizeText(await fs.readFile(path.join(subjectsDir, file.name), "utf8"));
      if (!content) continue;

      const subjectSlug = slug(subjectName);
      const htmlName = `${subjectSlug}.html`;
      const htmlPath = path.join(outDir, htmlName);
      const htmlUrl = `/exam-resources/${semFolder}/${htmlName}`;
      await fs.writeFile(
        htmlPath,
        buildHtml({
          semesterLabel: semKeys.length > 1 ? `Sem ${semKeys.join(" / Sem ")}` : `Sem ${semKeys[0]}`,
          subjectName,
          content,
        }),
        "utf8",
      );
      htmlFiles.push({ htmlPath, htmlUrl, semKeys, subjectName, subjectSlug, semFolder });

      for (const semKey of semKeys) {
        catalog[semKey] ||= [];
        catalog[semKey].push({
          subject: subjectName,
          notes: [
            {
              name: `${subjectName} - SRM Nexus dataset`,
              url: htmlUrl,
              local: true,
              watermarked: true,
            },
          ],
        });
      }
    }
  }

  let generatedPdfs = new Set();
  try {
    generatedPdfs = await maybeGeneratePdf(htmlFiles);
  } catch (error) {
    console.warn(`PDF generation skipped: ${error.message}`);
  }

  for (const item of htmlFiles) {
    const pdfPath = item.htmlPath.replace(/\.html$/i, ".pdf");
    if (!generatedPdfs.has(pdfPath)) continue;
    const pdfUrl = item.htmlUrl.replace(/\.html$/i, ".pdf");
    for (const semKey of item.semKeys) {
      const entry = catalog[semKey]?.find((subject) => subject.subject === item.subjectName);
      if (entry?.notes?.[0]) entry.notes[0].url = pdfUrl;
    }
  }

  for (const semKey of Object.keys(catalog)) {
    catalog[semKey].sort((a, b) => a.subject.localeCompare(b.subject));
  }

  await fs.writeFile(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");

  const htmlCount = htmlFiles.length;
  const pdfCount = generatedPdfs.size;
  console.log(`Generated ${htmlCount} watermarked resources.`);
  console.log(`Generated ${pdfCount} PDFs.`);
  console.log(`Catalog: ${catalogPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
