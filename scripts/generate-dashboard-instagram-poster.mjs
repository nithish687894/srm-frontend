import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const outputPath = resolve("public/marketing/srm-nexus-dashboard-poster.png");
await mkdir(dirname(outputPath), { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });

await page.setContent(`
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
    .glow {
      position: absolute;
      border-radius: 999px;
      filter: blur(70px);
      opacity: .75;
      pointer-events: none;
    }
    .g1 { width: 860px; height: 860px; left: 110px; top: 150px; background: radial-gradient(circle, rgba(109,93,246,.34), transparent 68%); }
    .g2 { width: 560px; height: 760px; right: -100px; top: 40px; background: radial-gradient(circle, rgba(255,79,184,.18), transparent 70%); }
    .g3 { width: 760px; height: 520px; left: 280px; bottom: 70px; background: radial-gradient(circle, rgba(0,229,255,.13), transparent 70%); }
    .stars span {
      position: absolute;
      width: 2px;
      height: 2px;
      border-radius: 50%;
      background: rgba(255,255,255,.22);
      box-shadow: 0 0 8px rgba(255,255,255,.35);
    }
    .badge {
      position: absolute;
      left: 72px;
      top: 70px;
      height: 52px;
      padding: 0 24px 0 48px;
      display: flex;
      align-items: center;
      border-radius: 999px;
      background: rgba(29,17,48,.9);
      border: 1px solid rgba(139,92,246,.42);
      box-shadow: 0 0 28px rgba(139,92,246,.32);
      color: #d8b4fe;
      font-size: 14px;
      font-weight: 800;
      letter-spacing: .02em;
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
    h1 {
      position: absolute;
      left: 72px;
      top: 180px;
      width: 920px;
      margin: 0;
      font-size: 62px;
      line-height: 1.02;
      letter-spacing: -2.4px;
      font-weight: 950;
    }
    h1 span {
      display: block;
      margin-top: 10px;
      color: #8b5cf6;
    }
    .sub {
      position: absolute;
      left: 76px;
      top: 350px;
      width: 650px;
      color: #a1a1aa;
      font-size: 26px;
      line-height: 1.28;
      font-weight: 500;
    }
    .proof {
      position: absolute;
      right: 76px;
      top: 354px;
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
    .micro-stack {
      position: absolute;
      left: 72px;
      top: 548px;
      display: grid;
      gap: 22px;
      z-index: 5;
    }
    .chip {
      width: 224px;
      height: 58px;
      border-radius: 999px;
      background: rgba(17,17,26,.93);
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
    .phone {
      position: absolute;
      left: 382px;
      top: 470px;
      width: 474px;
      height: 748px;
      border-radius: 74px;
      transform: rotate(-4deg);
      background: #2e2b34;
      border: 5px solid rgba(183,179,196,.34);
      box-shadow: 34px 54px 88px rgba(0,0,0,.72), -18px 10px 62px rgba(139,92,246,.3);
      padding: 24px;
      z-index: 4;
    }
    .screen {
      position: relative;
      width: 100%;
      height: 100%;
      border-radius: 54px;
      overflow: hidden;
      background: #05050a;
      border: 1px solid rgba(255,255,255,.06);
    }
    .screen:before {
      content: "";
      position: absolute;
      inset: -80px -30px auto -60px;
      height: 430px;
      background: radial-gradient(circle, rgba(139,92,246,.22), transparent 70%);
      filter: blur(45px);
    }
    .screen:after {
      content: "";
      position: absolute;
      right: -70px;
      bottom: 80px;
      width: 360px;
      height: 320px;
      background: radial-gradient(circle, rgba(255,79,184,.12), transparent 70%);
      filter: blur(50px);
    }
    .island {
      position: absolute;
      left: 150px;
      top: 16px;
      width: 112px;
      height: 30px;
      background: #000;
      border-radius: 999px;
      z-index: 2;
    }
    .screen-content {
      position: relative;
      z-index: 3;
      padding: 78px 36px 24px;
    }
    .greeting {
      font-size: 34px;
      line-height: .98;
      font-weight: 950;
      letter-spacing: -1px;
      margin-bottom: 28px;
    }
    .insight {
      border-radius: 28px;
      background: rgba(16,16,23,.98);
      border: 1px solid rgba(255,255,255,.08);
      padding: 24px 26px;
      font-size: 18px;
      line-height: 1.28;
      font-weight: 800;
      margin-bottom: 26px;
    }
    .stats {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-bottom: 26px;
    }
    .stat {
      height: 138px;
      border-radius: 24px;
      background: rgba(17,17,26,.96);
      border: 1px solid rgba(255,255,255,.08);
      padding: 22px 24px;
    }
    .stat .icon {
      width: 38px;
      height: 38px;
      border-radius: 14px;
      display: grid;
      place-items: center;
      margin-bottom: 14px;
    }
    .stat .value {
      font-size: 34px;
      font-weight: 950;
      letter-spacing: -1px;
    }
    .stat .label {
      margin-top: 8px;
      font-size: 12px;
      font-weight: 900;
      letter-spacing: .05em;
    }
    .planner {
      height: 112px;
      border-radius: 28px;
      background: rgba(23,16,32,.98);
      border: 1px solid rgba(139,92,246,.3);
      box-shadow: 0 10px 28px rgba(139,92,246,.24);
      padding: 24px 24px;
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 18px;
      align-items: center;
      margin-bottom: 34px;
    }
    .planner-title {
      font-size: 20px;
      line-height: 1.05;
      font-weight: 950;
    }
    .planner-sub {
      margin-top: 8px;
      color: #a1a1aa;
      font-size: 14px;
      line-height: 1.25;
      font-weight: 600;
    }
    .planner-metric {
      color: #00e5ff;
      font-size: 22px;
      line-height: 1.05;
      text-align: right;
      font-weight: 950;
    }
    .nav {
      height: 64px;
      border-radius: 999px;
      background: rgba(13,11,26,.98);
      border: 1px solid rgba(139,92,246,.14);
      box-shadow: 0 -10px 30px rgba(139,92,246,.32);
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      align-items: center;
      text-align: center;
      color: #777386;
      font-size: 22px;
      font-weight: 900;
    }
    .nav .active {
      color: #ff4fb8;
      position: relative;
    }
    .nav .active:after {
      content: "";
      position: absolute;
      left: 50%;
      bottom: -12px;
      transform: translateX(-50%);
      width: 18px;
      height: 4px;
      border-radius: 999px;
      background: #ff4fb8;
      box-shadow: 0 0 10px rgba(255,79,184,.8);
    }
    .url {
      position: absolute;
      left: 72px;
      bottom: 76px;
      font-size: 32px;
      font-weight: 950;
    }
    .footer {
      position: absolute;
      right: 76px;
      bottom: 83px;
      width: 420px;
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
    <div class="stars">${Array.from({ length: 76 }, (_, i) => `<span style="left:${(i * 149) % 1040 + 20}px;top:${(i * 239) % 1306 + 20}px;opacity:${0.15 + (i % 5) * 0.05};width:${i % 10 === 0 ? 3 : 1.7}px;height:${i % 10 === 0 ? 3 : 1.7}px"></span>`).join("")}</div>
    <div class="badge">SRM NEXUS V2.6 · DASHBOARD</div>
    <h1>Everything academic.<span>One intelligent dashboard.</span></h1>
    <div class="sub">Track attendance, marks, grades, and portal insights in one place.</div>
    <div class="proof">PORTAL INSIGHTS LIVE</div>
    <section class="micro-stack">
      <div class="chip"><span class="dot" style="background:#00e5ff"></span>ATTENDANCE&nbsp; 88.5%</div>
      <div class="chip"><span class="dot" style="background:#ff4fb8"></span>ACADEMIC&nbsp; 88.4%</div>
      <div class="chip"><span class="dot" style="background:#8b5cf6"></span>SGPA&nbsp; 9.68</div>
      <div class="chip"><span class="dot" style="background:#ff4fb8"></span>CGPA&nbsp; 9.74</div>
    </section>
    <section class="phone">
      <div class="screen">
        <div class="island"></div>
        <div class="screen-content">
          <div class="greeting">Good Afternoon,<br/>AURA</div>
          <div class="insight">Your academic trajectory is stable.<br/>You have <span style="color:#00e5ff">88.5%</span> attendance and <span style="color:#ff4fb8">88.4%</span> academic score.</div>
          <div class="stats">
            <div class="stat">
              <div class="icon" style="background:rgba(0,229,255,.2); color:#00e5ff">⌁</div>
              <div class="value">88.5%</div>
              <div class="label" style="color:#00e5ff">ATTENDANCE</div>
            </div>
            <div class="stat">
              <div class="icon" style="background:rgba(255,79,184,.2); color:#ff4fb8">⌾</div>
              <div class="value">88.4%</div>
              <div class="label" style="color:#ff4fb8">ACADEMIC</div>
            </div>
          </div>
          <div class="planner">
            <div>
              <div class="planner-title">Unified Academic Planner</div>
              <div class="planner-sub">Forecast marks, grades, and safe skip counts.</div>
            </div>
            <div class="planner-metric">89.3%<br/>Attn</div>
          </div>
          <div class="nav">
            <div class="active">⌂</div>
            <div>▥</div>
            <div>✓</div>
            <div>◷</div>
            <div>•••</div>
          </div>
        </div>
      </div>
    </section>
    <div class="url">srmnexus.app</div>
    <div class="footer">Built for students. Powered by intelligence.</div>
  </main>
</body>
</html>
`);

await page.screenshot({ path: outputPath, clip: { x: 0, y: 0, width: 1080, height: 1350 } });
await browser.close();
console.log(outputPath);
