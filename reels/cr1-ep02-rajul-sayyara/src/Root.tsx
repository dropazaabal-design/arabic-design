import React from 'react';
import { AbsoluteFill, Composition, useCurrentFrame } from 'remotion';
import { loadFonts } from './fonts';
import { Lab, LabProps } from './Lab';
import { hookBeats } from './programs';
import { Hook } from './scenes/hook';
import { Shot, shotFrames } from './Shot';
import { SIZE, type Ratio } from './stage';
import { FPS } from './theme';

loadFonts();

const HookTest: React.FC<{ ratio: Ratio }> = ({ ratio }) => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{ background: '#000' }}><Hook f={f} b={hookBeats(ratio === '16x9' ? 'long' : 'short')} ratio={ratio} /></AbsoluteFill>;
};

export const Root: React.FC = () => (
  <>
    <Composition id="Lab" component={Lab} durationInFrames={120} fps={FPS} width={1920} height={1080} />
    <Composition id="LabProps" component={LabProps} durationInFrames={120} fps={FPS} width={1920} height={1080} />
    {(['16x9', '9x16', '4x5'] as Ratio[]).map((r) => (
      <Composition key={`s${r}`} id={`Shot${r}`} component={Shot} defaultProps={{ ratio: r }} durationInFrames={shotFrames(r)} fps={FPS} width={SIZE[r][0]} height={SIZE[r][1]} />
    ))}
    {(['16x9', '9x16', '4x5'] as Ratio[]).map((r) => (
      <Composition key={r} id={`Hook${r}`} component={HookTest} defaultProps={{ ratio: r }} durationInFrames={Math.round(FPS * 20)} fps={FPS} width={SIZE[r][0]} height={SIZE[r][1]} />
    ))}
  </>
);
