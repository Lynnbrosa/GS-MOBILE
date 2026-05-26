import puppeteer from 'puppeteer';
import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'assets', 'screenshots');
const URL = process.env.SCREENSHOT_URL || 'http://localhost:8091';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function clickByText(page, text) {
  // Find every visible element whose textContent equals the target, then
  // walk up each candidate looking for a React-managed onClick. Use the
  // deepest match — it's the most specific clickable region.
  const result = await page.evaluate((t) => {
    if (document.activeElement && document.activeElement !== document.body) {
      document.activeElement.blur();
    }
    const all = Array.from(document.querySelectorAll('*'));
    const candidates = all.filter((el) => {
      if (el.textContent?.trim() !== t) return false;
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });
    if (candidates.length === 0) return { ok: false, reason: `no element with text "${t}"` };
    // Prefer the deepest candidate (smallest area or no children)
    candidates.sort((a, b) => {
      const ra = a.getBoundingClientRect();
      const rb = b.getBoundingClientRect();
      return ra.width * ra.height - rb.width * rb.height;
    });
    for (const target of candidates) {
      let p = target;
      let depth = 0;
      while (p && p !== document.body && depth < 12) {
        const propsKey = Object.keys(p).find((k) => k.startsWith('__reactProps'));
        if (propsKey && p[propsKey] && typeof p[propsKey].onClick === 'function') {
          p.scrollIntoView({ block: 'center', behavior: 'instant' });
          p.click();
          return { ok: true, depth, tag: p.tagName };
        }
        p = p.parentElement;
        depth++;
      }
    }
    return { ok: false, reason: 'no pressable ancestor on any candidate' };
  }, text);
  if (!result.ok) throw new Error(`Click "${text}" failed: ${result.reason}`);
  await sleep(400);
}

async function fillInputByPlaceholder(page, placeholder, value) {
  await page.evaluate((p) => {
    const inputs = Array.from(document.querySelectorAll(`input[placeholder="${p}"]`));
    const visible = inputs.find((el) => {
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && el.offsetParent !== null;
    });
    if (!visible) throw new Error(`No visible input ${p} (found ${inputs.length})`);
    visible.focus();
    if (document.activeElement !== visible) {
      throw new Error(`Could not focus input ${p}`);
    }
  }, placeholder);
  // Clear any existing value
  await page.keyboard.down('Control');
  await page.keyboard.press('A');
  await page.keyboard.up('Control');
  await page.keyboard.press('Delete');
  await page.keyboard.type(value, { delay: 20 });
}

