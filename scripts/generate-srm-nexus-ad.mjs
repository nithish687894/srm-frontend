import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const outputPath = resolve("public/videos/srm-nexus-ad.webm");
const width = 1280;
const height = 720;
const fps = 30;
const durationMs = 26000;

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width, height } });

const bytes = await page.evaluate(
  async ({ width, height, fps, durationMs }) => {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    document.body.style.margin = "0";
    document.body.appendChild(canvas);

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas context unavailable");

    const stream = canvas.captureStream(fps);
    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
      ? "video/webm;codecs=vp9"
      : "video/webm";
    const recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: 2_200_000,
    });

    const chunks = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };

    const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
    const lerp = (from, to, amount) => from + (to - from) * amount;
    const ease = (value) => {
      const t = clamp(value);
      return t * t * (3 - 2 * t);
    };
    const scene = (time, start, end) => ease((time - start) / (end - start));
    const fade = (time, start, end) => clamp((time - start) / (end - start));

    const roundRect = (x, y, w, h, r) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    };

    const text = (copy, x, y, size, color, options = {}) => {
      const { weight = 800, align = "center", alpha = 1, family = "Inter, system-ui, sans-serif" } = options;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = `${weight} ${size}px ${family}`;
      ctx.fillStyle = color;
      ctx.textAlign = align;
      ctx.textBaseline = "middle";
      ctx.fillText(copy, x, y);
      ctx.restore();
    };

    const panel = (x, y, w, h, r, alpha = 1) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      roundRect(x, y, w, h, r);
      const fill = ctx.createLinearGradient(x, y, x + w, y + h);
      fill.addColorStop(0, "rgba(255,255,255,0.105)");
      fill.addColorStop(0.5, "rgba(255,255,255,0.038)");
      fill.addColorStop(1, "rgba(255,255,255,0.075)");
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.17)";
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.restore();
    };

    const glow = (x, y, radius, color, alpha) => {
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, color.replace("ALPHA", alpha.toString()));
      gradient.addColorStop(1, color.replace("ALPHA", "0"));
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    };

    const drawLogoMark = (x, y, size, alpha = 1) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      const g = ctx.createLinearGradient(x - size / 2, y - size / 2, x + size / 2, y + size / 2);
      g.addColorStop(0, "#ff75c3");
      g.addColorStop(0.45, "#8f92ff");
      g.addColorStop(1, "#00ff88");
      roundRect(x - size / 2, y - size / 2, size, size, size * 0.24);
      ctx.fillStyle = "rgba(255,255,255,0.06)";
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.22)";
      ctx.stroke();
      ctx.strokeStyle = g;
      ctx.lineWidth = size * 0.07;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(x - size * 0.25, y + size * 0.2);
      ctx.lineTo(x - size * 0.1, y - size * 0.22);
      ctx.lineTo(x + size * 0.08, y + size * 0.07);
      ctx.lineTo(x + size * 0.25, y - size * 0.22);
      ctx.stroke();
      ctx.strokeStyle = "rgba(255,255,255,0.76)";
      ctx.lineWidth = size * 0.025;
      ctx.beginPath();
      ctx.moveTo(x - size * 0.2, y + size * 0.18);
      ctx.lineTo(x + size * 0.24, y + size * 0.18);
      ctx.stroke();
      ctx.restore();
    };

    const drawBackground = (time) => {
      const t = time / 1000;
      const bg = ctx.createLinearGradient(0, 0, width, height);
      bg.addColorStop(0, "#040408");
      bg.addColorStop(0.5, "#090614");
      bg.addColorStop(1, "#020404");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);
      glow(260 + Math.sin(t * 0.32) * 50, 150, 520, "rgba(255,117,195,ALPHA)", 0.19);
      glow(1000 + Math.cos(t * 0.24) * 60, 560, 580, "rgba(0,255,136,ALPHA)", 0.14);
      glow(690, 330 + Math.sin(t * 0.22) * 40, 620, "rgba(143,146,255,ALPHA)", 0.115);

      ctx.save();
      for (let i = 0; i < 90; i += 1) {
        const x = (i * 97 + Math.sin(t * 0.45 + i) * 22 + t * 9) % width;
        const y = (i * 53 + Math.cos(t * 0.33 + i) * 18 + t * 13) % height;
        ctx.globalAlpha = 0.08 + (i % 7) * 0.012;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(x, y, i % 3 === 0 ? 2 : 1, i % 3 === 0 ? 2 : 1);
      }
      ctx.restore();
    };

    const drawDashboard = (x, y, scale, alpha, time) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);
      ctx.globalAlpha = alpha;
      panel(-410, -235, 820, 470, 36, 1);
      text("SRM NEXUS", -350, -188, 24, "#ffffff", { align: "left", weight: 900 });
      text("ACADEMIC OS", -350, -158, 11, "rgba(255,255,255,0.48)", { align: "left", weight: 800 });

      const pulse = (Math.sin(time / 550) + 1) / 2;
      panel(-352, -102, 220, 250, 26, 0.95);
      ctx.lineWidth = 16;
      ctx.strokeStyle = "rgba(255,255,255,0.075)";
      ctx.beginPath();
      ctx.arc(-242, 8, 72, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = "#00ff88";
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.arc(-242, 8, 72, -Math.PI / 2, -Math.PI / 2 + Math.PI * (1.45 + pulse * 0.28));
      ctx.stroke();
      text(`${Math.round(84 + pulse * 7)}%`, -242, 3, 34, "#ffffff", { weight: 950 });
      text("ATTENDANCE", -242, 45, 10, "rgba(255,255,255,0.44)", { weight: 800 });

      panel(-92, -102, 240, 116, 24, 0.95);
      text("Marks Analytics", -62, -65, 18, "#ffffff", { align: "left", weight: 900 });
      [0.75, 0.86, 0.64].forEach((bar, i) => {
        const yy = -32 + i * 28;
        roundRect(-62, yy, 160, 8, 5);
        ctx.fillStyle = "rgba(255,255,255,0.08)";
        ctx.fill();
        roundRect(-62, yy, 160 * (bar + Math.sin(time / 700 + i) * 0.035), 8, 5);
        ctx.fillStyle = i === 1 ? "#ff75c3" : "#8f92ff";
        ctx.fill();
      });

      panel(178, -102, 170, 250, 24, 0.95);
      text("Today", 208, -65, 18, "#ffffff", { align: "left", weight: 900 });
      ["Math", "Lab", "AI", "Club"].forEach((label, i) => {
        const yy = -24 + i * 38;
        ctx.fillStyle = i === 2 ? "#00ff88" : "rgba(255,255,255,0.22)";
        ctx.beginPath();
        ctx.arc(208, yy, 5, 0, Math.PI * 2);
        ctx.fill();
        text(label, 226, yy, 13, "rgba(255,255,255,0.72)", { align: "left", weight: 800 });
      });

      panel(-92, 42, 240, 106, 24, 0.95);
      text("AI Assistant", -62, 74, 18, "#ffffff", { align: "left", weight: 900 });
      text("Predicts risk, plans recovery.", -62, 110, 14, "rgba(255,255,255,0.52)", { align: "left", weight: 700 });

      ctx.restore();
    };

    const drawFeature = (label, title, value, x, y, color, alpha, time) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      panel(x, y, 410, 160, 28, 1);
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 22;
      ctx.beginPath();
      ctx.arc(x + 54, y + 54, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      text(label, x + 84, y + 54, 14, "rgba(255,255,255,0.48)", { align: "left", weight: 850 });
      text(title, x + 32, y + 104, 23, "#ffffff", { align: "left", weight: 950 });
      text(value, x + 368, y + 104, 20, color, { align: "right", weight: 950 });
      const sweep = ((time / 12) % 410) - 70;
      const g = ctx.createLinearGradient(x + sweep, y, x + sweep + 100, y + 160);
      g.addColorStop(0, "rgba(255,255,255,0)");
      g.addColorStop(0.5, "rgba(255,255,255,0.12)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      roundRect(x, y, 410, 160, 28);
      ctx.fill();
      ctx.restore();
    };

    const drawFrame = (elapsedMs) => {
      const sec = elapsedMs / 1000;
      drawBackground(elapsedMs);

      const camera = 1 + Math.sin(sec * 0.2) * 0.012;
      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.scale(camera, camera);
      ctx.translate(-width / 2, -height / 2);

      const intro = fade(sec, 0, 3.8) * (1 - fade(sec, 5.0, 6.0));
      if (intro > 0) {
        const rise = lerp(18, 0, scene(sec, 0.2, 2.2));
        drawLogoMark(width / 2, 255 + rise, 104, intro);
        text("SRM NEXUS", width / 2, 384 + rise, 54, "#ffffff", { weight: 950, alpha: intro });
        text("THE ACADEMIC OPERATING SYSTEM", width / 2, 442 + rise, 15, "rgba(255,255,255,0.52)", { weight: 900, alpha: intro });
      }

      const problem = fade(sec, 4.2, 5.8) * (1 - fade(sec, 7.2, 8.0));
      if (problem > 0) {
        text("Students need one place", width / 2, 318, 50, "#ffffff", { weight: 950, alpha: problem });
        text("for every academic decision.", width / 2, 382, 50, "rgba(255,255,255,0.42)", { weight: 950, alpha: problem });
      }

      const reveal = fade(sec, 7.3, 9.4) * (1 - fade(sec, 11.4, 12.4));
      if (reveal > 0) {
        const zoom = lerp(0.74, 0.9, scene(sec, 7.3, 11.2));
        const y = lerp(435, 360, scene(sec, 7.3, 10.5));
        drawDashboard(width / 2, y, zoom, reveal, elapsedMs);
        text("One intelligent cockpit.", width / 2, 104, 43, "#ffffff", { weight: 950, alpha: fade(sec, 8.6, 10.4) * reveal });
      }

      const montage = fade(sec, 11.4, 12.8) * (1 - fade(sec, 22.0, 22.8));
      if (montage > 0) {
        text("Attendance. Marks. Timetable. AI.", width / 2, 90, 34, "#ffffff", { weight: 950, alpha: montage });
        drawFeature("ATTENDANCE", "Track every class", "86%", 140, 176, "#00ff88", scene(sec, 12.0, 13.6) * montage, elapsedMs);
        drawFeature("MARKS", "Know your score", "91.4", 730, 176, "#ff75c3", scene(sec, 14.0, 15.5) * montage, elapsedMs);
        drawFeature("TIMETABLE", "Plan the day", "Live", 140, 384, "#00e5ff", scene(sec, 16.0, 17.5) * montage, elapsedMs);
        drawFeature("AI ASSISTANT", "Ask. Predict. Improve.", "AI", 730, 384, "#8f92ff", scene(sec, 18.0, 19.7) * montage, elapsedMs);
        const lockAlpha = scene(sec, 20.0, 21.5) * montage;
        if (lockAlpha > 0) {
          panel(448, 266, 384, 178, 30, lockAlpha);
          drawLogoMark(512, 355, 72, lockAlpha);
          text("Secure student login", 570, 338, 29, "#ffffff", { align: "left", weight: 950, alpha: lockAlpha });
          text("Encrypted portal sync", 570, 382, 15, "rgba(255,255,255,0.52)", { align: "left", weight: 800, alpha: lockAlpha });
        }
      }

      const finale = fade(sec, 22.2, 23.8);
      if (finale > 0) {
        drawLogoMark(width / 2, 238, 96, finale);
        text("SRM Nexus — Your Academic OS", width / 2, 372, 52, "#ffffff", { weight: 950, alpha: finale });
        text("Built for students. Powered by intelligence.", width / 2, 438, 23, "rgba(255,255,255,0.58)", { weight: 800, alpha: finale });
      }

      ctx.restore();

      const vignette = ctx.createRadialGradient(width / 2, height / 2, 120, width / 2, height / 2, 720);
      vignette.addColorStop(0, "rgba(0,0,0,0)");
      vignette.addColorStop(1, "rgba(0,0,0,0.55)");
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, width, height);
    };

    recorder.start();
    const start = performance.now();
    await new Promise((resolve) => {
      const frame = (now) => {
        const elapsed = now - start;
        drawFrame(elapsed);
        if (elapsed < durationMs) requestAnimationFrame(frame);
        else resolve();
      };
      requestAnimationFrame(frame);
    });

    recorder.stop();
    await new Promise((resolve) => {
      recorder.onstop = resolve;
    });

    const blob = new Blob(chunks, { type: mimeType });
    return Array.from(new Uint8Array(await blob.arrayBuffer()));
  },
  { width, height, fps, durationMs }
);

await browser.close();
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, Buffer.from(bytes));
console.log(`Generated ${outputPath}`);
