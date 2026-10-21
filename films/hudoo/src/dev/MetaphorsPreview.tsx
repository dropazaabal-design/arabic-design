import React from 'react';
import { AbsoluteFill, Composition, interpolate, useCurrentFrame } from 'remotion';
import { Lake } from '../kit/metaphors/Lake';
import { Pot } from '../kit/metaphors/Pot';

// Dev preview: one 5-second composition per metaphor, sweeping its progress props.
const FPS = 60;
const k = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
const use = () => { const f = useCurrentFrame(); return { f, t: f / FPS }; };

const LakeP: React.FC = () => { const { f, t } = use(); return <AbsoluteFill><Lake t={t} current={k(f, 20, 110)} cut={k(f, 60, 150)} boat={k(f, 150, 299)} /></AbsoluteFill>; };
const LakeStormP: React.FC = () => { const { f, t } = use(); return <AbsoluteFill><Lake t={t} current={0.6} cut={0} storm={k(f, 0, 200)} /></AbsoluteFill>; };

// boil up with the lid rattling → hands press → hands let go, knob down, flame down → lid tilts, steam leaves
const PotP: React.FC = () => {
  const { f, t } = use();
  const press = k(f, 80, 110) - k(f, 160, 185);
  return <AbsoluteFill><Pot t={t} boil={k(f, 0, 60) - 0.85 * k(f, 200, 290)} flame={1 - 0.85 * k(f, 185, 240)} press={press} knob={k(f, 175, 220)} steamOut={k(f, 230, 270)} /></AbsoluteFill>;
};

const comps: [string, React.FC][] = [['Lake', LakeP], ['LakeStorm', LakeStormP], ['Pot', PotP]];

export const MetaphorsPreview: React.FC = () => (
  <>{comps.map(([id, C]) => <Composition key={id} id={id} component={C} durationInFrames={300} fps={FPS} width={1920} height={1080} />)}</>
);
