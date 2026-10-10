import React from 'react';

// A single continuous stage. All coordinates are in the 1080 × 1920 master.
const C = {ink:'#091522', wall:'#14283A', floor:'#1B3345', blue:'#2E7BC5',
  red:'#E63946', paper:'#E8F2F0', skin:'#D9C5B3', green:'#4DA987', shadow:'#0A1826'};
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
const ease=(n:number)=>{const x=clamp(n);return x*x*(3-2*x)};
const p=(a:number,b:number,t:number)=>a+(b-a)*ease(t);
const phase=(t:number,a:number,b:number)=>ease((t-a)/(b-a));
const sw={stroke:C.ink,strokeWidth:7,strokeLinecap:'round' as const,strokeLinejoin:'round' as const};
const txt={fontFamily:'DejaVu Sans, sans-serif',direction:'rtl' as const,unicodeBidi:'isolate' as const};

const Label:React.FC<{x:number;y:number;size:number;children:string;color?:string;weight?:number}> =
  ({x,y,size,children,color=C.paper,weight=800})=><text x={x} y={y} fill={color} fontSize={size} fontWeight={weight} textAnchor="middle" style={txt}>{children}</text>;

const Cup:React.FC<{x:number;y:number;rot?:number;lid?:boolean}>=({x,y,rot=0,lid=true})=>
  <g transform={`translate(${x} ${y}) rotate(${rot})`}>
    <path d="M-37 -48 H34 L25 39 Q0 50 -28 39Z" fill={C.paper} {...sw}/>
    <path d="M-31 -22 H29" stroke={C.blue} strokeWidth="10"/>
    {lid&&<path d="M-44 -50 Q0 -69 42 -50 L41 -42 H-42Z" fill={C.red} {...sw}/>}
    <path d="M-8 -87 Q-19 -104 -4 -118 M11 -87 Q2 -105 18 -118" fill="none" stroke={C.paper} strokeWidth="4" opacity=".55"/>
  </g>;
const Bag:React.FC<{x:number;y:number;rot?:number}>=({x,y,rot=0})=>
  <g transform={`translate(${x} ${y}) rotate(${rot})`}>
    <path d="M-95 -44 Q-96 -72 -69 -73 H70 Q95 -70 96 -43 V62 Q96 79 73 79 H-72 Q-96 78 -96 60Z" fill={C.blue} {...sw}/>
    <path d="M-37 -75 V-94 Q-37 -108 -18 -108 H19 Q38 -108 38 -93 V-73" fill="none" stroke={C.paper} strokeWidth="11"/>
    <path d="M-92 -10 H93 M-54 -7 V30 H55 V-7" fill="none" stroke={C.paper} strokeWidth="5" opacity=".7"/>
    <path d="M-9 14 H10" stroke={C.red} strokeWidth="12" strokeLinecap="round"/>
  </g>;
const Plant:React.FC<{x:number;y:number;rot?:number}>=({x,y,rot=0})=>
  <g transform={`translate(${x} ${y}) rotate(${rot})`}>
    <path d="M0 1 V-101 M0 -48 Q-28 -108 -59 -107 M0 -64 Q35 -127 65 -130" fill="none" stroke={C.green} strokeWidth="10" strokeLinecap="round"/>
    <ellipse cx="-62" cy="-112" rx="39" ry="19" transform="rotate(25 -62 -112)" fill={C.green} {...sw}/>
    <ellipse cx="65" cy="-137" rx="40" ry="20" transform="rotate(-29 65 -137)" fill={C.green} {...sw}/>
    <ellipse cx="8" cy="-112" rx="34" ry="18" transform="rotate(-45 8 -112)" fill="#79C59C" {...sw}/>
    <path d="M-48 -10 H49 L34 69 H-34Z" fill={C.red} {...sw}/>
  </g>;

