import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {BODY_FONT, TITLE_FONT} from './fonts';
import {C, ease, ramp, HookArt, RefusalArt, PlanArt, IncomeArt, HeartArt, FamilyArt, GiftArt, DreamArt, CloseArt} from './art';

export const COPY=[
 {id:'hook',title:'ليس كل سؤال\nيحتاج شرحًا',subtitle:'7 أشياء تختار لمن تحكيها'},
 {id:'refusal',title:'أسباب رفضك',subtitle:'ردّ واضح ومحترم يكفي'},
 {id:'plans',title:'خططك قبل أن تنضج',subtitle:'ناقشها مع من يساعدك'},
 {id:'income',title:'تفاصيل دخلك',subtitle:'شاركها عند الحاجة'},
 {id:'wounds',title:'جراحك القديمة',subtitle:'اختر شخصًا موثوقًا'},
 {id:'family',title:'خلافاتك العائلية',subtitle:'اطلب الدعم بعيدًا عن التشهير'},
 {id:'good',title:'أعمالك الصالحة',subtitle:'الخير لا يحتاج إعلانًا'},
 {id:'dreams',title:'أحلامك',subtitle:'اختر من يشجعك ويصارحك'},
 {id:'close',title:'اختر لمن تحكي…\nوماذا تحكي',subtitle:'وللدعم… اختر شخصًا موثوقًا'}
] as const;
const ART=[HookArt,RefusalArt,PlanArt,IncomeArt,HeartArt,FamilyArt,GiftArt,DreamArt,CloseArt];
const colors=[C.ink,C.ink,C.paper,C.blue,C.ink,C.paper,C.ink,C.blue,C.ink];
const foreground=[C.paper,C.paper,C.ink,C.paper,C.paper,C.ink,C.paper,C.paper,C.paper];

const Identity:React.FC<{color:string}>=({color})=><>
 <div data-copy="brand" dir="rtl" lang="ar" style={{position:'absolute',left:80,top:168,width:400,fontFamily:BODY_FONT,fontWeight:700,fontSize:40,color,display:'flex',alignItems:'center',gap:17}}>
 <svg width="45" height="53" viewBox="0 0 45 53"><path d="M2 3 H21 L24 7 L27 3 H43 V48 H26 L23 51 L20 48 H2Z" fill="none" stroke={color} strokeWidth="3"/><path d="M23 10 V44 M7 14 H17 M29 14 H38 M7 22 H17 M29 22 H38 M7 30 H17 M29 30 H38" stroke={color} strokeWidth="2"/></svg>
 <span>كتاب وبس</span></div>
 <div data-copy="handle" dir="ltr" style={{position:'absolute',left:80,top:1618,color,opacity:.82,fontFamily:BODY_FONT,fontSize:33,fontWeight:500}}>‏@kitabwbs</div>
 </>;

