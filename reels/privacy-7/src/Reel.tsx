import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useVideoConfig} from 'remotion';
import {Scene} from './Scene';
import {loadFonts} from './fonts';

export const Hook=()=> <Scene index={0}/>;
export const Refusal=()=> <Scene index={1}/>;
export const Plans=()=> <Scene index={2}/>;
export const Income=()=> <Scene index={3}/>;
export const Wounds=()=> <Scene index={4}/>;
export const Family=()=> <Scene index={5}/>;
export const Good=()=> <Scene index={6}/>;
export const Dreams=()=> <Scene index={7}/>;
export const Close=()=> <Scene index={8}/>;

const Cue:React.FC<{at:number,file:string,volume:number}>=({at,file,volume})=>{
 const {fps}=useVideoConfig();return <Sequence from={Math.round(at*fps)} durationInFrames={Math.round(2*fps)} premountFor={fps}><Audio src={staticFile(`sfx/${file}.wav`)} volume={volume}/></Sequence>;
};
export const PrivacyReel=()=>{
 loadFonts();const{fps}=useVideoConfig();const f=(s:number)=>Math.round(s*fps);
 return <AbsoluteFill style={{background:'#101827'}}>
  <Audio src={staticFile('music/quiet-bed.wav')} volume={.75}/>
  <Sequence from={0} durationInFrames={f(4)} premountFor={fps}><Hook/></Sequence>
  <Sequence from={f(4)} durationInFrames={f(4.5)} premountFor={fps}><Refusal/></Sequence>
  <Sequence from={f(8.5)} durationInFrames={f(4.5)} premountFor={fps}><Plans/></Sequence>
  <Sequence from={f(13)} durationInFrames={f(4.5)} premountFor={fps}><Income/></Sequence>
  <Sequence from={f(17.5)} durationInFrames={f(4.5)} premountFor={fps}><Wounds/></Sequence>
  <Sequence from={f(22)} durationInFrames={f(4.5)} premountFor={fps}><Family/></Sequence>
  <Sequence from={f(26.5)} durationInFrames={f(4.5)} premountFor={fps}><Good/></Sequence>
  <Sequence from={f(31)} durationInFrames={f(4.5)} premountFor={fps}><Dreams/></Sequence>
  <Sequence from={f(35.5)} durationInFrames={f(6.5)} premountFor={fps}><Close/></Sequence>
  <Cue at={.4} file="click" volume={.24}/>
  <Cue at={4.2} file="pageflip" volume={.20}/><Cue at={5.4} file="pop" volume={.22}/>
  <Cue at={8.75} file="scribble" volume={.20}/><Cue at={10.4} file="chime" volume={.15}/>
  <Cue at={13.6} file="pageflip" volume={.22}/><Cue at={15.4} file="click" volume={.20}/>
  <Cue at={18.8} file="whoosh" volume={.13}/><Cue at={20.2} file="chime" volume={.14}/>
  <Cue at={22.25} file="scribble" volume={.20}/><Cue at={24.4} file="pop" volume={.16}/>
  <Cue at={27.1} file="pageflip" volume={.18}/><Cue at={28.5} file="chime" volume={.16}/>
  <Cue at={31.8} file="whoosh" volume={.16}/><Cue at={33.9} file="click" volume={.18}/>
  <Cue at={35.7} file="pageflip" volume={.18}/><Cue at={37.7} file="chime" volume={.19}/>
 </AbsoluteFill>;
};
