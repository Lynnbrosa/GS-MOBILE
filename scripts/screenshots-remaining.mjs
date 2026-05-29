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

async function shot(page, name) {
  await page.screenshot({ path: path.join(OUT_DIR, `${name}.png`), fullPage: false });
  console.log(`saved ${name}.png`);
}

async function waitRoot(page) {
  await page.waitForFunction(() => document.querySelector('#root')?.children.length > 0, { timeout: 30000 });
  await sleep(800);
}

async function fillByPlaceholder(page, placeholder, value) {
  await page.evaluate((p) => {
    const inputs = Array.from(document.querySelectorAll(`input[placeholder="${p}"]`));
    const visible = inputs.find((el) => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && el.offsetParent !== null;
    });
    if (!visible) throw new Error('No visible input ' + p);
    visible.focus();
  }, placeholder);
  await page.keyboard.down('Control');
  await page.keyboard.press('A');
  await page.keyboard.up('Control');
  await page.keyboard.press('Delete');
  await page.keyboard.type(value, { delay: 15 });
}

async function clickByText(page, text) {
  const result = await page.evaluate((t) => {
    if (document.activeElement && document.activeElement !== document.body) {
      document.activeElement.blur();
    }
    const all = Array.from(document.querySelectorAll('*'));
    const candidates = all.filter((el) => {
      if (el.textContent?.trim() !== t) return false;
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    });
    if (candidates.length === 0) return { ok: false, reason: `no element with text "${t}"` };
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
          return { ok: true };
        }
        p = p.parentElement;
        depth++;
      }
    }
    return { ok: false, reason: 'no pressable ancestor' };
  }, text);
  if (!result.ok) throw new Error(`Click "${text}" failed: ${result.reason}`);
  await sleep(400);
}

async function clickTabByText(page, text) {
  await clickByText(page, text);
  await sleep(600);
}

async function toggleDarkSwitch(page) {
  const result = await page.evaluate(() => {
    const sw = document.querySelector('[role="switch"]');
    if (!sw) return { ok: false };
    sw.click();
    return { ok: true };
  });
  if (!result.ok) throw new Error('No switch found');
  await sleep(500);
}

async function captureAuthScreens(scheme) {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--force-color-profile=srgb',
      '--disable-web-security',
      `--user-data-dir=${path.join(ROOT, `.puppeteer-profile-${scheme}-auth`)}`,
    ],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: scheme }]);
  await page.goto(URL, { waitUntil: 'networkidle2', timeout: 60000 });
  await waitRoot(page);
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle2' });
  await waitRoot(page);
  await shot(page, `login-${scheme}`);
  await clickByText(page, 'Cadastre-se');
  await sleep(1500);
  await shot(page, `register-${scheme}`);
  await browser.close();
}

async function captureExtras(scheme) {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--force-color-profile=srgb',
      '--disable-web-security',
      `--user-data-dir=${path.join(ROOT, `.puppeteer-profile-${scheme}-extras`)}`,
    ],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: scheme }]);
  await page.goto(URL, { waitUntil: 'networkidle2', timeout: 60000 });
  await waitRoot(page);
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle2' });
  await waitRoot(page);

  await clickByText(page, 'Cadastre-se');
  await sleep(1500);
  const email = `extras-${scheme}-${Date.now()}@orbittapi.dev`;
  await fillByPlaceholder(page, 'Seu nome', 'Operador Demo');
  await fillByPlaceholder(page, 'voce@exemplo.com', email);
  await fillByPlaceholder(page, 'Mínimo 8 caracteres', 'SenhaForte123');
  await fillByPlaceholder(page, 'Repita a senha', 'SenhaForte123');
  await sleep(300);
  await clickByText(page, 'Criar conta');
  await page.waitForFunction(
    () => Array.from(document.querySelectorAll('*')).some((el) => el.textContent?.trim() === 'Início'),
    { timeout: 30000 },
  );
  await sleep(1500);

  // From Home: open APOD
  await clickByText(page, 'NASA · Foto do dia');
  await sleep(3000);
  await shot(page, `apod-${scheme}`);

  // Reload to reset stack to Home
  await page.reload({ waitUntil: 'networkidle2' });
  await waitRoot(page);
  await sleep(1500);

  await clickByText(page, 'Eventos vistos do espaço');
  await sleep(3000);
  await shot(page, `events-${scheme}`);

  // Detail screen: reload, then Nova consulta → fill → consultar
  await page.reload({ waitUntil: 'networkidle2' });
  await waitRoot(page);
  await sleep(1500);
  await clickByText(page, 'Nova consulta');
  await sleep(1500);
  await fillByPlaceholder(page, '-23.5505', '-23.5505');
  await fillByPlaceholder(page, '-46.6333', '-46.6333');
  await clickByText(page, 'Consultar');
  await sleep(3000);
  await shot(page, `detail-${scheme}`);

  await browser.close();
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  if (process.argv.includes('--auth-only')) {
    await captureAuthScreens('dark');
  } else if (process.argv.includes('--detail-dark')) {
    await captureExtrasDetailDark();
  } else if (process.argv.includes('--events-dark')) {
    await captureEventsDark();
  } else if (process.argv.includes('--apod-light')) {
    await captureApodLight();
  } else if (process.argv.includes('--apod-dark')) {
    await captureApodDark();
  } else {
    console.log('--- Capturing auth screens (dark) ---');
    await captureAuthScreens('dark');
    console.log('--- Capturing extras: light scheme ---');
    await captureExtras('light');
    console.log('--- Capturing detail dark ---');
    await captureExtrasDetailDark();
  }
  console.log('done');
}

