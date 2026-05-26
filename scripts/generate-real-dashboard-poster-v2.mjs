import { chromium } from "playwright";
import { mkdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const baseUrl = "http://127.0.0.1:3000";
const outDir = resolve("public/marketing");
const screenPath = resolve(outDir, "srm-nexus-real-dashboard-screen-v2.png");
const posterPath = resolve(outDir, "srm-nexus-real-dashboard-poster-v2.png");

await mkdir(outDir, { recursive: true });

const demoAcademicData = {
  profile: {
    Name: "AURA",
    "Registration Number": "RA2411003010000",
    "Combo / Batch": "B.Tech CSE / Batch 1",
    CGPA: "9.74",
    SGPA: "9.68",
  },
  attendance: [
    { "Course Code": "15CS301J", "Course Title": "Design And Analysis Of Algorithms", "Hours Conducted": "50", "Hours Attended": "44", "Hours Absent": "6", "Attn %": "88.0", Category: "Theory" },
    { "Course Code": "15CS302J", "Course Title": "Operating Systems", "Hours Conducted": "48", "Hours Attended": "43", "Hours Absent": "5", "Attn %": "89.6", Category: "Theory" },
    { "Course Code": "15CS303J", "Course Title": "Database Management Systems", "Hours Conducted": "44", "Hours Attended": "39", "Hours Absent": "5", "Attn %": "88.6", Category: "Theory" },
    { "Course Code": "15AI201J", "Course Title": "Artificial Intelligence", "Hours Conducted": "36", "Hours Attended": "32", "Hours Absent": "4", "Attn %": "88.9", Category: "Theory" },
  ],
  marks: [
    { courseCode: "15CS301J", courseTitle: "Design And Analysis Of Algorithms", tests: [{ test: "CT1/20", score: "18.5" }, { test: "CT2/20", score: "18" }, { test: "MODEL/50", score: "43" }] },
    { courseCode: "15CS302J", courseTitle: "Operating Systems", tests: [{ test: "CT1/20", score: "17.5" }, { test: "CT2/20", score: "18" }, { test: "MODEL/50", score: "42.5" }] },
    { courseCode: "15CS303J", courseTitle: "Database Management Systems", tests: [{ test: "CT1/20", score: "18" }, { test: "CT2/20", score: "18.5" }, { test: "MODEL/50", score: "42" }] },
    { courseCode: "15AI201J", courseTitle: "Artificial Intelligence", tests: [{ test: "CT1/20", score: "18.5" }, { test: "CT2/20", score: "18" }, { test: "MODEL/50", score: "43" }] },
  ],
  lastFetchedAt: Date.now(),
};

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 430, height: 932 },
  deviceScaleFactor: 2,
  isMobile: true,
});
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
await page.waitForTimeout(8500);
await page.evaluate(() => {
  document.querySelectorAll(".aura-badge").forEach((node) => {
    const text = node.textContent || "";
    if (text.includes("OFFLINE") || text.includes("Secure Gateway")) node.remove();
  });
});
await page.screenshot({
  path: screenPath,
  clip: { x: 0, y: 160, width: 430, height: 760 },
});
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
    body {
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif;
      background: #080810;
      color: #fff;
    }
    .poster {
      position: relative;
      width: 1080px;
      height: 1350px;
      overflow: hidden;
      background: #080810;
      isolation: isolate;
    }
    .poster:after {
      content: "";
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at 62% 46%, transparent 0 30%, rgba(0,0,0,.28) 76%, rgba(0,0,0,.62));
      pointer-events: none;
      z-index: 20;
    }
    .glow {
      position: absolute;
      border-radius: 999px;
      filter: blur(78px);
      pointer-events: none;
    }
    .g1 { width: 860px; height: 860px; left: 150px; top: 190px; background: radial-gradient(circle, rgba(109,93,246,.34), transparent 68%); }
    .g2 { width: 680px; height: 760px; right: -110px; top: 290px; background: radial-gradient(circle, rgba(255,79,184,.22), transparent 72%); }
    .g3 { width: 760px; height: 500px; left: 280px; bottom: 100px; background: radial-gradient(circle, rgba(0,229,255,.13), transparent 70%); }
    .stars span {
      position: absolute;
      border-radius: 50%;
      background: rgba(255,255,255,.2);
      box-shadow: 0 0 8px rgba(255,255,255,.32);
    }
    .badge {
      position: absolute;
      z-index: 30;
      left: 72px;
      top: 70px;
      height: 52px;
      padding: 0 24px 0 48px;
      display: flex;
      align-items: center;
      border-radius: 999px;
      background: rgba(29,17,48,.9);
      border: 1px solid rgba(139,92,246,.44);
      box-shadow: 0 0 30px rgba(139,92,246,.34);
      color: #d8b4fe;
      font-size: 14px;
      font-weight: 900;
      letter-spacing: .03em;
    }
    .badge:before {
      content: "";
      position: absolute;
      left: 22px;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: #00ff88;
      box-shadow: 0 0 18px rgba(0,255,136,.75);
    }
    .headline {
      position: absolute;
      z-index: 30;
      left: 72px;
      top: 174px;
      width: 875px;
      margin: 0;
      font-size: 66px;
      line-height: 1.02;
      letter-spacing: -2.7px;
      font-weight: 950;
    }
    .headline span {
      display: block;
      color: #8b5cf6;
      margin-top: 8px;
    }
    .sub {
      position: absolute;
      z-index: 30;
      left: 76px;
      top: 360px;
      width: 570px;
      color: #a1a1aa;
      font-size: 25px;
      line-height: 1.3;
      font-weight: 500;
    }
    .proof {
      position: absolute;
      z-index: 30;
      right: 76px;
      top: 356px;
      height: 54px;
      padding: 0 24px 0 48px;
      display: flex;
      align-items: center;
      border-radius: 999px;
      background: rgba(16,16,23,.92);
      border: 1px solid rgba(0,255,136,.22);
      color: #00ff88;
      font-size: 14px;
      font-weight: 900;
      letter-spacing: .05em;
    }
    .proof:before {
      content: "";
      position: absolute;
      left: 22px;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: #00ff88;
    }
    .chips {
      position: absolute;
      z-index: 30;
      left: 72px;
      top: 560px;
      display: grid;
      gap: 22px;
    }
    .chip {
      width: 224px;
      height: 58px;
      border-radius: 999px;
      background: rgba(17,17,26,.94);
      border: 1px solid rgba(255,255,255,.08);
      box-shadow: 0 14px 28px rgba(0,0,0,.28);
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 0 20px;
      font-size: 15px;
      font-weight: 900;
    }
    .dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      flex: none;
    }
    .phone-wrap {
      position: absolute;
      z-index: 25;
      left: 510px;
      top: 438px;
      width: 420px;
      height: 744px;
      transform: rotate(-3deg);
      filter: drop-shadow(42px 58px 78px rgba(0,0,0,.76)) drop-shadow(-16px 8px 64px rgba(139,92,246,.38));
    }
    .phone {
      position: absolute;
      inset: 0;
      border-radius: 70px;
      background: #2c2a32;
      border: 5px solid rgba(188,185,198,.38);
      padding: 20px;
      overflow: hidden;
    }
    .phone:before {
      content: "";
      position: absolute;
      inset: 8px;
      border-radius: 62px;
      border: 1px solid rgba(255,255,255,.12);
      pointer-events: none;
    }
    .screen {
      position: relative;
      width: 100%;
      height: 100%;
      border-radius: 50px;
      overflow: hidden;
      background: #05050a;
      border: 1px solid rgba(255,255,255,.07);
    }
    .screen img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      filter: brightness(1.18) contrast(1.12) saturate(1.08);
    }
    .glass {
      position: absolute;
      inset: 0;
      background: linear-gradient(116deg, rgba(255,255,255,.16) 0%, rgba(255,255,255,.045) 24%, transparent 42%);
      mix-blend-mode: screen;
      pointer-events: none;
    }
    .island {
      position: absolute;
      left: 50%;
      top: 26px;
      transform: translateX(-50%);
      width: 116px;
      height: 32px;
      border-radius: 999px;
      background: #000;
      box-shadow: inset 0 1px 0 rgba(255,255,255,.05);
    }
    .url {
      position: absolute;
      z-index: 30;
      left: 72px;
      bottom: 56px;
      font-size: 32px;
      font-weight: 950;
    }
    .footer {
      position: absolute;
      z-index: 30;
      right: 76px;
      bottom: 58px;
      width: 430px;
      text-align: right;
      color: #a1a1aa;
      font-size: 18px;
      font-weight: 500;
    }
  </style>
