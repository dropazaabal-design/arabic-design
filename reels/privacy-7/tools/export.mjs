import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
fs.mkdirSync('render',{recursive:true});
const executable=process.env.REMOTION_CHROME;
const render=['remotion','render','src/index.ts','PrivacyReel','render/privacy-7-master.mp4','--codec=h264','--audio-codec=aac','--audio-bitrate=192k','--crf=18','--pixel-format=yuv420p','--color-range=limited',...(executable?[`--browser-executable=${executable}`]:[]),...process.argv.slice(2)];
const first=spawnSync('npx',render,{stdio:'inherit'});if(first.status!==0)process.exit(first.status??1);
// Shared mix gain and a standard limited-range H.264 delivery; native timing.
const second=spawnSync('ffmpeg',['-y','-v','error','-i','render/privacy-7-master.mp4','-map','0:v:0','-map','0:a:0','-vf','scale=in_range=pc:out_range=tv,format=yuv420p','-c:v','libx264','-crf','16','-preset','medium','-color_range','tv','-color_primaries','bt709','-color_trc','bt709','-colorspace','bt709','-af','volume=10dB','-c:a','aac','-b:a','192k','-movflags','+faststart','render/privacy-7.mp4'],{stdio:'inherit'});
process.exit(second.status??1);
