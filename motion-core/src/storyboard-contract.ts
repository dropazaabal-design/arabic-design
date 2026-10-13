/**
 * Baseera Narrative Bridge V1
 *
 * Accepts a proposed editorial storyboard (written by a human OR an AI agent).
 * Verifies that directions refer to actual spoken words, valid actors and
 * non-overlapping camera shots. It DOES NOT infer cinematic meaning from text.
 *
 * Type-only imports keep this validator usable by Node's lightweight tests
 * without a browser, Remotion or external services.
 */
import type {AlignedWord} from './core';
import type {StoryCue,StoryDirection} from './semantic-director';

export type ShotScale='wide'|'medium'|'close';

export type ValidatedShot={
  id:string;camera:ShotScale;focusActorId:string;
  fromFrame:number;toFrame:number;screenText?:string;
  visualReason:string;
};

export type PreparedStoryboard={
  description:string;
  actors:readonly string[];
  cues:readonly StoryCue[];
  shots:readonly ValidatedShot[];
};

const directions=new Set<StoryDirection>([
 'enter','notice','hesitate','explain','emphasize','decide','exit'
]);
const cameras=new Set<ShotScale>(['wide','medium','close']);
const actorPattern=/^[a-z][a-z0-9_-]{0,39}$/;
const fail=(message:string):never=>{throw new Error('BaseeraStoryboard: '+message)};
const obj=(value:unknown,name:string):Record<string,unknown>=>{
 if(value===null||typeof value!=='object'||Array.isArray(value))
  fail(name+' must be an object');
 return value as Record<string,unknown>;
};
const array=(value:unknown,name:string):unknown[]=>{
 if(!Array.isArray(value))fail(name+' must be an array');
 return value as unknown[];
};
const str=(value:unknown,name:string):string=>{
 if(typeof value!=='string')return fail(name+' must be nonempty text');
 const trimmed=value.trim();
 if(!trimmed)return fail(name+' must be nonempty text');
 return trimmed;
};
const num=(value:unknown,name:string):number=>{
 if(typeof value!=='number'||!Number.isFinite(value))
  return fail(name+' must be finite');
 return value;
};
const cleanWord=(value:string)=>value.normalize('NFKC')
 .replace(/[\u064B-\u065F\u0670\u0640]/g,'')
 .replace(/[^\p{L}\p{N}]/gu,'');
const toFrame=(ms:number,fps:number)=>Math.round(ms*fps/1000);