</head>
<body>
  <main class="poster">
    <div class="glow g1"></div>
    <div class="glow g2"></div>
    <div class="glow g3"></div>
    <div class="stars">${Array.from({ length: 76 }, (_, i) => `<span style="left:${(i * 149) % 1040 + 20}px;top:${(i * 239) % 1306 + 20}px;opacity:${0.12 + (i % 5) * 0.045};width:${i % 10 === 0 ? 3 : 1.6}px;height:${i % 10 === 0 ? 3 : 1.6}px"></span>`).join("")}</div>
    <div class="badge">SRM NEXUS V2.6 - REAL DASHBOARD</div>
    <h1 class="headline">Everything academic.<span>One intelligent dashboard.</span></h1>
    <div class="sub">A real SRM Nexus dashboard view, shaped into a premium academic command center.</div>
    <div class="proof">LIVE ACADEMIC OS</div>
    <section class="chips">
      <div class="chip"><span class="dot" style="background:#00e5ff"></span>ATTENDANCE&nbsp; 89.3%</div>
      <div class="chip"><span class="dot" style="background:#ff4fb8"></span>ACADEMIC&nbsp; 88.9%</div>
      <div class="chip"><span class="dot" style="background:#8b5cf6"></span>SGPA&nbsp; 9.68</div>
      <div class="chip"><span class="dot" style="background:#ff4fb8"></span>CGPA&nbsp; 9.74</div>
    </section>
    <section class="phone-wrap">
      <div class="phone">
        <div class="screen">
          <img src="${screenDataUrl}" />
          <div class="glass"></div>
          <div class="island"></div>
        </div>
      </div>
    </section>
    <div class="url">srmnexus.app</div>
    <div class="footer">Built for students. Powered by intelligence.</div>
  </main>
</body>
</html>
`);

await posterPage.screenshot({ path: posterPath, clip: { x: 0, y: 0, width: 1080, height: 1350 } });
await browser.close();
console.log(JSON.stringify({ screenPath, posterPath }));
