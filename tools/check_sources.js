#!/usr/bin/env node
// Re-read every supplied source page in headless Chromium and confirm each quote
// in script/sources.json still appears on it, word for word.
//   node tools/check_sources.js build/source-check.json
'use strict';

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const norm = s => s.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').trim().toLowerCase();

(async () => {
  const out = process.argv[2];
  const { sources } = JSON.parse(fs.readFileSync(path.join(ROOT, 'script', 'sources.json'), 'utf8'));
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const results = [];
  for (const [id, s] of Object.entries(sources)) {
    let text = '';
    try {
      await page.goto(s.url, { waitUntil: 'networkidle', timeout: 60000 });
      await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 100)); }
      });
      text = norm(await page.evaluate(() => document.body.innerText));
    } catch (e) {
      results.push({ id, url: s.url, error: String(e) });
      continue;
    }
    for (const q of s.quotes) results.push({ id, url: s.url, quote: q, found: text.includes(norm(q)) });
  }
  await browser.close();
  fs.writeFileSync(out, JSON.stringify({ checked: new Date().toISOString(), results }, null, 2) + '\n');
  const bad = results.filter(r => !r.found);
  console.log(`${results.length - bad.length} of ${results.length} quotes found on the live pages`);
  process.exit(bad.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
