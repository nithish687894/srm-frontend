# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: login.spec.ts >> SRM Nexus — Authentication Gateway >> should successfully authenticate via Quick Launch Demo Mode
- Location: tests\login.spec.ts:90:7

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /.*(setup\/theme|dashboard)/
Received string:  "http://localhost:3000/"
Timeout: 10000ms

Call log:
  - Expect "toHaveURL" with timeout 10000ms
    21 × unexpected value "http://localhost:3000/"

```

```yaml
- img
- text: AUTHENTICATION GRANTED ESTABLISHING SECURE CONNECTION...
- img "Logo"
- heading "SRM NEXUS" [level=2]
- paragraph: → IDENTITY SECURE
- textbox "NETID (e.g. ab1234)" [disabled]: demo12
- textbox "PASSWORD" [disabled]: demo
- button
- checkbox "Remember session" [checked]
- text: Remember session
- button "INITIALIZING..." [disabled]
- button "Quick Launch Demo Mode" [disabled]
- text: v2.0 PRODUCTION SYSTEMS ONLINE
- heading "Dominate Your Academic Journey." [level=1]
- paragraph: Experience the next generation of student intelligence. Precision metrics, AI-driven predictions, and zero-latency synchronization.
- text: Launch trailer Your Academic OS SECURE SYNC Bank-grade encryption for all your portal interactions. ULTRA SPEED Engineered for zero-lag data hydration.
- heading "The Nexus Advantage" [level=2]
- paragraph: Why settle for the official portal?
- table:
  - rowgroup:
    - 'row "Load Speed Academia: ~8.4s Nexus: ~0.4s"':
      - cell "Load Speed"
      - 'cell "Academia: ~8.4s"'
      - 'cell "Nexus: ~0.4s"'
    - row "Mobile UX Non-Responsive Pure Native Feel":
      - cell "Mobile UX"
      - cell "Non-Responsive"
      - cell "Pure Native Feel"
    - row "Intelligence Static Data AI Prediction":
      - cell "Intelligence"
      - cell "Static Data"
      - cell "AI Prediction"
