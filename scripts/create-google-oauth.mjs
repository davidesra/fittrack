import { chromium } from 'playwright';
import { writeFileSync, readFileSync } from 'fs';
import { resolve } from 'path';

const PROJECT_ID = 'fittrack-app-1771586104';
const REDIRECT_URI = 'http://localhost:3000/api/auth/callback/google';
const ENV_PATH = resolve(process.cwd(), '.env.local');

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function waitAndClick(page, selector, timeout = 15000) {
  await page.waitForSelector(selector, { timeout });
  await page.click(selector);
}

(async () => {
  console.log('🚀 Opening Google Cloud Console...');
  const browser = await chromium.launch({ headless: false, slowMo: 200 });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  // ── Step 1: Go to OAuth consent screen ─────────────────────────────────────
  console.log('📋 Navigating to OAuth consent screen...');
  await page.goto(
    `https://console.cloud.google.com/apis/credentials/consent?project=${PROJECT_ID}`,
    { waitUntil: 'networkidle', timeout: 60000 }
  );

  // Handle Google sign-in if needed
  if (page.url().includes('accounts.google.com')) {
    console.log('⏳ Please sign in to Google in the browser window...');
    await page.waitForURL(`**console.cloud.google.com**`, { timeout: 120000 });
    await sleep(3000);
  }

  // Select "External" user type
  try {
    console.log('🔘 Selecting External user type...');
    // Wait for the radio buttons
    await page.waitForSelector('text=External', { timeout: 20000 });
    await page.click('mat-radio-button:has-text("External")');
    await sleep(1000);
    // Click Create
    await page.click('button:has-text("Create")');
    await sleep(3000);
  } catch(e) {
    console.log('ℹ️  Consent screen may already exist, continuing...');
  }

  // ── Step 2: Fill out OAuth consent form ────────────────────────────────────
  try {
    console.log('📝 Filling consent screen form...');
    await page.waitForSelector('input[formcontrolname="applicationTitle"], input[aria-label*="App name"]', { timeout: 20000 });

    // App name
    const appNameInput = page.locator('input[formcontrolname="applicationTitle"]').first();
    await appNameInput.fill('FitTrack');

    // Support email
    const emailSelects = page.locator('mat-select, [role="combobox"]');
    if (await emailSelects.count() > 0) {
      await emailSelects.first().click();
      await sleep(1000);
      await page.click(`mat-option:has-text("davidesra@gmail.com")`).catch(() => {});
    }

    // Developer contact email
    const devEmailInput = page.locator('input[formcontrolname="developerEmail"]').first();
    await devEmailInput.fill('davidesra@gmail.com').catch(() => {});

    // Save and Continue
    await page.click('button:has-text("Save and Continue"), button:has-text("SAVE AND CONTINUE")');
    await sleep(2000);

    // Continue through Scopes page
    await page.click('button:has-text("Save and Continue"), button:has-text("SAVE AND CONTINUE")').catch(() => {});
    await sleep(2000);

    // Continue through Test users page
    await page.click('button:has-text("Save and Continue"), button:has-text("SAVE AND CONTINUE")').catch(() => {});
    await sleep(2000);

    // Back to dashboard
    await page.click('button:has-text("Back to Dashboard"), a:has-text("Back to Dashboard")').catch(() => {});
    await sleep(2000);
    console.log('✅ Consent screen configured!');
  } catch(e) {
    console.log('ℹ️  Consent screen step skipped or already done:', e.message);
  }

  // ── Step 3: Create OAuth 2.0 Client ID ─────────────────────────────────────
  console.log('🔑 Creating OAuth 2.0 Client ID...');
  await page.goto(
    `https://console.cloud.google.com/apis/credentials/oauthclient?project=${PROJECT_ID}`,
    { waitUntil: 'networkidle', timeout: 30000 }
  );
  await sleep(3000);

  // Select application type: Web application
  try {
    await page.waitForSelector('mat-select[formcontrolname="applicationType"], [aria-label*="Application type"]', { timeout: 15000 });
    await page.click('mat-select[formcontrolname="applicationType"], [aria-label*="Application type"]');
    await sleep(1000);
    await page.click('mat-option:has-text("Web application")');
    await sleep(1000);
  } catch(e) {
    console.log('ℹ️  Trying alternative app type selector...');
    await page.selectOption('select', 'web').catch(() => {});
  }

  // Set name
  const nameInput = page.locator('input[formcontrolname="displayName"], input[aria-label*="Name"]').first();
  await nameInput.fill('FitTrack Web').catch(() => {});

  // Add redirect URI
  try {
    await page.click('button:has-text("Add URI"), button:has-text("ADD URI")');
    await sleep(500);
    const uriInputs = page.locator('input[formcontrolname="uri"]');
    const lastInput = uriInputs.last();
    await lastInput.fill(REDIRECT_URI);
    await sleep(500);
  } catch(e) {
    console.log('ℹ️  URI field approach 2...');
    await page.fill('input[placeholder*="URI"]', REDIRECT_URI).catch(() => {});
  }

  // Click Create
  await page.click('button:has-text("Create"), button:has-text("CREATE")');
  await sleep(5000);

  // ── Step 4: Extract credentials from modal ──────────────────────────────────
  console.log('📋 Extracting credentials...');
  let clientId = '';
  let clientSecret = '';

  try {
    // The modal shows "OAuth client created" with the credentials
    await page.waitForSelector('text=OAuth client created', { timeout: 15000 });

    // Extract from the dialog
    const allText = await page.locator('mat-dialog-content, .credentials-dialog, [role="dialog"]').textContent();
    console.log('Dialog text:', allText?.substring(0, 500));

    // Try to get Client ID and Secret from inputs in the dialog
    const inputs = page.locator('mat-dialog-content input, [role="dialog"] input');
    const count = await inputs.count();
    for (let i = 0; i < count; i++) {
      const val = await inputs.nth(i).inputValue();
      if (val.includes('.apps.googleusercontent.com')) clientId = val;
      if (val.startsWith('GOCSPX-') || (val.length > 20 && !val.includes('.'))) clientSecret = val;
    }
  } catch(e) {
    console.log('ℹ️  Trying page content extraction...');
    // Try extracting from page directly
    const content = await page.content();
    const idMatch = content.match(/(\d+-[a-z0-9]+\.apps\.googleusercontent\.com)/);
    const secretMatch = content.match(/GOCSPX-[a-zA-Z0-9_-]+/);
    if (idMatch) clientId = idMatch[1];
    if (secretMatch) clientSecret = secretMatch[0];
  }

  if (clientId && clientSecret) {
    console.log(`\n✅ Got credentials!`);
    console.log(`Client ID: ${clientId}`);
    console.log(`Client Secret: ${clientSecret.substring(0, 8)}...`);

    // Write to .env.local
    let env = readFileSync(ENV_PATH, 'utf8');
    env = env.replace(/AUTH_GOOGLE_ID=".*"/, `AUTH_GOOGLE_ID="${clientId}"`);
    env = env.replace(/AUTH_GOOGLE_SECRET=".*"/, `AUTH_GOOGLE_SECRET="${clientSecret}"`);
    writeFileSync(ENV_PATH, env);
    console.log('✅ Written to .env.local!');
  } else {
    console.log('\n⚠️  Could not auto-extract credentials. Taking screenshot...');
    await page.screenshot({ path: '/tmp/google-oauth-result.png', fullPage: true });
    console.log('Screenshot saved to /tmp/google-oauth-result.png');
    console.log('\nPlease check the browser window for your Client ID and Secret,');
    console.log('then paste them in the terminal.');
  }

  await sleep(5000);
  await browser.close();
})();
