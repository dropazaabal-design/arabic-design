import React from 'react';
import { Composition } from 'remotion';
import timeline from '../../timeline.json';
import { Probe, RiveFallbackProbe, RiveMissingProbe, RiveProbe } from '../probe/Probe';
import { Reel } from './Reel';

const SECONDS = timeline.totalSeconds;
// The reel at 60 fps (timeline.json); the cover is its frame 744 (12.4 s: the lit room and the title). Reel30 is the same scene at 30 fps — tools/render-tests.mjs renders both and
// requires the same picture at the same second. The probes exist for the render tests only.
export const Root: React.FC = () => (
  <>
    <Composition id="Reel" component={Reel} durationInFrames={timeline.durationInFrames} fps={timeline.fps} width={1080} height={1920} />
    <Composition id="Reel30" component={Reel} durationInFrames={Math.round(SECONDS * 30)} fps={30} width={1080} height={1920} />
    <Composition id="Probe" component={Probe} durationInFrames={180} fps={60} width={540} height={540} />
    <Composition id="Probe30" component={Probe} durationInFrames={90} fps={30} width={540} height={540} />
    <Composition id="RiveFallbackProbe" component={RiveFallbackProbe} durationInFrames={10} fps={60} width={240} height={240} />
    <Composition id="RiveMissingProbe" component={RiveMissingProbe} durationInFrames={10} fps={60} width={240} height={240} />
    <Composition id="RiveProbe" component={RiveProbe} durationInFrames={120} fps={60} width={240} height={240} />
  </>
);
