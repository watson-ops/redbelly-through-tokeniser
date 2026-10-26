#!/usr/bin/env node
/*
 * Build the README banner and storyboard images from the final video.
 *
 *   node tools/build_readme_media.js
 *
 * Writes web/readme-banner.png and web/readme-storyboard.png.
 * Frames come from the clean master, so the images show exactly what is in the film.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const TMP = path.join(ROOT, 'build', 'readme');
const VIDEO = path.join(ROOT, 'deliverables', 'tokenisation-explainer-1080p-clean.mp4');

const BOARD = [
  [6.6, '0:00', 'The fund'],
  [21.5, '0:13', 'Step 1  Legal review'],
  [32.0, '0:23', 'Step 2  Set the rules'],
  [41.8, '0:33', 'Step 3  Verify investors'],
  [50.4, '0:43', 'Step 4  Issue on Redbelly'],
  [59.0, '0:51', 'Step 5  Transfers'],
  [76.5, '1:00', 'The Redbelly layer'],
  [86.5, '1:18', 'Close'],
];
const BANNER_FRAME = 50.4;

function frame(t, name) {
  const out = path.join(TMP, name);
  execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-ss', String(t), '-i', VIDEO,
    '-frames:v', '1', '-vf', 'scale=960:540', '-q:v', '2', out]);
  return out;
}

function fontCss() {
  return fs.readFileSync(path.join(ROOT, 'brand', 'tokens.css'), 'utf8')
    .replace(/url\("fonts\//g, `url("file://${path.join(ROOT, 'brand', 'fonts')}/`);
}

function bannerHtml(still) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>${fontCss()}
  html,body{margin:0;width:1600px;height:520px;overflow:hidden}
  body{font-family:var(--font-sans);color:#fff;position:relative;
    background:radial-gradient(800px 420px at 92% -20%,rgba(162,255,200,.20),transparent 60%),
               radial-gradient(700px 420px at -10% 120%,rgba(0,156,156,.22),transparent 60%),#343740}
  body:before{content:"";position:absolute;inset:0;background-image:radial-gradient(circle,rgba(255,255,255,.07) 1.2px,transparent 1.5px);background-size:32px 32px}
  .l{position:absolute;left:84px;top:74px;width:700px}
  .logo{height:40px;display:block;margin-bottom:46px}
  h1{font-size:58px;font-weight:500;letter-spacing:-.03em;line-height:1.04;margin:0 0 20px}
  h1 em{font-style:normal;color:#a2ffc8}
  p{font-size:21px;line-height:1.5;color:#d3d6de;margin:0 0 30px;width:640px}
  .chips{display:flex;gap:10px}
  .chips span{font-size:15px;font-weight:500;padding:8px 14px;border-radius:999px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.14);color:#e6e8ec}
  .chips span b{color:#a2ffc8;font-weight:600}
  .r{position:absolute;right:84px;top:66px;width:680px}
  .shot{width:680px;height:383px;border-radius:12px;overflow:hidden;box-shadow:0 30px 70px -20px rgba(0,0,0,.55),0 0 0 1px rgba(255,255,255,.08)}
  .shot img{width:100%;height:100%;display:block}
  .built{display:flex;align-items:center;justify-content:flex-end;gap:12px;margin-top:22px;color:#9ea3ae;font-size:15px}
  .built img{height:24px}
  </style></head><body>
  <div class="l">
    <img class="logo" src="file://${path.join(ROOT, 'web', 'logo-light.svg')}">
    <h1>From fund to <em>token</em>,<br>in five clear steps.</h1>
    <p>An 88 second explainer: how a regulated fund becomes a compliant token on Redbelly Network through Tokeniser.</p>
    <div class="chips"><span><b>88s</b> film</span><span><b>1080p</b> 30 fps</span><span><b>43</b> sourced quotes</span><span><b>42/42</b> QA checks</span></div>
  </div>
  <div class="r">
    <div class="shot"><img src="file://${still}"></div>
    <div class="built">Built on <img src="file://${path.join(ROOT, 'brand', 'logos', 'redbelly-horizontal-negative.svg')}"></div>
  </div>
  </body></html>`;
}

function boardHtml(stills) {
  const cells = BOARD.map(([, time, label], i) => `
    <figure><div class="img"><img src="file://${stills[i]}"></div>
    <figcaption><span class="t">${time}</span>${label.replace('  ', ' <i></i> ')}</figcaption></figure>`).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><style>${fontCss()}
  *{box-sizing:border-box}
  html,body{margin:0;width:1600px}
  body{background:#f4f5f6;font-family:var(--font-sans);color:#343740;padding:40px}
  .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:24px 20px}
  figure{margin:0}
  .img{border-radius:8px;overflow:hidden;border:1px solid #e1e4e8;box-shadow:0 10px 24px -14px rgba(20,37,48,.35);aspect-ratio:16/9;background:#fff}
  .img img{width:100%;height:100%;display:block}
  figcaption{display:flex;align-items:center;gap:10px;margin-top:12px;font-size:17px;font-weight:500}
  figcaption .t{font-family:var(--font-mono);font-size:13px;font-weight:500;color:#5e6270;background:#e9ebee;border-radius:4px;padding:2px 7px}
  figcaption i{display:inline-block;width:4px;height:4px;border-radius:2px;background:#009c9c;margin:0 2px}
  </style></head><body><div class="grid">${cells}</div></body></html>`;
}

(async () => {
  fs.mkdirSync(TMP, { recursive: true });
  const stills = BOARD.map(([t], i) => frame(t, `board_${i}.jpg`));
  const bannerStill = frame(BANNER_FRAME, 'banner.jpg');

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1600, height: 520 } });
  const bannerFile = path.join(TMP, 'banner.html');
  fs.writeFileSync(bannerFile, bannerHtml(bannerStill));
  await page.goto('file://' + bannerFile, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(ROOT, 'web', 'readme-banner.png') });

  const boardFile = path.join(TMP, 'board.html');
  fs.writeFileSync(boardFile, boardHtml(stills));
  await page.setViewportSize({ width: 1600, height: 600 });
  await page.goto('file://' + boardFile, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(ROOT, 'web', 'readme-storyboard.png'), fullPage: true });
  await browser.close();
  console.log('web/readme-banner.png and web/readme-storyboard.png written');
})().catch(e => { console.error(e); process.exit(1); });
