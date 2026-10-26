#!/usr/bin/env node
// Print an HTML file to PDF with headless Chromium.
//   node tools/html_to_pdf.js build/script.html deliverables/tokenisation-explainer-script.pdf
'use strict';

const path = require('path');
const { chromium } = require('playwright');

(async () => {
  const [src, dest] = process.argv.slice(2).map(p => path.resolve(p));
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('file://' + src, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.pdf({
    path: dest,
    format: 'A4',
    landscape: true,
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: '<div></div>',
    footerTemplate: '<div style="width:100%;font-size:8px;color:#5e6270;padding:0 16mm;display:flex;justify-content:space-between;font-family:sans-serif;"><span>From Fund to Token: script</span><span><span class="pageNumber"></span> of <span class="totalPages"></span></span></div>',
    margin: { top: '16mm', bottom: '18mm', left: '16mm', right: '16mm' },
  });
  await browser.close();
  console.log('pdf written to ' + path.relative(process.cwd(), dest));
})().catch(e => { console.error(e); process.exit(1); });
