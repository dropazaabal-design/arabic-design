import React from 'react';
import {Composition} from 'remotion';
import {Reel,Cover} from './reel';
export const Root:React.FC=()=> <>
  <Composition id="Reel" component={Reel} durationInFrames={1275} fps={30} width={1080} height={1920}/>
  <Composition id="Cover" component={Cover} durationInFrames={1} fps={30} width={1080} height={1920}/>
</>;
