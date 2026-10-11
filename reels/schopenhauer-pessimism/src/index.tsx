import React from 'react';
import {AbsoluteFill,Composition,Still,Sequence,registerRoot,useCurrentFrame,useVideoConfig,staticFile,delayRender,continueRender} from 'remotion';
import {Audio} from '@remotion/media';
import {Hook,Coin} from './scenes/Hook';
import {Effort,Win} from './scenes/Effort';
import {Bored,Foot} from './scenes/Bored';
import {Pile,PendulumScene} from './scenes/Pile';
import {Thread} from './scenes/Thread';
import {Art} from './scenes/Art';
import {Door,End} from './scenes/Exit';
import {Cover} from './Cover';
import caps from './captions.json';
import './style.css';
const fontHandle=delayRender('Cairo');
const font=new FontFace('Cairo',`url(${staticFile('Cairo.ttf')})`,{weight:'200 1000'});
font.load().then(v=>{document.fonts.add(v);continueRender(fontHandle);});
const Captions=()=>{const f=useCurrentFrame();const {fps}=useVideoConfig();const c=caps.find(x=>f/fps>=x.start&&f/fps<x.end);return c?<div dir="rtl" style={{position:'absolute',top:1650,left:80,right:80,textAlign:'center',fontFamily:'Cairo',fontWeight:600,fontSize:43,lineHeight:1.55,color:'#EEE7DA',textShadow:'0 2px 5px #000',background:'#0E1622E8',borderRadius:16,padding:'12px 24px'}}>{c.text}</div>:null;};
export const Reel=()=>{const {fps}=useVideoConfig();return <AbsoluteFill>
<Sequence name="سحب وقطعة نقدية" from={0} durationInFrames={158} premountFor={fps}><Hook/></Sequence>
<Sequence name="اختيار الجولة" from={158} durationInFrames={124} premountFor={fps}><Coin/></Sequence>
<Sequence name="المحاولة والالتقاط" from={282} durationInFrames={226} premountFor={fps}><Effort/></Sequence>
<Sequence name="انتقال الجائزة" from={508} durationInFrames={115} premountFor={fps}><Win/></Sequence>
<Sequence name="راحة ثم ملل" from={623} durationInFrames={163} premountFor={fps}><Bored/></Sequence>
<Sequence name="قدم سرية" from={786} durationInFrames={161} premountFor={fps}><Foot/></Sequence>
<Sequence name="ثقل الأمنيات" from={947} durationInFrames={159} premountFor={fps}><Pile/></Sequence>
<Sequence name="البندول" from={1106} durationInFrames={234} premountFor={fps}><PendulumScene/></Sequence>
<Sequence name="مصدر الخيط" from={1340} durationInFrames={118} premountFor={fps}><Thread/></Sequence>
<Sequence name="فسحة التأمل" from={1458} durationInFrames={321} premountFor={fps}><Art/></Sequence>
<Sequence name="جائزة تسد الباب" from={1779} durationInFrames={117} premountFor={fps}><Door/></Sequence>
<Sequence name="جولة أخيرة" from={1896} durationInFrames={96} premountFor={fps}><End/></Sequence>
<Audio src={staticFile('mix.wav')} premountFor={fps}/><Captions/>
</AbsoluteFill>;};
const Root=()=> <>
<Composition id="Reel" component={Reel} durationInFrames={1992} fps={30} width={1080} height={1920}/>
<Composition id="Hook" component={Hook} durationInFrames={158} fps={30} width={1080} height={1920}/>
<Composition id="Effort" component={Effort} durationInFrames={226} fps={30} width={1080} height={1920}/>
<Composition id="Win" component={Win} durationInFrames={115} fps={30} width={1080} height={1920}/>
<Composition id="Bored" component={Bored} durationInFrames={163} fps={30} width={1080} height={1920}/>
<Composition id="Foot" component={Foot} durationInFrames={161} fps={30} width={1080} height={1920}/>
<Composition id="Pile" component={Pile} durationInFrames={159} fps={30} width={1080} height={1920}/>
<Composition id="Pendulum" component={PendulumScene} durationInFrames={234} fps={30} width={1080} height={1920}/>
<Composition id="Thread" component={Thread} durationInFrames={118} fps={30} width={1080} height={1920}/>
<Composition id="Art" component={Art} durationInFrames={321} fps={30} width={1080} height={1920}/>
<Composition id="Door" component={Door} durationInFrames={117} fps={30} width={1080} height={1920}/>
<Composition id="End" component={End} durationInFrames={96} fps={30} width={1080} height={1920}/>
<Still id="Cover" component={Cover} width={1080} height={1920}/>
</>;
registerRoot(Root);
