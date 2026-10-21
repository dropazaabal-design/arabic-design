import test from 'node:test';
import assert from 'node:assert/strict';
import {compileMotionPlan,fromSegmentedWhisperWords,sampleActor,sampleStroke} from '../dist/core.js';
const words=fromSegmentedWhisperWords([
 {seg:'s01',i:0,w:'توقّف',start:0.20,end:0.60},
 {seg:'s01',i:1,w:'ثم',start:0.60,end:0.83},
 {seg:'s01',i:2,w:'ابدأ',start:0.83,end:1.12}
]);
const beats=[
 {id:'approach',wordId:'s01:0',actorId:'hero',channel:'position',action:'walk',intent:'introduce',durationMs:300,amount:90},
 {id:'look',wordId:'s01:1',actorId:'hero',channel:'gesture',action:'nod',intent:'react',durationMs:200},
 {id:'underline',wordId:'s01:2',actorId:'line',channel:'stroke',action:'draw',intent:'resolve',durationMs:500}
];
test('existing Whisper segment/word IDs preserved',()=>{
 assert.equal(words[0].id,'s01:0');assert.equal(words[2].startMs,830);
});
test('absolute frames and stable repeatable plan',()=>{
 const p=compileMotionPlan({fps:30,words,beats,durationMs:1800});
 assert.deepEqual(p.events.map(e=>e.startFrame),[6,18,25]);
 assert.equal(p.durationInFrames,54);assert.equal(p.events[0].endFrame,15);
 assert.deepEqual(p,compileMotionPlan({fps:30,words,beats,durationMs:1800}));
});
test('position persists but gestures end',()=>{
 const p=compileMotionPlan({fps:30,words,beats});
 assert.equal(sampleActor(p,'hero',0).x,0);
 assert.equal(sampleActor(p,'hero',25).x,90);
 assert.equal(sampleActor(p,'hero',40).nod,0);
 assert.equal(sampleStroke(p,'line',0),0);
 assert.equal(sampleStroke(p,'line',50),1);
});
test('missing audio word fails loudly',()=>{
 assert.throws(()=>compileMotionPlan({fps:30,words,beats:[{...beats[0],wordId:'s99:42'}]}),/missing word anchor/);
});
test('same-actor same-channel overlaps are rejected',()=>{
 assert.throws(()=>compileMotionPlan({fps:30,words,beats:[beats[0],{...beats[0],id:'other'}]}),/overlapping position/);
});
test('composition ending before an action fails',()=>{
 assert.throws(()=>compileMotionPlan({fps:30,words,beats,durationMs:200}),/composition ends before/);
});
test('invalid frame rates, actions, offsets are rejected',()=>{
 assert.throws(()=>compileMotionPlan({fps:0,words,beats}),/positive integer/);
 assert.throws(()=>compileMotionPlan({fps:30,words,beats:[{...beats[0],action:'draw'}]}),/action\/channel mismatch/);
 assert.throws(()=>compileMotionPlan({fps:30,words,beats:[{...beats[0],offsetMs:-500}]}),/before frame zero/);
});
