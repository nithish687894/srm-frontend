import { chromium } from "playwright";
import { mkdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const baseUrl = "http://127.0.0.1:3000";
const screenPath = resolve("public/marketing/srm-nexus-real-dashboard-screen.png");
const posterPath = resolve("public/marketing/srm-nexus-real-dashboard-poster.png");

await mkdir(resolve("public/marketing"), { recursive: true });

const demoAcademicData = {
  profile: {
    Name: "AURA",
    "Registration Number": "RA2411003010000",
    "Combo / Batch": "B.Tech CSE / Batch 1",
    CGPA: "9.74",
    SGPA: "9.68",
  },
  attendance: [
    { "Course Code": "15CS301J", "Course Title": "Design And Analysis Of Algorithms", "Hours Conducted": "50", "Hours Attended": "46", "Hours Absent": "4", "Attn %": "92.0", Category: "Theory" },
    { "Course Code": "15CS302J", "Course Title": "Operating Systems", "Hours Conducted": "48", "Hours Attended": "42", "Hours Absent": "6", "Attn %": "87.5", Category: "Theory" },
    { "Course Code": "15CS303J", "Course Title": "Database Management Systems", "Hours Conducted": "44", "Hours Attended": "39", "Hours Absent": "5", "Attn %": "88.6", Category: "Theory" },
    { "Course Code": "15AI201J", "Course Title": "Artificial Intelligence", "Hours Conducted": "36", "Hours Attended": "32", "Hours Absent": "4", "Attn %": "88.9", Category: "Theory" },
  ],
  marks: [
    { courseCode: "15CS301J", courseTitle: "Design And Analysis Of Algorithms", tests: [{ test: "CT1/20", score: "18.5" }, { test: "CT2/20", score: "19" }, { test: "MODEL/50", score: "43.5" }] },
    { courseCode: "15CS302J", courseTitle: "Operating Systems", tests: [{ test: "CT1/20", score: "17.5" }, { test: "CT2/20", score: "18" }, { test: "MODEL/50", score: "43" }] },
    { courseCode: "15CS303J", courseTitle: "Database Management Systems", tests: [{ test: "CT1/20", score: "18" }, { test: "CT2/20", score: "18.5" }, { test: "MODEL/50", score: "42.5" }] },
    { courseCode: "15AI201J", courseTitle: "Artificial Intelligence", tests: [{ test: "CT1/20", score: "19" }, { test: "CT2/20", score: "18.5" }, { test: "MODEL/50", score: "44" }] },
  ],
  lastFetchedAt: Date.now(),
};

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2, isMobile: true });
const page = await context.newPage();

await page.route("**/api/v1/data/unified", async (route) => {
  await route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ success: true, academia: demoAcademicData, studentPortal: null }),
  });
});
await page.route("**/api/timetable**", async (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: { rows: [] } }) }));
await page.route("**/api/my-timetable**", async (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: { courses: [], studentInfo: demoAcademicData.profile } }) }));
await page.route("**/api/calendar**", async (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(null) }));
await page.route("**/api/admin/broadcast**", async (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(null) }));

await page.addInitScript((data) => {
  localStorage.setItem("authToken", "demo-token");
  localStorage.setItem("refreshToken", "demo-refresh");
  localStorage.setItem("userEmail", "demo12@srmist.edu.in");
  localStorage.setItem("srmx-theme", JSON.stringify({ state: { theme: "aura" }, version: 0 }));
  localStorage.setItem("srmx-auth", JSON.stringify({
    state: {
      authToken: "demo-token",
      refreshToken: "demo-refresh",
      email: "demo12@srmist.edu.in",
      profile: data.profile,
      academicData: data,
      academiaConnected: true,
      hasChosenTheme: true,
      studentPortalConnected: false,
      studentPortalData: null,
    },
    version: 0,
  }));
}, demoAcademicData);

await page.goto(`${baseUrl}/dashboard`, { waitUntil: "networkidle" });
await page.waitForTimeout(8000);
await page.screenshot({ path: screenPath, fullPage: false });
await context.close();

const screenDataUrl = `data:image/png;base64,${(await readFile(screenPath)).toString("base64")}`;

