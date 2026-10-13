import React from 'react';
import {AbsoluteFill,Audio,staticFile,useCurrentFrame} from 'remotion';
import alignedWords from '../../reels/clear-thinking-pause/src/words.json';
import {compileMotionPlan,fromSegmentedWhisperWords} from '../src/core';
import {directStory} from '../src/semantic-director';
import {CharacterActor} from '../src/CharacterActor';
import {ArabicWordCaption} from '../src/Captions';

export const STORY_FPS=30;
export const STORY_FRAMES=330;
const words=fromSegmentedWhisperWords(alignedWords)
 .filter(w=>w.endMs<=STORY_FRAMES*1000/STORY_FPS);
/** Human-directed semantic intent for an existing narration, not AI keyword matching. */
export const storyPlan=compileMotionPlan({
 fps:STORY_FPS,words,durationMs:11000,
 beats:directStory([
  {id:'hero-enter',wordId:'s01:0',actorId:'hero',direction:'enter',distance:200,durationMs:700},
  {id:'hero-hesitate',wordId:'s01:3',actorId:'hero',direction:'hesitate',durationMs:800},
  {id:'other-enter',wordId:'s02:0',actorId:'other',direction:'enter',distance:-135,durationMs:700},
  {id:'other-notice',wordId:'s02:2',actorId:'other',direction:'notice',durationMs:550},
  {id:'hero-explain',wordId:'s02:3',actorId:'hero',direction:'explain',durationMs:750},
  {id:'other-hesitate',wordId:'s02:5',actorId:'other',direction:'hesitate',durationMs:650},
  {id:'hero-emphasis',wordId:'s02:9',actorId:'hero',direction:'emphasize',durationMs:550}
 ])
});
const beatFrame=(ms:number)=>Math.round(ms*STORY_FPS/1000);
const start=(id:string)=>words.find(w=>w.id===id)!.startMs;
const messageAt=beatFrame(start('s02:1'));
const questionAt=beatFrame(start('s02:9'));

export const CharacterStory:React.FC=()=>{
 const f=useCurrentFrame();
 const message=f>=messageAt;
 const question=f>=questionAt;
 return <AbsoluteFill style={{background:'#0B1930',overflow:'hidden'}}>
  <style>{`@font-face{font-family:'BaseeraCairo';font-style:normal;font-weight:900;src:url('${staticFile('fonts/cairo-900-arabic.woff2')}') format('woff2')}`}</style>
  <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position:'absolute',inset:0}}>
   <path d="M0 1630 Q540 1550 1080 1630" stroke="#2E415C" strokeWidth="3" fill="none"/>
   <circle cx="150" cy="360" r="240" fill="#19304D" opacity=".6"/>
   <circle cx="1010" cy="1260" r="290" fill="#112A44" opacity=".8"/>
   <path d="M80 1530 H1000" stroke="#34516D" strokeWidth="4" strokeDasharray="14 20"/>
  </svg>
  <div dir="rtl" lang="ar" style={{position:'absolute',top:135,left:75,right:75,
   textAlign:'center',fontFamily:'BaseeraCairo,sans-serif',fontSize:94,
   lineHeight:1.35,fontWeight:900,color:'#FFFFFF'}}>
    لا ترسلها وأنت غاضب
  </div>
  {message&&<div dir="rtl" lang="ar" style={{position:'absolute',top:480,left:240,right:240,
    border:'5px solid #E63946',background:'#142B44',borderRadius:32,padding:32,
    textAlign:'center',fontFamily:'BaseeraCairo,sans-serif',fontSize:58,fontWeight:900,color:'#FFFFFF'}}>
    {question?'لحظة واحدة!':'وصلتك رسالة'}
   </div>}
  <CharacterActor plan={storyPlan} actorId="hero" x={-65} y={1040} scale={2.05}
    temperament="energetic" styleVariant="doodle" color="#E63946"/>
  <CharacterActor plan={storyPlan} actorId="other" x={730} y={1070} scale={1.9}
    facing="left" temperament="calm" styleVariant="editorial" color="#2E7BC5"/>
  <ArabicWordCaption words={words} fps={STORY_FPS} fontFamily="BaseeraCairo,sans-serif"/>
  <Audio src={staticFile('voice/voice.wav')}/>
 </AbsoluteFill>;
};
