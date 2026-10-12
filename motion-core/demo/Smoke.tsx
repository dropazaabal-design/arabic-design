import React from 'react';
import {AbsoluteFill, Audio, staticFile} from 'remotion';
import alignedWords from '../../reels/clear-thinking-pause/src/words.json';
import {compileMotionPlan, fromSegmentedWhisperWords} from '../src/core.js';
import type {SemanticBeat} from '../src/core.js';
import {SemanticCharacter, SemanticPath} from '../src/RemotionStage.js';
import {ArabicWordCaption} from '../src/Captions.js';
import {GsapEntrance} from '../src/GsapEntrance.js';

export const FPS = 30;
export const DURATION_FRAMES = 330; // 11 seconds of existing voice
const allWords=fromSegmentedWhisperWords(alignedWords);
const words=allWords.filter((word)=>word.endMs<=DURATION_FRAMES*1000/FPS);
const beats:SemanticBeat[]=[
 {id:'enter',wordId:'s01:0',actorId:'hero',intent:'introduce',channel:'position',action:'walk',durationMs:650,amount:190},
 {id:'react',wordId:'s01:3',actorId:'hero',intent:'react',channel:'gesture',action:'nod',durationMs:450},
 {id:'title',wordId:'s02:0',actorId:'title',intent:'introduce',channel:'emphasis',action:'pulse',durationMs:650},
 {id:'message',wordId:'s02:1',actorId:'message-line',intent:'explain',channel:'stroke',action:'draw',durationMs:850},
 {id:'approach',wordId:'s02:3',actorId:'hero',intent:'react',channel:'position',action:'walk',durationMs:670,amount:145},
 {id:'point',wordId:'s02:5',actorId:'hero',intent:'explain',channel:'gesture',action:'point',durationMs:500,amount:1.5},
 {id:'warning',wordId:'s02:9',actorId:'hero',intent:'question',channel:'emphasis',action:'pulse',durationMs:700,amount:0.2},
];
export const smokePlan=compileMotionPlan({fps:FPS,words,beats,durationMs:11000});
const title=smokePlan.events.find((event)=>event.id==='title')!;

export const Smoke:React.FC=()=>(
 <AbsoluteFill style={{background:'#0B1930',color:'#FFFFFF',overflow:'hidden'}}>
  <style>{`@font-face{font-family:'BaseeraCairo';font-style:normal;font-weight:900;src:url('${staticFile('fonts/cairo-900-arabic.woff2')}') format('woff2')}`}</style>
  <div dir="rtl" lang="ar" style={{position:'absolute',top:125,left:85,right:85,
   textAlign:'center',fontFamily:'BaseeraCairo, sans-serif',fontSize:92,fontWeight:900}}>
   لا ترسلها وأنت غاضب
  </div>
  <SemanticCharacter plan={smokePlan} actorId="hero" x={125} y={790} scale={1.6} color="#2E7BC5"/>
  <SemanticPath plan={smokePlan} actorId="message-line"
   d="M20 120 Q120 10 200 110 T400 100" stroke="#E63946"
   viewBox="0 0 450 160" style={{position:'absolute',top:1040,left:90,width:880,height:220}}/>
  <GsapEntrance event={title} fps={FPS}>
   <div lang="ar" dir="rtl" style={{position:'absolute',left:120,right:120,top:595,
    border:'5px solid #10B981',borderRadius:32,padding:35,textAlign:'center',
    background:'#14304C',fontFamily:'BaseeraCairo, sans-serif',fontSize:60,fontWeight:900}}>
    فكّر قبل أن تردّ
   </div>
  </GsapEntrance>
  <ArabicWordCaption words={words} fps={FPS} fontFamily="BaseeraCairo, sans-serif"/>
  <Audio src={staticFile('voice/voice.wav')}/>
 </AbsoluteFill>
);