async function captureApodDark() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--force-color-profile=srgb',
      '--disable-web-security',
      `--user-data-dir=${path.join(ROOT, '.puppeteer-profile-apod-dark')}`,
    ],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }]);
  await page.goto(URL, { waitUntil: 'networkidle2', timeout: 60000 });
  await waitRoot(page);
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle2' });
  await waitRoot(page);

  await clickByText(page, 'Cadastre-se');
  await sleep(1500);
  const email = `apod-dark-${Date.now()}@orbittapi.dev`;
  await fillByPlaceholder(page, 'Seu nome', 'Operador Demo');
  await fillByPlaceholder(page, 'voce@exemplo.com', email);
  await fillByPlaceholder(page, 'Mínimo 8 caracteres', 'SenhaForte123');
  await fillByPlaceholder(page, 'Repita a senha', 'SenhaForte123');
  await sleep(300);
  await clickByText(page, 'Criar conta');
  await page.waitForFunction(
    () => Array.from(document.querySelectorAll('*')).some((el) => el.textContent?.trim() === 'Início'),
    { timeout: 30000 },
  );
  await sleep(2500);

  await clickByText(page, 'NASA · Foto do dia');
  // Wait until the APOD image actually loads (not the skeleton)
  await page.waitForFunction(
    () => {
      const imgs = Array.from(document.querySelectorAll('img'));
      return imgs.some((img) => img.complete && img.naturalWidth > 100 && img.src.includes('apod.nasa.gov'));
    },
    { timeout: 30000 },
  );
  await sleep(1500);
  await shot(page, 'apod-dark');
  await browser.close();
}

async function captureApodLight() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--force-color-profile=srgb',
      '--disable-web-security',
      `--user-data-dir=${path.join(ROOT, '.puppeteer-profile-apod-light')}`,
    ],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }]);
  await page.goto(URL, { waitUntil: 'networkidle2', timeout: 60000 });
  await waitRoot(page);
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle2' });
  await waitRoot(page);

  await clickByText(page, 'Cadastre-se');
  await sleep(1500);
  const email = `apod-light-${Date.now()}@orbittapi.dev`;
  await fillByPlaceholder(page, 'Seu nome', 'Operador Demo');
  await fillByPlaceholder(page, 'voce@exemplo.com', email);
  await fillByPlaceholder(page, 'Mínimo 8 caracteres', 'SenhaForte123');
  await fillByPlaceholder(page, 'Repita a senha', 'SenhaForte123');
  await sleep(300);
  await clickByText(page, 'Criar conta');
  await page.waitForFunction(
    () => Array.from(document.querySelectorAll('*')).some((el) => el.textContent?.trim() === 'Início'),
    { timeout: 30000 },
  );
  await sleep(2500);

  await clickByText(page, 'NASA · Foto do dia');
  await sleep(4000);
  await shot(page, 'apod-light');
  await browser.close();
}

async function captureEventsDark() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--force-color-profile=srgb',
      '--disable-web-security',
      `--user-data-dir=${path.join(ROOT, '.puppeteer-profile-events-dark')}`,
    ],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }]);
  await page.goto(URL, { waitUntil: 'networkidle2', timeout: 60000 });
  await waitRoot(page);
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle2' });
  await waitRoot(page);

  await clickByText(page, 'Cadastre-se');
  await sleep(1500);
  const email = `events-dark-${Date.now()}@orbittapi.dev`;
  await fillByPlaceholder(page, 'Seu nome', 'Operador Demo');
  await fillByPlaceholder(page, 'voce@exemplo.com', email);
  await fillByPlaceholder(page, 'Mínimo 8 caracteres', 'SenhaForte123');
  await fillByPlaceholder(page, 'Repita a senha', 'SenhaForte123');
  await sleep(300);
  await clickByText(page, 'Criar conta');
  await page.waitForFunction(
    () => Array.from(document.querySelectorAll('*')).some((el) => el.textContent?.trim() === 'Início'),
    { timeout: 30000 },
  );
  await sleep(1500);

  await clickByText(page, 'Eventos vistos do espaço');
  await sleep(3500);
  await shot(page, 'events-dark');
  await browser.close();
}

async function captureExtrasDetailDark() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--force-color-profile=srgb',
      '--disable-web-security',
      `--user-data-dir=${path.join(ROOT, '.puppeteer-profile-detail-dark')}`,
    ],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }]);
  await page.goto(URL, { waitUntil: 'networkidle2', timeout: 60000 });
  await waitRoot(page);
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle2' });
  await waitRoot(page);

  await clickByText(page, 'Cadastre-se');
  await sleep(1500);
  const email = `detail-dark-${Date.now()}@orbittapi.dev`;
  await fillByPlaceholder(page, 'Seu nome', 'Operador Demo');
  await fillByPlaceholder(page, 'voce@exemplo.com', email);
  await fillByPlaceholder(page, 'Mínimo 8 caracteres', 'SenhaForte123');
  await fillByPlaceholder(page, 'Repita a senha', 'SenhaForte123');
  await sleep(300);
  await clickByText(page, 'Criar conta');
  await page.waitForFunction(
    () => Array.from(document.querySelectorAll('*')).some((el) => el.textContent?.trim() === 'Início'),
    { timeout: 30000 },
  );
  await sleep(1500);

  await clickByText(page, 'Nova consulta');
  await sleep(1500);
  await fillByPlaceholder(page, '-23.5505', '-23.5505');
  await fillByPlaceholder(page, '-46.6333', '-46.6333');
  await clickByText(page, 'Consultar');
  await sleep(3000);
  await shot(page, 'detail-dark');
  await browser.close();
}

main().catch((err) => {
  console.error('failed:', err);
  process.exit(1);
});
