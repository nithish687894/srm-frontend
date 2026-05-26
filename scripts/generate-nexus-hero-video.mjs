import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const outputPath = resolve("public/nexus-hero-loop.webm");

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 960, height: 540 } });

const videoBuffer = await page.evaluate(async () => {
  const canvas = document.createElement("canvas");
  canvas.width = 960;
  canvas.height = 540;
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");

  const stream = canvas.captureStream(30);
  const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
    ? "video/webm;codecs=vp9"
    : "video/webm";
  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: 2_400_000,
  });

  const chunks = [];
  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) chunks.push(event.data);
  };

  const drawText = (text, x, y, size, color, weight = 800, align = "left") => {
    ctx.font = `${weight} ${size}px Inter, system-ui, sans-serif`;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = "middle";
    ctx.fillText(text, x, y);
  };

  const roundedRect = (x, y, width, height, radius) => {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + width, y, x + width, y + height, radius);
    ctx.arcTo(x + width, y + height, x, y + height, radius);
    ctx.arcTo(x, y + height, x, y, radius);
    ctx.arcTo(x, y, x + width, y, radius);
    ctx.closePath();
  };

  const drawFrame = (time) => {
    const t = time / 1000;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const bg = ctx.createLinearGradient(0, 0, 960, 540);
    bg.addColorStop(0, "#050508");
    bg.addColorStop(0.5, "#0c0714");
    bg.addColorStop(1, "#020404");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 960, 540);

    const glowA = ctx.createRadialGradient(230, 130, 20, 230, 130, 360);
    glowA.addColorStop(0, "rgba(255, 117, 195, 0.34)");
    glowA.addColorStop(1, "rgba(255, 117, 195, 0)");
    ctx.fillStyle = glowA;
    ctx.fillRect(0, 0, 960, 540);

    const glowB = ctx.createRadialGradient(730, 410, 20, 730, 410, 320);
    glowB.addColorStop(0, "rgba(0, 255, 136, 0.24)");
    glowB.addColorStop(1, "rgba(0, 255, 136, 0)");
    ctx.fillStyle = glowB;
    ctx.fillRect(0, 0, 960, 540);

    for (let i = 0; i < 54; i += 1) {
      const x = (i * 83 + Math.sin(t * 0.45 + i) * 26) % 960;
      const y = (i * 47 + t * 22) % 540;
      ctx.fillStyle = `rgba(255,255,255,${0.05 + (i % 5) * 0.012})`;
      ctx.fillRect(x, y, 2, 2);
    }

    const phoneX = 92 + Math.sin(t * 0.9) * 4;
    const phoneY = 48 + Math.cos(t * 0.75) * 5;
    roundedRect(phoneX, phoneY, 282, 444, 44);
    ctx.fillStyle = "rgba(8, 8, 12, 0.92)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.14)";
    ctx.lineWidth = 2;
    ctx.stroke();

    roundedRect(phoneX + 21, phoneY + 22, 240, 400, 30);
    ctx.fillStyle = "#07070a";
    ctx.fill();

    drawText("SRM NEXUS", phoneX + 46, phoneY + 64, 19, "#ffffff", 900);
    drawText("ACADEMIC OS", phoneX + 46, phoneY + 92, 10, "rgba(255,255,255,0.46)", 800);

    const ringProgress = (Math.sin(t * 1.25) + 1) / 2;
    ctx.lineWidth = 14;
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.beginPath();
    ctx.arc(phoneX + 141, phoneY + 198, 68, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = "#00ff88";
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(phoneX + 141, phoneY + 198, 68, -Math.PI / 2, -Math.PI / 2 + Math.PI * 1.62 + ringProgress * 0.35);
    ctx.stroke();
    drawText(`${Math.round(82 + ringProgress * 6)}%`, phoneX + 141, phoneY + 197, 34, "#ffffff", 900, "center");
    drawText("ATTENDANCE", phoneX + 141, phoneY + 238, 10, "rgba(255,255,255,0.42)", 800, "center");

    const rows = [
      ["Marks", "91.4", "#ff75c3"],
      ["GPA", "9.21", "#8f92ff"],
      ["Today", "4 classes", "#00e5ff"],
    ];
    rows.forEach(([label, value, color], index) => {
      const y = phoneY + 300 + index * 45;
      roundedRect(phoneX + 42, y, 198, 32, 12);
      ctx.fillStyle = "rgba(255,255,255,0.045)";
      ctx.fill();
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(phoneX + 60, y + 16, 4, 0, Math.PI * 2);
      ctx.fill();
      drawText(label, phoneX + 74, y + 16, 12, "rgba(255,255,255,0.52)", 700);
      drawText(value, phoneX + 220, y + 16, 13, "#ffffff", 900, "right");
    });

    const panelX = 420;
    const panelY = 84;
    roundedRect(panelX, panelY, 444, 350, 30);
    ctx.fillStyle = "rgba(255,255,255,0.055)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.stroke();

    drawText("LIVE STUDENT INTELLIGENCE", panelX + 38, panelY + 54, 15, "rgba(255,255,255,0.58)", 900);
    drawText("Everything in one", panelX + 38, panelY + 104, 40, "#ffffff", 900);
    drawText("secure cockpit.", panelX + 38, panelY + 150, 40, "rgba(255,255,255,0.42)", 900);

    const cards = [
      ["Sync", "0.4s", "#00ff88"],
      ["AI Risk", "Low", "#ff75c3"],
      ["Portal", "Online", "#00e5ff"],
    ];
    cards.forEach(([label, value, color], index) => {
      const x = panelX + 38 + index * 132;
      const y = panelY + 202;
      roundedRect(x, y, 112, 88, 20);
      ctx.fillStyle = "rgba(0,0,0,0.24)";
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.stroke();
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.75 + Math.sin(t * 2 + index) * 0.18;
      ctx.beginPath();
      ctx.arc(x + 24, y + 25, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      drawText(value, x + 18, y + 55, 22, "#ffffff", 900);
      drawText(label, x + 18, y + 76, 10, "rgba(255,255,255,0.43)", 800);
    });

    for (let i = 0; i < 5; i += 1) {
      const x = panelX + 40 + i * 76;
      const height = 34 + Math.sin(t * 1.8 + i * 0.8) * 18;
      roundedRect(x, panelY + 322 - height, 44, height, 10);
      ctx.fillStyle = i % 2 === 0 ? "rgba(0,255,136,0.42)" : "rgba(255,117,195,0.35)";
      ctx.fill();
    }

    const sweep = (t * 180) % 1120 - 160;
    const light = ctx.createLinearGradient(sweep, 0, sweep + 220, 540);
    light.addColorStop(0, "rgba(255,255,255,0)");
    light.addColorStop(0.5, "rgba(255,255,255,0.12)");
    light.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = light;
    ctx.fillRect(0, 0, 960, 540);
  };

  recorder.start();

  const start = performance.now();
  await new Promise((resolveFrame) => {
    const frame = (now) => {
      drawFrame(now - start);
      if (now - start < 5200) {
        requestAnimationFrame(frame);
      } else {
        resolveFrame();
      }
    };
    requestAnimationFrame(frame);
  });

  recorder.stop();
  await new Promise((resolveRecorder) => {
    recorder.onstop = resolveRecorder;
  });

  const blob = new Blob(chunks, { type: mimeType });
  return Array.from(new Uint8Array(await blob.arrayBuffer()));
});

await browser.close();
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, Buffer.from(videoBuffer));
console.log(`Generated ${outputPath}`);
