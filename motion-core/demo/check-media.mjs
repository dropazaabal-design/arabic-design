import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const file=process.argv[2];
if(!file)throw new Error('Expected path to ffprobe JSON');
const probe=JSON.parse(readFileSync(file,'utf8'));
const video=probe.streams?.find((s)=>s.codec_type==='video');
const audio=probe.streams?.find((s)=>s.codec_type==='audio');
assert.ok(video,'Video stream missing');
assert.ok(audio,'Audio stream missing');
assert.equal(video.codec_name,'h264','Expected H.264');
assert.equal(video.width,1080,'Expected 1080px width');
assert.equal(video.height,1920,'Expected 1920px height');
assert.equal(audio.codec_name,'aac','Expected AAC');
const [numerator,denominator]=String(video.avg_frame_rate).split('/').map(Number);
assert.equal(numerator/denominator,30,'Expected constant 30fps');
assert.equal(Number(video.nb_frames),330,'Expected 330 frames');
const seconds=Number(probe.format?.duration);
assert.ok(seconds>=10.95&&seconds<=11.10,'Unexpected total duration: '+seconds);
console.log(JSON.stringify({
 status:'PASS',
 width:video.width,height:video.height,frameRate:30,frames:video.nb_frames,
 videoCodec:video.codec_name,audioCodec:audio.codec_name,durationSeconds:seconds
},null,2));
