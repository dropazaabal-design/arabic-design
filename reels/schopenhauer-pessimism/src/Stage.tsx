import React from 'react';
import {AbsoluteFill,useCurrentFrame,useVideoConfig} from 'remotion';
import {Hero,Duck,Machine,Claw,Button,Room,Pendulum,Line,P,k,Pose} from './art';
export type Phase='hook'|'coin'|'effort'|'win'|'bored'|'foot'|'pile'|'pendulum'|'thread'|'art'|'door'|'end';
export const Stage=({phase}:{phase:Phase})=>{
 const f=useCurrentFrame();const {fps,durationInFrames}=useVideoConfig();const t=f/fps;const d=durationInFrames/fps;const u=t/d;
 let cx=540,cy=960,zoom=1;let hx=340,hy=1430,lean=0,bounce=0,face='want',foot=0,gaze=1,mouth=0;
 let l:[number,number]=[-86,-145],r:[number,number]=[105,-223];let clawX=782,clawY=675,closed=0,duckX=782,duckY=1092,duckS=.62;
 let showSmall=true,held=false,showMedium=false,showBig=false,medX=475,medY=1280,bigX=640,bigY=1260,machineShift=0;let pend=false,button=false;
 if(phase==='hook'){
  hx=k(t,[0,1.7,2.7,3.3],[202,352,326,340]);lean=k(t,[0,1.7,2.5,3],[28,36,-9,0]);face=t<2.5?'strain':'want';
  l=[-124,-127];r=[109,-240];clawX=hx+70;clawY=1124+Math.sin(t*6)*7;closed=t<2.6?1:0;
  if(t>2.6){clawX=k(t,[2.6,3.4],[hx+70,782]);clawY=k(t,[2.6,3.4],[1124,675]);r=[k(t,[3.1,4.1,4.8],[109,252,95]),k(t,[3.1,4.1,4.8],[-240,-258,-210])];}
  bounce=t<2.5?Math.sin(t*8)*5:0;cx=520;cy=1090;zoom=1.15;
 }
 if(phase==='coin'){cx=725;cy=1118;zoom=1.9;hx=355;r=[235,-263];clawX=780+Math.sin(t*1.4)*14;clawY=675+Math.sin(t*1.2)*8;face='want';button=t>.8&&t<1.5;}
 if(phase==='effort'){
  face='strain';lean=5+Math.sin(t*3)*9;bounce=Math.sin(t*5)*4;l=[-110,-140];r=[260-hx*.015+Math.sin(t*5)*8,-272+Math.sin(t*5)*6];
  clawX=k(t,[0,2,3.2,4.2,5.5,6.6,7.5],[760,839,750,820,780,780,780]);clawY=k(t,[0,3,4.6,5.2,6.0,7.4],[675,740,955,1015,990,710]);closed=k(t,[5.0,5.5],[0,1]);
  if(t>5.2){duckX=clawX;duckY=clawY+82;}if(t>2.7&&t<3.7){r=[165,-165];lean=-12;}
  cx=t<3?550:600;cy=t<3?1050:1040;zoom=t<3?1.1:1.26;
 }
 if(phase==='win'){
  clawX=k(t,[0,.9,1.6],[780,780,715]);clawY=k(t,[0,.9,1.6],[710,1060,1150]);closed=t<1.4?1:0;
  duckX=k(t,[0,.9,1.6,2.3,3.1],[780,780,715,425,374]);duckY=k(t,[0,.9,1.6,2.3,3.1],[792,1142,1280,1270,1210]);
  r=[k(t,[0,1.4,2.3,3.1],[105,180,110,89]),k(t,[0,1.4,2.3,3.1],[-223,-165,-165,-214])];l=[k(t,[0,1.9,3],[-86,-15,0]),k(t,[0,1.9,3],[-145,-155,-214])];face=t>2.1?'happy':'want';mouth=t>.1&&t<.7?.7:0;bounce=t>2.3?Math.sin(t*5)*3:0;
  cx=530;cy=1150;zoom=1.25;
 }
 if(phase==='bored'||phase==='foot'){
  held=true;hy=1430;face=phase==='bored'?(t<1.3?'happy':'bored'):'bored';gaze=t<2?-1:1;r=[92,-215+Math.sin(t*7)*2];l=[-12,-212];
  if(phase==='bored'){lean=k(t,[0,1.2,3,4.8],[0,0,-5,-8]);foot=Math.sin(t*9)*4;cx=390;cy=1147;zoom=1.42;}
  else{foot=k(t,[0,1.3,2.3,3.3,4.2,5],[0,24,90,172,177,0]);button=t>3.5&&t<4.35;cx=t<2?390:488;cy=t<2?1112:1390;zoom=t<2?1.47:2.05;l=t<2?[-133,-260]:[-12,-212];}
 }
 if(phase==='pile'||phase==='pendulum'){
  held=true;showMedium=true;face='strain';lean=-7+Math.sin(t*3)*3;r=[150,-117];l=[-20,-205];
  if(phase==='pile'){
   medX=k(t,[0,.6,1.7,2.6],[780,745,489,454]);medY=k(t,[0,.6,1.7,2.6],[1050,1240,1280,1310]);
   showBig=t>2.65;bigX=k(t,[2.65,3.3,4.1,5.2],[782,720,626,630]);bigY=k(t,[2.65,3.3,4.1,5.2],[1010,1130,1190,1300]);bounce=t>3.9?8+Math.sin(t*5)*5:0;clawY=950+Math.sin(t*2)*160;clawX=780;closed=1;cx=560;cy=1050;zoom=1.07;
  }else{showBig=true;pend=true;bounce=9+Math.abs(Math.sin(t*2.8))*8;medX=454;medY=1310;bigX=665;bigY=1298;lean=-7+Math.sin(t*2.8)*9;cx=t<2.5?460:540;cy=t<2.5?1000:1080;zoom=t<2.5?1.14:1;}
 }
 if(phase==='thread'){
  held=false;duckX=385;duckY=1430;showMedium=true;showBig=true;medX=474;medY=1390;bigX=760;bigY=1300;pend=true;
  r=[k(t,[0,1,1.9,2.6],[90,126,138,117]),k(t,[0,1,1.9,2.6],[-205,-279,-285,-255])];l=[90,-185];face=t>1.7?'shock':'strain';cx=t<1.8?510:405;cy=t<1.8?1120:1160;zoom=t<1.8?1.18:1.7;
 }
 if(phase==='art'){
  duckX=385;duckY=1430;showMedium=true;showBig=true;medX=474;medY=1390;bigX=760;bigY=1300;pend=true;face='calm';gaze=-1;
  r=[-84,-240];l=[-120,-285];if(t>2.5)l=[-162,-330+Math.sin(t*1.8)*23];cx=t<2.5?430:t<6.5?257:430;cy=t<2.5?1050:t<6.5?1060:1050;zoom=t<2.5?1.05:t<6.5?1.48:1.05;clawY=760+Math.sin(t*1.8)*180;clawX=770;closed=0;
 }
 if(phase==='door'){
  hx=360-k(t,[0,2.5],[0,32]);face='strain';lean=-14;duckX=385;duckY=1430;showMedium=true;showBig=true;medX=474;medY=1390;bigX=k(t,[0,.9,1.6,2.6,3.8],[760,535,310,298,318]);bigY=1330;pend=true;r=[-140,-150];l=[-190,-181];cx=448;cy=1160;zoom=1.08;
 }
 if(phase==='end'){
  hx=k(t,[0,1.4,2.5],[330,343,349]);face=t<1.3?'shock':'bored';lean=0;held=false;duckX=385;duckY=1430;showMedium=true;showBig=true;medX=474;medY=1390;bigX=318;bigY=1330;pend=true;
  machineShift=k(t,[0,.8,1.1,1.5],[0,-74,-96,-96]);r=[240,-256];l=[-82,-180];foot=k(t,[1.3,2.0,2.8,3.2],[0,10,46,90]);cx=540;cy=1140;zoom=1.02;
 }
 if(held){const a=lean*Math.PI/180;duckX=hx+36*Math.cos(a)+217*Math.sin(a);duckY=hy+36*Math.sin(a)-217*Math.cos(a)+bounce;}
 const endpoint=(phase==='thread'||phase==='art'||phase==='end')?r:[66,-230];const theta=lean*Math.PI/180;const threadEndX=hx+endpoint[0]*Math.cos(theta)-endpoint[1]*Math.sin(theta);const threadEndY=hy+endpoint[0]*Math.sin(theta)+endpoint[1]*Math.cos(theta)+bounce;
 const slack=phase==='art'?100:phase==='thread'&&t>2?70:phase==='bored'||phase==='foot'?45:0;
 return <AbsoluteFill style={{background:P.dark}}><svg width="1080" height="1920" viewBox="0 0 1080 1920"><Room t={t}/><g transform={`translate(540 960) scale(${zoom}) translate(${-cx} ${-cy})`}>
 <Machine t={t} shift={machineShift} button={button?1:0}/>
 {(phase==='bored'||phase==='foot')&&<g><path d="M248 1300 L418 1300 L405 1324 L261 1324Z" fill={P.metal} stroke={P.ink} strokeWidth={4}/><Line d="M275 1326 L269 1445 M393 1326 L400 1445" width={6}/><g transform="translate(816 770)"><rect x="-58" y="-99" width="123" height="179" rx="60" fill="#364B60" stroke={P.metal} strokeWidth={5}/><g opacity=".58"><Duck x={0} y={8} s={.55}/></g><path d="M-38 -51 L18 -85" stroke={P.ink} strokeWidth={4}/></g></g>}
 {pend&&<><Pendulum t={t} x={198} y={738} shadow/><Pendulum t={t} x={398} y={775}/>{phase==='pendulum'&&<g fill={P.ink} fontSize="33" style={{fontFamily:'Cairo',direction:'rtl'}}><text x="247" y="760" textAnchor="middle">أريد</text><text x="538" y="760" textAnchor="middle">ماذا بعد؟</text></g>}</>}
 <Line d={`M${780+machineShift} 556 Q${740+machineShift} 858 ${threadEndX+slack} ${threadEndY-40} Q${threadEndX+slack*.7} ${threadEndY+slack} ${threadEndX} ${threadEndY}`} color={P.red} width={4}/>
 {phase==='art'&&<><path d={`M185 886 Q78 980 208 1031 Q334 1080 197 1147`} stroke={P.mint} strokeWidth={5} strokeDasharray="520" strokeDashoffset={k(t,[2.5,7.3],[520,0])} fill="none"/><circle cx="196" cy="1150" r={5+Math.sin(t*1.8)*1.4} fill={P.mint}/></>}
 <Hero x={hx} y={hy} lean={lean} face={face} left={l} right={r} foot={foot} bounce={bounce} gaze={gaze} mouth={mouth}/>
 {showSmall&&<Duck x={duckX} y={duckY} s={duckS} r={phase==='bored'&&t>2?Math.sin(t*2)*10:0}/>}
 {showMedium&&<Duck x={medX} y={medY} s={1.17} r={phase==='pile'?Math.sin(t*3)*6:0}/>}
 {showBig&&<Duck x={bigX} y={bigY} s={phase==='door'||phase==='end'?1.88:1.87} r={phase==='pile'?k(t,[3,4,5.2],[-8,15,0]):phase==='door'?Math.sin(t*6)*3:0}/>}
 <Claw x={clawX+machineShift} y={clawY} closed={closed}/><Button pressed={button}/>
 {phase==='hook'&&t>3.1&&t<4.65&&<circle cx={k(t,[3.1,4.25],[449,895])} cy={k(t,[3.1,3.7,4.25],[1185,1105,1166])} r="13" fill={P.mint} stroke={P.ink} strokeWidth={4}/>}
 {phase==='thread'&&t<1.9&&<g transform={`translate(${hx+90} ${hy-185}) rotate(${-18+Math.sin(t*4)*8})`}><Line d="M0 0 L35 -63 M0 0 L-25 -65" width={5}/><circle cx="-4" cy="10" r="11" fill="none" stroke={P.ink} strokeWidth={4}/><circle cx="16" cy="7" r="11" fill="none" stroke={P.ink} strokeWidth={4}/></g>}
 {phase==='thread'&&t>2&&<g><path d={`M${threadEndX} ${threadEndY} q34 -24 43 0 q-18 22 -43 0 q-23 -26 -36 0 q14 23 36 0`} stroke={P.red} strokeWidth={5} fill="none"/></g>}
 {phase==='art'&&t>2.5&&<Line d={`M${hx-162} ${hy-330+Math.sin(t*1.8)*23} L${hx-180} ${hy-355+Math.sin(t*1.8)*23}`} color={P.mint} width={8}/>}
 {phase==='effort'&&t>2.7&&t<3.7&&<Line d="M515 1130 L507 1110 M494 1143 L472 1140" color={P.red} width={4}/>}
 </g></svg></AbsoluteFill>;
};
