import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const uploadRoot = path.join(root, "dist", "exam-library-upload");
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;
const bucket = process.env.SUPABASE_BUCKET || "srm exam";

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_PUBLISHABLE_KEY.");
  console.error("Example:");
  console.error('$env:SUPABASE_URL="https://PROJECT.supabase.co"; $env:SUPABASE_PUBLISHABLE_KEY="sb_publishable_..."; npm run upload:exam-library');
  process.exit(1);
}

if (!fs.existsSync(uploadRoot)) {
  console.error(`Upload folder not found: ${uploadRoot}`);
  process.exit(1);
}

function contentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".pdf") return "application/pdf";
  if (ext === ".json") return "application/json";
  return "application/octet-stream";
}

function walkFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkFiles(full));
    else out.push(full);
  }
  return out;
}

function objectPath(filePath) {
  return path.relative(uploadRoot, filePath).replace(/\\/g, "/");
}

async function uploadFile(filePath) {
  const key = objectPath(filePath);
  const url = `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/${encodeURIComponent(bucket)}/${key.split("/").map(encodeURIComponent).join("/")}`;
  const headers = {
    apikey: supabaseKey,
    "Content-Type": contentType(filePath),
    "Cache-Control": "31536000",
  };
  if (supabaseKey.split(".").length === 3) {
    headers.Authorization = `Bearer ${supabaseKey}`;
  }
  let response;
  let body = "";
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    response = await fetch(url, {
      method: "POST",
      headers,
      body: fs.readFileSync(filePath),
    });
    if (response.ok) break;
    body = await response.text();
    if (response.status === 400 && body.includes('"Duplicate"')) {
      return `${key} (already exists)`;
    }
    if (response.status < 500 || attempt === 4) break;
    await new Promise((resolve) => setTimeout(resolve, attempt * 2000));
  }

  if (!response.ok) {
    body ||= await response.text();
    throw new Error(`${response.status} ${response.statusText}: ${key}\n${body}`);
  }
  return key;
}

const files = walkFiles(uploadRoot);
let uploaded = 0;

console.log(`Uploading ${files.length} files to bucket "${bucket}"...`);

for (const file of files) {
  const key = await uploadFile(file);
  uploaded += 1;
  console.log(`[${uploaded}/${files.length}] ${key}`);
}

console.log("Done.");
console.log(`Public base URL: ${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/${encodeURIComponent(bucket)}`);
