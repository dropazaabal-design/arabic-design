import React from 'react';
import {useCurrentFrame} from 'remotion';
import type {MotionPlan} from './core';
import {characterPose} from './character-rig';
import type {CharacterTemperament} from './character-rig';

export type CharacterStyle='doodle'|'editorial'|'minimal';
/**
 * Two or more characters can perform separate semantic tracks.
 * Stylized faceless SVG: expressions come from body language, not faces.
 */
export const CharacterActor:React.FC<{
 plan:MotionPlan;actorId:string;x:number;y:number;scale?:number;
 facing?:'left'|'right';styleVariant?:CharacterStyle;
 temperament?:CharacterTemperament;color?:string
}>=({plan,actorId,x,y,scale=1,facing='right',styleVariant='doodle',
 temperament='neutral',color='#2E7BC5'})=>{
 const frame=useCurrentFrame();
 const p=characterPose(plan,actorId,frame,temperament);
 const ink=styleVariant==='minimal'?'#DCE6F3':color;
 const lineWidth=styleVariant==='editorial'?16:styleVariant==='doodle'?13:10;
 const outlined=styleVariant==='editorial'?'#0B1930':'none';
 const flipped=facing==='left';
 return <svg width={180} height={270} viewBox="0 0 180 270"
  role="img" aria-label="شخصية هندسية متحركة بلا ملامح"
  style={{position:'absolute',left:x,top:y,overflow:'visible',
   transformOrigin:'50% 90%',
   transform:`translate(${p.x}px,${p.lift}px) scale(${scale*p.scale})`}}>
  <g transform={flipped?'translate(180 0) scale(-1 1)':undefined}
   fill="none" stroke={ink} strokeWidth={lineWidth}
   strokeLinecap="round" strokeLinejoin="round">
   {/* A connected torso with real shoulder and hip pivots. */}
   <g transform={`translate(90 105) rotate(${p.torsoLean})`}>
    <path d="M0 -18 Q-5 24 0 69"/>
    <g transform={`rotate(${p.leftArm})`}>
     <path d="M-3 0 Q-21 23 -42 61"/>
    </g>
    <g transform={`rotate(${p.rightArm})`}>
     <path d="M3 0 Q23 28 46 61"/>
     {p.point>0.1&&<path d="M46 61 L55 58" strokeWidth={6}/>}
    </g>
   </g>
   <g transform={`translate(90 174) rotate(${p.leftLeg})`}>
    <path d="M0 0 Q-12 32 -28 66"/>
   </g>
   <g transform={`translate(90 174) rotate(${p.rightLeg})`}>
    <path d="M0 0 Q13 32 27 66"/>
   </g>
   <g transform={`translate(90 ${51+p.headY}) rotate(${p.headTilt})`}>
    <circle cx="0" cy="0" r={30} fill={ink} stroke={outlined} strokeWidth={styleVariant==='editorial'?5:0}/>
    {styleVariant==='editorial'&&<path d="M-26 13 L26 13" stroke="#0B1930" strokeWidth={3} opacity={0.5}/>}
   </g>
  </g>
 </svg>;
};
