import React from 'react';
import {useGsapTimeline} from '@remotion/gsap';
import type {MotionEvent} from './core';
/** Paused GSAP timeline, sought by Remotion. No playback callbacks or wall-clock timers. */
export const GsapEntrance:React.FC<{event:MotionEvent;fps:number;children:React.ReactNode}>=({event,fps,children})=>{
 const from=event.startFrame/fps;
 const duration=(event.endFrame-event.startFrame)/fps;
 const scope=useGsapTimeline<HTMLDivElement>(({timeline,selector})=>{
  timeline.from(selector('[data-baseera-entry]'),
   {y:45,opacity:0,duration,ease:'power3.out',immediateRender:false},from);
 },{dependencies:[from,duration]});
 return <div ref={scope} style={{position:'absolute',inset:0,pointerEvents:'none'}}>
  <div data-baseera-entry style={{width:'100%',height:'100%'}}>{children}</div>
 </div>;
};
