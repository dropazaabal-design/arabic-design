import test from 'node:test';
import assert from 'node:assert/strict';
import {compileMotionPlan,fromSegmentedWhisperWords} from '../dist/core.js';
import {characterPose} from '../dist/character-rig.js';
import {directStory} from '../dist/semantic-director.js';

const words=fromSegmentedWhisperWords([
 {seg:'a',i:0,w:'وصل',start:0.2,end:0.45},
 {seg:'a',i:1,w:'انتظر',start:1,end:1.25},
 {seg:'a',i:2,w:'اشرح',start:2,end:2.25},
 {seg:'a',i:3,w:'قرر',start:3,end:3.3}
]);
const plan=compileMotionPlan({fps:30,words,durationMs:3900,beats:directStory([
 {id:'enter',wordId:'a:0',actorId:'hero',direction:'enter',distance:220,durationMs:650},
 {id:'think',wordId:'a:1',actorId:'hero',direction:'hesitate',durationMs:700},
 {id:'point',wordId:'a:2',actorId:'hero',direction:'explain',durationMs:680},
 {id:'decide',wordId:'a:3',actorId:'other',direction:'decide',durationMs:420}
])});
test('semantic mapping preserves word anchors and actor identity',()=>{
 assert.deepEqual(plan.events.map(e=>e.wordId),['a:0','a:1','a:2','a:3']);
 assert.equal(plan.events[1].action,'hold');
 assert.equal(plan.events[2].channel,'gesture');
});
test('position stays after walking; joints return to rest',()=>{
 const last=characterPose(plan,'hero',110);
 assert.equal(last.x,220);
 assert.equal(last.leftLeg,0);
 assert.equal(last.rightLeg,0);
 assert.equal(last.point,0);
 assert.equal(last.thinking,0);
});
test('gait articulates limbs and returns smoothly to neutral',()=>{
 const p=characterPose(plan,'hero',12,'energetic');
 assert.notEqual(p.x,0);
 assert.ok(Math.abs(p.leftLeg)+Math.abs(p.rightLeg)>0);
 assert.ok(Math.abs(p.leftArm)+Math.abs(p.rightArm)>0);
});
test('pause implies expressive thought without permanent deformation',()=>{
 const during=characterPose(plan,'hero',40);
 const after=characterPose(plan,'hero',59);
 assert.ok(during.thinking>0);
 assert.equal(after.thinking,0);
});
test('pointing recovers and does not leak into later frames',()=>{
 assert.ok(characterPose(plan,'hero',67).point>0);
 assert.equal(characterPose(plan,'hero',115).point,0);
});
test('word-aligned motion is deterministic across random-access frames',()=>{
 const f=75;
 const a=characterPose(plan,'hero',f);
 characterPose(plan,'hero',8);
 characterPose(plan,'other',95);
 assert.deepEqual(characterPose(plan,'hero',f),a);
});
test('two actors have isolated motion tracks',()=>{
 assert.equal(characterPose(plan,'other',18).x,0);
 assert.equal(characterPose(plan,'other',100).point,0);
});
test('different temperaments affect gait, not destination',()=>{
 const calm=characterPose(plan,'hero',12,'calm');
 const energetic=characterPose(plan,'hero',12,'energetic');
 assert.equal(calm.x,energetic.x);
 assert.notEqual(calm.leftLeg,energetic.leftLeg);
});
test('invalid direction, duplicate id and missing word fail early',()=>{
 assert.throws(()=>directStory([{id:'x',wordId:'a:0',actorId:'h',direction:'bad'}]),/unknown direction/);
 assert.throws(()=>directStory([
  {id:'x',wordId:'a:0',actorId:'h',direction:'enter'},
  {id:'x',wordId:'a:1',actorId:'h',direction:'enter'}
 ]),/duplicate cue id/);
 assert.throws(()=>compileMotionPlan({fps:30,words,
  beats:directStory([{id:'missing',wordId:'not-real',actorId:'h',direction:'notice'}])
 }),/missing word anchor/);
});
test('invalid cue parameters and channel overlaps fail',()=>{
 assert.throws(()=>directStory([{id:'x',wordId:'a:0',actorId:'h',direction:'explain',distance:30}]),/distance only/);
 assert.throws(()=>directStory([{id:'x',wordId:'a:0',actorId:'h',direction:'enter',durationMs:-1}]),/invalid duration/);
 assert.throws(()=>compileMotionPlan({fps:30,words,beats:directStory([
  {id:'one',wordId:'a:0',actorId:'hero',direction:'enter',durationMs:1400},
  {id:'two',wordId:'a:1',actorId:'hero',direction:'exit'}
 ])}),/overlapping position/);
});
