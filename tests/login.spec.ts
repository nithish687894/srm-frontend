import { test, expect } from '@playwright/test';

test.describe('SRM Nexus — Authentication Gateway', () => {
  
  test.beforeEach(async ({ page }) => {
    // Capture browser console logs for E2E debugging if needed
    // page.on('console', msg => console.log(`[BROWSER]: ${msg.type().toUpperCase()}: ${msg.text()}`));

    // Prevent the PWA installation popup from showing up and obscuring buttons on mobile viewports
    await page.addInitScript(() => {
      window.localStorage.setItem('srmx_pwa_dismissed', 'true');
    });

    // Mock config and broadcast endpoints to prevent log clutter and network errors
    await page.route('**/api/config', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });

    await page.route('**/api/admin/broadcast', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, broadcast: null }),
      });
    });

    // Intercept login API requests with realistic network latency to prevent instant loading transition race conditions
    await page.route('**/api/v1/connectors/academia/connect', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 500)); // 500ms network delay simulation
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mockTokenPayload',
          refreshToken: 'mock-refresh-token-for-nexus-e2e',
        }),
      });
    });

    // Intercept captcha/initAuth requests if student-portal connector is accessed
    await page.route('**/api/v1/connectors/student-portal/init', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          captcha: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
          captchaToken: 'mock-captcha-token',
        }),
      });
    });

    await page.goto('/');
  });

  test('should load the gateway page with branding and layout', async ({ page }) => {
    // Verify the page title
    await expect(page).toHaveTitle(/SRM Nexus/i);

    // Verify main branding elements are present
    const logo = page.locator('img[alt="Logo"]');
    await expect(logo).toBeVisible();

    const title = page.locator('h2', { hasText: 'SRM NEXUS' });
    await expect(title).toBeVisible();

    // Verify critical CTA button is visible
    const submitBtn = page.getByTestId('submit-login-btn');
    await expect(submitBtn).toBeVisible();
    await expect(submitBtn).toHaveText(/ENTER ACADEMIC OS/i);
  });

  test('should show validation error when submitting empty credentials', async ({ page }) => {
    const submitBtn = page.getByTestId('submit-login-btn');
    
    // Click submit without entering any NETID or password
    await submitBtn.click();

    // Verify error message is displayed
    const errorDiv = page.getByTestId('login-error');
    await expect(errorDiv).toBeVisible();
    await expect(errorDiv).toHaveText(/PROVIDE CREDENTIALS/i);
  });

  test('should successfully authenticate via Quick Launch Demo Mode', async ({ page }) => {
    const demoBtn = page.getByTestId('quick-demo-btn');
    
    // Scroll the button into view to ensure it's not clipped and is fully visible on smaller mobile viewports (e.g. iPhone 14)
    await demoBtn.scrollIntoViewIfNeeded();
    await expect(demoBtn).toBeVisible();

    // Click quick demo launch
    await demoBtn.click();

    // 1. Verify that loading overlay gets triggered instantly
    const overlay = page.locator('text=BREACHING GATEWAY');
    await expect(overlay).toBeVisible();

    // 2. Verify sub-text of loading states
    const subtext = page.locator('text=BYPASSING FIREWALLS');
    await expect(subtext).toBeVisible();

    // 3. Verify that it successfully redirects to the setup page (theme selection) or dashboard.
    // Note: Upon successful auth, the authToken is instantly stored in Zustand, triggering
    // a synchronous router.replace in Next.js. Thus, the intermediate "AUTHENTICATION GRANTED" 
    // visual state is unmounted almost instantly, making a direct check on the target URL the most reliable E2E check.
    await expect(page).toHaveURL(/.*(setup\/theme|dashboard)/, { timeout: 10000 });
  });

  test('should show correct error message on invalid credentials from backend', async ({ page }) => {
    // Mock unauthorized connector response
    await page.route('**/api/v1/connectors/academia/connect', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'INVALID NETID OR PASSWORD',
        }),
      });
    });

    // Enter credentials
    await page.getByTestId('netid-input').fill('ab1234');
    await page.getByTestId('password-input').fill('wrongpass');

    // Submit form
    const submitBtn = page.getByTestId('submit-login-btn');
    await submitBtn.click();

    // Verify error message is displayed
    const errorDiv = page.getByTestId('login-error');
    await expect(errorDiv).toBeVisible();
    await expect(errorDiv).toHaveText(/INVALID NETID OR PASSWORD/i);
  });

  test('should show fallback error message on backend internal server error', async ({ page }) => {
    // Mock internal server error response
    await page.route('**/api/v1/connectors/academia/connect', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'GATEWAY OFFLINE',
        }),
      });
    });

    // Enter credentials
    await page.getByTestId('netid-input').fill('ab1234');
    await page.getByTestId('password-input').fill('somepass');

    // Submit form
    const submitBtn = page.getByTestId('submit-login-btn');
    await submitBtn.click();

    // Verify error message is displayed
    const errorDiv = page.getByTestId('login-error');
    await expect(errorDiv).toBeVisible();
    await expect(errorDiv).toHaveText(/GATEWAY OFFLINE/i);
  });

});
