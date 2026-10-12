/** Deterministic, word-aligned semantic motion planner for Baseera. */
export type AlignedWord={id:string;text:string;startMs:number;endMs:number;segment?:string};
export type MotionChannel='position'|'gesture'|'stroke'|'emphasis';
export type MotionAction='walk'|'nod'|'point'|'draw'|'pulse'|'hold';
export type SemanticIntent='introduce'|'react'|'question'|'explain'|'resolve'|'exit';
export type SemanticBeat={
 id:string;wordId:string;actorId:string;intent:SemanticIntent;
 channel:MotionChannel;action:MotionAction;anchor?:'start'|'end';
 offsetMs?:number;durationMs:number;amount?:number;
};
export type MotionEvent=SemanticBeat&{startFrame:number;endFrame:number};
export type MotionPlan={fps:number;durationInFrames:number;events:MotionEvent[]};

const validIntent=new Set<SemanticIntent>(['introduce','react','question','explain','resolve','exit']);
const actionChannels:Record<MotionAction,MotionChannel>={
 walk:'position',nod:'gesture',point:'gesture',draw:'stroke',pulse:'emphasis',hold:'gesture'
};
const fail=(s:string):never=>{throw new Error('BaseeraMotion: '+s)};
const finite=(n:number)=>Number.isFinite(n);
const frameAt=(ms:number,fps:number)=>Math.round(ms*fps/1000);

export function fromSegmentedWhisperWords(input:readonly {seg:string;i:number;w:string;start:number;end:number}[]):AlignedWord[]{
 return input.map(w=>({id:`${w.seg}:${w.i}`,segment:w.seg,text:w.w,startMs:w.start*1000,endMs:w.end*1000}));
}

/** All animation times derive exclusively from aligned word positions. */
export function compileMotionPlan(input:{
 fps:number;words:readonly AlignedWord[];beats:readonly SemanticBeat[];durationMs?:number
}):MotionPlan{
 const {fps,words,beats,durationMs}=input;
 if(!finite(fps)||fps<=0||!Number.isInteger(fps))fail('fps must be a positive integer');
 const wordMap=new Map<string,AlignedWord>();
 for(const w of words){
  if(!w.id||wordMap.has(w.id))fail(`duplicate/empty word id: ${w.id}`);
  if(![w.startMs,w.endMs].every(finite)||w.startMs<0||w.endMs<=w.startMs)
   fail(`invalid alignment for ${w.id}`);
  wordMap.set(w.id,w);
 }
 const beatIds=new Set<string>();
 const events:MotionEvent[]=beats.map(b=>{
  if(!b.id||beatIds.has(b.id))fail(`duplicate/empty beat id: ${b.id}`);
  beatIds.add(b.id);
  const w=wordMap.get(b.wordId);
  if(!w)throw new Error(`BaseeraMotion: missing word anchor ${b.wordId} for ${b.id}`);
  if(!b.actorId)fail(`missing actorId for ${b.id}`);
  if(!validIntent.has(b.intent))fail(`invalid intent for ${b.id}`);
  if(!(b.action in actionChannels)||actionChannels[b.action]!==b.channel)
   fail(`action/channel mismatch for ${b.id}`);
  if(!finite(b.durationMs)||b.durationMs<=0)fail(`invalid duration for ${b.id}`);
  if(b.amount!==undefined&&!finite(b.amount))fail(`invalid amount for ${b.id}`);
  if(b.offsetMs!==undefined&&!finite(b.offsetMs))fail(`invalid offset for ${b.id}`);
  const anchor=b.anchor??'start';
  if(anchor!=='start'&&anchor!=='end')fail(`invalid anchor for ${b.id}`);
  const startMs=(anchor==='start'?w.startMs:w.endMs)+(b.offsetMs??0);
  if(startMs<0)fail(`beat ${b.id} begins before frame zero`);
  const startFrame=frameAt(startMs,fps);
  const endFrame=Math.max(startFrame+1,frameAt(startMs+b.durationMs,fps));
  return {...b,startFrame,endFrame};
 }).sort((a,b)=>a.startFrame-b.startFrame||a.id.localeCompare(b.id));
 const last=new Map<string,MotionEvent>();
 for(const e of events){
  const key=`${e.actorId}::${e.channel}`,prior=last.get(key);
  if(prior&&e.startFrame<prior.endFrame)
   fail(`overlapping ${e.channel} beats on ${e.actorId}: ${prior.id} and ${e.id}`);
  last.set(key,e);
 }
 const necessaryFrames=Math.max(1,...words.map(w=>frameAt(w.endMs,fps)),...events.map(e=>e.endFrame));
 if(durationMs!==undefined&&(!finite(durationMs)||durationMs<0))fail('invalid durationMs');
 const durationInFrames=durationMs===undefined?necessaryFrames:frameAt(durationMs,fps);
 if(durationInFrames<necessaryFrames)
  fail(`composition ends before speech or animation (${necessaryFrames} frames needed)`);
 return {fps,durationInFrames,events};
}
export const clamp01=(v:number)=>Math.max(0,Math.min(1,v));
export const easeOutCubic=(v:number)=>1-(1-clamp01(v))**3;
export const progressAt=(e:MotionEvent,frame:number)=>easeOutCubic((frame-e.startFrame)/(e.endFrame-e.startFrame));
/** Position is cumulative; gesture/emphasis are time-bounded. */
export function sampleActor(plan:MotionPlan,actorId:string,frame:number){
 let x=0,nod=0,pointing=0,emphasis=0;
 for(const e of plan.events){
  if(e.actorId!==actorId||frame<e.startFrame)continue;
  const p=progressAt(e,frame),active=frame<e.endFrame;
  switch(e.action){
   case'walk':x+=(e.amount??120)*p;break;
   case'nod':if(active)nod=Math.sin(p*Math.PI*2)*(e.amount??10);break;
   case'point':if(active)pointing=(e.amount??1)*Math.sin(Math.PI*p);break;
   case'pulse':if(active)emphasis=(e.amount??0.12)*Math.sin(Math.PI*p);break;
  }
 }
 return{x,nod,pointing,emphasis};
}
export function sampleStroke(plan:MotionPlan,actorId:string,frame:number){
 const e=plan.events.filter(e=>e.actorId===actorId&&e.channel==='stroke'&&e.action==='draw'&&e.startFrame<=frame).at(-1);
 return e?progressAt(e,frame):0;
}
