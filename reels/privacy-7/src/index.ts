import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {loadFonts} from './fonts';
import {PrivacyReel,Hook,Refusal,Plans,Income,Wounds,Family,Good,Dreams,Close} from './Reel';
const props={fps:60,width:1080,height:1920};
const Root=()=>{loadFonts();return React.createElement(React.Fragment,null,
 React.createElement(Composition,{id:'PrivacyReel',component:PrivacyReel,durationInFrames:2520,...props}),
 React.createElement(Composition,{id:'Hook',component:Hook,durationInFrames:240,...props}),
 React.createElement(Composition,{id:'Refusal',component:Refusal,durationInFrames:270,...props}),
 React.createElement(Composition,{id:'Plans',component:Plans,durationInFrames:270,...props}),
 React.createElement(Composition,{id:'Income',component:Income,durationInFrames:270,...props}),
 React.createElement(Composition,{id:'Wounds',component:Wounds,durationInFrames:270,...props}),
 React.createElement(Composition,{id:'Family',component:Family,durationInFrames:270,...props}),
 React.createElement(Composition,{id:'Good',component:Good,durationInFrames:270,...props}),
 React.createElement(Composition,{id:'Dreams',component:Dreams,durationInFrames:270,...props}),
 React.createElement(Composition,{id:'Close',component:Close,durationInFrames:390,...props})
 );};
registerRoot(Root);
