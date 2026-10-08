import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {loadFonts} from './fonts';
import timeline from '../timeline.json';
import {PrivacyReel,Hook,Refusal,Plans,Income,Wounds,Family,Good,Dreams,Close} from './Reel';
const props={fps:60,width:1080,height:1920};
const parts=[Hook,Refusal,Plans,Income,Wounds,Family,Good,Dreams,Close];
const names=['Hook','Refusal','Plans','Income','Wounds','Family','Good','Dreams','Close'];
const Root=()=>{loadFonts();return React.createElement(React.Fragment,null,
 React.createElement(Composition,{id:'PrivacyReel',component:PrivacyReel,durationInFrames:timeline.frames,...props}),
 ...parts.map((component,i)=>React.createElement(Composition,{key:names[i],id:names[i],component,durationInFrames:timeline.scenes[i].durationInFrames,...props}))
 );};
registerRoot(Root);
