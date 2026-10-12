import React from 'react';
import {Composition} from 'remotion';
import {Smoke,FPS,DURATION_FRAMES} from './Smoke';
export const DemoRoot:React.FC=()=>(
 <Composition id="BaseeraMotionSmoke" component={Smoke}
  fps={FPS} width={1080} height={1920} durationInFrames={DURATION_FRAMES}/>
);
