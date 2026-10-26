#!/usr/bin/env node
/*
 * Render the animation to PNG frames with headless Chromium (Playwright).
 *
 *   node tools/render_frames.js --out <dir>                 every frame, frame_00000.png ...
 *   node tools/render_frames.js --out <dir> --stills 3,12.5  single frames at given seconds
 *   node tools/render_frames.js --text <file.json>          on screen text per scene
 *   node tools/render_frames.js --captions <dir>            transparent caption overlays
 *
 * Frames are captured by calling window.seek(t) for t = frame / fps, so every
 * render is frame exact. Work is split across --workers browser pages.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const PAGE = 'file://' + path.join(ROOT, 'animation', 'index.html');

function args() {
  const a = process.argv.slice(2);
  const o = { workers: 4 };
  for (let i = 0; i < a.length; i += 1) {
    const k = a[i].replace(/^--/, '');
    o[k] = a[i + 1];
    i += 1;
  }
  o.workers = Number(o.workers);
  return o;
}

async function openPage(browser) {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(PAGE + '#t=0', { waitUntil: 'load' });
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map(img => (img.complete ? null : new Promise(r => { img.onload = r; img.onerror = r; }))));
  });
  if (errors.length) throw new Error('Page errors:\n' + errors.join('\n'));
  return page;
}

async function renderRange(browser, out, fps, from, to, log) {
  const page = await openPage(browser);
  for (let f = from; f < to; f += 1) {
    await page.evaluate(t => window.seek(t), f / fps);
    await page.screenshot({ path: path.join(out, `frame_${String(f).padStart(5, '0')}.png`) });
    if (log && f % 150 === 0) console.log(`frame ${f}`);
  }
  await page.close();
}

async function main() {
  const o = args();
  const timeline = JSON.parse(fs.readFileSync(path.join(ROOT, 'script', 'timeline.json'), 'utf8'));
  const fps = Number(o.fps || timeline.fps);
  const browser = await chromium.launch();
  try {
    if (o.text) {
      const page = await openPage(browser);
      const text = await page.evaluate(() => ({ text: window.collectText(), missingWords: window.__missingWords }));
      fs.writeFileSync(o.text, JSON.stringify(text, null, 2) + '\n');
      console.log(`on screen text written to ${o.text}`);
      if (text.missingWords.length) console.log('missing word cues: ' + text.missingWords.join(', '));
    }

    if (o.captions) {
      const caps = JSON.parse(fs.readFileSync(path.join(ROOT, 'subtitles', 'captions.json'), 'utf8'));
      fs.mkdirSync(o.captions, { recursive: true });
      const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
      // Inline the fonts as data URLs: a page built with setContent cannot load file:// fonts.
      const css = fs.readFileSync(path.join(ROOT, 'brand', 'tokens.css'), 'utf8')
        .replace(/url\("fonts\/([^"]+)"\)/g, (m, f) =>
          `url("data:font/woff2;base64,${fs.readFileSync(path.join(ROOT, 'brand', 'fonts', f)).toString('base64')}")`);
      for (const c of caps.captions) {
        const html = `<!doctype html><html><head><style>${css}
          html,body{margin:0;width:1920px;height:1080px;background:transparent;}
          .wrap{position:absolute;left:0;right:0;bottom:64px;display:flex;justify-content:center;}
          .cap{max-width:1500px;padding:14px 28px 16px;border-radius:8px;background:rgba(20,37,48,0.86);
               color:#ffffff;font-family:var(--font-sans);font-size:40px;font-weight:400;line-height:1.3;
               text-align:center;letter-spacing:0.005em;}
        </style></head><body><div class="wrap"><div class="cap">${c.lines.map(l => l.replace(/&/g, '&amp;').replace(/</g, '&lt;')).join('<br>')}</div></div></body></html>`;
        await page.setContent(html, { waitUntil: 'load' });
        const ok = await page.evaluate(async () => { await document.fonts.ready; return document.fonts.check('40px "Readex Pro"'); });
        if (!ok) throw new Error('Readex Pro did not load for caption overlays');
        await page.screenshot({ path: path.join(o.captions, `${c.id}.png`), omitBackground: true });
      }
      console.log(`${caps.captions.length} caption overlays written to ${o.captions}`);
      await page.close();
    }

    if (o.stills) {
      fs.mkdirSync(o.out, { recursive: true });
      const page = await openPage(browser);
      for (const s of o.stills.split(',')) {
        const t = Number(s);
        await page.evaluate(x => window.seek(x), t);
        await page.screenshot({ path: path.join(o.out, `still_${t.toFixed(2).padStart(6, '0')}.png`) });
      }
      console.log(`stills written to ${o.out}`);
    } else if (o.out) {
      fs.mkdirSync(o.out, { recursive: true });
      const total = Math.round(timeline.duration * fps);
      const per = Math.ceil(total / o.workers);
      const jobs = [];
      for (let w = 0; w < o.workers; w += 1) {
        jobs.push(renderRange(browser, o.out, fps, w * per, Math.min(total, (w + 1) * per), w === 0));
      }
      await Promise.all(jobs);
      console.log(`${total} frames written to ${o.out}`);
    }
  } finally {
    await browser.close();
  }
}

main().catch(e => { console.error(e); process.exit(1); });
