import test from 'node:test';
import assert from 'node:assert/strict';
import {REST,CALM,pose,face,track,trackNum,walk,blink,mixRecord} from '../dist/cartoon/rig.js';

test('named poses and faces override only what they name',()=>{
 const p=pose('point');
 assert.equal(p.shF,70);assert.equal(p.hipN,REST.hipN);
 assert.equal(face('grin').open,0.45);assert.equal(face('grin').gx,CALM.gx);
});
test('tracks hold before a key, blend after it and settle on it',()=>{
 const keys=[{at:0,to:pose('stand')},{at:100,to:pose('point'),dur:20}];
 assert.deepEqual(track(99,keys),pose('stand'));
 const mid=track(110,keys).shF;
 assert.ok(mid>REST.shF&&mid<70);
 assert.equal(track(120,keys).shF,70);
});
test('a late key never snaps: it starts from where the track already is',()=>{
 const keys=[{at:0,to:{v:0}},{at:10,to:{v:10},dur:20},{at:15,to:{v:-10},dur:20}];
 const a=track(15,keys).v,b=track(16,keys).v;
 assert.ok(Math.abs(b-a)<1.5);
 assert.equal(trackNum(40,[{at:0,to:0},{at:10,to:10,dur:20},{at:15,to:-10,dur:20}]),-10);
});
test('a walk ends at its target with the feet at rest',()=>{
 const w=walk(200,0,300,100,60);
 assert.equal(w.x,300);assert.ok(w.add.hipF===0&&w.add.bob===0);
});
test('blink is deterministic, brief, and differs between characters',()=>{
 const shut=s=>Array.from({length:600},(_,f)=>blink(f,s)).filter(v=>v>0).length;
 assert.equal(shut(1),shut(1));
 assert.ok(shut(1)>0&&shut(1)<60);
 assert.notDeepEqual(Array.from({length:600},(_,f)=>blink(f,1)),Array.from({length:600},(_,f)=>blink(f,2)));
});
test('mixRecord is linear',()=>{assert.deepEqual(mixRecord({a:0,b:10},{a:10,b:0},0.25),{a:2.5,b:7.5});});
