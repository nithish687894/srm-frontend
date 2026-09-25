const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const publicDir = path.join(__dirname, '..', 'public');

// Standalone Vector Icon SVG (Square 512x512 viewBox)
const svgIcon512 = `
<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="bgGlow" cx="50%" cy="30%" r="60%">
      <stop offset="0%" stop-color="#1E1B4B" stop-opacity="0.8" />
      <stop offset="100%" stop-color="#09090F" stop-opacity="1" />
    </radialGradient>
    <linearGradient id="nLeft" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#60A5FA" />
      <stop offset="100%" stop-color="#2563EB" />
    </linearGradient>
    <linearGradient id="nRight" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#3B82F6" />
      <stop offset="100%" stop-color="#1D4ED8" />
    </linearGradient>
    <linearGradient id="nBridge" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#93C5FD" />
      <stop offset="50%" stop-color="#60A5FA" />
      <stop offset="100%" stop-color="#3B82F6" />
    </linearGradient>
    <linearGradient id="borderGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#3E394A" />
      <stop offset="100%" stop-color="#1A1724" />
    </linearGradient>
    <filter id="neon" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="12" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Background Container -->
  <rect x="16" y="16" width="480" height="480" rx="120" fill="url(#bgGlow)" stroke="url(#borderGrad)" stroke-width="12" />
  
  <!-- Subtle Internal Highlight -->
  <rect x="28" y="28" width="456" height="456" rx="108" fill="none" stroke="#2563EB" stroke-width="2" stroke-opacity="0.25" />

  <!-- Nexus 'N' Monogram -->
  <g filter="url(#neon)">
    <!-- Left Pillar (Academia) -->
    <rect x="124" y="130" width="58" height="252" rx="24" fill="url(#nLeft)" />

    <!-- Central Dynamic Diagonal Bridge (Convergence Gateway) -->
    <path d="M148 142 L364 362 C376 374 388 368 388 352 L388 320 L184 116 C172 104 160 110 160 126 Z" fill="url(#nBridge)" opacity="0.95" />

    <!-- Right Pillar (Student Portal) -->
    <rect x="330" y="130" width="58" height="252" rx="24" fill="url(#nRight)" />

    <!-- Core Convergence Star Node -->
    <circle cx="256" cy="256" r="16" fill="#FFFFFF" />
    <circle cx="256" cy="256" r="32" fill="#93C5FD" fill-opacity="0.35" />
  </g>
</svg>
`.trim();

// Favicon SVG (clean, high-contrast, scalable)
const svgFavicon = `
<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="favLeft" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#60A5FA" />
      <stop offset="100%" stop-color="#2563EB" />
    </linearGradient>
    <linearGradient id="favRight" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#3B82F6" />
      <stop offset="100%" stop-color="#1D4ED8" />
    </linearGradient>
    <linearGradient id="favBridge" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#93C5FD" />
      <stop offset="100%" stop-color="#3B82F6" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="32" height="32" rx="8" fill="#09090F" />
  <rect x="0.75" y="0.75" width="30.5" height="30.5" rx="7.25" stroke="#2563EB" stroke-opacity="0.3" stroke-width="1.5" />

  <!-- Left Pillar -->
  <rect x="7" y="7.5" width="4.2" height="17" rx="2" fill="url(#favLeft)" />

  <!-- Bridge -->
  <path d="M8.5 8.5 L23.5 23.5 C24.5 24.5 25.5 24 25.5 22.8 L25.5 20.5 L11.5 6.5 C10.5 5.5 9.5 6 9.5 7.2 Z" fill="url(#favBridge)" />

  <!-- Right Pillar -->
  <rect x="20.8" y="7.5" width="4.2" height="17" rx="2" fill="url(#favRight)" />

  <!-- Nexus Core -->
  <circle cx="16" cy="16" r="1.5" fill="#FFFFFF" />
</svg>
`.trim();

