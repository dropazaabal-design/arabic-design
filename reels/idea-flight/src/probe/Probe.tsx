import React from 'react';
import { AbsoluteFill, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { DrawPath, GsapCamera, RiveActor, alongPath, clock, popIn, scribbleLoop, useGsapTimeline } from '@motion/index';

// Render-test probes (tools/render-tests.mjs). Probe uses every layer of the motion stack at once — a GSAP camera,
// a GSAP pop on HTML, a drawn path, an object on a motion path, a Rive state machine with a scheduled input — so a
// still at second t must be identical at 30 and 60 fps and identical whatever order the frames are rendered in.
const PATH = 'M60 420 C160 120 380 120 480 420';
const LOOP = scribbleLoop(270, 140, 150, 50, { seed: 5 });

export const Probe: React.FC = () => {
  const { t } = clock(useCurrentFrame(), useVideoConfig().fps);
  const p = Math.min(1, t / 2.5);
  const dot = alongPath(PATH, p);
  const scope = useGsapTimeline<HTMLDivElement>(({ timeline, selector }) => { popIn(timeline, selector('.chip'), 0.8, { dur: 0.6, transformOrigin: '50% 50%' }); });
  return (
    <AbsoluteFill style={{ background: '#2F4A66' }}>
      <svg width={540} height={540} style={{ position: 'absolute' }}>
        <GsapCamera width={540} height={540} start={{ cx: 270, cy: 270, zoom: 1 }} moves={[{ at: 0.5, dur: 1.5, cx: 300, cy: 260, zoom: 1.2, ease: 'power2.inOut' }]}>
          <rect x={-200} y={-200} width={940} height={940} fill="#2F4A66" />
          <DrawPath d={PATH} p={p} stroke="#FFC845" strokeWidth={10} />
          <DrawPath d={LOOP} p={Math.min(1, t / 1.5)} stroke="#FFF8EA" strokeWidth={6} />
          <circle cx={dot.x} cy={dot.y} r={22} fill="#E63946" />
          <foreignObject x={170} y={200} width={200} height={200}>
            <RiveActor src={staticFile('rive/birb.riv')} artboard="birb" stateMachine="birb" inputs={[{ at: 1.0, name: 'look up' }]} width={200} height={200} />
          </foreignObject>
        </GsapCamera>
      </svg>
      <div ref={scope} style={{ position: 'absolute', top: 24, width: '100%', textAlign: 'center' }}>
        <span className="chip" style={{ display: 'inline-block', background: '#FFC845', padding: '6px 24px', borderRadius: 20, fontSize: 40, fontWeight: 900, direction: 'rtl', opacity: 0 }}>فكرة</span>
      </div>
    </AbsoluteFill>
  );
};

/** A missing .riv with a fallback: must render the fallback (a solid red square), not fail and not stay blank. */
export const RiveFallbackProbe: React.FC = () => (
  <AbsoluteFill style={{ background: '#000' }}>
    <RiveActor src={staticFile('rive/does-not-exist.riv')} width={240} height={240} fallback={<div style={{ width: 240, height: 240, background: '#FF0000' }} />} />
  </AbsoluteFill>
);

/** The same .riv without a fallback: a missing file must fail the render (no silent blank character). */
export const RiveMissingProbe: React.FC = () => (
  <AbsoluteFill style={{ background: '#000' }}>
    <RiveActor src={staticFile('rive/does-not-exist.riv')} width={240} height={240} />
  </AbsoluteFill>
);

/** The bird alone on black at t (state machine with an input): the Rive layer really draws. */
export const RiveProbe: React.FC = () => (
  <AbsoluteFill style={{ background: '#000' }}>
    <RiveActor src={staticFile('rive/birb.riv')} artboard="birb" stateMachine="birb" inputs={[{ at: 0.5, name: 'look up' }]} width={240} height={240} />
  </AbsoluteFill>
);