/** Fail closed on invalid or misleading AI/editor suggestions. */
export function prepareStoryboard(
 raw:unknown, words:readonly AlignedWord[],fps:number,durationMs:number
):PreparedStoryboard{
 if(!Number.isInteger(fps)||fps<=0)fail('fps invalid');
 if(!Number.isFinite(durationMs)||durationMs<=0)fail('durationMs invalid');
 const data=obj(raw,'storyboard');
 if(data.version!==1)fail('unsupported version (expected 1)');
 if(data.language!=='ar')fail('language must be ar');
 const description=str(data.description,'description');
 const ids=new Set<string>();
 const actors=array(data.actors,'actors').map((value,i)=>{
   const actor=obj(value,'actors['+i+']');
   const id=str(actor.id,'actor.id');
   if(!actorPattern.test(id)||ids.has(id))fail('invalid or repeated actor id '+id);
   ids.add(id);
   str(actor.role,'actor.role');
   return id;
 });
 if(!actors.length||actors.length>6)fail('require 1–6 actors');
 const wordMap=new Map<string,AlignedWord>();
 for(const w of words){
  if(!w.id||wordMap.has(w.id))fail('word ids missing or repeated');
  if(!Number.isFinite(w.startMs)||!Number.isFinite(w.endMs)||w.startMs<0||w.endMs<=w.startMs)
   fail('invalid word alignment for '+w.id);
  wordMap.set(w.id,w);
 }
 if(!words.length)fail('aligned words are required');
 const word=(id:string, expected?:string):AlignedWord=>{
   const found=wordMap.get(id);
   if(!found)return fail('unknown word anchor '+id);
   if(expected!==undefined&&cleanWord(found.text)!==cleanWord(expected))
    fail('word text mismatch for '+id+': expected '+expected+', found '+found.text);
   return found;
 };
 const rawCues=array(data.cues,'cues');
 if(!rawCues.length||rawCues.length>80)fail('require 1–80 cues');
 const cueIds=new Set<string>();
 const cues:StoryCue[]=rawCues.map((value,i)=>{
  const c=obj(value,'cues['+i+']');
  const id=str(c.id,'cue.id'),wordId=str(c.wordId,'cue.wordId');
  const actorId=str(c.actorId,'cue.actorId');
  if(cueIds.has(id))fail('repeated cue id '+id);
  cueIds.add(id);
  if(!ids.has(actorId))fail('cue '+id+' refers to missing actor '+actorId);
  const expectedWord=str(c.expectedWord,'cue.expectedWord');
  const anchor=word(wordId,expectedWord);
  const direction=str(c.direction,'cue.direction') as StoryDirection;
  if(!directions.has(direction))fail('invalid direction for '+id);
  if(anchor.startMs>=durationMs)fail('cue begins after soundtrack '+id);
  const visualReason=str(c.visualReason,'cue.visualReason');
  if(visualReason.length<5)fail('cue requires an explanatory visualReason '+id);
  const duration=c.durationMs===undefined?undefined:num(c.durationMs,'durationMs');
  if(duration!==undefined&&(duration<=0||duration>4000))fail('invalid cue duration '+id);
  const offset=c.offsetMs===undefined?undefined:num(c.offsetMs,'offsetMs');
  if(offset!==undefined&&(offset< -500||offset>800))fail('cue offset too large '+id);
  const distance=c.distance===undefined?undefined:num(c.distance,'distance');
  const start=anchor.startMs+(offset??0);
  if(start<0||start+(duration??0)>durationMs)fail('cue exceeds video bounds '+id);
  if(distance!==undefined&&Math.abs(distance)>450)fail('cue displacement too large '+id);
  return {id,wordId,actorId,direction,durationMs:duration,offsetMs:offset,distance};
 });
 const rawShots=array(data.shots,'shots');
 if(!rawShots.length||rawShots.length>24)fail('require 1–24 shots');
 const shotIds=new Set<string>();
 let previousEnd=0;
 const shots:ValidatedShot[]=rawShots.map((value,i)=>{
  const s=obj(value,'shots['+i+']');
  const id=str(s.id,'shot.id');
  if(shotIds.has(id))fail('repeated shot id '+id);
  shotIds.add(id);
  const fromId=str(s.fromWordId,'shot.fromWordId'),toId=str(s.toWordId,'shot.toWordId');
  const start=word(fromId).startMs,end=word(toId).endMs;
  if(start>=end||end>durationMs)fail('invalid shot bounds '+id);
  const fromFrame=toFrame(start,fps),toFrameValue=toFrame(end,fps);
  if(toFrameValue<=fromFrame)fail('shot has no frames '+id);
  if(fromFrame<previousEnd)fail('overlapping shots at '+id);
  previousEnd=toFrameValue;
  const camera=str(s.camera,'shot.camera') as ShotScale;
  if(!cameras.has(camera))fail('invalid shot camera '+id);
  const focusActorId=str(s.focusActorId,'shot.focusActorId');
  if(!ids.has(focusActorId))fail('shot focus actor missing '+id);
  const visualReason=str(s.visualReason,'shot.visualReason');
  if(visualReason.length<5)fail('shot requires a visual reason '+id);
  const screenText=s.screenText===undefined?undefined:str(s.screenText,'shot.screenText');
  if(screenText!==undefined&&/[A-Za-z]/.test(screenText))
   fail('Latin words on Arabic-only screen for shot '+id);
  return {id,camera,focusActorId,fromFrame,toFrame:toFrameValue,
   visualReason,screenText};
 });
 return {description,actors,cues,shots};
}
