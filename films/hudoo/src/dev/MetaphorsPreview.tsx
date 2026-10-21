import React from 'react';
import { AbsoluteFill, Composition, interpolate, useCurrentFrame } from 'remotion';
import { Doors, Gap, Lake, Loop, Plan, Pot, SingleDoor, Storm, Tree, Wave } from '../kit/metaphors';

// Dev preview: one 5-second composition per metaphor, sweeping its progress props.
const FPS = 60;
const k = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
const use = () => { const f = useCurrentFrame(); return { f, t: f / FPS }; };
const Fill: React.FC<{ children: React.ReactNode }> = ({ children }) => <AbsoluteFill>{children}</AbsoluteFill>;

// still lake → the current shows → the view cuts below the surface → the boat crosses, steered
const LakeP = () => { const { f, t } = use(); return <Fill><Lake t={t} current={k(f, 20, 110)} cut={k(f, 60, 150)} boat={k(f, 150, 299)} /></Fill>; };
const LakeStormP = () => { const { f, t } = use(); return <Fill><Lake t={t} current={0.6} cut={0} storm={k(f, 0, 200)} /></Fill>; };
// boil up with the lid rattling → hands press → hands let go, knob down, flame down → lid tilts, steam leaves
const PotP = () => {
  const { f, t } = use();
  return <Fill><Pot t={t} boil={k(f, 0, 60) - 0.85 * k(f, 200, 290)} flame={1 - 0.85 * k(f, 185, 240)} press={k(f, 80, 110) - k(f, 160, 185)} knob={k(f, 175, 220)} steamOut={k(f, 230, 270)} /></Fill>;
};
const DoorsP = () => { const { f, t } = use(); return <Fill><Doors t={t} open={[k(f, 30, 110), k(f, 110, 190), k(f, 190, 270)]} /></Fill>; };
const SingleDoorP = () => { const { f, t } = use(); return <Fill><SingleDoor t={t} knock={f < 20 ? 1 : k(f, 20, 140)} open={k(f, 170, 260)} /></Fill>; };
const TreeP = () => { const { f, t } = use(); return <Fill><Tree t={t} wind={k(f, 0, 90)} roots={k(f, 150, 280)} /></Fill>; };
const WaveP = () => { const { f, t } = use(); return <Fill><Wave t={t} phase={k(f, 0, 299)} size={1} /></Fill>; };
// pulse goes round once, then the doorways appear
const LoopP = () => { const { f, t } = use(); return <Fill><Loop t={t} active={k(f, 0, 200) * 3} entries={k(f, 200, 290)} /></Fill>; };
const StormP = () => { const { f, t } = use(); return <Fill><Storm t={t} intensity={k(f, 0, 240)} /></Fill>; };
const PlanP = () => { const { f, t } = use(); return <Fill><Plan t={t} written={k(f, 0, 280)} /></Fill>; };
const GapP = () => { const { f, t } = use(); return <Fill><Gap t={t} open={k(f, 20, 260)} /></Fill>; };

const comps: [string, React.FC][] = [
  ['Lake', LakeP], ['LakeStorm', LakeStormP], ['Pot', PotP], ['Doors', DoorsP], ['SingleDoor', SingleDoorP], ['Tree', TreeP],
  ['Wave', WaveP], ['Loop', LoopP], ['Storm', StormP], ['Plan', PlanP], ['Gap', GapP],
];

export const MetaphorsPreview: React.FC = () => (
  <>{comps.map(([id, C]) => <Composition key={id} id={id} component={C} durationInFrames={300} fps={FPS} width={1920} height={1080} />)}</>
);