// The workers' faces change independently of the camera.
const Worker:React.FC<{t:number;fantasy:boolean}>=({t,fantasy})=>{
  const load=phase(t,2.8,7.1)*(1-phase(t,22.1,25.5));
  const weight=load*(t<17?1:.82);
  const dx=phase(t,0,1.7)*70-phase(t,2.2,3.5)*70+
    phase(t,25.5,31)*45 + phase(t,35.9,41)*225;
  const lean=weight*18 + (t>9.1&&t<17?8:0);
  const wobble=weight*Math.sin(t*14)*7;
  const y=1150+weight*42+Math.sin(t*(t>35.9?13:5))*(t>35.9?11:4);
  const smile=t<4.35?'easy':t<8.2?'strained':t<17.8?'fear':t<21.2?'firm':t<25.8?'relief':'soft';
  return <g transform={`translate(${360+dx+wobble} ${y}) rotate(${lean})`}>
    <ellipse cy="330" rx={120+weight*35} ry="22" fill={C.shadow} opacity=".75"/>
    <path d="M-55 167 L-68 321 M54 167 L62 321" stroke={C.ink} strokeWidth="39" strokeLinecap="round"/>
    <path d="M-55 167 L-68 321 M54 167 L62 321" stroke={C.blue} strokeWidth="26" strokeLinecap="round"/>
    <path d="M-100 322 H-28 M32 322 H99" stroke={C.ink} strokeWidth="28" strokeLinecap="round"/>
    <path d="M-103 322 H-27 M33 322 H99" stroke={C.paper} strokeWidth="16" strokeLinecap="round"/>
    <path d="M-101 -96 Q0 -140 103 -95 L84 158 Q0 181 -87 158Z" fill={C.blue} {...sw}/>
    <path d="M-99 -97 L-25 -70 L-4 15 L-77 145 M100 -95 L23 -69 L5 16 L80 146" fill="none" stroke="#70B1DF" strokeWidth="17"/>
    <path d="M-61 92 H-4 V147 H-62Z" fill="#256AA8" stroke={C.ink} strokeWidth="4"/>
    {/* The cup lid remains clipped to his pocket after the hand-off. */}
    {t>=3.35&&<path d="M-65 94 Q-33 81 -4 92 L-7 104 Q-35 110 -65 103Z" fill={C.red} stroke={C.ink} strokeWidth="5" opacity={t>40.9?1:.9}/>}
    <path d={weight>0.35?'M-88 -41 Q-178 0 -131 112':'M-88 -41 Q-133 23 -85 95'} fill="none" stroke={C.ink} strokeWidth="32" strokeLinecap="round"/>
    <path d={weight>0.35?'M-88 -41 Q-178 0 -131 112':'M-88 -41 Q-133 23 -85 95'} fill="none" stroke={C.skin} strokeWidth="20" strokeLinecap="round"/>
    <path d={weight>0.35?'M86 -42 Q167 12 148 102':'M86 -42 Q145 12 109 91'} fill="none" stroke={C.ink} strokeWidth="32" strokeLinecap="round"/>
    <path d={weight>0.35?'M86 -42 Q167 12 148 102':'M86 -42 Q145 12 109 91'} fill="none" stroke={C.skin} strokeWidth="20" strokeLinecap="round"/>
    <ellipse cy="-179" rx="82" ry="93" fill={C.skin} {...sw}/>
    <path d="M-79 -176 Q-84 -260 -23 -273 Q50 -282 80 -218 L80 -198 Q38 -217 11 -215 Q-41 -210 -76 -177Z" fill={C.ink}/>
    <ellipse cx="-30" cy="-174" rx="7" ry={smile==='fear'?13:8} fill={C.ink}/>
    <ellipse cx="32" cy="-174" rx="7" ry={smile==='fear'?13:8} fill={C.ink}/>
    {smile==='easy'?<path d="M-23 -130 Q0 -113 26 -130" fill="none" stroke={C.ink} strokeWidth="6" strokeLinecap="round"/>:
      smile==='strained'||smile==='fear'?<path d="M-16 -129 Q0 -139 17 -129" fill="none" stroke={C.ink} strokeWidth="6" strokeLinecap="round"/>:
      <path d="M-22 -132 Q0 -117 21 -132" fill="none" stroke={C.ink} strokeWidth="5" strokeLinecap="round"/>}
    {smile==='strained'||smile==='fear'?<path d="M-51 -199 L-14 -205 M14 -204 L51 -198" stroke={C.ink} strokeWidth="5" opacity=".85"/>:null}
    {fantasy&&<path d="M71 -151 l29 -20 m-37 40 l38 12" stroke={C.red} strokeWidth="5"/>}
    {t>=40.9&&<><path d="M-57 84 Q-15 52 11 85" fill="none" stroke={C.paper} strokeWidth="8"/>
      <path d="M-62 94 Q-32 24 -3 93" fill={C.red} stroke={C.ink} strokeWidth="5" opacity={phase(t,40.9,41.25)}/></>}
  </g>;
};