// OpenGraph / Google Search Social Card (1200x630)
const svgOg = `
<svg width="1200" height="630" viewBox="0 0 1200 630" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="ogGlow" cx="25%" cy="35%" r="70%">
      <stop offset="0%" stop-color="#1E1B4B" stop-opacity="0.9" />
      <stop offset="60%" stop-color="#09090F" stop-opacity="1" />
      <stop offset="100%" stop-color="#050508" stop-opacity="1" />
    </radialGradient>
    <linearGradient id="ogPillar" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#60A5FA" />
      <stop offset="100%" stop-color="#2563EB" />
    </linearGradient>
    <linearGradient id="ogBridge" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#93C5FD" />
      <stop offset="100%" stop-color="#3B82F6" />
    </linearGradient>
    <linearGradient id="textGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="100%" stop-color="#E2E8F0" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#ogGlow)" />
  <rect x="1" y="1" width="1198" height="628" fill="none" stroke="#292532" stroke-width="2" />

  <!-- Grid lines background -->
  <g stroke="#2563EB" stroke-opacity="0.06" stroke-width="1">
    <line x1="0" y1="126" x2="1200" y2="126" />
    <line x1="0" y1="252" x2="1200" y2="252" />
    <line x1="0" y1="378" x2="1200" y2="378" />
    <line x1="0" y1="504" x2="1200" y2="504" />
    <line x1="240" y1="0" x2="240" y2="630" />
    <line x1="480" y1="0" x2="480" y2="630" />
    <line x1="720" y1="0" x2="720" y2="630" />
    <line x1="960" y1="0" x2="960" y2="630" />
  </g>

  <!-- Logo Mark Left -->
  <g transform="translate(100, 165)">
    <rect width="300" height="300" rx="75" fill="#12121A" stroke="#292532" stroke-width="6" />
    <rect x="8" y="8" width="284" height="284" rx="67" fill="none" stroke="#2563EB" stroke-opacity="0.3" stroke-width="2" />

    <!-- Left Pillar -->
    <rect x="75" y="75" width="36" height="150" rx="14" fill="url(#ogPillar)" />
    <!-- Diagonal Bridge -->
    <path d="M88 82 L222 216 C230 224 238 220 238 210 L238 190 L110 64 C102 56 94 60 94 70 Z" fill="url(#ogBridge)" opacity="0.95" />
    <!-- Right Pillar -->
    <rect x="189" y="75" width="36" height="150" rx="14" fill="url(#ogPillar)" />
    <!-- Central Node -->
    <circle cx="150" cy="150" r="10" fill="#FFFFFF" />
    <circle cx="150" cy="150" r="22" fill="#93C5FD" fill-opacity="0.3" />
  </g>

  <!-- Brand Typography Right -->
  <g transform="translate(460, 210)">
    <!-- Pill -->
    <rect width="130" height="34" rx="17" fill="#12121A" stroke="#292532" stroke-width="1.5" />
    <circle cx="20" cy="17" r="4" fill="#4ADE80" />
    <text x="34" y="22" fill="#B8B2C2" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="13" font-weight="700" letter-spacing="0.05em">SRM NEXUS</text>

    <!-- Main Heading -->
    <text x="0" y="105" fill="url(#textGrad)" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="58" font-weight="800" letter-spacing="-0.04em">Unified Academic Workspace</text>
    
    <!-- Subtitle -->
    <text x="0" y="165" fill="#9C96A7" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="24" font-weight="500" letter-spacing="-0.01em">Authoritative Attendance · Internal Marks · Timetable · Friends Sync</text>

    <!-- Tags Row -->
    <g transform="translate(0, 215)">
      <rect x="0" y="0" width="160" height="38" rx="8" fill="#12121A" stroke="#292532" />
      <text x="16" y="24" fill="#60A5FA" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="14" font-weight="700">Dual-Portal Sync</text>

      <rect x="175" y="0" width="165" height="38" rx="8" fill="#12121A" stroke="#292532" />
      <text x="191" y="24" fill="#4ADE80" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="14" font-weight="700">Student Portal Live</text>

      <rect x="355" y="0" width="150" height="38" rx="8" fill="#12121A" stroke="#292532" />
      <text x="371" y="24" fill="#A78BFA" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="14" font-weight="700">DO 1–5 Schedules</text>
    </g>
  </g>
</svg>
`.trim();

async function generateAllAssets() {
  console.log('Writing vector files...');
  fs.writeFileSync(path.join(publicDir, 'nexus-icon.svg'), svgIcon512);
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgFavicon);

  console.log('Generating PNG assets via sharp...');
  
  // 512x512 Master Logo PNG
  await sharp(Buffer.from(svgIcon512))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'nexus-logo.png'));
  console.log('✓ public/nexus-logo.png (512x512)');

  // 192x192 Android Chrome Icon
  await sharp(Buffer.from(svgIcon512))
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'android-chrome-192x192.png'));
  console.log('✓ public/android-chrome-192x192.png (192x192)');

  // 512x512 Android Chrome Icon
  await sharp(Buffer.from(svgIcon512))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'android-chrome-512x512.png'));
  console.log('✓ public/android-chrome-512x512.png (512x512)');

  // 180x180 Apple Touch Icon
  await sharp(Buffer.from(svgIcon512))
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('✓ public/apple-touch-icon.png (180x180)');

  // 32x32 Favicon PNG
  await sharp(Buffer.from(svgFavicon))
    .resize(32, 32)
    .png()
    .toFile(path.join(publicDir, 'favicon-32x32.png'));
  console.log('✓ public/favicon-32x32.png (32x32)');

  // 16x16 Favicon PNG
  await sharp(Buffer.from(svgFavicon))
    .resize(16, 16)
    .png()
    .toFile(path.join(publicDir, 'favicon-16x16.png'));
  console.log('✓ public/favicon-16x16.png (16x16)');

  // OpenGraph Image 1200x630
  await sharp(Buffer.from(svgOg))
    .resize(1200, 630)
    .png()
    .toFile(path.join(publicDir, 'og-image.png'));
  console.log('✓ public/og-image.png (1200x630)');

  console.log('All logo and icon assets successfully generated!');
}

generateAllAssets().catch(err => {
  console.error('Error generating assets:', err);
  process.exit(1);
});
