import fs from 'node:fs';
const caps=JSON.parse(fs.readFileSync('src/captions.json'));
const norm=s=>s.replace(/[\u064b-\u065f]/g,'').replace(/\s+/g,' ').trim();
const script=norm(fs.readFileSync('audio/narration.txt','utf8'));
const joined=norm(caps.map(c=>c.text).join(' '));
const strings=['آلة الأمنية','جولة أخرى','أريد','ماذا بعد؟','آلة الأمنية','لماذا لا تدوم «أخيرًا»؟','فكرة من فلسفة شوبنهاور',...caps.map(c=>c.text)];
const findings=[];if(script!==joined)findings.push('Caption text differs from narration');
for(const s of strings){if(/[A-Za-z]/.test(s))findings.push('Latin on screen: '+s);if(/[\u0660-\u0669\u06f0-\u06f9]/.test(s))findings.push('Non-Western digits');if(/[\u202a-\u202e]/.test(s))findings.push('Directional override');}
const maxCps=Math.max(...caps.map(c=>c.text.length/(c.end-c.start)));if(maxCps>17)findings.push('Caption too fast');
const result={screenStrings:strings.length,captions:caps.length,captionTextMatchesNarration:script===joined,maxCps,font:'Cairo',captionDirection:'RTL',findings,limits:'Source-text checks; visual Arabic shaping separately inspected in Chromium stills. This does not measure all screen text boxes.'};
fs.writeFileSync('output/qa-arabic.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));process.exit(findings.length?1:0);
