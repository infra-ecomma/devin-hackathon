#!/usr/bin/env node
// Renders media/tellurion.html standalone in headless Chromium, injects a labeled
// TEST FIXTURE state through the webview's test hook, and screenshots all four
// skins. Rule 27: rendered work is verified by looking, so this produces the
// pixels to look at. Run: node verify/render-skins.mjs
import pkg from '/home/wassim/projects/Organizing-Claude-Code/node_modules/playwright-core/index.js';
const { chromium } = pkg;
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(import.meta.url), '..', '..');
const out = join(root, 'verify', 'last-walk');
mkdirSync(out, { recursive: true });

const now = new Date().toISOString();
const ev = (target, exit, cmd) => ({
  target, command: cmd, exitCode: exit, sha: 'a3f9c21ffffffff', timestamp: now,
  durationMs: 2100, logTail: ['Tests: 34 passed, 34 total', 'Time: 2.108s, exit ' + exit],
});
// TEST FIXTURE, not product data: exercises every drawable state at once.
const FIXTURE = {
  name: 'walk-venture', branch: 'main', headSha: 'a3f9c21ffffffff', clean: true,
  productsInSky: 2, productsVerified: 1, featuresInSky: 6,
  scannedAt: now, planPath: '.tellurion/plan.json', planProblems: [],
  products: [
    { id: 'auth', name: 'Auth', category: 'auth', started: true, startedAt: now,
      startedCount: 3, verifiedCount: 3, productVerified: true, orbitIndex: 0, dirtyFiles: 0,
      walkEvidence: ev('auth/__walk__', 0, 'node walk'),
      features: [
        { id: 'login', name: 'Signs a user in', state: 'verified', hasCheck: true, evidence: ev('auth/login', 0, 'npm test -w auth') },
        { id: 'reset', name: 'Resets a password', state: 'verified', hasCheck: true, evidence: ev('auth/reset', 0, 'npm test -w auth') },
        { id: 'session', name: 'Refreshes a session', state: 'verified', hasCheck: true, evidence: ev('auth/session', 0, 'npm test -w auth') },
      ] },
    { id: 'checkout', name: 'Checkout', category: 'api', started: true, startedAt: now,
      startedCount: 3, verifiedCount: 1, productVerified: false, orbitIndex: 1, dirtyFiles: 2,
      features: [
        { id: 'promo', name: 'Applies promo codes', state: 'verified', hasCheck: true, evidence: ev('checkout/promo', 0, 'npm test -w checkout') },
        { id: 'cart', name: 'Totals a cart', state: 'failing', hasCheck: true, failingCount: 1, evidence: ev('checkout/cart', 1, 'npm test -w checkout') },
        { id: 'tax', name: 'Computes tax', state: 'stale', hasCheck: true, behind: 2, evidence: ev('checkout/tax', 0, 'npm test -w checkout') },
        { id: 'refunds', name: 'Issues refunds', state: 'in-progress', hasCheck: false },
        { id: 'invoices', name: 'Prints invoices', state: 'not-started', hasCheck: false },
      ] },
    { id: 'notify', name: 'Notifications', category: 'database', started: false,
      startedCount: 0, verifiedCount: 0, productVerified: false, orbitIndex: 2, dirtyFiles: 0,
      features: [ { id: 'digest', name: 'Sends digests', state: 'not-started', hasCheck: false } ] },
  ],
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('file://' + join(root, 'media', 'tellurion.html'));
const combos = [
  ['rustic', 'light'], ['rustic', 'dark'], ['futuristic', 'dark'], ['futuristic', 'light'],
];
for (const [style, theme] of combos) {
  const okHook = await page.evaluate(([f, s, t]) => {
    if (!window.__tellurion || typeof window.__tellurion.setState !== 'function') return false;
    window.__tellurion.setState({ type: 'state', state: f, style: s, theme: t });
    return true;
  }, [FIXTURE, style, theme]);
  if (!okHook) { console.error('RENDER FAIL: window.__tellurion.setState missing'); process.exit(1); }
  await page.waitForTimeout(450);
  const shot = join(out, `skin-${style}-${theme}.png`);
  await page.screenshot({ path: shot });
  const seen = await page.evaluate(() => ({
    products: window.__tellurion.lastState ? window.__tellurion.lastState.products.length : 0,
    bodyStyle: document.documentElement.getAttribute('data-style'),
    bodyTheme: document.documentElement.getAttribute('data-theme'),
  }));
  if (seen.products !== 3 || seen.bodyStyle !== style || seen.bodyTheme !== theme) {
    console.error('RENDER FAIL: state or skin not applied', JSON.stringify(seen));
    process.exit(1);
  }
  console.log(`ok render ${style} ${theme} -> ${shot}`);
}
await browser.close();
console.log('RENDER PASS: 4 skins captured to verify/last-walk/');
