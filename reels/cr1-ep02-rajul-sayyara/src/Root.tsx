import React from 'react';
import { AbsoluteFill, Composition, Still, useCurrentFrame } from 'remotion';
import { loadFonts } from './fonts';
import { Cover } from './Cover';
import { Episode, Reel } from './Film';
import { Lab, LabProps } from './Lab';
import { LONG, SHORT, hookBeats } from './programs';
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
    <Composition id="Episode16x9" component={Episode} fps={FPS} width={1920} height={1080} durationInFrames={Math.round(LONG.totalSeconds * FPS)} defaultProps={{ guides: false }} />
    <Composition id="Episode16x9Draft" component={Episode} fps={30} width={1920} height={1080} durationInFrames={Math.round(LONG.totalSeconds * 30)} defaultProps={{ guides: false }} />
    <Composition id="Reel9x16" component={Reel} fps={FPS} width={1080} height={1920} durationInFrames={Math.round(SHORT.totalSeconds * FPS)} defaultProps={{ ratio: '9x16' as Ratio, guides: false }} />
    <Composition id="Reel4x5" component={Reel} fps={FPS} width={1080} height={1350} durationInFrames={Math.round(SHORT.totalSeconds * FPS)} defaultProps={{ ratio: '4x5' as Ratio, guides: false }} />
    <Composition id="Reel9x16Draft" component={Reel} fps={30} width={1080} height={1920} durationInFrames={Math.round(SHORT.totalSeconds * 30)} defaultProps={{ ratio: '9x16' as Ratio, guides: false }} />
    <Composition id="Reel4x5Draft" component={Reel} fps={30} width={1080} height={1350} durationInFrames={Math.round(SHORT.totalSeconds * 30)} defaultProps={{ ratio: '4x5' as Ratio, guides: false }} />
    <Still id="Cover16x9" component={Cover} width={1920} height={1080} defaultProps={{ ratio: '16x9' as Ratio, guides: false }} />
    <Still id="Cover9x16" component={Cover} width={1080} height={1920} defaultProps={{ ratio: '9x16' as Ratio, guides: false }} />
    <Still id="Cover4x5" component={Cover} width={1080} height={1350} defaultProps={{ ratio: '4x5' as Ratio, guides: false }} />
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
