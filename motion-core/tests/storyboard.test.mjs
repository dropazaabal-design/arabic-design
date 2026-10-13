import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareStoryboard} from '../dist/storyboard-contract.js';
import {compileMotionPlan} from '../dist/core.js';
import {directStory} from '../dist/semantic-director.js';

const words=[
 {id:'s01:0',text:'لا',startMs:200,endMs:320},
 {id:'s01:1',text:'ترسلها',startMs:340,endMs:780},
 {id:'s01:2',text:'غاضب.',startMs:900,endMs:1300},
 {id:'s02:0',text:'توقف',startMs:1500,endMs:1950},
 {id:'s02:1',text:'الآن',startMs:2100,endMs:2500}
];
const data=()=>({
 version:1,language:'ar',
 description:'مشهد عن التفكير قبل إرسال رسالة',
 actors:[{id:'hero',role:'صاحب الرسالة'},{id:'friend',role:'الصديق'}],
 cues:[
  {id:'enter',actorId:'hero',wordId:'s01:0',expectedWord:'لا',
   direction:'enter',durationMs:400,distance:100,visualReason:'دخول الشخصية بصريًا'},
  {id:'thinking',actorId:'hero',wordId:'s01:2',expectedWord:'غاضب',
   direction:'hesitate',durationMs:450,visualReason:'التردد يظهر في حركة الجسد'},
  {id:'arrive',actorId:'friend',wordId:'s02:0',expectedWord:'توقف',
   direction:'enter',durationMs:550,distance:-90,visualReason:'يتقدم الصديق لإيقاف الاندفاع'}
 ],
 shots:[
  {id:'open',fromWordId:'s01:0',toWordId:'s01:2',camera:'wide',
   focusActorId:'hero',visualReason:'اتساع المشهد لبناء المكان'},
  {id:'answer',fromWordId:'s02:0',toWordId:'s02:1',camera:'close',
   focusActorId:'friend',screenText:'فكّر أولًا',visualReason:'تكبير لحظة القرار'}
 ]
});
const validate=(v=data())=>prepareStoryboard(v,words,30,3000);
test('valid Arabic storyboard compiles into original timed motion',()=>{
 const p=validate();
 assert.equal(p.cues.length,3);
 assert.equal(p.shots.length,2);
 assert.equal(p.shots[0].fromFrame,6);
 assert.equal(p.shots[1].toFrame,75);
 const motion=compileMotionPlan({fps:30,words,beats:directStory(p.cues),durationMs:3000});
 assert.equal(motion.events.length,3);
 assert.equal(motion.durationInFrames,90);
});
test('Arabic diacritics and trailing punctuation do not break word guards',()=>{
 assert.equal(validate().cues[1].wordId,'s01:2');
});
test('unknown anchor and mismatched spoken word are rejected',()=>{
 const a=data();a.cues[0].wordId='s99:0';
 assert.throws(()=>validate(a),/unknown word anchor/);
 const b=data();b.cues[0].expectedWord='نعم';
 assert.throws(()=>validate(b),/word text mismatch/);
});
test('actor identifiers must exist and remain unique',()=>{
 const a=data();a.cues[0].actorId='unknown';
 assert.throws(()=>validate(a),/missing actor/);
 const b=data();b.actors[1].id='hero';
 assert.throws(()=>validate(b),/repeated actor id/);
});
test('invalid directions do not silently map to random animations',()=>{
 const a=data();a.cues[0].direction='jump';
 assert.throws(()=>validate(a),/invalid direction/);
});
test('duplicate cue and shot IDs are rejected',()=>{
 const a=data();a.cues[1].id='enter';
 assert.throws(()=>validate(a),/repeated cue id/);
 const b=data();b.shots[1].id='open';
 assert.throws(()=>validate(b),/repeated shot id/);
});
test('camera shots cannot overlap in time',()=>{
 const a=data();a.shots[1].fromWordId='s01:1';
 assert.throws(()=>validate(a),/overlapping shots/);
});
test('unknown camera and out of range shot fail',()=>{
 const a=data();a.shots[1].camera='fly';
 assert.throws(()=>validate(a),/invalid shot camera/);
 const b=data();b.shots[1].toWordId='absent';
 assert.throws(()=>validate(b),/unknown word anchor/);
});
test('Arabic-only on-screen strings reject English text',()=>{
 const a=data();a.shots[1].screenText='STOP';
 assert.throws(()=>validate(a),/Latin words/);
});
test('cue duration, offsets and physical displacement are bounded',()=>{
 const a=data();a.cues[0].durationMs=9999;
 assert.throws(()=>validate(a),/invalid cue duration/);
 const b=data();b.cues[0].offsetMs=999;
 assert.throws(()=>validate(b),/cue offset too large/);
 const c=data();c.cues[0].distance=999;
 assert.throws(()=>validate(c),/displacement too large/);
});
test('narrative data is validated as runtime input, not trusted TypeScript',()=>{
 assert.throws(()=>prepareStoryboard(null,words,30,3000),/must be an object/);
 const a=data();a.version=2;
 assert.throws(()=>validate(a),/unsupported version/);
 const b=data();b.language='en';
 assert.throws(()=>validate(b),/language must be ar/);
});
test('storyboard validation is deterministic and immutable',()=>{
 const a=data(),original=structuredClone(a);
 const x=validate(a);assert.deepEqual(validate(a),x);
 assert.deepEqual(a,original);
});
