import React from 'react';
import type {Caption} from '@remotion/captions';
import {useCurrentFrame} from 'remotion';
import type {AlignedWord} from './core.js';
/** Preserve word boundaries and whitespace for @remotion/captions tools. */
export const toRemotionCaptions=(words:readonly AlignedWord[]):Caption[]=>words.map(w=>({
 text:' '+w.text,startMs:w.startMs,endMs:w.endMs,
 timestampMs:(w.startMs+w.endMs)/2,confidence:null,
}));
/** Render whole Arabic words, never letters split from their shaping context. */
export const ArabicWordCaption:React.FC<{
 words:readonly AlignedWord[];fps:number;fontFamily?:string
}>=({words,fps,fontFamily='Cairo'})=>{
 const time=useCurrentFrame()*1000/fps;
 const word=words.find(w=>w.startMs<=time&&time<w.endMs);
 if(!word)return null;
 return <div lang="ar" dir="rtl" style={{position:'absolute',bottom:240,left:110,right:110,
  textAlign:'center',fontFamily,fontWeight:800,fontSize:80,lineHeight:1.4,
  color:'#FFFFFF',textShadow:'0 4px 22px rgba(0,0,0,0.7)'}}>
   {word.text}
 </div>;
};
