import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {mkdirSync,writeFileSync} from 'node:fs';
import {Frame} from '../src/scene';
const out=process.argv[2]||'output/frames';
const mode=process.argv[3]||'contact';
const frames=mode==='all15'?Array.from({length:638},(_,i)=>i*2):
  mode==='cover'?[309]:
  (process.argv[3]||'0,70,100,130,170,215,300,389,465,500,550,620,651,710,760,850,1000,1090,1200,1250').split(',').map(Number);
mkdirSync(out,{recursive:true});
for(const [i,f] of frames.entries()){
  const svg=renderToStaticMarkup(<Frame f={f} cover={mode==='cover'}/>);
  writeFileSync(`${out}/frame-${String(mode==='all15'?i:f).padStart(4,'0')}.svg`,svg);
}
console.log(`${frames.length} SVG frames`);