export const Scene:React.FC<{index:number}>=({index})=>{
 const frame=useCurrentFrame(),{fps}=useVideoConfig(),t=frame/fps;
 const bg=colors[index],ink=foreground[index],light=bg===C.paper;
 const accent=index===4||index===8?C.green:index===1?C.red:C.blue;
 const Art=ART[index], copy=COPY[index],hook=index===0,close=index===8;
 const entry=hook?1:.28+.72*ease(t,0,.28);
 return <AbsoluteFill style={{background:bg,color:ink,overflow:'hidden'}}>
  <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position:'absolute',inset:0}}>
   <defs><pattern id={`hatch-${index}`} width="27" height="27" patternUnits="userSpaceOnUse" patternTransform="rotate(-30)"><path d="M0 0 V27" stroke={ink} strokeWidth="2" opacity=".14"/></pattern></defs>
   <path d="M820 -110 Q1080 40 1190 405 L1190 1390 Q1050 1660 838 1827 L1180 1960 V-80Z" fill={bg===C.blue?C.ink:C.blue} opacity={light?.12:.22}/>
   <path d="M-180 838 Q218 625 206 1060 T-30 1500" fill="none" stroke={ink} strokeWidth="1.5" opacity=".13"/>
   <circle cx="895" cy="877" r="190" fill={`url(#hatch-${index})`} opacity=".5"/>
   <path d="M69 1590 H930" stroke={ink} opacity=".18" strokeWidth="2"/>
   <g stroke={ink} opacity=".19" strokeWidth="3">{[0,1,2,3,4].map(n=><path key={n} d={`M${77+n*16} 213 L${95+n*16} 225`}/>)}</g>
  </svg>
  <Identity color={ink}/>
  {index>0&&index<8?<div dir="ltr" style={{position:'absolute',right:148,top:159,width:85,height:85,borderRadius:50,border:`3px solid ${ink}`,color:ink,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:TITLE_FONT,fontSize:48,fontWeight:900,transform:`rotate(${-6+6*ease(t,0,.35)}deg)`}}>{index}</div>:null}
  <div data-copy="title" dir="rtl" lang="ar" style={{position:'absolute',left:78,top:hook?301:close?292:307,width:838,fontFamily:TITLE_FONT,fontSize:hook?94:close?89:index===2?88:94,fontWeight:900,lineHeight:1.28,whiteSpace:'pre-line',textAlign:'right',opacity:entry,transform:`translateY(${hook?0:20*(1-ease(t,0,.3))}px)`}}>{copy.title}</div>
  {hook?<div data-copy="subtitle" dir="rtl" lang="ar" style={{position:'absolute',left:78,top:574,width:838,fontFamily:BODY_FONT,fontSize:58,fontWeight:700,lineHeight:1.25,color:C.green}}>{copy.subtitle}</div>:null}
  <div style={{position:'absolute',left:55,top:hook?705:close?646:595,width:874,height:hook?778:720,transform:`translateY(${index===0?0:28*(1-ease(t,0,.5))}px)`}}><Art t={t}/></div>
  {index===1?<div data-copy="no" dir="rtl" lang="ar" style={{position:'absolute',left:373,top:809,width:256,height:156,display:'flex',alignItems:'center',justifyContent:'center',lineHeight:1,fontFamily:TITLE_FONT,fontWeight:900,fontSize:108,color:C.paper,opacity:ease(t,1.15,1.65),transform:`rotate(-4deg) translateY(${40*(1-ease(t,1.15,1.65))}px)`}}>لا</div>:null}
  {!hook?<>
    <div style={{position:'absolute',left:78,top:1340,width:8,height:close?143:123,background:accent,transform:`scaleY(${ease(t,.6,1)})`,transformOrigin:'top'}}/>
    <div data-copy="subtitle" dir="rtl" lang="ar" style={{position:'absolute',left:108,top:1346,width:808,fontFamily:BODY_FONT,fontSize:close?60:61,fontWeight:700,lineHeight:1.28,opacity:.3+.7*ease(t,close?2.1:.25,close?2.6:.7),transform:`translateY(${15*(1-ease(t,.25,.7))}px)`}}>{copy.subtitle}</div>
  </>:null}
  <div style={{position:'absolute',left:80,top:1539,display:'flex',gap:14}}>{Array.from({length:7},(_,n)=><div key={n} style={{height:7,width:107,borderRadius:9,background:ink,opacity:hook?.18:n<index?.75:.18,transform:`scaleX(${n===index-1?ramp(t,0,4.3):1})`,transformOrigin:'right'}}/>)}</div>
  {close?<svg viewBox="0 0 840 60" width="840" height="60" style={{position:'absolute',left:78,top:1496}}><path d="M15 28 Q190 10 407 28 T820 27" fill="none" stroke={C.green} strokeWidth="5" strokeLinecap="round" pathLength="1" strokeDasharray="1 1" strokeDashoffset={1-ramp(t,3,5.4)}/></svg>:null}
 </AbsoluteFill>;
};
