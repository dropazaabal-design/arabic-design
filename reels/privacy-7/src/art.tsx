import React from 'react';
import {interpolate} from 'remotion';

export const C={ink:'#101827',blue:'#2E7BC5',red:'#E63946',green:'#10B981',paper:'#F4F5F2'};
export const clamp=(v:number)=>Math.max(0,Math.min(1,v));
export const ramp=(t:number,a:number,b:number)=>clamp((t-a)/(b-a));
export const ease=(t:number,a:number,b:number)=>{const p=ramp(t,a,b);return 1-(1-p)**3;};
// Same path-length convention as the preceding Fikra episode; no CSS animation.
const draw=(p:number)=>({pathLength:1,strokeDasharray:'1 1',strokeDashoffset:1-clamp(p)});
const pen={strokeWidth:8,strokeLinecap:'round' as const,strokeLinejoin:'round' as const,fill:'none'};
export const Line:React.FC<{d:string,p?:number,color?:string,width?:number}>=({d,p=1,color=C.ink,width=8})=><path d={d} {...pen} stroke={color} strokeWidth={width} {...draw(p)}/>;

export const Envelope:React.FC<{open?:number,color?:string}>=({open=0,color=C.paper})=><g>
  <path d={`M140 330 L400 ${330-open*185} L660 330`} fill={color} stroke={C.ink} strokeWidth="8" strokeLinejoin="round"/>
  <path d="M140 330 Q135 315 157 310 L643 310 Q665 312 660 335 L660 550 Q660 571 638 570 L162 570 Q140 570 140 550Z" fill={color} stroke={C.ink} strokeWidth="8"/>
  <Line d="M150 330 L400 485 L650 330" color={C.blue}/>
  <Line d="M150 557 L319 438 M650 557 L481 438" color={C.blue}/>
</g>;

export const HookArt:React.FC<{t:number}>=({t})=>{
 const shut=ease(t,.3,1.15), ink=C.paper, morph=ease(t,2.35,3.8);
 return <svg viewBox="0 0 800 700" width="100%" height="100%">
  <g opacity=".18" stroke={ink} strokeWidth="2"><circle cx="390" cy="344" r="276" fill="none"/><circle cx="390" cy="344" r="298" fill="none" strokeDasharray="7 17"/></g>
  {[0,1,2].map((n)=><g key={n} transform={`translate(${90+n*30+95*ramp(t,0,1)},${160+n*125}) rotate(${-15+n*14})`} opacity={1-ramp(t,.8,1.5)}><path d="M0 0 Q25 -40 65 0 Q90 35 46 62 L45 93" {...pen} stroke={C.red}/><circle cx="46" cy="115" r="5" fill={C.red}/></g>)}
  <g opacity={1-morph} transform={`translate(${interpolate(shut,[0,1],[65,0])},${110*morph})`}><rect x="210" y="85" width="360" height="490" rx="13" fill={C.blue} stroke={ink} strokeWidth="8"/><path d="M243 119 H539 V542 H244 Z" {...pen} stroke={ink} strokeWidth="4"/><circle cx="508" cy="347" r="13" fill={C.red}/><Line d="M205 587 H606" color={ink} p={shut}/></g>
  <g opacity={1-morph} transform={`translate(396 ${319+110*morph}) scale(${ease(t,.4,1.3)})`}><circle r="72" fill={C.ink} stroke={C.green} strokeWidth="7"/><Line d="M-30 2 L-8 27 L35 -27" color={C.green} p={ramp(t,.85,1.4)}/></g>
  <g opacity={morph} transform={`translate(0 ${-75+100*(1-morph)})`}><Envelope open={.4}/></g>
  {Array.from({length:7},(_,n)=>{const p=ease(t,1.45+n*.12,1.8+n*.12);return <circle key={n} cx={220+n*56} cy={625-24*Math.sin(p*Math.PI)} r={p*12} fill={n%2?C.blue:C.green}/>;})}
 </svg>;
};