const posterPage = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
await posterPage.setContent(`
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    * { box-sizing: border-box; }
    html, body { width: 1080px; height: 1350px; margin: 0; overflow: hidden; }
    body { font-family: Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif; background: #080810; color: white; }
    .poster { position: relative; width: 1080px; height: 1350px; background: #080810; overflow: hidden; }
    .glow { position: absolute; border-radius: 999px; filter: blur(72px); pointer-events: none; }
    .g1 { width: 880px; height: 880px; left: 90px; top: 150px; background: radial-gradient(circle, rgba(109,93,246,.34), transparent 70%); }
    .g2 { width: 640px; height: 700px; right: -160px; top: 120px; background: radial-gradient(circle, rgba(255,79,184,.16), transparent 70%); }
    .g3 { width: 760px; height: 520px; left: 280px; bottom: 70px; background: radial-gradient(circle, rgba(0,229,255,.12), transparent 70%); }
    .stars span { position: absolute; border-radius: 50%; background: rgba(255,255,255,.22); box-shadow: 0 0 8px rgba(255,255,255,.35); }
    .badge {
      position: absolute; left: 72px; top: 70px; height: 52px; padding: 0 24px 0 48px;
      display: flex; align-items: center; border-radius: 999px; background: rgba(29,17,48,.9);
      border: 1px solid rgba(139,92,246,.42); box-shadow: 0 0 28px rgba(139,92,246,.32);
      color: #d8b4fe; font-size: 14px; font-weight: 900; letter-spacing: .02em;
    }
    .badge:before { content: ""; position: absolute; left: 22px; width: 12px; height: 12px; border-radius: 50%; background: #00ff88; box-shadow: 0 0 18px rgba(0,255,136,.75); }
    h1 { position: absolute; left: 72px; top: 178px; width: 910px; margin: 0; font-size: 64px; line-height: 1.02; letter-spacing: -2.5px; font-weight: 950; }
    h1 span { display: block; color: #8b5cf6; margin-top: 8px; }
    .sub { position: absolute; left: 76px; top: 358px; width: 620px; color: #a1a1aa; font-size: 26px; line-height: 1.28; font-weight: 500; }
    .proof { position: absolute; right: 76px; top: 358px; height: 54px; padding: 0 24px 0 48px; display: flex; align-items: center; border-radius: 999px; background: rgba(16,16,23,.92); border: 1px solid rgba(0,255,136,.22); color: #00ff88; font-size: 14px; font-weight: 900; letter-spacing: .05em; }
    .proof:before { content: ""; position: absolute; left: 22px; width: 12px; height: 12px; border-radius: 50%; background: #00ff88; }
    .phone { position: absolute; left: 430px; top: 462px; width: 414px; height: 802px; border-radius: 74px; transform: rotate(-4deg); background: #2e2b34; border: 5px solid rgba(183,179,196,.34); box-shadow: 34px 54px 88px rgba(0,0,0,.74), -18px 10px 62px rgba(139,92,246,.32); padding: 18px; overflow: hidden; }
    .screen { width: 100%; height: 100%; border-radius: 54px; overflow: hidden; background: #05050a; border: 1px solid rgba(255,255,255,.06); }
    .screen img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .chips { position: absolute; left: 72px; top: 560px; display: grid; gap: 22px; }
    .chip { width: 224px; height: 58px; border-radius: 999px; background: rgba(17,17,26,.93); border: 1px solid rgba(255,255,255,.08); box-shadow: 0 14px 28px rgba(0,0,0,.28); display: flex; align-items: center; gap: 14px; padding: 0 20px; font-size: 15px; font-weight: 900; }
    .dot { width: 12px; height: 12px; border-radius: 50%; flex: none; }
    .url { position: absolute; left: 72px; bottom: 76px; font-size: 32px; font-weight: 950; }
    .footer { position: absolute; right: 76px; bottom: 83px; width: 420px; text-align: right; color: #a1a1aa; font-size: 18px; font-weight: 500; }
  </style>
</head>
<body>
  <main class="poster">
    <div class="glow g1"></div><div class="glow g2"></div><div class="glow g3"></div>
    <div class="stars">${Array.from({ length: 76 }, (_, i) => `<span style="left:${(i * 149) % 1040 + 20}px;top:${(i * 239) % 1306 + 20}px;opacity:${0.15 + (i % 5) * 0.05};width:${i % 10 === 0 ? 3 : 1.7}px;height:${i % 10 === 0 ? 3 : 1.7}px"></span>`).join("")}</div>
    <div class="badge">SRM NEXUS V2.6 · REAL DASHBOARD</div>
    <h1>Everything academic.<span>One intelligent dashboard.</span></h1>
    <div class="sub">Real SRM Nexus dashboard, powered by live academic intelligence.</div>
    <div class="proof">PORTAL INSIGHTS LIVE</div>
    <section class="chips">
      <div class="chip"><span class="dot" style="background:#00e5ff"></span>ATTENDANCE&nbsp; 88.5%</div>
      <div class="chip"><span class="dot" style="background:#ff4fb8"></span>ACADEMIC&nbsp; 88.4%</div>
      <div class="chip"><span class="dot" style="background:#8b5cf6"></span>SGPA&nbsp; 9.68</div>
      <div class="chip"><span class="dot" style="background:#ff4fb8"></span>CGPA&nbsp; 9.74</div>
    </section>
    <section class="phone"><div class="screen"><img src="${screenDataUrl}" /></div></section>
    <div class="url">srmnexus.app</div>
    <div class="footer">Built for students. Powered by intelligence.</div>
  </main>
</body>
</html>
`);
await posterPage.screenshot({ path: posterPath, clip: { x: 0, y: 0, width: 1080, height: 1350 } });
await browser.close();
console.log(JSON.stringify({ screenPath, posterPath }));
