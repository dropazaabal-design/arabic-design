import React from 'react';
import {AbsoluteFill,Audio,staticFile,useCurrentFrame} from 'remotion';
import {Frame} from './scene';

export const Reel:React.FC=()=>{
  const f=useCurrentFrame();
  return <AbsoluteFill style={{backgroundColor:'#14283A'}}><Frame f={f}/>
    {/* Copy the approved generated take into public before rendering. */}
    <Audio src={staticFile('narration.mp3')}/>
    <Audio src={staticFile('foley.wav')} volume={0.35}/>
  </AbsoluteFill>;
};
export const Cover:React.FC=()=> <AbsoluteFill><Frame f={309} cover/></AbsoluteFill>;