- contentinfo: SRM NEXUS © 2026 • ENGINEERED FOR EXCELLENCE
- alert
```

# Test source

```ts
  4   |   
  5   |   test.beforeEach(async ({ page }) => {
  6   |     // Capture browser console logs for E2E debugging if needed
  7   |     // page.on('console', msg => console.log(`[BROWSER]: ${msg.type().toUpperCase()}: ${msg.text()}`));
  8   | 
  9   |     // Prevent the PWA installation popup from showing up and obscuring buttons on mobile viewports
  10  |     await page.addInitScript(() => {
  11  |       window.localStorage.setItem('srmx_pwa_dismissed', 'true');
  12  |     });
  13  | 
  14  |     // Mock config and broadcast endpoints to prevent log clutter and network errors
  15  |     await page.route('**/api/config', async (route) => {
  16  |       await route.fulfill({
  17  |         status: 200,
  18  |         contentType: 'application/json',
  19  |         body: JSON.stringify({ success: true }),
  20  |       });
  21  |     });
  22  | 
  23  |     await page.route('**/api/admin/broadcast', async (route) => {
  24  |       await route.fulfill({
  25  |         status: 200,
  26  |         contentType: 'application/json',
  27  |         body: JSON.stringify({ success: true, broadcast: null }),
  28  |       });
  29  |     });
  30  | 
  31  |     // Intercept login API requests with realistic network latency to prevent instant loading transition race conditions
  32  |     await page.route('**/api/v1/connectors/academia/connect', async (route) => {
  33  |       await new Promise((resolve) => setTimeout(resolve, 500)); // 500ms network delay simulation
  34  |       await route.fulfill({
  35  |         status: 200,
  36  |         contentType: 'application/json',
  37  |         body: JSON.stringify({
  38  |           success: true,
  39  |           token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mockTokenPayload',
  40  |           refreshToken: 'mock-refresh-token-for-nexus-e2e',
  41  |         }),
  42  |       });
  43  |     });
  44  | 
  45  |     // Intercept captcha/initAuth requests if student-portal connector is accessed
  46  |     await page.route('**/api/v1/connectors/student-portal/init', async (route) => {
  47  |       await route.fulfill({
  48  |         status: 200,
  49  |         contentType: 'application/json',
  50  |         body: JSON.stringify({
  51  |           success: true,
  52  |           captcha: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  53  |           captchaToken: 'mock-captcha-token',
  54  |         }),
  55  |       });
  56  |     });
  57  | 
  58  |     await page.goto('/');
  59  |   });
  60  | 
  61  |   test('should load the gateway page with branding and layout', async ({ page }) => {
  62  |     // Verify the page title
  63  |     await expect(page).toHaveTitle(/SRM Nexus/i);
  64  | 
  65  |     // Verify main branding elements are present
  66  |     const logo = page.locator('img[alt="Logo"]');
  67  |     await expect(logo).toBeVisible();
  68  | 
  69  |     const title = page.locator('h2', { hasText: 'SRM NEXUS' });
  70  |     await expect(title).toBeVisible();
  71  | 
  72  |     // Verify critical CTA button is visible
  73  |     const submitBtn = page.getByTestId('submit-login-btn');
  74  |     await expect(submitBtn).toBeVisible();
  75  |     await expect(submitBtn).toHaveText(/ENTER ACADEMIC OS/i);
  76  |   });
  77  | 
  78  |   test('should show validation error when submitting empty credentials', async ({ page }) => {
  79  |     const submitBtn = page.getByTestId('submit-login-btn');
  80  |     
  81  |     // Click submit without entering AnyValue NETID or password
  82  |     await submitBtn.click();
  83  | 
  84  |     // Verify error message is displayed
  85  |     const errorDiv = page.getByTestId('login-error');
  86  |     await expect(errorDiv).toBeVisible();
  87  |     await expect(errorDiv).toHaveText(/PROVIDE CREDENTIALS/i);
  88  |   });
  89  | 
  90  |   test('should successfully authenticate via Quick Launch Demo Mode', async ({ page }) => {
  91  |     const demoBtn = page.getByTestId('quick-demo-btn');
  92  |     
  93  |     // Scroll the button into view to ensure it's not clipped and is fully visible on smaller mobile viewports (e.g. iPhone 14)
  94  |     await demoBtn.scrollIntoViewIfNeeded();
  95  |     await expect(demoBtn).toBeVisible();
  96  | 
  97  |     // Click quick demo launch
  98  |     await demoBtn.click();
  99  | 
  100 |     // Verify that it successfully redirects to the setup page (theme selection) or dashboard.
  101 |     // Note: Upon successful auth, the authToken is instantly stored in Zustand, triggering
  102 |     // a synchronous router.replace in Next.js. Thus, the intermediate "AUTHENTICATION GRANTED" 
  103 |     // visual state is unmounted almost instantly, making a direct check on the target URL the most reliable E2E check.
> 104 |     await expect(page).toHaveURL(/.*(setup\/theme|dashboard)/, { timeout: 10000 });
      |                        ^ Error: expect(page).toHaveURL(expected) failed
  105 |   });
  106 | 
  107 |   test('should show correct error message on invalid credentials from backend', async ({ page }) => {
  108 |     // Mock unauthorized connector response
  109 |     await page.route('**/api/v1/connectors/academia/connect', async (route) => {
  110 |       await route.fulfill({
  111 |         status: 401,
  112 |         contentType: 'application/json',
  113 |         body: JSON.stringify({
  114 |           success: false,
  115 |           error: 'INVALID NETID OR PASSWORD',
  116 |         }),
  117 |       });
  118 |     });
  119 | 
  120 |     // Enter credentials
  121 |     await page.getByTestId('netid-input').fill('ab1234');
  122 |     await page.getByTestId('password-input').fill('wrongpass');
  123 | 
  124 |     // Submit form
  125 |     const submitBtn = page.getByTestId('submit-login-btn');
  126 |     await submitBtn.click();
  127 | 
  128 |     // Verify error message is displayed
  129 |     const errorDiv = page.getByTestId('login-error');
  130 |     await expect(errorDiv).toBeVisible();
  131 |     await expect(errorDiv).toHaveText(/INVALID NETID OR PASSWORD/i);
  132 |   });
  133 | 
  134 |   test('should show fallback error message on backend internal server error', async ({ page }) => {
  135 |     // Mock internal server error response
  136 |     await page.route('**/api/v1/connectors/academia/connect', async (route) => {
  137 |       await route.fulfill({
  138 |         status: 500,
  139 |         contentType: 'application/json',
  140 |         body: JSON.stringify({
  141 |           success: false,
  142 |           error: 'GATEWAY OFFLINE',
  143 |         }),
  144 |       });
  145 |     });
  146 | 
  147 |     // Enter credentials
  148 |     await page.getByTestId('netid-input').fill('ab1234');
  149 |     await page.getByTestId('password-input').fill('somepass');
  150 | 
  151 |     // Submit form
  152 |     const submitBtn = page.getByTestId('submit-login-btn');
  153 |     await submitBtn.click();
  154 | 
  155 |     // Verify error message is displayed
  156 |     const errorDiv = page.getByTestId('login-error');
  157 |     await expect(errorDiv).toBeVisible();
  158 |     await expect(errorDiv).toHaveText(/GATEWAY OFFLINE/i);
  159 |   });
  160 | 
  161 | });
  162 | 
```