export const RefusalArt:React.FC<{t:number}>=({t})=>{
 const fold=ease(t,.7,1.6), hit=ease(t,1.15,1.65);
 return <svg viewBox="0 0 800 700" width="100%" height="100%">
 <g transform={`translate(0 ${40*fold}) rotate(${-4+4*fold} 400 350)`}>
  <path d={`M205 80 H590 V${520-200*fold} L563 ${544-200*fold} L539 ${527-200*fold} L509 ${544-200*fold} L478 ${527-200*fold} L450 ${544-200*fold} L425 ${527-200*fold} L400 ${544-200*fold} L374 ${527-200*fold} L350 ${544-200*fold} L322 ${527-200*fold} L299 ${544-200*fold} L270 ${527-200*fold} L245 ${544-200*fold} L205 ${520-200*fold}Z`} fill={C.paper} stroke={C.ink} strokeWidth="8"/>
  {[0,1,2,3,4,5].map(n=><Line key={n} d={`M250 ${140+n*53} H${n%2?490:546}`} color={C.blue} p={1-fold} width={6}/>)}
 </g>
 <g transform={`translate(410 ${300+85*(1-hit)}) rotate(${-7+3*hit}) scale(${.85+.15*hit})`} opacity={hit}><circle r="127" fill={C.red} stroke={C.ink} strokeWidth="8"/><circle r="109" {...pen} stroke={C.paper} strokeWidth="3"/></g>
 <Line d="M117 539 Q400 630 677 539" color={C.green} p={ramp(t,2.25,3.15)} width={9}/>
 <Line d="M130 510 L117 539 L148 542 M650 542 L677 539 L663 510" color={C.green} p={ramp(t,2.7,3.3)}/>
 <g transform={`translate(590 496) scale(${ease(t,2.7,3.9)})`}><path d="M-84 -55 H70 Q87 -55 87 -38 V26 Q87 43 70 43 H0 L-43 74 V43 H-84 Q-99 43 -99 26 V-38 Q-99 -55 -84 -55Z" fill={C.green} stroke={C.ink} strokeWidth="6"/><Line d="M-55 -6 L-24 17 L31 -21" color={C.paper}/></g>
 </svg>;
};

export const PlanArt:React.FC<{t:number}>=({t})=><svg viewBox="0 0 800 700" width="100%" height="100%">
 <g transform="rotate(-6 390 330)"><rect x="190" y="120" width="421" height="449" rx="8" fill={C.paper} stroke={C.ink} strokeWidth="8"/><rect x="169" y="120" width="39" height="449" fill={C.blue} stroke={C.ink} strokeWidth="6"/>
 {[0,1,2,3,4].map(n=><Line key={n} d={`M155 ${165+n*80} H200`} width={8}/>)}
 <Line d="M270 447 Q275 250 415 340 T551 225" color={C.blue} p={ramp(t,.25,1.8)} width={10}/>
 {[0,1,2].map((n)=><circle key={n} cx={[270,415,552][n]} cy={[447,340,225][n]} r={14*ease(t,.5+n*.4,1+n*.4)} fill={C.red}/>)}
 </g>
 <g transform={`translate(588 458) scale(${ease(t,1.5,2.3)})`}><path d="M-64 25 H62 L43 118 H-46Z" fill={C.blue} stroke={C.ink} strokeWidth="7"/><Line d="M0 30 V-132" color={C.green} p={ramp(t,1.9,2.6)}/><path d="M0 -63 Q-85 -146 -85 -61 Q-67 -22 0 -63 M0 -96 Q90 -188 92 -97 Q71 -49 0 -96" fill={C.green} stroke={C.ink} strokeWidth="6"/></g>
 <Line d="M302 615 Q421 643 502 623" color={C.ink} width={4} p={ramp(t,3.0,3.8)}/>
</svg>;

export const IncomeArt:React.FC<{t:number}>=({t})=>{
 const hide=ease(t,1,2.5);
 return <svg viewBox="0 0 800 700" width="100%" height="100%">
 <g transform={`translate(0 ${235*hide}) rotate(${-7*(1-hide)} 400 250)`}><path d="M252 95 H548 V510 L525 490 L500 510 L477 490 L452 510 L427 490 L402 510 L377 490 L352 510 L327 490 L302 510 L277 490 L252 510Z" fill={C.paper} stroke={C.ink} strokeWidth="8"/>
  <circle cx="400" cy="178" r="43" fill={C.green}/><Line d="M377 170 H416 M382 187 H421 M400 144 V208" color={C.paper} width={7}/>
  {[0,1,2,3].map(n=><g key={n}><Line d={`M287 ${269+n*44} H435`} color={C.blue} width={5}/><circle cx="485" cy={269+n*44} r="7" fill={C.red}/></g>)}
 </g>
 <g transform="translate(0 100)"><Envelope color={C.paper}/></g>
 <g opacity={ease(t,2.2,2.8)} transform={`translate(${650-48*ease(t,2.2,2.8)},275)`}><circle r="54" fill={C.ink} stroke={C.green} strokeWidth="7"/><Line d="M-22 0 L-6 17 L27 -18" color={C.green} p={ramp(t,2.5,3.2)}/></g>
 </svg>;
};

