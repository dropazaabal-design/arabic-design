import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useVideoConfig} from 'remotion';
import {Scene} from './Scene';
import {loadFonts} from './fonts';
import timeline from '../timeline.json';
export const Hook=()=> <Scene index={0}/>;
export const Refusal=()=> <Scene index={1}/>;
export const Plans=()=> <Scene index={2}/>;
export const Income=()=> <Scene index={3}/>;
export const Wounds=()=> <Scene index={4}/>;
export const Family=()=> <Scene index={5}/>;
export const Good=()=> <Scene index={6}/>;
export const Dreams=()=> <Scene index={7}/>;
export const Close=()=> <Scene index={8}/>;
const parts=[Hook,Refusal,Plans,Income,Wounds,Family,Good,Dreams,Close];
const cues:[number,number,string,number][]=[
 [0,.4,'click',.16],[1,.2,'pageflip',.14],[1,1.4,'pop',.14],
 [2,.25,'scribble',.14],[2,1.9,'chime',.10],[3,.6,'pageflip',.14],[3,2.4,'click',.14],
 [4,1.3,'whoosh',.09],[4,2.7,'chime',.10],[5,.25,'scribble',.14],[5,2.4,'pop',.11],
 [6,.6,'pageflip',.12],[6,2,'chime',.10],[7,.8,'whoosh',.10],[7,2.9,'click',.12],
 [8,.2,'pageflip',.12],[8,2.2,'chime',.12]
];
export const PrivacyReel=()=>{
 loadFonts();const {fps}=useVideoConfig();
 return <AbsoluteFill style={{background:'#101827'}}>
  <Audio src={staticFile('voice/nadeem-soft.wav')} volume={1}/>
  <Audio src={staticFile('music/quiet-bed.wav')} volume={.5}/>
  {timeline.scenes.map((s,i)=>{const Part=parts[i];return <Sequence key={s.id} from={s.fromFrame} durationInFrames={s.durationInFrames} premountFor={fps}><Part/></Sequence>;})}
  {cues.map(([i,at,file,volume],n)=>{
   const authored=i===0?4:i===8?6.5:4.5;
   const scene=timeline.scenes[i];const start=Math.round((scene.at+at*scene.seconds/authored)*fps);
   return <Sequence key={n} from={start} durationInFrames={Math.min(2*fps,timeline.frames-start)} premountFor={fps}><Audio src={staticFile(`sfx/${file}.wav`)} volume={volume}/></Sequence>;
  })}
 </AbsoluteFill>;
};