const Colleague:React.FC<{x:number;y:number;t:number;fantasy:boolean;shirt:string;mask?:boolean}>=({x,y,t,fantasy,shirt,mask=false})=>
  <g transform={`translate(${x} ${y})`}>
    <ellipse cy="288" rx="102" ry="19" fill={C.shadow}/>
    <path d="M-40 135 L-49 279 M39 135 L49 279" stroke={C.ink} strokeWidth="32" strokeLinecap="round"/>
    <path d="M-40 135 L-49 279 M39 135 L49 279" stroke={shirt} strokeWidth="20" strokeLinecap="round"/>
    <path d="M-85 -93 Q0 -119 85 -92 L73 134 Q0 151 -75 134Z" fill={shirt} {...sw}/>
    <path d="M-79 -57 Q-128 9 -94 59 M75 -58 Q127 7 100 54" fill="none" stroke={C.ink} strokeWidth="28" strokeLinecap="round"/>
    <path d="M-79 -57 Q-128 9 -94 59 M75 -58 Q127 7 100 54" fill="none" stroke={C.skin} strokeWidth="18" strokeLinecap="round"/>
    <ellipse cy="-169" rx={mask?112:68} ry={mask?130:77} fill={mask?C.paper:C.skin} {...sw}/>
    <path d="M-66 -189 Q-60 -252 15 -246 Q68 -237 66 -182 Q14 -210 -64 -184Z" fill={C.ink}/>
    {mask?<><path d="M-70 -194 L-18 -165 M17 -165 L70 -194" stroke={C.red} strokeWidth="14"/><path d="M-36 -117 Q0 -156 36 -117" stroke={C.red} strokeWidth="12" fill="none"/></>:
      <><circle cx="-25" cy="-168" r="6" fill={C.ink}/><circle cx="26" cy="-168" r="6" fill={C.ink}/><path d="M-22 -127 Q0 -109 22 -127" stroke={C.ink} strokeWidth="5" fill="none"/></>}
  </g>;

const CameraDesk:React.FC<{t:number}>=({t})=>{
  const moved=phase(t,22.5,25.7)*145;
  return <g transform={`translate(${770+moved} 1230)`}>
    <ellipse cx="80" cy="210" rx="220" ry="22" fill={C.shadow}/>
    <path d="M-142 -7 H230 V37 H-142Z" fill={C.blue} {...sw}/>
    <path d="M-104 37 L-113 205 M195 37 L205 205" stroke={C.ink} strokeWidth="22"/>
    <path d="M-37 -7 L-8 -158 H126 L153 -7" fill="none" stroke={C.paper} strokeWidth="10"/>
    <rect x="-43" y="-199" width="188" height="87" rx="12" fill={C.paper} {...sw}/>
    <circle cx="32" cy="-154" r="28" fill={C.blue} {...sw}/>
    <path d="M145 -181 L201 -206 V-118 L145 -144Z" fill={C.red} {...sw}/>
    <path d="M30 -199 L9 -241 H114 L92 -199" fill={C.paper} {...sw}/>
  </g>;
};