export const HeartArt:React.FC<{t:number}>=({t})=>{
 const mend=ease(t,1.3,2.4);
 return <svg viewBox="0 0 800 700" width="100%" height="100%">
 <g transform={`translate(${-(1-mend)*15},0)`}><path d="M405 541 L215 350 C48 206 267 55 397 243 L422 308 L388 355 L417 402 L391 449Z" fill={C.red} stroke={C.paper} strokeWidth="8"/></g>
 <g transform={`translate(${(1-mend)*15},0)`}><path d="M405 541 L598 350 C759 209 539 50 397 243 L422 308 L388 355 L417 402 L391 449Z" fill={C.red} stroke={C.paper} strokeWidth="8"/></g>
 <g transform={`translate(400 363) rotate(-17) scale(${mend})`}><rect x="-162" y="-52" width="324" height="104" rx="49" fill={C.paper} stroke={C.ink} strokeWidth="7"/><rect x="-60" y="-45" width="120" height="90" rx="11" fill={C.green}/>{[-119,119].map(x=><g key={x}>{[-16,16].map(y=><circle key={y} cx={x} cy={y} r="4" fill={C.blue}/>)}</g>)}</g>
 <Line d="M205 539 Q402 641 604 539" color={C.green} p={ramp(t,2.7,3.7)} width={6}/>
 <Line d="M173 158 L146 135 M632 145 L662 113 M394 89 V54" color={C.paper} p={ramp(t,.2,.8)} width={5}/>
 <g transform={`translate(212 499) scale(${ease(t,2.5,3.9)})`}><path d="M-64 -58 H72 Q93 -58 93 -35 V28 Q93 49 73 49 H10 L-38 78 V49 H-64 Q-84 49 -84 28 V-35 Q-84 -58 -64 -58Z" fill={C.green} stroke={C.ink} strokeWidth="7"/><Line d="M-41 -12 H49 M-41 12 H24" color={C.paper} p={ramp(t,3.2,4.05)} width={7}/></g>
 </svg>;
};

export const FamilyArt:React.FC<{t:number}>=({t})=>{
 const calm=ease(t,1.6,2.6);
 return <svg viewBox="0 0 800 700" width="100%" height="100%">
 <path d="M202 335 L402 142 L602 335" {...pen} stroke={C.ink} strokeWidth="12" {...draw(ramp(t,0,.75))}/>
 <path d="M232 323 V568 H571 V323" fill={C.paper} stroke={C.ink} strokeWidth="9"/>
 <path d="M333 568 V395 Q400 341 467 395 V568" fill={C.green} stroke={C.ink} strokeWidth="7"/>
 <path d={`M333 568 V395 Q${400-45*ease(t,2.8,4)} 341 ${467-97*ease(t,2.8,4)} 395 V${568-20*ease(t,2.8,4)}Z`} fill={C.blue} stroke={C.ink} strokeWidth="7"/>
 <Line d={`M${421-70*ease(t,2.8,4)} 460 H${434-70*ease(t,2.8,4)}`} color={C.paper} width={8}/>
 <g opacity={1-calm}><Line d="M90 342 L162 367 L119 415 L198 432" color={C.red} p={ramp(t,.4,1.3)}/><Line d="M717 411 L639 382 L685 338 L611 314" color={C.red} p={ramp(t,.8,1.4)}/></g>
 <path d="M143 592 V269 Q400 -26 657 269 V592" {...pen} stroke={C.green} strokeWidth="7" strokeDasharray="13 15" opacity={ease(t,1.7,2.6)}/>
 <g transform={`translate(583 ${525-45*calm}) scale(${calm})`}><path d="M-97 -73 H76 Q94 -73 94 -49 V31 Q94 54 71 54 H-15 L-60 86 V54 H-97 Q-116 54 -116 31 V-49 Q-116 -73 -97 -73Z" fill={C.green} stroke={C.ink} strokeWidth="6"/><Line d="M-70 -9 L-35 17 L26 -29" color={C.paper}/></g>
 </svg>;
};

