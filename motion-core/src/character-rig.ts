/**
 * Frame-pure, faceless 2D character posing for Baseera.
 * Every dramatic action is anchored to a compiled semantic event; no wall clock,
 * animation loops, React state or random numbers. Safe for non-linear rendering.
 */
import type {MotionPlan, MotionEvent} from './core';

export type CharacterPose={
  x:number; lift:number; headY:number; headTilt:number; torsoLean:number;
  leftArm:number; rightArm:number; leftLeg:number; rightLeg:number;
  point:number; thinking:number; scale:number;
};
export type CharacterTemperament='calm'|'energetic'|'neutral';

const clamp=(n:number)=>Math.max(0,Math.min(1,n));
const ease=(n:number)=>1-(1-clamp(n))**3;
const sineEnvelope=(n:number)=>Math.sin(Math.PI*clamp(n));
function fraction(e:MotionEvent,frame:number){
  return clamp((frame-e.startFrame)/Math.max(1,e.endFrame-e.startFrame));
}

/**
 * A walk ends with feet at rest while the final x translation remains.
 * Pointing, nodding, thinking and pulse gestures decay to neutral before the
 * next gesture. Breathing stays subtle and is independent of playback order.
 */
export function characterPose(
 plan:MotionPlan,actorId:string,frame:number,temperament:CharacterTemperament='neutral',
):CharacterPose{
 if(!Number.isFinite(frame))throw new Error('BaseeraRig: frame must be finite');
 let x=0,lift=0,headY=0,headTilt=0,torsoLean=0;
 let leftArm=0,rightArm=0,leftLeg=0,rightLeg=0,point=0,thinking=0,scale=1;
 const energy=temperament==='energetic'?1.24:temperament==='calm'?0.72:1;
 const breath=2*Math.sin(frame*0.082)*energy;
 for(const e of plan.events){
  if(e.actorId!==actorId||frame<e.startFrame)continue;
  const raw=fraction(e,frame);
  const p=ease(raw);
  const active=frame<e.endFrame;
  const env=active?sineEnvelope(raw):0;
  if(e.action==='walk'){
   const dx=e.amount??120;
   x+=dx*p;
   if(active){
    // Two gait cycles minimum; larger translations produce more steps.
    const cycles=Math.max(2,Math.abs(dx)/95);
    const phase=raw*cycles*Math.PI*2;
    const stride=Math.min(26,Math.max(10,Math.abs(dx)/9))*env*energy;
    leftLeg+=Math.sin(phase)*stride;
    rightLeg-=Math.sin(phase)*stride;
    leftArm-=Math.sin(phase)*stride*0.48;
    rightArm+=Math.sin(phase)*stride*0.48;
    lift-=Math.abs(Math.sin(phase))*6*env;
    torsoLean+=Math.sign(dx)*4*env;
   }
  }else if(active&&e.action==='nod'){
   const amplitude=(e.amount??12)*energy;
   headY+=Math.sin(p*Math.PI*2)*amplitude*0.28*env;
   headTilt+=Math.sin(p*Math.PI*2)*amplitude*0.7*env;
  }else if(active&&e.action==='point'){
   point=Math.max(point,env*clamp((e.amount??1)/1.5));
   rightArm-=70*point;
   torsoLean+=5*env;
  }else if(active&&e.action==='hold'){
   thinking=Math.max(thinking,env);
   headTilt-=11*env;
   leftArm+=33*env;
   rightArm-=24*env;
   torsoLean-=4*env;
  }else if(active&&e.action==='pulse'){
   scale+=Math.max(0,(e.amount??0.12))*env;
   lift-=4*env;
  }
 }
 // Faceless head and limbs share one connected torso: gentle breathing only.
 headY+=breath*0.35;
 return {x,lift,headY,headTilt,torsoLean,leftArm,rightArm,leftLeg,rightLeg,point,thinking,scale};
}
