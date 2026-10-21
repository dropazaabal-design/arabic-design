import React from 'react';
import {evolvePath} from '@remotion/paths';
import {useCurrentFrame} from 'remotion';
import {sampleActor,sampleStroke} from './core';
import type {MotionPlan} from './core';

/** Faceless geometric actor; replace its SVG rig without changing the semantic plan. */
export const SemanticCharacter:React.FC<{
 plan:MotionPlan;actorId:string;x:number;y:number;scale?:number;color?:string
}>=({plan,actorId,x,y,scale=1,color='#2E7BC5'})=>{
 const frame=useCurrentFrame();
 const pose=sampleActor(plan,actorId,frame);
 const size=scale*(1+pose.emphasis);
 return <svg width={180} height={260} viewBox="0 0 180 260" aria-label="شخصية توضيحية"
   style={{position:'absolute',left:x,top:y,overflow:'visible',transformOrigin:'50% 90%',transform:`translateX(${pose.x}px) scale(${size})`}}>
   <g fill="none" stroke={color} strokeWidth={13} strokeLinecap="round" strokeLinejoin="round">
    <circle cx={90} cy={48+pose.nod} r={29} fill={color} stroke="none"/>
    <path d="M90 85 L90 178"/>
    <path d={`M90 110 L${120+18*pose.pointing} ${148-44*pose.pointing}`}/>
    <path d="M90 110 L56 146"/>
    <path d="M90 178 L58 236 M90 178 L122 236"/>
   </g>
 </svg>;
};
/** SVG drawing progress is driven by the same word-aligned frame clock. */
export const SemanticPath:React.FC<{
 plan:MotionPlan;actorId:string;d:string;stroke?:string;strokeWidth?:number;
 viewBox?:string;style?:React.CSSProperties
}>=({plan,actorId,d,stroke='#E63946',strokeWidth=8,viewBox='0 0 500 200',style})=>{
 const progress=sampleStroke(plan,actorId,useCurrentFrame());
 const {strokeDasharray,strokeDashoffset}=evolvePath(progress,d);
 return <svg viewBox={viewBox} style={style} aria-label="رسم متحرك">
  <path d={d} fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round"
   strokeLinejoin="round" strokeDasharray={strokeDasharray} strokeDashoffset={strokeDashoffset}/>
 </svg>;
};