async function shot(page, name) {
  const file = path.join(OUT_DIR, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  console.log(`saved ${name}.png`);
}

async function waitForRoot(page) {
  await page.waitForFunction(
    () => document.querySelector('#root')?.children.length > 0,
    { timeout: 30000 }
  );
  await sleep(800);
}

async function goToTab(page, tabName) {
  await clickByText(page, tabName);
  await sleep(500);
}

async function toggleDarkSwitch(page) {
  // Settings has 2 switches: first is dark mode, second is notifications.
  // Find the first role=switch
  const sw = await page.$('[role="switch"]');
  if (!sw) throw new Error('Dark switch not found');
  await sw.click();
  await sleep(500);
}

async function ensureSettingsTab(page) {
  await goToTab(page, 'Config');
}

async function pressBackArrow(page) {
  // The back arrow is a small clickable element in the upper-left portion of
  // the viewport. Find the smallest React-clickable region inside that band.
  const result = await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll('div'));
    const candidates = all.filter((el) => {
      const r = el.getBoundingClientRect();
      if (r.top < 0 || r.top > 220) return false;
      if (r.left < 0 || r.left > 120) return false;
      if (r.width > 120 || r.height > 80) return false;
      if (r.width < 12 || r.height < 12) return false;
      const propsKey = Object.keys(el).find((k) => k.startsWith('__reactProps'));
      return propsKey && el[propsKey] && typeof el[propsKey].onClick === 'function';
    });
    candidates.sort((a, b) => {
      const ra = a.getBoundingClientRect();
      const rb = b.getBoundingClientRect();
      return ra.width * ra.height - rb.width * rb.height;
    });
    if (candidates.length === 0) {
      // Diagnostic: report all clickables in upper portion
      const upper = all
        .filter((el) => {
          const r = el.getBoundingClientRect();
          return r.top < 220 && r.width > 0 && r.height > 0;
        })
        .map((el) => {
          const r = el.getBoundingClientRect();
          const propsKey = Object.keys(el).find((k) => k.startsWith('__reactProps'));
          const hasClick = propsKey && el[propsKey] && typeof el[propsKey].onClick === 'function';
          return hasClick ? { top: Math.round(r.top), left: Math.round(r.left), w: Math.round(r.width), h: Math.round(r.height) } : null;
        })
        .filter(Boolean)
        .slice(0, 8);
      return { ok: false, reason: 'no top-left clickable. upper clickables=' + JSON.stringify(upper) };
    }
    candidates[0].click();
    return { ok: true };
  });
  if (!result.ok) throw new Error('Back arrow click failed: ' + result.reason);
  await sleep(500);
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--force-color-profile=srgb',
      '--disable-web-security',
      `--disable-features=IsolateOrigins,site-per-process`,
      '--user-data-dir=' + path.join(ROOT, '.puppeteer-profile'),
    ],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }]);

  console.log('opening', URL);
  await page.goto(URL, { waitUntil: 'networkidle2', timeout: 60000 });
  await waitForRoot(page);
  // Clear any persisted auth from previous runs.
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle2' });
  await waitForRoot(page);

  // Capture Login (light)
  await shot(page, 'login-light');

  // Go to Register
  await clickByText(page, 'Cadastre-se');
  await sleep(1500);
  await shot(page, 'register-light');
  // Diagnostic: how many inputs visible?
  const inputCount = await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input'));
    return inputs.map(i => ({ placeholder: i.placeholder, visible: i.offsetParent !== null }));
  });
  console.log('inputs on screen:', JSON.stringify(inputCount));

  // Fill register form
  const email = `demo+${Date.now()}@orbittapi.dev`;
  await fillInputByPlaceholder(page, 'Seu nome', 'Operador Demo');
  await fillInputByPlaceholder(page, 'voce@exemplo.com', email);
  await fillInputByPlaceholder(page, 'Mínimo 8 caracteres', 'SenhaForte123');
  await fillInputByPlaceholder(page, 'Repita a senha', 'SenhaForte123');
  await sleep(300);
  // Diagnostic: check input values match what we typed
  const inputValues = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('input')).map(i => ({
      placeholder: i.placeholder,
      value: i.value,
      type: i.type,
    }));
  });
  console.log('input values:', JSON.stringify(inputValues));
  // Listen for network requests
  page.on('request', (req) => {
    if (req.url().includes('/auth/')) console.log('REQ', req.method(), req.url());
  });
  page.on('response', (res) => {
    if (res.url().includes('/auth/')) console.log('RES', res.status(), res.url());
  });
  console.log('clicking submit');
  await clickByText(page, 'Criar conta');
  await sleep(3000);
  await shot(page, 'debug-after-submit');

  // Wait for main tabs
  await page.waitForFunction(
    () => Array.from(document.querySelectorAll('*')).some((el) => el.textContent?.trim() === 'Início'),
    { timeout: 30000 },
  );
  await sleep(1500);

  // Home (light)
  await shot(page, 'home-light');

  // Queries
  await goToTab(page, 'Consultas');
  await sleep(800);
  await shot(page, 'queries-light');

  // Favorites
  await goToTab(page, 'Favoritos');
  await sleep(800);
  await shot(page, 'favorites-light');

  // Settings
  await ensureSettingsTab(page);
  await sleep(500);
  await shot(page, 'settings-light');

  // Toggle dark mode
  await toggleDarkSwitch(page);
  await sleep(800);
  await shot(page, 'settings-dark');

  // Now in dark, navigate back through tabs
  await goToTab(page, 'Favoritos');
  await sleep(600);
  await shot(page, 'favorites-dark');

  await goToTab(page, 'Consultas');
  await sleep(600);
  await shot(page, 'queries-dark');

  await goToTab(page, 'Início');
  await sleep(800);
  await shot(page, 'home-dark');

  // Open APOD from Home (still dark)
  await clickByText(page, 'NASA · Foto do dia');
  await sleep(2500);
  await shot(page, 'apod-dark');
  // Go back
  await pressBackArrow(page);
  await sleep(800);

  // Open EONET from Home (still dark)
  await clickByText(page, 'Eventos vistos do espaço');
  await sleep(2500);
  await shot(page, 'events-dark');
  await pressBackArrow(page);
  await sleep(800);

  // Make a query → detail (dark)
  await clickByText(page, 'Nova consulta');
  await sleep(800);
  await fillInputByPlaceholder(page, '-23.5505', '-23.5505');
  await fillInputByPlaceholder(page, '-46.6333', '-46.6333');
  await clickByText(page, 'Consultar');
  await sleep(2500);
  await shot(page, 'detail-dark');
  await pressBackArrow(page);
  await sleep(500);
  await pressBackArrow(page);
  await sleep(500);

  // Toggle back to light via Settings
  await ensureSettingsTab(page);
  await sleep(500);
  await toggleDarkSwitch(page);
  await sleep(500);

  // APOD light
  await goToTab(page, 'Início');
  await sleep(800);
  await clickByText(page, 'NASA · Foto do dia');
  await sleep(2500);
  await shot(page, 'apod-light');
  await pressBackArrow(page);
  await sleep(800);

  // EONET light
  await clickByText(page, 'Eventos vistos do espaço');
  await sleep(2500);
  await shot(page, 'events-light');
  await pressBackArrow(page);
  await sleep(800);

  // Detail light
  await clickByText(page, 'Nova consulta');
  await sleep(800);
  await fillInputByPlaceholder(page, '-23.5505', '-23.5505');
  await fillInputByPlaceholder(page, '-46.6333', '-46.6333');
  await clickByText(page, 'Consultar');
  await sleep(2500);
  await shot(page, 'detail-light');

  // Logout for register-dark screenshot
  await goToTab(page, 'Início');
  await sleep(400);
  await ensureSettingsTab(page);
  await sleep(400);
  await toggleDarkSwitch(page); // back to dark
  await sleep(500);
  await clickByText(page, 'Sair');
  await sleep(400);
  // confirm logout dialog
  try { await clickByText(page, 'Sair'); } catch (e) { /* sometimes auto */ }
  await sleep(1500);

  // Login dark
  await shot(page, 'login-dark');
  await clickByText(page, 'Cadastre-se');
  await sleep(600);
  await shot(page, 'register-dark');

  await browser.close();
  console.log('done');
}

main().catch((err) => {
  console.error('script failed:', err);
  process.exit(1);
});
