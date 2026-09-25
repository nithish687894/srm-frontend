import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const scratchDir = path.resolve('scratch');
if (!fs.existsSync(scratchDir)) {
  fs.mkdirSync(scratchDir, { recursive: true });
}

async function runAudit() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('1. Navigating to login page...');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });

  // Click "Preview sample dashboard"
  console.log('Clicking sample dashboard button...');
  const demoBtn = page.getByText(/Preview sample dashboard/i);
  await demoBtn.waitFor({ state: 'visible', timeout: 10000 });
  await demoBtn.click();

  console.log('Waiting for navigation to /dashboard...');
  await page.waitForURL('**/dashboard', { timeout: 15000 });
  await page.waitForTimeout(3000);
  console.log('Successfully navigated to:', page.url());

  const pages = [
    { name: 'dashboard', path: '/dashboard' },
    { name: 'timetable', path: '/timetable' },
    { name: 'attendance', path: '/attendance' },
    { name: 'marks', path: '/marks' },
    { name: 'gpa', path: '/gpa' }
  ];

  // 1. Desktop 1440x900
  console.log('\n--- Auditing Desktop 1440x900 ---');
  await page.setViewportSize({ width: 1440, height: 900 });
  for (const item of pages) {
    await page.goto('http://localhost:3000' + item.path, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    const savePath = path.join(scratchDir, `desktop_${item.name}.png`);
    await page.screenshot({ path: savePath, fullPage: false });
    console.log(`Saved ${savePath}`);
  }

  // 2. Tablet 820x1024
  console.log('\n--- Auditing Tablet 820x1024 ---');
  await page.setViewportSize({ width: 820, height: 1024 });
  for (const item of pages.slice(0, 3)) {
    await page.goto('http://localhost:3000' + item.path, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    const savePath = path.join(scratchDir, `tablet_${item.name}.png`);
    await page.screenshot({ path: savePath, fullPage: false });
    console.log(`Saved ${savePath}`);
  }

  // 3. Mobile 390x844
  console.log('\n--- Auditing Mobile 390x844 ---');
  await page.setViewportSize({ width: 390, height: 844 });
  for (const item of pages.slice(0, 3)) {
    await page.goto('http://localhost:3000' + item.path, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    const savePath = path.join(scratchDir, `mobile_${item.name}.png`);
    await page.screenshot({ path: savePath, fullPage: false });
    console.log(`Saved ${savePath}`);
  }

  await browser.close();
  console.log('\nAudit complete: All screenshots captured.');
}

runAudit().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
