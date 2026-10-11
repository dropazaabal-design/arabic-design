import React from 'react';
import {interpolate} from 'remotion';
export const P={ink:'#D7DFDB',dark:'#111B28',blue:'#2E7BC5',red:'#E63946',mint:'#79B6AE',metal:'#566D7D',skin:'#EEE7DA'};
export const k=(t:number,ts:number[],vs:number[])=>interpolate(t,ts,vs,{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
export const Line=({d,color=P.ink,width=6,opacity=1}:{d:string;color?:string;width?:number;opacity?:number})=><path d={d} stroke={color} strokeWidth={width} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={opacity}/>;
export const Duck=({x,y,s=1,r=0,color=P.blue}:{x:number;y:number;s?:number;r?:number;color?:string})=><g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`} stroke={P.ink} strokeWidth={5} strokeLinejoin="round"><ellipse cx="0" cy="9" rx="77" ry="53" fill={color}/><path d="M-64 8 Q-108 -43 -91 -42 Q-60 -13 -32 -32" fill={color}/><circle cx="53" cy="-45" r="42" fill={color}/><path d="M85 -47 L130 -31 L87 -18Z" fill={P.mint}/><ellipse cx="9" cy="14" rx="37" ry="21" fill="#2866A1"/><circle cx="63" cy="-57" r="5" stroke="none" fill={P.dark}/><path d="M31 -88 Q43 -111 57 -88 Q74 -104 76 -82" fill="none"/><path d="M-51 52 L47 52" stroke="#162637" strokeWidth="8"/></g>;
export type Pose={x?:number;y?:number;s?:number;lean?:number;face?:string;gaze?:number;left?:[number,number];right?:[number,number];foot?:number;bounce?:number;mouth?:number};
export const Hero=({x=330,y=1430,s=1,lean=0,face='want',gaze=1,left=[-78,-142],right=[95,-202],foot=0,bounce=0,mouth=0}:Pose)=>{
 const eyes=face==='bored'?.28:face==='calm'?.6:1;const smile=face==='happy'||face==='calm';
 const arm=(a:[number,number],sx:number)=> <g><Line d={`M${sx} -231 Q${sx+a[0]*.3} ${-210+(a[1]+210)*.3} ${a[0]} ${a[1]}`} width={17} color={P.dark}/><Line d={`M${sx} -231 Q${sx+a[0]*.3} ${-210+(a[1]+210)*.3} ${a[0]} ${a[1]}`} width={8} color={P.mint}/><circle cx={a[0]} cy={a[1]} r={13} fill={P.skin} stroke={P.ink} strokeWidth={4}/></g>;
 return <g transform={`translate(${x} ${y+bounce}) scale(${s}) rotate(${lean})`}>
 <ellipse cx="0" cy="9" rx="99" ry="15" fill="#050B12" opacity=".4"/>
 <Line d="M-30 -103 Q-48 -64 -47 -17" width={20} color={P.dark}/><Line d="M-30 -103 Q-48 -64 -47 -17" width={9} color={P.ink}/>
 <Line d={`M30 -103 Q${56+foot*.55} -67 ${49+foot} -17`} width={20} color={P.dark}/><Line d={`M30 -103 Q${56+foot*.55} -67 ${49+foot} -17`} width={9} color={P.ink}/>
 <path d="M-71 -21 Q-92 -6 -56 0 L-31 0 L-32 -20Z" fill={P.red} stroke={P.ink} strokeWidth={4}/><path d={`M${28+foot} -21 Q${27+foot} -3 ${51+foot} 0 L${85+foot} 0 Q${98+foot} -16 ${61+foot} -22Z`} fill={P.red} stroke={P.ink} strokeWidth={4}/>
 {arm(left,-47)}{arm(right,47)}
 <path d="M-45 -256 Q-62 -248 -58 -210 L-49 -110 Q0 -93 51 -110 L57 -215 Q61 -250 42 -256Z" fill={P.mint} stroke={P.ink} strokeWidth={5}/>
 <Line d="M-44 -167 Q-8 -149 47 -166" width={4} color="#314F55"/><Line d="M-6 -247 L-6 -110" width={3} color="#3E7474"/><circle cx="7" cy="-211" r="4" fill={P.ink}/><circle cx="7" cy="-187" r="4" fill={P.ink}/>
 <path d="M-18 -254 L-17 -282 L22 -282 L22 -254" fill={P.skin} stroke={P.ink} strokeWidth={4}/>
 <g transform={`translate(0 -340) rotate(${face==='bored'?-8:face==='shock'?6:0})`}>
 <ellipse cx="0" cy="0" rx="69" ry="73" fill={P.skin} stroke={P.ink} strokeWidth={5}/><circle cx="-68" cy="8" r="12" fill={P.skin} stroke={P.ink} strokeWidth={4}/>
 <path d="M-61 -35 Q-74 -70 -42 -72 Q-7 -85 37 -60 L58 -37 Q28 -55 -8 -49 Q-33 -58 -61 -35" fill={P.dark} stroke={P.ink} strokeWidth={4}/><Line d="M-10 -70 Q16 -108 32 -83 Q32 -57 6 -73" width={4}/>
 <g transform={`translate(-23 -8) scale(1 ${eyes})`}><ellipse rx="12" ry="18" fill={P.dark}/><circle cx={gaze*4} cy="-3" r="4" fill={P.ink}/></g><g transform={`translate(27 -8) scale(1 ${eyes})`}><ellipse rx="12" ry="18" fill={P.dark}/><circle cx={gaze*4} cy="-3" r="4" fill={P.ink}/></g>
 <Line d={face==='shock'?'M-39 -37 L-14 -46 M16 -45 L40 -35':face==='bored'?'M-36 -30 L-12 -29 M16 -28 L40 -26':'M-38 -33 Q-26 -45 -14 -36 M16 -36 Q30 -45 42 -34'} color={P.dark} width={4}/>
 <Line d="M10 0 L17 15 L5 17" color="#987D78" width={3}/>
 {mouth>0?<ellipse cx="8" cy="38" rx={9+mouth*5} ry={4+mouth*8} fill={P.dark}/>:<Line d={smile?'M-17 31 Q6 56 32 30':face==='shock'?'M-7 36 Q9 22 24 36':'M-13 37 Q10 32 27 37'} color={P.dark} width={4}/>}
 {face==='strain'&&<><path d="M64 -30 Q92 -7 76 0 Q61 -7 64 -30" fill={P.blue}/><Line d="M-83 -32 L-101 -46 M-84 -12 L-107 -10" color={P.red} width={4}/></>}
 </g>
 </g>;
};
export const Claw=({x,y,closed=0}:{x:number;y:number;closed?:number})=><g stroke={P.ink} strokeWidth={6} fill="none" strokeLinecap="round"><path d={`M${x} 555 L${x} ${y-35}`} stroke={P.metal}/><path d={`M${x-30} ${y-25} L${x+30} ${y-25} L${x+25} ${y+2} L${x-25} ${y+2}Z`} fill={P.metal}/><path d={`M${x-22} ${y} L${x-52+closed*28} ${y+57} L${x-20+closed*18} ${y+87} M${x+22} ${y} L${x+52-closed*28} ${y+57} L${x+20-closed*18} ${y+87}`}/></g>;
export const Machine=({t,shift=0,button=0}:{t:number;shift?:number;button?:number})=><g transform={`translate(${shift} 0)`}>
 <rect x="594" y="424" width="371" height="928" rx="38" fill="#233340" stroke={P.ink} strokeWidth={6}/>
 <rect x="616" y="534" width="327" height="604" rx="18" fill="#152838" stroke={P.metal} strokeWidth={5}/>
 <path d="M630 550 L920 550" stroke={P.mint} strokeWidth={12}/><path d="M636 563 L636 1100" stroke="#92B9C8" strokeWidth={5} opacity=".35"/>
 <path d="M645 1070 L729 831 M675 1075 L839 592" stroke="#BAD1DA" strokeWidth={8} opacity=".045"/>
 <text x="780" y="493" textAnchor="middle" fill={P.ink} fontSize="41" style={{fontFamily:'Cairo',direction:'rtl'}}>آلة الأمنية</text>
 <rect x="711" y="1193" width="152" height="126" rx="17" fill="#07131E" stroke={P.metal} strokeWidth={5}/><path d="M722 1207 L853 1207 L838 1261 L735 1261Z" fill="#142331"/>
 <rect x="536" y="1140" width="428" height="64" rx="23" fill={P.metal} stroke={P.ink} strokeWidth={5}/><ellipse cx="605" cy={1147+button*6} rx="38" ry="14" fill={button?P.red:P.blue} stroke={P.ink} strokeWidth={4}/><Line d="M685 1140 L695 1114" width={8}/><circle cx="695" cy="1104" r="15" fill={P.red} stroke={P.ink} strokeWidth={4}/>
 <path d="M867 1166 L912 1166" stroke={P.dark} strokeWidth={8}/><circle cx="642" cy="1379" r="27" fill={P.dark} stroke={P.metal} strokeWidth={7}/><circle cx="914" cy="1379" r="27" fill={P.dark} stroke={P.metal} strokeWidth={7}/><path d={`M630 ${1377+Math.sin(t*6)*8} L654 ${1381-Math.sin(t*6)*8}`} stroke={P.ink} strokeWidth={3}/>
 </g>;
export const Button=({pressed=false}:{pressed?:boolean})=><g><path d="M530 1434 L610 1434 L595 1396 L545 1396Z" fill={P.metal} stroke={P.ink} strokeWidth={4}/><ellipse cx="570" cy={1392+(pressed?10:0)} rx="30" ry="10" fill={P.red} stroke={P.ink} strokeWidth={4}/><text x="570" y="1496" fontSize="27" textAnchor="middle" fill={P.ink} style={{fontFamily:'Cairo',direction:'rtl'}}>جولة أخرى</text></g>;
export const Room=({t}:{t:number})=><>
 <defs><radialGradient id="room"><stop stopColor="#263D50"/><stop offset="1" stopColor="#0E1622"/></radialGradient><pattern id="hatch" width="28" height="28" patternUnits="userSpaceOnUse"><path d="M1 28 L28 1" stroke="#B5C6CF" strokeWidth="1" opacity=".035"/></pattern></defs>
 <rect width="1080" height="1920" fill="url(#room)"/><rect width="1080" height="1920" fill="url(#hatch)"/>
 <Line d="M20 1450 Q510 1442 1060 1450" color="#698496" width={4}/><path d="M0 1454 L1080 1454 L1080 1920 L0 1920" fill="#152330" opacity=".7"/>
 {[0,1,2,3,4].map(i=><path key={i} d={`M${150+i*190} 1452 L${-380+i*360} 1920`} stroke="#394C5C" strokeWidth={2}/>)}
 <rect x="53" y="572" width="197" height="863" rx="90" fill="#101C28" stroke="#425968" strokeWidth={6}/><path d="M70 1420 L70 690 Q70 601 148 590" stroke="#62798A" strokeWidth={3} fill="none"/><circle cx="209" cy="1048" r="8" fill={P.mint}/>
 <path d="M310 255 L750 255 L711 307 L350 307Z" fill="#304C5A" stroke="#71848B" strokeWidth={3}/><path d="M384 306 L674 306" stroke={P.mint} strokeWidth={8}/><path d="M402 310 L263 1400 L810 1400 L654 310Z" fill={P.mint} opacity=".025"/>
 <circle cx="1005" cy="1060" r="5" fill={P.red} opacity={.45+.1*Math.sin(t*1.5)}/>
 </>;
export const Pendulum=({t,x=386,y=620,shadow=false}:{t:number;x?:number;y?:number;shadow?:boolean})=>{const a=Math.sin(t*2.8)*38;return <g transform={`translate(${x} ${y}) rotate(${a})`} opacity={shadow?.23:1}><Line d="M0 0 L0 227" color={shadow?'#03090F':P.metal} width={shadow?18:9}/><circle cy="238" r={shadow?38:28} fill={shadow?'#03090F':P.red} stroke={shadow?'#03090F':P.ink} strokeWidth={4}/><circle r="12" fill={shadow?'#03090F':P.mint}/></g>};
