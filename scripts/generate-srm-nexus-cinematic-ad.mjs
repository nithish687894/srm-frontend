import { chromium } from "playwright";
import ffmpegPath from "ffmpeg-static";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { spawn } from "node:child_process";

const width = 1080;
const height = 1920;
const fps = 30;
const durationMs = 30000;
const videoBitrate = 9_000_000;

const publicDir = resolve("public/videos");
const webmPath = resolve(publicDir, "srm-nexus-cinematic-ad.webm");
const outputPath = resolve(publicDir, "srm-nexus-cinematic-ad.mp4");
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });

const bytes = await page.evaluate(
  async ({ width, height, fps, durationMs, videoBitrate }) => {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    document.body.style.margin = "0";
    document.body.style.background = "#050505";
    document.body.appendChild(canvas);

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas context unavailable");

    const audio = new AudioContext({ sampleRate: 48000 });
    const destination = audio.createMediaStreamDestination();
    const master = audio.createGain();
    const lowpass = audio.createBiquadFilter();
    const compressor = audio.createDynamicsCompressor();
    master.gain.value = 0.22;
    lowpass.type = "lowpass";
    lowpass.frequency.value = 900;
    compressor.threshold.value = -24;
    compressor.ratio.value = 3;
    master.connect(lowpass);
    lowpass.connect(compressor);
    compressor.connect(destination);

    const addOsc = (frequency, type, gainValue, detune = 0) => {
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.type = type;
      osc.frequency.value = frequency;
      osc.detune.value = detune;
      gain.gain.value = gainValue;
      osc.connect(gain);
      gain.connect(master);
      osc.start();
      return { osc, gain };
    };

    const bass = addOsc(49, "sine", 0.14);
    const droneA = addOsc(98, "triangle", 0.045, -7);
    const droneB = addOsc(147, "sine", 0.035, 5);
    const shimmer = addOsc(392, "sine", 0.014, 9);
    const tension = addOsc(523.25, "triangle", 0.008, -11);

    const stream = canvas.captureStream(fps);
    for (const track of destination.stream.getAudioTracks()) stream.addTrack(track);

    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
      ? "video/webm;codecs=vp9,opus"
      : "video/webm";
    const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: videoBitrate });
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
    const easeOut = (value) => 1 - Math.pow(1 - clamp(value), 3);
    const easeInOut = (value) => {
      const t = clamp(value);
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    };
    const inOut = (sec, start, end, fadeIn = 0.65, fadeOut = 0.65) =>
      clamp((sec - start) / fadeIn) * (1 - clamp((sec - (end - fadeOut)) / fadeOut));
    const progress = (sec, start, end) => clamp((sec - start) / (end - start));

    const roundRect = (x, y, w, h, r) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    };

    const glow = (x, y, radius, color, alpha) => {
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, color.replace("ALPHA", alpha.toString()));
      gradient.addColorStop(1, color.replace("ALPHA", "0"));
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    };

    const text = (copy, x, y, size, color, options = {}) => {
      const { weight = 800, align = "center", alpha = 1, family = "Inter, SF Pro Display, system-ui, sans-serif" } = options;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = `${weight} ${size}px ${family}`;
      ctx.fillStyle = color;
      ctx.textAlign = align;
      ctx.textBaseline = "middle";
      ctx.fillText(copy, x, y);
      ctx.restore();
    };

    const shadowText = (copy, x, y, size, color, shadow, options = {}) => {
      ctx.save();
      ctx.shadowColor = shadow;
      ctx.shadowBlur = options.blur ?? 28;
      text(copy, x, y, size, color, options);
      ctx.restore();
    };

    const panel = (x, y, w, h, r, alpha = 1) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.shadowColor = "rgba(236,72,153,0.18)";
      ctx.shadowBlur = 42;
      roundRect(x, y, w, h, r);
      const fill = ctx.createLinearGradient(x, y, x + w, y + h);
      fill.addColorStop(0, "rgba(255,255,255,0.115)");
      fill.addColorStop(0.48, "rgba(124,58,237,0.07)");
      fill.addColorStop(1, "rgba(255,255,255,0.045)");
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = "rgba(248,250,252,0.16)";
      ctx.lineWidth = 1.25;
      ctx.stroke();
      ctx.restore();
    };

    const drawIcon = (x, y, size, alpha, pulse = 0) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      glow(x, y, size * (1.45 + pulse * 0.22), "rgba(124,58,237,ALPHA)", 0.24 * alpha);
      glow(x, y, size * (1.05 + pulse * 0.35), "rgba(236,72,153,ALPHA)", 0.18 * alpha);
      ctx.shadowColor = "rgba(124,58,237,0.72)";
      ctx.shadowBlur = 54 + pulse * 28;
      roundRect(x - size / 2, y - size / 2, size, size, size * 0.23);
      const base = ctx.createLinearGradient(x - size / 2, y - size / 2, x + size / 2, y + size / 2);
      base.addColorStop(0, "#1A1A1D");
      base.addColorStop(0.48, "#09090B");
      base.addColorStop(1, "#020202");
      ctx.fillStyle = base;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = "rgba(248,250,252,0.12)";
      ctx.lineWidth = Math.max(1, size * 0.012);
      ctx.stroke();

      const g = ctx.createLinearGradient(x - size * 0.28, y + size * 0.26, x + size * 0.28, y - size * 0.26);
      g.addColorStop(0, "#10B981");
      g.addColorStop(0.46, "#34D399");
      g.addColorStop(1, "#A7F3D0");
      ctx.strokeStyle = g;
      ctx.lineWidth = size * 0.09;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.shadowColor = "#10B981";
      ctx.shadowBlur = 24 + pulse * 22;
      ctx.beginPath();
      ctx.moveTo(x - size * 0.24, y + size * 0.24);
      ctx.lineTo(x - size * 0.24, y - size * 0.24);
      ctx.lineTo(x + size * 0.24, y + size * 0.24);
      ctx.lineTo(x + size * 0.24, y - size * 0.24);
      ctx.stroke();

      ctx.shadowColor = "#EC4899";
      ctx.shadowBlur = 14 + pulse * 12;
      ctx.strokeStyle = "rgba(236,72,153,0.58)";
      ctx.lineWidth = size * 0.028;
      ctx.beginPath();
      ctx.moveTo(x - size * 0.34, y - size * 0.28);
      ctx.lineTo(x - size * 0.24, y - size * 0.24);
      ctx.lineTo(x + size * 0.32, y + size * 0.18);
      ctx.stroke();
      ctx.restore();
    };

    const drawLightLeak = (sec, start, duration, direction = "horizontal") => {
      const t = progress(sec, start, start + duration);
      if (t <= 0 || t >= 1) return;
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      const eased = easeInOut(t);
      if (direction === "vertical") {
        const y = lerp(height + 260, -340, eased);
        const g = ctx.createLinearGradient(0, y - 220, 0, y + 220);
        g.addColorStop(0, "rgba(236,72,153,0)");
        g.addColorStop(0.38, "rgba(236,72,153,0.22)");
        g.addColorStop(0.55, "rgba(124,58,237,0.42)");
        g.addColorStop(1, "rgba(236,72,153,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, y - 260, width, 520);
      } else {
        const x = lerp(-360, width + 360, eased);
        const g = ctx.createLinearGradient(x - 260, 0, x + 260, 0);
        g.addColorStop(0, "rgba(236,72,153,0)");
        g.addColorStop(0.42, "rgba(236,72,153,0.42)");
        g.addColorStop(0.58, "rgba(124,58,237,0.32)");
        g.addColorStop(1, "rgba(236,72,153,0)");
        ctx.fillStyle = g;
        ctx.fillRect(x - 260, 0, 520, height);
      }
      ctx.restore();
    };

    const drawBackground = (sec) => {
      ctx.fillStyle = "#050505";
      ctx.fillRect(0, 0, width, height);
      glow(width * 0.5 + Math.sin(sec * 0.28) * 70, height * 0.42, 720, "rgba(124,58,237,ALPHA)", 0.08);
      glow(width * 0.25, height * 0.68 + Math.cos(sec * 0.2) * 80, 560, "rgba(236,72,153,ALPHA)", 0.055);
      ctx.save();
      ctx.globalAlpha = 0.055;
      ctx.strokeStyle = "#7C3AED";
      ctx.lineWidth = 1;
      for (let i = 0; i < 18; i += 1) {
        const y = (i * 120 + sec * 8) % height;
        ctx.beginPath();
        ctx.moveTo(95, y);
        ctx.lineTo(width - 95, y + Math.sin(sec + i) * 16);
        ctx.stroke();
      }
      ctx.restore();
    };

    const drawPhoneFrame = (x, y, w, h, alpha) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      glow(x + w / 2, y + h / 2, 520, "rgba(124,58,237,ALPHA)", 0.08 * alpha);
      roundRect(x, y, w, h, 58);
      ctx.fillStyle = "rgba(8,8,12,0.78)";
      ctx.fill();
      ctx.strokeStyle = "rgba(248,250,252,0.12)";
      ctx.lineWidth = 2;
      ctx.stroke();
      roundRect(x + 32, y + 32, w - 64, h - 64, 42);
      ctx.clip();
      ctx.fillStyle = "rgba(5,5,5,0.62)";
      ctx.fillRect(x + 32, y + 32, w - 64, h - 64);
      ctx.restore();
    };

    const drawStatCard = (x, y, label, value, color, alpha, pulse) => {
      panel(x, y, 330, 210, 32, alpha);
      shadowText(value, x + 36, y + 82, 57, color, color, { align: "left", weight: 950, alpha, blur: 22 + pulse * 18 });
      text(label, x + 38, y + 145, 21, "rgba(248,250,252,0.62)", { align: "left", weight: 900, alpha });
    };

    const drawDashboard = (sec, alpha) => {
      const rise = lerp(140, -34, easeOut(progress(sec, 6.0, 11.6)));
      const x = 122;
      const y = 320 + rise;
      drawPhoneFrame(x - 34, y - 46, 904, 1190, alpha);
      panel(x, y, 836, 1090, 48, alpha);
      text("Good Afternoon, AURA", x + 62, y + 118, 45, "#F8FAFC", { align: "left", weight: 950, alpha });
      text("LIVE ACADEMIC INTELLIGENCE", x + 62, y + 176, 18, "rgba(248,250,252,0.38)", { align: "left", weight: 900, alpha });
      const pulse = (Math.sin(sec * Math.PI * 1.1) + 1) / 2;
      drawStatCard(x + 62, y + 260, "ATTENDANCE", "88.5%", "#10B981", alpha, pulse);
      drawStatCard(x + 444, y + 260, "ACADEMIC", "88.4%", "#EC4899", alpha, pulse);
      panel(x + 62, y + 540, 712, 360, 36, alpha);
      text("SYSTEM SYNC", x + 106, y + 604, 21, "rgba(248,250,252,0.48)", { align: "left", weight: 900, alpha });
      for (let i = 0; i < 6; i += 1) {
        const yy = y + 672 + i * 38;
        ctx.save();
        ctx.globalAlpha = alpha * 0.82;
        roundRect(x + 106, yy, 520, 10, 7);
        ctx.fillStyle = "rgba(248,250,252,0.08)";
        ctx.fill();
        roundRect(x + 106, yy, (300 + i * 34) * easeOut(progress(sec, 6.6 + i * 0.12, 8.2 + i * 0.12)), 10, 7);
        ctx.fillStyle = i % 2 ? "#EC4899" : "#7C3AED";
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 14;
        ctx.fill();
        ctx.restore();
      }
    };

    const drawGrades = (sec, alpha) => {
      const rise = lerp(120, -32, easeOut(progress(sec, 12.0, 17.6)));
      const x = 116;
      const y = 292 + rise;
      drawPhoneFrame(x - 28, y - 40, 904, 1240, alpha);
      panel(x, y, 836, 1140, 48, alpha);
      text("Academic Hub", x + 62, y + 100, 42, "#F8FAFC", { align: "left", weight: 950, alpha });
      const lockPulse = 1 + 0.05 * Math.sin(progress(sec, 13.2, 14.2) * Math.PI);
      shadowText("SGPA 9.68", x + 62, y + 218, 62 * lockPulse, "#EC4899", "#EC4899", { align: "left", weight: 950, alpha, blur: 28 });
      shadowText("CGPA 9.74", x + 62, y + 304, 62 * lockPulse, "#EC4899", "#EC4899", { align: "left", weight: 950, alpha, blur: 28 });
      panel(x + 62, y + 420, 712, 548, 36, alpha);
      text("MARKS REGISTRY", x + 104, y + 480, 20, "rgba(248,250,252,0.52)", { align: "left", weight: 900, alpha });
      const subjects = ["Math", "Physics", "Data Structures", "English", "Electronics", "Python Lab"];
      const scores = [0.92, 0.86, 0.89, 0.84, 0.91, 0.88];
      for (let i = 0; i < subjects.length; i += 1) {
        const yy = y + 552 + i * 62;
        text(subjects[i], x + 104, yy, 22, "rgba(248,250,252,0.78)", { align: "left", weight: 800, alpha });
        ctx.save();
        ctx.globalAlpha = alpha;
        roundRect(x + 104, yy + 24, 540, 12, 8);
        ctx.fillStyle = "rgba(248,250,252,0.09)";
        ctx.fill();
        const fill = scores[i] * easeOut(progress(sec, 13.2 + i * 0.22, 15.4 + i * 0.22));
        const grad = ctx.createLinearGradient(x + 104, yy, x + 644, yy);
        grad.addColorStop(0, "#7C3AED");
        grad.addColorStop(1, "#EC4899");
        roundRect(x + 104, yy + 24, 540 * fill, 12, 8);
        ctx.fillStyle = grad;
        ctx.shadowColor = "#EC4899";
        ctx.shadowBlur = 18;
        ctx.fill();
        ctx.restore();
      }
      shadowText("Overall average 88.4%", x + 418, y + 1018, 28, "#7C3AED", "#7C3AED", { weight: 950, alpha, blur: 24 });
    };

    const drawRing = (x, y, radius, percent, color, label, alpha, sec, delay = 0) => {
      const fill = easeOut(progress(sec, 18.2 + delay, 20.2 + delay));
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.lineWidth = 18;
      ctx.strokeStyle = "rgba(248,250,252,0.09)";
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 24;
      ctx.lineCap = "round";
      ctx.beginPath();
      const spin = sec * 0.36;
      ctx.arc(x, y, radius, -Math.PI / 2 + spin, -Math.PI / 2 + spin + Math.PI * 2 * percent * fill);
      ctx.stroke();
      ctx.shadowBlur = 0;
      text(`${Math.round(percent * 100)}%`, x, y - 8, 43, "#F8FAFC", { weight: 950, alpha });
      text(label, x, y + 42, 19, color, { weight: 900, alpha });
      ctx.restore();
    };

    const drawAttendance = (sec, alpha) => {
      const x = 118;
      const y = 340 + lerp(110, -28, easeOut(progress(sec, 18.0, 23.6)));
      drawPhoneFrame(x - 30, y - 46, 904, 1110, alpha);
      panel(x, y, 836, 1018, 48, alpha);
      text("Lumina Sync", x + 62, y + 106, 45, "#F8FAFC", { align: "left", weight: 950, alpha });
      shadowText("88.5%", x + 418, y + 276, 98, "#7C3AED", "#7C3AED", { weight: 950, alpha, blur: 36 });
      text("AVERAGE", x + 418, y + 354, 22, "rgba(248,250,252,0.48)", { weight: 900, alpha });
      drawRing(x + 222, y + 590, 112, 0.92, "#10B981", "SAFE", alpha, sec, 0);
      drawRing(x + 612, y + 590, 112, 0.96, "#10B981", "SAFE", alpha, sec, 0.18);
      drawRing(x + 418, y + 826, 124, 0.73, "#F59E0B", "WARNING", alpha, sec, 0.36);
      ctx.save();
      ctx.globalAlpha = alpha * inOut(sec, 20.7, 23.3, 0.4, 0.4);
      panel(x + 574, y + 732, 154, 62, 20, 1);
      shadowText("RISK", x + 651, y + 763, 24, "#F59E0B", "#F59E0B", { weight: 950, alpha: 1, blur: 18 });
      ctx.restore();
    };

    const drawFinale = (sec, alpha) => {
      const settle = easeOut(progress(sec, 24.0, 27.0));
      const y = lerp(470, 790, settle);
      const pulse = Math.sin(progress(sec, 28.25, 29.25) * Math.PI);
      drawIcon(width / 2, y, 238, alpha, pulse);
      const url = "srmnexus.app";
      const count = Math.floor(url.length * easeOut(progress(sec, 25.7, 27.8)));
      text(url.slice(0, count), width / 2, y + 252, 36, "#F8FAFC", { weight: 700, alpha: alpha * 0.92 });
    };

    const drawFrame = (elapsedMs) => {
      const sec = elapsedMs / 1000;
      bass.gain.gain.setTargetAtTime(0.10 + 0.05 * progress(sec, 0, 24), audio.currentTime, 0.08);
      droneA.gain.gain.setTargetAtTime(0.03 + 0.025 * progress(sec, 6, 24), audio.currentTime, 0.08);
      droneB.gain.gain.setTargetAtTime(0.025 + 0.02 * Math.sin(sec * 0.33), audio.currentTime, 0.08);
      shimmer.gain.gain.setTargetAtTime(0.008 + 0.014 * inOut(sec, 12, 24, 2, 2), audio.currentTime, 0.08);
      tension.gain.gain.setTargetAtTime(0.006 + 0.012 * inOut(sec, 18, 25, 2, 2), audio.currentTime, 0.08);
      master.gain.setTargetAtTime(0.22 * (1 - progress(sec, 28.5, 30.0) * 0.88), audio.currentTime, 0.06);

      drawBackground(sec);
      ctx.save();
      const float = Math.sin(sec * 0.75) * 14;

      const spark = inOut(sec, 0, 6, 1.2, 0.7);
      if (spark > 0) {
        const appear = easeOut(progress(sec, 0.2, 2.6));
        drawIcon(width / 2, lerp(1015, 875, progress(sec, 0, 6)) + float, 238 * appear, spark, (Math.sin(sec * 2.2) + 1) / 2);
      }

      if (sec >= 6 && sec < 12.4) drawDashboard(sec, inOut(sec, 6, 12, 0.7, 0.6));
      if (sec >= 12 && sec < 18.4) drawGrades(sec, inOut(sec, 12, 18, 0.7, 0.6));
      if (sec >= 18 && sec < 24.4) drawAttendance(sec, inOut(sec, 18, 24, 0.7, 0.55));
      if (sec >= 24) drawFinale(sec, inOut(sec, 24, 30, 0.8, 0.9));

      ctx.restore();
      drawLightLeak(sec, 5.25, 0.85, "horizontal");
      drawLightLeak(sec, 11.25, 0.85, "vertical");
      drawLightLeak(sec, 17.25, 0.9, "horizontal");
      drawLightLeak(sec, 23.25, 0.8, "vertical");

      const vignette = ctx.createRadialGradient(width / 2, height / 2, 160, width / 2, height / 2, 1060);
      vignette.addColorStop(0, "rgba(0,0,0,0)");
      vignette.addColorStop(1, "rgba(0,0,0,0.72)");
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, width, height);

      if (sec > 29.15) {
        ctx.fillStyle = `rgba(5,5,5,${progress(sec, 29.15, 30.0)})`;
        ctx.fillRect(0, 0, width, height);
      }
    };

    await audio.resume();
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
    await audio.close();

    const blob = new Blob(chunks, { type: mimeType });
    return Array.from(new Uint8Array(await blob.arrayBuffer()));
  },
  { width, height, fps, durationMs, videoBitrate }
);

await browser.close();
await mkdir(dirname(webmPath), { recursive: true });
await writeFile(webmPath, Buffer.from(bytes));

if (!ffmpegPath) {
  throw new Error("ffmpeg-static did not provide an ffmpeg binary path");
}

await new Promise((resolvePromise, rejectPromise) => {
  const ffmpeg = spawn(ffmpegPath, [
    "-y",
    "-i",
    webmPath,
    "-t",
    "30",
    "-r",
    String(fps),
    "-vf",
    "scale=1080:1920",
    "-c:v",
    "libx264",
    "-preset",
    "medium",
    "-crf",
    "18",
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    "aac",
    "-b:a",
    "160k",
    "-movflags",
    "+faststart",
    outputPath,
  ]);

  let stderr = "";
  ffmpeg.stderr.on("data", (data) => {
    stderr += data.toString();
  });
  ffmpeg.on("close", (code) => {
    if (code === 0) resolvePromise();
    else rejectPromise(new Error(stderr || `ffmpeg exited with code ${code}`));
  });
});

console.log(`Generated ${outputPath}`);
