import {bundle} from '@remotion/bundler';
import {openBrowser,selectComposition,renderStill} from '@remotion/renderer';
import fs from 'node:fs';
import path from 'node:path';
process.on('unhandledRejection',(e)=>{console.error(e.message);process.exit(1);});
const browserExecutable=process.env.REMOTION_CHROME;
if(!browserExecutable)throw new Error('Set REMOTION_CHROME to the installed Chromium executable.');
fs.mkdirSync('render/qa',{recursive:true});
const serveUrl=await bundle({entryPoint:path.resolve('src/index.ts'),outDir:path.resolve('render/qa/bundle')});
const browser=await openBrowser('chrome',{browserExecutable,chromiumOptions:{gl:'angle'}});
try{
 const composition=await selectComposition({serveUrl,id:'PrivacyReel',puppeteerInstance:browser});
 const requested=process.argv.slice(2).map(Number);
 const frames=requested.length?requested:[0,90,390,690,930,1200,1470,1740,2040,2370];
 for(const frame of frames){
  await renderStill({serveUrl,composition,puppeteerInstance:browser,frame,output:`render/qa/frame-${frame}.png`,scale:.4});
  console.log(`Reviewed-frame ${frame} / ${frame/60}s`);
 }
 fs.writeFileSync('review/qa-samples.json',JSON.stringify({frames,scale:.4,composition},null,2)+'\n');
}finally{await browser.close({silent:true});}
