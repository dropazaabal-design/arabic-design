/**
 * Explicit semantic direction: a director or AI planner supplies meaning and
 * word anchors. This deliberately does NOT pretend to understand arbitrary
 * narration through keyword matching.
 */
import type {SemanticBeat,SemanticIntent} from './core';

export type StoryDirection='enter'|'notice'|'hesitate'|'explain'|'emphasize'|'decide'|'exit';
export type StoryCue={
 id:string;wordId:string;actorId:string;direction:StoryDirection;
 durationMs?:number;distance?:number;offsetMs?:number;
};
const rule:Record<StoryDirection,{
 action:SemanticBeat['action'];channel:SemanticBeat['channel'];intent:SemanticIntent;
 duration:number;amount?:number
}>={
 enter:{action:'walk',channel:'position',intent:'introduce',duration:650,amount:140},
 notice:{action:'nod',channel:'gesture',intent:'react',duration:480,amount:13},
 hesitate:{action:'hold',channel:'gesture',intent:'question',duration:850},
 explain:{action:'point',channel:'gesture',intent:'explain',duration:570,amount:1.3},
 emphasize:{action:'pulse',channel:'emphasis',intent:'explain',duration:590,amount:0.15},
 decide:{action:'nod',channel:'gesture',intent:'resolve',duration:540,amount:18},
 exit:{action:'walk',channel:'position',intent:'exit',duration:720,amount:-180}
};
export function directStory(cues:readonly StoryCue[]):SemanticBeat[]{
 const seen=new Set<string>();
 return cues.map(c=>{
  if(!c.id||seen.has(c.id))throw new Error('BaseeraDirector: empty or duplicate cue id '+c.id);
  seen.add(c.id);
  if(!c.wordId||!c.actorId)throw new Error('BaseeraDirector: actor and word anchors required');
  const r=rule[c.direction];
  if(!r)throw new Error('BaseeraDirector: unknown direction '+c.direction);
  const durationMs=c.durationMs??r.duration;
  if(!Number.isFinite(durationMs)||durationMs<=0)throw new Error('BaseeraDirector: invalid duration');
  if(c.distance!==undefined&&r.channel!=='position')
   throw new Error('BaseeraDirector: distance only belongs to position actions');
  if(c.distance!==undefined&&!Number.isFinite(c.distance))
   throw new Error('BaseeraDirector: invalid distance');
  if(c.offsetMs!==undefined&&!Number.isFinite(c.offsetMs))
   throw new Error('BaseeraDirector: invalid offset');
  return {
   id:c.id,wordId:c.wordId,actorId:c.actorId,
   intent:r.intent,channel:r.channel,action:r.action,
   durationMs,offsetMs:c.offsetMs,
   amount:c.distance??r.amount
  };
 });
}
