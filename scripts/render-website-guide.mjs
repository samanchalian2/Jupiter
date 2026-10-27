import {chromium} from '../node_modules/.pnpm/playwright@1.64.1/node_modules/playwright/index.mjs';
import {mkdir} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
const root=process.cwd();
await mkdir('output/pdf',{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const page=await browser.newPage();
 await page.goto(pathToFileURL(path.join(root,'tmp/pdfs/jupiter-guide.html')).href);
 await page.evaluate(()=>document.fonts.ready);
 await page.pdf({path:'output/pdf/jupiter-comprehensive-user-guide-fa.pdf',format:'A4',printBackground:true,preferCSSPageSize:true,displayHeaderFooter:true,headerTemplate:'<span></span>',footerTemplate:'<div style="font-family:Arial;font-size:8px;width:100%;padding:0 65px;color:#63546f;display:flex;justify-content:space-between"><span>Jupiter | Arandi — GOAL-070 Preview — 2026-10-26</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>'});
 console.log('PDF generated');
}finally{await browser.close();}