const Stage:React.FC<{t:number;cover?:boolean}>=({t,cover=false})=>{
  const fantasy=t>=12.55&&t<16.35;
  const blackout=phase(t,14.25,15.65);
  const returnLoad=1-phase(t,22.0,25.55);
  const cupTo=phase(t,2.1,3.45), bagTo=phase(t,3.7,5.3), plantTo=phase(t,5.42,7.02);
  const cupBack=phase(t,22.05,23.0), bagBack=phase(t,23.0,24.22), plantBack=phase(t,24.22,25.55);
  const cupIn=phase(t,0,1.7);
  const cx=p(p(p(p(1160,867,cupIn),230,cupTo),896,cupBack),700,phase(t,36.1,37.3)),
    cy=p(p(p(p(790,836,cupIn),1130,cupTo),847,cupBack),955,phase(t,36.1,37.3));
  const bx=p(p(886,480,bagTo),855,bagBack), by=p(p(1050,1270,bagTo),1170,bagBack);
  const px=p(p(915,430,plantTo),945,plantBack), py=p(p(890,900,plantTo),902,plantBack);
  const desire=phase(t,8.8,10.75);
  return <g>
    <path fill={fantasy?'#080F1F':C.wall} d="M0 0 H1080 V1920 H0Z"/>
    <path fill={fantasy?'#141629':C.floor} d="M0 1410 H1080 V1920 H0Z"/>
    <path d="M0 1410 H1080 M0 1580 H1080" stroke={fantasy?'#323043':'#35607B'} strokeWidth="5"/>
    {[120,510,990].map((x)=><path key={x} d={`M${x} 0 V145`} stroke={C.paper} strokeWidth="8" opacity=".5"/>)}
    {[120,510,990].map((x)=><g key={x} opacity={fantasy?1-blackout:.85}><ellipse cx={x} cy="181" rx="99" ry="35" fill={C.blue}/><path d={`M${x-48} 175 H${x+48}`} stroke={C.paper} strokeWidth="15" strokeLinecap="round"/></g>)}
    <path d="M-80 1350 L110 1210 M-80 1530 L130 1410" stroke={C.blue} strokeWidth="8" opacity=".5"/>
    {/* One fixed exit door with a readable clock beside it. */}
    <path d="M699 384 H1014 V1392 H699Z" fill={fantasy?'#172035':'#284459'} {...sw}/>
    <path d="M728 419 H986 V1364 H728Z" fill={fantasy?'#10172A':'#153E5E'} stroke={C.blue} strokeWidth="10"/>
    <circle cx="953" cy="927" r="16" fill={C.red} stroke={C.ink} strokeWidth="5"/>
    <path d="M1015 387 H1080 V1387 H1015" fill={C.ink}/>
    <circle cx="671" cy="443" r="68" fill={C.paper} {...sw}/>
    <path d="M671 443 V405 M671 443 L711 456" stroke={C.red} strokeWidth="8" strokeLinecap="round"/>
    <Label x={853} y={544} size={46}>خروج</Label>
    <CameraDesk t={t}/>
    <Colleague x={843} y={1106} t={t} fantasy={fantasy} shirt={C.red} mask={fantasy&&t>13.2}/>
    <Colleague x={1040} y={1270} t={t} fantasy={fantasy} shirt={C.green} mask={fantasy&&t>13.5}/>
    {desire>0&&t<12.5&&<path d={`M${867} 938 Q${700-desire*100} ${773-desire*70} ${565} 940`} fill="none" stroke={C.red} strokeWidth={10} strokeDasharray="24 22" opacity={desire}/>}
    <Worker t={t} fantasy={fantasy}/>
    {/* Every item travels through the same interpolated position on the outbound and return path. */}
    <Cup x={cx} y={cy+returnLoad*Math.sin(t*15)*4} rot={cupTo*13-cupBack*13} lid={t<3.35}/>
    {t>=3.5&&<Bag x={bx} y={by} rot={bagTo*19-bagBack*17}/>}
    {t>=5.2&&<Plant x={px} y={py} rot={plantTo*(-19+Math.sin(t*12)*6)+plantBack*19}/>}
    {fantasy&&<><rect width="1080" height="1920" fill="#080F1F" opacity={blackout*.7}/>
      <path d="M108 490 Q297 350 486 507 M595 597 Q814 358 1047 560" stroke={C.red} strokeWidth="11" fill="none" opacity=".5"/>
      {blackout>.55&&<path d="M0 1460 H1080" stroke={C.red} strokeWidth="7" opacity=".4"/>}
    </>}
    {t>=18.2&&t<21.15&&<g opacity={phase(t,18.2,18.45)}><path d="M235 600 Q400 525 541 595 L512 716 Q410 738 292 700Z" fill={C.paper} {...sw}/><Label x={392} y={677} size={72} color={C.red}>لا، اليوم ما أقدر</Label></g>}
    {t>=21.23&&t<23.2&&<g><path d="M668 699 Q796 636 934 697 L908 819 Q791 842 681 796Z" fill={C.paper} {...sw}/><Label x={790} y={775} size={74} color={C.blue}>تمام</Label></g>}
    {t>=31.6&&t<35.9&&<g opacity={phase(t,31.6,32)}><path d="M175 321 H910 V472 H175Z" fill={C.ink} opacity=".82"/><Label x={542} y={423} size={65}>السوسيوتروبية</Label></g>}
    {t>=26&&t<30.5&&<g opacity={(1-phase(t,29.1,30.5))*.65} transform={`translate(${560+phase(t,26,30)*145} ${642-phase(t,26,30)*120}) scale(${1-phase(t,26,30)*.6})`}>
      <path d="M-87 -66 Q0 -116 87 -66 L70 77 Q0 106 -70 77Z" fill="none" stroke={C.red} strokeWidth="12"/>
      <path d="M-57 -26 L-20 -6 M20 -6 L57 -26 M-30 52 Q0 15 30 52" fill="none" stroke={C.red} strokeWidth="11"/>
    </g>}
    {cover&&<><path d="M0 1307 H1080 V1582 H0Z" fill={C.ink} opacity=".94"/><Label x={540} y={1418} size={66}>قال «أكيد»… حتى اختفى</Label><Label x={540} y={1512} size={64} color="#8CC5EB">تحت الطلبات!</Label></>}
  </g>;
};

export const Frame:React.FC<{f:number;cover?:boolean}>=({f,cover=false})=>{
  const t=cover?10.3:f/30;
  const camera=cover?1.0:t<11.3?1:t<16.35?1.08:t<22.2?1.04:1;
  return <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
    <g transform={`translate(${(1-camera)*540} ${(1-camera)*900}) scale(${camera})`}><Stage t={t} cover={cover}/></g>
  </svg>;
};