export const GiftArt:React.FC<{t:number}>=({t})=>{
 const lift=ease(t,.4,1.4);
 return <svg viewBox="0 0 800 700" width="100%" height="100%">
 <path d="M253 295 H546 V547 H253Z" fill={C.blue} stroke={C.paper} strokeWidth="8"/><path d="M372 293 H425 V547 H372Z" fill={C.red}/>
 <g transform={`translate(0 ${-80*lift}) rotate(${-8*lift} 400 294)`}><rect x="232" y="253" width="335" height="72" rx="6" fill={C.paper} stroke={C.ink} strokeWidth="8"/><path d="M372 253 H425 V325 H372Z" fill={C.red}/><path d="M400 249 C258 234 281 106 359 167 Q396 194 400 249 C420 125 523 131 507 190 Q483 231 400 249Z" fill={C.red} stroke={C.ink} strokeWidth="7"/></g>
 {[0,1,2,3,4].map(n=>{const p=ramp(t,1.1+n*.5,2.4+n*.5),a=(n-2)*.47;return <g key={n} transform={`translate(${400+Math.sin(a)*p*220} ${320-p*250}) scale(${Math.sin(p*Math.PI)*1.7})`}><path d="M0 29 C-71 -24 -19 -63 0 -21 C24 -63 71 -24 0 29Z" fill={C.green} stroke={C.ink} strokeWidth="4"/></g>;})}
 <Line d="M191 596 Q400 643 614 596" color={C.green} p={ramp(t,2.7,3.6)} width={5}/>
 </svg>;
};

export const DreamArt:React.FC<{t:number}>=({t})=>{
 const p=ease(t,.4,3.3), x=210+360*p,y=510-350*p;
 return <svg viewBox="0 0 800 700" width="100%" height="100%">
 <Line d="M184 546 Q219 445 326 413 T434 283 T594 144" color={C.paper} width={6} p={ramp(t,.1,3.2)}/>
 {[0,1,2,3].map(n=><circle key={n} cx={[145,654,219,598][n]} cy={[188,390,314,581][n]} r="6" fill={C.paper}/>)}
 <g transform={`translate(${x} ${y}) rotate(40)`}><path d="M0 -96 Q-84 -31 -55 92 H55 Q84 -31 0 -96Z" fill={C.paper} stroke={C.ink} strokeWidth="8"/><circle cy="-3" r="29" fill={C.blue} stroke={C.ink} strokeWidth="7"/><path d="M-54 32 L-90 87 L-90 116 L-48 82 M54 32 L90 87 L90 116 L48 82" fill={C.red} stroke={C.ink} strokeWidth="7"/><path d={`M-24 99 Q0 ${150+12*Math.sin(t*9)} 24 99`} fill={C.green} stroke={C.ink} strokeWidth="6"/></g>
 <g opacity={1-ramp(t,1.5,2.5)}><Line d="M96 431 L168 446 L142 474" color={C.red} p={ramp(t,.6,1)}/><Line d="M647 247 L571 269 L597 297" color={C.red} p={ramp(t,1,1.3)}/></g>
 <g transform={`translate(206 591) scale(${ease(t,2.5,3.3)})`}><circle r="55" fill={C.ink} stroke={C.green} strokeWidth="7"/><Line d="M-25 0 L-8 19 L30 -20" color={C.green}/></g>
 </svg>;
};

export const CloseArt:React.FC<{t:number}>=({t})=>{
 const card=ease(t,1.1,2.2),chosen=ease(t,3,4.9);
 return <svg viewBox="0 0 800 700" width="100%" height="100%">
 {Array.from({length:7},(_,n)=>{const p=ease(t,n*.1,.75+n*.1);return <g key={n} transform={`translate(${130+n*85+(400-(130+n*85))*p} ${110+170*p}) rotate(${(n-3)*12*(1-p)})`} opacity={1-p}><rect x="-29" y="-39" width="58" height="78" rx="6" fill={n%2?C.blue:C.green} stroke={C.paper} strokeWidth="4"/></g>;})}
 <g transform={`translate(${-100*chosen} ${-165*card-40*chosen})`} opacity={card}><rect x="269" y="251" width="260" height="225" rx="14" fill={C.green} stroke={C.ink} strokeWidth="8"/><circle cx="400" cy="333" r="43" fill={C.paper}/><Line d="M377 332 L394 348 L424 317" color={C.green} p={ramp(t,1.8,2.5)}/><Line d="M317 408 H482 M337 438 H462" color={C.paper} width={7} p={ramp(t,2.3,2.8)}/></g>
 <g transform={`translate(${75*chosen} ${54+20*chosen})`}><Envelope open={ease(t,.6,1.3)} color={C.paper}/></g>
 <g transform={`translate(570 203) scale(${chosen})`}><path d="M-85 -75 H75 Q102 -75 102 -49 V48 Q102 72 76 72 H-10 L-51 109 V72 H-85 Q-106 72 -106 48 V-49 Q-106 -75 -85 -75Z" fill={C.blue} stroke={C.paper} strokeWidth="7"/><Line d="M-61 -23 H56 M-61 7 H56 M-61 37 H20" color={C.paper} p={ramp(t,4.1,5.05)} width={7}/></g>
 <Line d="M159 643 Q399 677 640 643" color={C.green} p={ramp(t,2.7,3.6)} width={5}/>
 </svg>;
};
