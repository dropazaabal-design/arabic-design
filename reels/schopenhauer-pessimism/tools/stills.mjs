import {bundle} from '@remotion/bundler';import {renderStill,selectComposition} from '@remotion/renderer';import fs from 'node:fs';
const serveUrl=await bundle({entryPoint:'src/index.tsx'});const c=await selectComposition({serveUrl,id:'Reel',browserExecutable:'/usr/bin/chromium'});
for(const frame of [15,120,215,330,460,545,587,645,720,820,910,980,1070,1160,1270,1390,1430,1510,1640,1730,1800,1860,1930,1990])await renderStill({serveUrl,composition:c,output:`work/frame-${frame}.png`,frame,browserExecutable:'/usr/bin/chromium'});
const cover=await selectComposition({serveUrl,id:'Cover',browserExecutable:'/usr/bin/chromium'});await renderStill({serveUrl,composition:cover,output:'publish/cover-1080x1920.jpg',imageFormat:'jpeg',browserExecutable:'/usr/bin/chromium'});
