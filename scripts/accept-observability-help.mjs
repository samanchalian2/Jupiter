// Explicit LOCAL authenticated acceptance. Never persist credentials or sessions.
import { createRequire } from 'node:module';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
const require = createRequire(new URL('../observability/server/package.json', import.meta.url));
const { chromium } = require('playwright');
const origin = process.env.JUPITER_HELP_ACCEPTANCE_ORIGIN ?? 'http://127.0.0.1:5174';
if (!['localhost', '127.0.0.1', '[::1]'].includes(new URL(origin).hostname)) throw Error('LOCAL acceptance only');
const identifier = process.env.JUPITER_HELP_ACCEPTANCE_USER;
const password = process.env.JUPITER_HELP_ACCEPTANCE_PASSWORD;
if (!identifier || !password) throw Error('Provide local acceptance identity through environment variables');
const topics = ['console','concepts','severity','incidents','applications','ai','ai-limits','privacy','integration','feedback','offline'];
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const context = await browser.newContext(); const page = await context.newPage();
const widths = [375, 768, 1024, 1440];
const artifacts = resolve('output/goal069-help'); await mkdir(artifacts, { recursive: true });
try {
  await page.goto(`${origin}/operations`);
  await page.locator('input[autocomplete="username"]').fill(identifier);
  await page.locator('input[autocomplete="current-password"]').fill(password);
  const login = page.waitForResponse(response => response.url().endsWith('/auth/login'));
  await page.getByRole('button', { name: 'ورود به سامانه', exact: true }).click();
  if (!(await login).ok()) throw Error('Local acceptance login denied');
  await page.getByRole('button', { name: 'راهنمای مرکز پایش', exact: true }).waitFor();
  async function checkArticle(topic, action) {
    const pending = page.waitForResponse(response => response.url().endsWith(`/help/articles/observability-${topic}`));
    await action(); const response = await pending;
    if (!response.ok()) throw Error('Published article lookup denied');
    const article = await response.json();
    if (article.slug !== `observability-${topic}` || article.content.length < 100) throw Error('Wrong/empty article');
    const dialog = page.getByRole('dialog', { name: 'راهنمای مرکز پایش' });
    await dialog.locator('h4').filter({ hasText: article.title }).waitFor();
    if (!(await dialog.locator('pre').innerText()).includes(article.content.slice(0, 60))) throw Error('Article not rendered');
    if (await dialog.evaluate(element => getComputedStyle(element).direction) !== 'rtl') throw Error('Help is not RTL');
    const bounds = await dialog.boundingBox();
    const viewport = page.viewportSize();
    if (!bounds || !viewport || bounds.x < 0 || bounds.x + bounds.width > viewport.width || bounds.y < 0 || bounds.y + bounds.height > viewport.height) throw Error('Help reader is clipped outside viewport');
    if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw Error('Document overflow');
    return dialog;
  }
  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 });
    const target = await page.getByRole('button', { name: 'راهنمای مرکز پایش', exact: true }).boundingBox();
    if (!target || target.width < 44 || target.height < 44) throw Error('Help target below 44px');
    await checkArticle('console', () => page.getByRole('button', { name: 'راهنمای مرکز پایش', exact: true }).click());
    for (const topic of topics.slice(1)) {
      await checkArticle(topic, () => page.getByRole('combobox', { name: 'موضوع راهنمای پایش' }).selectOption(topic));
    }
    if ([375,1440].includes(width)) await page.screenshot({ path: resolve(artifacts, `operations-${width}.png`) });
    await page.getByRole('combobox', { name: 'موضوع راهنمای پایش' }).press('Escape');
    if (await page.getByRole('dialog', { name: 'راهنمای مرکز پایش' }).count()) throw Error('Help did not close');
  }
  await page.goto(`${origin}/feedback`);
  await checkArticle('feedback', () => page.getByRole('button', { name: 'راهنمای گزارش مشکل', exact: true }).click());
  const options = await page.getByRole('combobox', { name: 'موضوع راهنمای پایش' }).locator('option').count();
  if (options !== 3) throw Error('Wrong feedback topic subset');
  await checkArticle('offline', () => page.getByRole('combobox', { name: 'موضوع راهنمای پایش' }).selectOption('offline'));
  await page.screenshot({ path: resolve(artifacts, 'feedback-1440.png') });
  const privateGuide = await context.request.get(`${origin}/api/v1/help/articles/platform-commercial-admin`);
  if (privateGuide.status() !== 404) throw Error('Anonymous Help exposed private article');
  await page.goto(`${origin}/platform`);
  await page.locator('#platform-tab-observability').click();
  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 });
    await checkArticle('console', () => page.getByRole('button', { name: 'راهنمای مرکز پایش', exact: true }).click());
    if ([375,1440].includes(width)) await page.screenshot({ path: resolve(artifacts, `platform-${width}.png`) });
    await page.getByRole('button', { name: 'بستن راهنما', exact: true }).click();
  }
  console.log(JSON.stringify({ local: true, authenticated: true, helpTopics: 11, widths, rtl: true, documentOverflow: false, feedbackTopics: options, platformHelp: true }));
} finally {
  // Revoke the actual refresh session via the normal host endpoint, not SQL.
  try {
    const logout = await context.request.post(`${origin}/api/v1/auth/logout`);
    if (!logout.ok()) throw Error('Acceptance session logout failed');
    const refresh = await context.request.post(`${origin}/api/v1/auth/refresh`);
    if (refresh.status() !== 401) throw Error('Logged-out session still refreshable');
  } finally {
    await context.close(); await browser.close();
    delete process.env.JUPITER_HELP_ACCEPTANCE_PASSWORD;
  }
}
