import React from 'react';
import { AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame } from 'remotion';
import { BUCKET, BubbleShape, CUP, Check, Crab, Ladder, Lock, MotionLines, RedClaw, Steam, TalkDots, VesselBack, VesselFront, Wrench, lerpShape } from './art';
import { BODY_FONT, TITLE_FONT, loadFonts } from './fonts';
import { C, H, SAFE, W } from './theme';
import { TL, ease, mix, prog, sceneStart, sec, segAt, segStart } from './time';

loadFonts();

// ---------------------------------------------------------------------------
// Text. Words are laid out by the browser, RTL; motion is per line, never per letter.
// `*…*` marks the accent words; the split falls on spaces, so joining is untouched.
// ---------------------------------------------------------------------------
const Rich: React.FC<{ text: string; accent: string }> = ({ text, accent }) => (
  <>
    {text.split(/(\*[^*]+\*)/).filter(Boolean).map((part, i) =>
      part.startsWith('*') ? <span key={i} style={{ color: accent }}>{part.slice(1, -1)}</span> : <span key={i}>{part}</span>,
    )}
  </>
);

const Title: React.FC<{ text: string; from: number; to: number; size?: number; accent?: string; top?: number }> = ({ text, from, to, size = 104, accent = C.red, top = 190 }) => {
  const f = useCurrentFrame();
  if (f < from - 1 || f > to + 1) return null;
  const pin = from === 0 ? 1 : prog(f, from, 12, ease.out);
  const pout = prog(f, to - 8, 8, ease.in);
  return (
    <div dir="rtl" lang="ar" style={{
      position: 'absolute', top, left: SAFE.left, right: SAFE.right, textAlign: 'center',
      fontFamily: TITLE_FONT, fontWeight: 900, fontSize: size, lineHeight: 1.22, color: C.ivory,
      opacity: Math.min(pin, 1 - pout), transform: `translateY(${(1 - pin) * 40 - pout * 30}px)`,
      textShadow: `0 6px 0 ${C.bgDeep}`,
    }}>
      <Rich text={text} accent={accent} />
    </div>
  );
};

const Caption: React.FC<{ text: string; from: number; to: number; top: number; size?: number; color?: string; bg?: string; weight?: number }> = ({ text, from, to, top, size = 58, color = C.ivory, bg, weight = 700 }) => {
  const f = useCurrentFrame();
  if (f < from - 1 || f > to + 1) return null;
  const pin = prog(f, from, 10, ease.out);
  const op = Math.min(pin, 1 - prog(f, to - 8, 8, ease.in));
  return (
    <div style={{ position: 'absolute', top, left: SAFE.left, right: SAFE.right, display: 'flex', justifyContent: 'center', opacity: op, transform: `translateY(${(1 - pin) * 24}px)` }}>
      <div dir="rtl" lang="ar" style={{ fontFamily: BODY_FONT, fontWeight: weight, fontSize: size, lineHeight: 1.3, color, background: bg, padding: bg ? '14px 38px 18px' : 0, borderRadius: 999, textAlign: 'center' }}>
        <Rich text={text} accent={C.blueSoft} />
      </div>
    </div>
  );
};

/** Words placed at a point of the world (camera is identity in scenes 4–7). */
const Words: React.FC<{ text: string; x: number; y: number; w: number; size: number; opacity: number; scale?: number; rot?: number; color?: string; weight?: number; font?: string }> = ({ text, x, y, w, size, opacity, scale = 1, rot = 0, color = C.ivory, weight = 700, font = BODY_FONT }) => (
  <div dir="rtl" lang="ar" style={{
    position: 'absolute', left: x - w / 2, top: y, width: w, transform: `translateY(-50%) rotate(${rot}deg) scale(${scale})`,
    textAlign: 'center', fontFamily: font, fontWeight: weight, fontSize: size, lineHeight: 1.25, color, opacity,
  }}>{text}</div>
);

// ---------------------------------------------------------------------------
// Frames of every beat, from the measured voice.
// ---------------------------------------------------------------------------
const F = {
  s2: sceneStart(2), s3: sceneStart(3), s4: sceneStart(4), s5: sceneStart(5),
  s6: sceneStart(6), s7: sceneStart(7), s8: sceneStart(8), end: TL.durationInFrames,
};
const B = {
  hookGrab: 22, hookYank: 36,
  s3climb: F.s3 + 4, s3grab: F.s3 + sec(0.9), s3yank: F.s3 + sec(1.25), s3name: segStart('s3b'),
  s4bubble: segAt('s4', 0.52), s4slam: segAt('s4', 0.52) + 20,
  s5bubble: segAt('s5', 0.5), s5hit: segAt('s5', 0.5) + 12,
  s6fix: segStart('s6b') + 4, s6pull: segStart('s6c') + 2,
  a: segStart('s7a'), b: segStart('s7b'), c: segStart('s7c'), d: segStart('s7d'),
  s8: segStart('s8'),
};

const SFX: Array<[string, number, number]> = [
  ['snap', B.hookGrab + 9, 0.45], ['whoosh', B.hookYank - 2, 0.35],
  ['whoosh', F.s2, 0.25], ['pop', F.s2 + 40, 0.25],
  ['snap', B.s3grab + 8, 0.45], ['whoosh', B.s3yank - 2, 0.35], ['pop', B.s3name, 0.3],
  ['whoosh', F.s4, 0.3], ['pop', B.s4bubble, 0.35], ['thud', B.s4slam, 0.55],
  ['pop', B.s5bubble, 0.3], ['thud', B.s5hit, 0.55],
  ['tick', B.s6fix + 22, 0.45], ['snap', B.s6pull + 10, 0.4], ['whoosh', B.s6pull + 12, 0.3],
  ['thud', B.a + 22, 0.4], ['tick', B.a + 40, 0.45], ['pop', B.b + 24, 0.3], ['tick', B.b + 36, 0.45], ['tick', B.c + 30, 0.45],
  ['whoosh', F.s8 + 4, 0.25], ['snap', B.s8 + 50, 0.4], ['pop', B.s8 + 72, 0.35],
];

// ---------------------------------------------------------------------------
// Camera: zoom on the rim (1), pull out (2), steady (3), identity (4–7), back (8).
// ---------------------------------------------------------------------------
const camera = (f: number) => {
  const close = { k: 1.62, cy: 930 };
  const wide = { k: 1.25, cy: 1060 };
  if (f < F.s2) return { k: mix(close.k, close.k + 0.08, prog(f, 0, F.s2, ease.inOut)), cy: close.cy };
  if (f < F.s3) { const p = prog(f, F.s2, 36, ease.inOut); return { k: mix(close.k + 0.08, wide.k, p), cy: mix(close.cy, wide.cy, p) }; }
  if (f < F.s4) return { k: mix(wide.k, wide.k + 0.06, prog(f, B.s3name, 40, ease.inOut)), cy: wide.cy };
  if (f < F.s8) { const p = prog(f, F.s4, 20, ease.inOut); return { k: mix(wide.k + 0.06, 1, p), cy: mix(wide.cy, H / 2, p) }; }
  const p = prog(f, F.s8, 16, ease.inOut);
  return { k: 1, cy: mix(H / 2, 1000, p) };
};

// ---------------------------------------------------------------------------
// The world.
// ---------------------------------------------------------------------------
const World: React.FC = () => {
  const f = useCurrentFrame();
  const cam = camera(f);
  const seed = (Math.floor(f / 4) % 3) + 2;
  const camT = `translate(${W / 2} ${H / 2}) scale(${cam.k}) translate(${-W / 2} ${-cam.cy})`;

  // ---- vessel: bucket in 1–3 and 8, cup in 4 ----
  const toCup = prog(f, F.s4, 20, ease.inOut);
  const cupOut = prog(f, F.s5, 14, ease.in);
  const bucketBack = prog(f, F.s8, 14, ease.out);
  let vessel = lerpShape(BUCKET, CUP, toCup);
  let vesselOpacity = 1 - cupOut;
  let cupness = toCup;
  if (f >= F.s5) vessel = { ...CUP, cx: CUP.cx - cupOut * 260 };
  if (f >= F.s6) vesselOpacity = 0;
  if (f >= F.s8) { vessel = BUCKET; vesselOpacity = bucketBack; cupness = 0; }
  const glow = f < F.s4 ? prog(f, F.s2 + 20, 30) * (1 - prog(f, F.s4 - 10, 10)) : f >= F.s8 ? 0.6 * prog(f, F.s8 + 20, 20) : 0;

  // ---- blue crab ----
  let crab = { x: 520, y: 1010, rot: 0, s: 1, legPhase: f * 0.9, clawOpen: 0.4 + 0.3 * Math.sin(f / 3), armRaise: 0.4, look: 0, opacity: 1, inside: true };
  if (f < F.s2) {
    const up = prog(f, 0, 20, ease.out);
    const yank = prog(f, B.hookYank, 16, ease.in);
    const peek = prog(f, 72, 14, ease.out) * (1 - prog(f, 112, 8, ease.in));
    crab.y = f > 60 ? 1130 - peek * 150 : mix(1010, 905, up) + yank * 320;
    crab.rot = yank * 22 + Math.sin(f / 5) * 3 * (1 - yank);
    crab.look = f > 80 ? Math.sin((f - 80) / 7) : 0;
    crab.clawOpen = f < B.hookGrab ? 0.8 : 0.2;
  } else if (f < F.s3) {
    crab.y = 1200;
    crab.opacity = 0;
  } else if (f < F.s4) {
    const up = prog(f, B.s3climb, 20, ease.out);
    const yank = prog(f, B.s3yank, 14, ease.in);
    crab = { ...crab, x: 470, y: mix(1150, 900, up) + yank * 320, rot: yank * -18, opacity: 1 };
  } else if (f < F.s6) {
    const walk = prog(f, F.s4 + 20, 26, ease.inOut);
    const knocked = prog(f, B.s4slam, 8, ease.out);
    crab = { ...crab, inside: false, s: 0.72, x: mix(340, 560, walk) - knocked * 50, y: mix(980, 1330, walk), rot: -knocked * 14, legPhase: walk > 0 && walk < 1 ? f * 1.1 : 0, look: -0.6, armRaise: 0.8 - knocked * 0.8 };
    if (f >= F.s5) {
      const hit = prog(f, B.s5hit, 8, ease.out);
      crab = { ...crab, x: 860, y: 1180, rot: -hit * 22, armRaise: 1 - hit, clawOpen: 0.4 + 0.4 * Math.sin(f / 2.5) * (1 - hit), look: -0.8, legPhase: 0 };
    }
  } else if (f < F.s7) {
    crab.opacity = 0;
  } else if (f < F.s8) {
    const toLadder = prog(f, B.d + 10, 30, ease.inOut);
    crab = { ...crab, inside: false, s: 0.55, x: mix(500, 340, toLadder), y: 1300, legPhase: toLadder > 0 && toLadder < 1 ? f : 0, look: -0.7, opacity: prog(f, B.b, 10) };
  } else {
    const climb = prog(f, B.s8 + 4, 40, ease.out);
    const hop = prog(f, B.s8 + 54, 18, ease.inOut);
    const ladderTop = { x: 760, y: 840 };
    const ladderFoot = { x: 610, y: 1250 };
    const lx = mix(ladderFoot.x, ladderTop.x, climb);
    const ly = mix(ladderFoot.y, ladderTop.y, climb);
    const hx = mix(lx, 880, hop);
    const hy = mix(ly, 1390, hop) - Math.sin(hop * Math.PI) * 140;
    crab = { ...crab, inside: hop < 0.25, s: hop > 0 ? mix(0.9, 0.7, hop) : 0.9, x: hx, y: hy - 30, rot: mix(16, 0, hop), legPhase: climb < 1 ? f * 1.2 : 0, armRaise: hop >= 1 ? 1 + 0.2 * Math.sin(f / 3) : 0.6, look: hop >= 1 ? Math.sin(f / 9) : 0.4, opacity: prog(f, F.s8 + 6, 10) };
  }

  // ---- red claws ----
  const claws: React.ReactNode[] = [];
  if (f < F.s2) {
    const reach = prog(f, B.hookGrab - 10, 10, ease.out);
    const tap = f > 96 ? prog(f, 98, 8, ease.out) * (1 - prog(f, 120, 10, ease.in)) : 0;
    const grabX = crab.x + 100;
    const grabY = crab.y + 30;
    const tx = f > 60 ? 650 : mix(720, grabX, reach);
    const ty = f > 60 ? 1160 - tap * 230 : mix(1160, grabY, reach);
    claws.push(<RedClaw key="h" bx={720} by={1330} tx={tx} ty={ty} open={f > 60 ? 0.9 : f < B.hookGrab ? 1 : 0.05} bend={-60} s={1.25} />);
  } else if (f < F.s4) {
    const rise = (i: number) => prog(f, F.s2 + 40 + i * 8, 16, ease.back);
    const grab = prog(f, B.s3grab - 6, 8, ease.out);
    const yank = prog(f, B.s3yank, 14, ease.in);
    const sink = prog(f, B.s3name + 10, 20, ease.in);
    [[380, 860], [560, 840], [700, 870]].forEach(([x, y], i) => {
      const idleX = x + Math.sin(f / 9 + i * 2) * 12;
      const idleY = mix(1150, y, rise(i)) + Math.sin(f / 7 + i) * 8;
      const target = { x: crab.x + (i - 1) * 60, y: crab.y + 40 };
      const back = prog(f, B.s3yank + 18, 16, ease.out);
      const hold = f >= F.s3 ? grab * (1 - back) : 0;
      const tx = mix(idleX, target.x, hold);
      const ty = mix(idleY, target.y, hold) + sink * 420;
      claws.push(<RedClaw key={i} bx={x + (i - 1) * 20} by={1320} tx={tx} ty={ty} open={hold > 0.8 ? 0.1 : 0.7 + 0.2 * Math.sin(f / 4 + i)} bend={(i - 1) * 50 + yank * 20} />);
    });
  } else if (f >= F.s8) {
    const rise = prog(f, B.s8 + 18, 16, ease.back);
    const sink = prog(f, B.s8 + 72, 18, ease.in);
    [[420, 900], [560, 880]].forEach(([x, y], i) => {
      claws.push(<RedClaw key={i} bx={x} by={1320} tx={x + 60 + i * 40} ty={mix(1150, y, rise) + sink * 360} open={f > B.s8 + 50 ? 0.05 : 0.9} bend={-30 + i * 60} />);
    });
  }

  // ---- ladder (scenes 7–8) ----
  const rungs = f < F.s7 ? 0 : prog(f, B.a + 36, 8) + prog(f, B.b + 32, 8) + prog(f, B.c + 26, 8);
  const ladderIn = prog(f, F.s7 + 6, 16, ease.out);
  const toBucket = prog(f, F.s8 + 2, 22, ease.inOut);
  const ladder = f >= F.s7 ? (
    <Ladder x={mix(220, 610, toBucket)} y={mix(1330, 1250, toBucket)} h={mix(560, 470, toBucket)} rot={mix(-4, 20, toBucket)} rungs={rungs} total={3} railGrow={ladderIn}
      glow={f >= B.d ? prog(f, B.d, 16) * (1 - toBucket) : 0} />
  ) : null;

  const crabNode = <Crab {...crab} />;

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: 'absolute', inset: 0 }}>
      <defs>
        <filter id="boil" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.014" numOctaves={1} seed={seed} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale={5} xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
      <g transform={camT}>
        <g filter="url(#boil)">
          {vesselOpacity > 0 && (
            <g opacity={vesselOpacity}>
              <clipPath id="inVessel"><path d={`M -400 -1000 L 1480 -1000 L 1480 ${vessel.rimY} L ${vessel.cx + vessel.rx} ${vessel.rimY} L ${vessel.cx + vessel.botHalf} ${vessel.botY} L ${vessel.cx - vessel.botHalf} ${vessel.botY} L ${vessel.cx - vessel.rx} ${vessel.rimY} L -400 ${vessel.rimY} Z`} /></clipPath>
              <VesselBack v={vessel} glow={glow} />
              <g clipPath="url(#inVessel)">
                {crab.inside && crabNode}
                {claws}
                {f >= F.s8 && ladder}
              </g>
              <VesselFront v={vessel} cup={cupness} />
              {f < F.s2 && f > B.hookYank + 14 && <MotionLines x={crab.x} y={BUCKET.rimY} p={prog(f, B.hookYank + 14, 14)} />}
              {f >= F.s3 && f < F.s4 && <MotionLines x={470} y={BUCKET.rimY} p={prog(f, B.s3yank + 14, 14)} />}
            </g>
          )}
          {f >= F.s2 && f < F.s4 && <OpenTop f={f} />}
          {f >= F.s4 && f < F.s5 + 10 && <Steam x={vessel.cx} y={vessel.rimY - 40} draw={prog(f, F.s4 + 18, 18) * (1 - cupOut)} t={f} />}
          {f >= F.s7 && f < F.s8 + 1 && ladder}
          {!crab.inside && crabNode}
          <Scene4to7 f={f} />
        </g>
      </g>
    </svg>
  );
};

const OpenTop: React.FC<{ f: number }> = ({ f }) => {
  const draw = prog(f, F.s2 + 26, 18);
  const out = prog(f, F.s3 - 4, 10, ease.in);
  return (
    <g opacity={1 - out}>
      <path d={`M ${BUCKET.cx - 250} ${BUCKET.rimY - 40} Q ${BUCKET.cx} ${BUCKET.rimY - 200} ${BUCKET.cx + 250} ${BUCKET.rimY - 40}`} fill="none" stroke={C.ivory} strokeWidth={6} strokeDasharray="18 22" strokeLinecap="round" opacity={0.6 * draw} />
      <g transform={`translate(${BUCKET.cx} ${BUCKET.rimY - 150 - draw * 40})`} opacity={draw}>
        <path d="M 0 40 L 0 -60 M -34 -26 L 0 -60 L 34 -26" fill="none" stroke={C.ivory} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </g>
  );
};

/** Scenes 4–7: notebook, project, advice vs discouragement, three actions. Camera is identity here. */
const Scene4to7: React.FC<{ f: number }> = ({ f }) => {
  if (f < F.s4 || f >= F.s8 + 12) return null;
  const nodes: React.ReactNode[] = [];

  // Scene 4 — learning: the notebook, and the bubble that slams it shut.
  if (f < F.s5 + 14) {
    const pop = prog(f, F.s4 + 14, 14, ease.back);
    const squash = prog(f, B.s4slam, 6, ease.out);
    const morph = prog(f, F.s5, 14, ease.inOut);
    const bubbleIn = prog(f, B.s4bubble, 10, ease.back);
    const slam = prog(f, B.s4slam - 8, 8, ease.in);
    const out = prog(f, F.s5, 8);
    nodes.push(
      <g key="nb" opacity={1 - morph}>
        <g transform={`translate(720 1180) scale(${pop * (1 + squash * 0.06)} ${pop * (1 - squash * 0.24)}) rotate(${-squash * 6})`}>
          <image href={staticFile('assets/notebook-pencil.svg')} x={-230} y={-400} width={460} height={460} />
        </g>
      </g>,
    );
    if (f >= B.s4bubble) {
      nodes.push(<BubbleShape key="b4" x={640} y={mix(690, 790, slam)} w={720} h={170} scale={bubbleIn} rot={slam * -4} tailX={60} opacity={1 - out} />);
    }
  }

  // Scene 5 — the small project and the bubble that crushes its progress.
  if (f >= F.s5 && f < F.s6 + 12) {
    const inP = prog(f, F.s5 + 4, 14, ease.back);
    const grow = prog(f, F.s5 + 12, 26, ease.out);
    const hit = prog(f, B.s5hit, 8, ease.out);
    const fall = prog(f, B.s5bubble, 12, ease.in);
    const out = prog(f, F.s6, 10);
    const fill = mix(0, 0.74, grow) - hit * 0.48;
    nodes.push(
      <g key="proj" opacity={1 - out}>
        <g transform={`translate(560 1020) scale(${inP} ${inP * (1 - hit * 0.12 + prog(f, B.s5hit + 8, 12) * 0.06)})`}>
          <image href={staticFile('assets/steps-flag.svg')} x={-210} y={-300} width={420} height={420} />
        </g>
        <rect x={230} y={1220} width={560} height={46} rx={23} fill={C.bgDeep} stroke={C.ivory} strokeWidth={5} />
        <rect x={236} y={1226} width={Math.max(0, 548 * fill)} height={34} rx={17} fill={C.blue} />
        {f >= B.s5bubble && <BubbleShape x={520} y={mix(470, 1110, fall)} w={560} h={150} scale={1} rot={mix(-8, 3, fall)} tail="none" />}
      </g>,
    );
  }

  // Scene 6 — advice repairs, discouragement pulls down.
  if (f >= F.s6 && f < F.s7 + 12) {
    const out = prog(f, F.s7, 10);
    const line = prog(f, F.s6 + 6, 16);
    const show = prog(f, F.s6 + 8, 14, ease.out);
    const fix = prog(f, B.s6fix + 8, 14, ease.inOut);
    const wrenchIn = prog(f, B.s6fix, 12, ease.out);
    const pull = prog(f, B.s6pull, 12, ease.out);
    const fallP = prog(f, B.s6pull + 12, 16, ease.in);
    const tintR = prog(f, B.s6fix - 6, 10);
    const tintL = prog(f, B.s6pull - 6, 10);
    nodes.push(
      <g key="s6" opacity={1 - out}>
        <path d="M 540 560 L 540 1300" stroke={C.ivory} strokeWidth={5} strokeDasharray="14 18" strokeLinecap="round" opacity={0.5} pathLength={1} strokeDashoffset={0} style={{ clipPath: `inset(0 0 ${(1 - line) * 100}% 0)` }} />
        <TalkDots x={770} y={620} fill={tintR > 0.5 ? C.blue : C.metalLight} scale={show} />
        <TalkDots x={310} y={620} fill={tintL > 0.5 ? C.red : C.metalLight} scale={show} />
        <Ladder x={770} y={1230} h={520} rungs={4 * show} total={4} broken={1} fix={fix} opacity={show} />
        {wrenchIn > 0 && <Wrench x={mix(980, 800, wrenchIn)} y={mix(1200, 960, wrenchIn) - fix * 6} rot={mix(60, 0, wrenchIn) + Math.sin(fix * Math.PI * 3) * 25} opacity={1 - prog(f, B.s6fix + 30, 10)} />}
        <Ladder x={310 - fallP * 40} y={1230 + fallP * 60} h={520} rot={-fallP * 38} rungs={4 * show} total={4} opacity={show} />
        {f >= B.s6pull - 2 && <RedClaw bx={250} by={1500} tx={mix(260, 300, pull) - fallP * 60} ty={mix(1420, 1205, pull) + fallP * 90} open={pull > 0.85 ? 0.1 : 0.9} bend={-30} />}
      </g>,
    );
  }

  // Scene 7 — three actions; each finished one adds a rung.
  if (f >= F.s7 && f < F.s8 + 12) {
    const out = prog(f, F.s8, 10);
    const a = (k: number) => f - B.a - k;
    const lockDrop = prog(f, B.a + 12, 10, ease.in);
    const bounce = prog(f, B.a + 22, 18, ease.out);
    const aOut = prog(f, B.b - 4, 8);
    const bIn = prog(f, B.b, 12, ease.back);
    const q = prog(f, B.b + 6, 20, ease.inOut);
    const halo = prog(f, B.b + 24, 12);
    const bOut = prog(f, B.c - 4, 8);
    const bars = [120, 200, 290];
    const dim = f >= B.d ? 1 - 0.55 * prog(f, B.d, 12) : 1;
    nodes.push(
      <g key="s7" opacity={1 - out}>
        <g opacity={(1 - aOut) * prog(f, B.a, 8)}>
          <image href={staticFile('assets/notebook-pencil.svg')} x={500} y={820} width={300} height={300} />
          {lockDrop > 0 && <Lock x={650} y={mix(760, 1000, lockDrop)} s={0.9} />}
          {[0, 1, 2].map((i) => {
            const t = prog(f, B.a + i * 4, 22, ease.in);
            const start = [[980, 820], [960, 1180], [930, 640]][i];
            const hitX = 760 + i * 10;
            const hitY = 960 + (i - 1) * 90;
            const x = bounce > 0 ? mix(hitX, start[0] + 80, bounce) : mix(start[0], hitX, t);
            const y = bounce > 0 ? mix(hitY, start[1] - 120, bounce) : mix(start[1], hitY, t);
            return a(0) >= 0 ? <TalkDots key={i} x={x} y={y} fill={C.red} scale={0.5} opacity={1 - bounce} /> : null;
          })}
        </g>
        <g opacity={bIn * (1 - bOut)}>
          {halo > 0 && <circle cx={740} cy={860} r={210 * halo} fill={C.blue} opacity={0.25} />}
          <image href={staticFile('assets/lightbulb.svg')} x={570} y={700} width={340} height={340} />
          <g transform={`translate(${mix(500, 660, q)} ${mix(1180, 930, q) - Math.sin(q * Math.PI) * 120})`} opacity={1 - halo}>
            <circle r={44} fill={C.ivory} />
            <text x={0} y={18} textAnchor="middle" fontFamily={TITLE_FONT} fontWeight={900} fontSize={56} fill={C.bg}>؟</text>
          </g>
        </g>
        <g opacity={prog(f, B.c, 8) * dim}>
          {bars.map((h, i) => {
            const g = prog(f, B.c + 4 + i * 6, 16, ease.out);
            return (
              <g key={i}>
                <rect x={560 + i * 120} y={1260 - h * g} width={86} height={h * g} rx={14} fill={C.blue} stroke={C.ivory} strokeWidth={5} />
                <Check x={603 + i * 120} y={1200 - h - 40} p={prog(f, B.c + 14 + i * 6, 10)} />
              </g>
            );
          })}
          <path d="M 530 1262 L 930 1262" stroke={C.ivory} strokeWidth={6} strokeLinecap="round" />
        </g>
      </g>,
    );
  }
  return <>{nodes}</>;
};

// ---------------------------------------------------------------------------
// Words on screen.
// ---------------------------------------------------------------------------
const Pill: React.FC<{ text: string; x: number; y: number; bg: string; from: number; to: number }> = ({ text, x, y, bg, from, to }) => {
  const f = useCurrentFrame();
  if (f < from - 1 || f > to + 1) return null;
  const p = prog(f, from, 10, ease.back);
  return (
    <div style={{ position: 'absolute', left: x - 220, top: y, width: 440, display: 'flex', justifyContent: 'center', opacity: Math.min(prog(f, from, 6), 1 - prog(f, to - 8, 8)), transform: `scale(${0.6 + 0.4 * p})` }}>
      <div dir="rtl" lang="ar" style={{ fontFamily: BODY_FONT, fontWeight: 700, fontSize: 48, color: C.ivory, background: bg, padding: '12px 32px 16px', borderRadius: 999, border: `4px solid ${C.ivory}`, whiteSpace: 'nowrap' }}>{text}</div>
    </div>
  );
};

const Texts: React.FC = () => {
  const f = useCurrentFrame();
  const s4slam = prog(f, B.s4slam - 8, 8, ease.in);
  const s4in = prog(f, B.s4bubble, 10, ease.back);
  const s5fall = prog(f, B.s5bubble, 12, ease.in);
  const steps = [
    { n: '1', text: 'قلّل مشاركة الخطط', at: segAt('s7a', 0.3) },
    { n: '2', text: 'اسأل صاحب تجربة', at: B.b },
    { n: '3', text: 'قِس تقدّمك', at: B.c },
  ];
  return (
    <AbsoluteFill>
      <Title text="كلّما طلعت… *جرّوك لتحت*" from={0} to={F.s2 + 8} size={112} />
      <Title text="العائق *من الداخل*" from={F.s2 + 6} to={B.s3name + 2} />
      <Title text="عقلية *السلطعون*" from={B.s3name} to={F.s4 + 6} size={128} />
      <Caption text="استعارة، ماشي تشخيص" from={B.s3name + 14} to={F.s4 + 6} top={1480} size={54} color={C.ivory} bg={C.metal} />
      <Title text="غادي *نتعلّم*" from={F.s4 + 4} to={F.s5 + 6} accent={C.blueSoft} />
      {f >= B.s4bubble && f < F.s5 + 8 && (
        <Words text="وحتى اللي تعلّمو، شنو دارو؟" x={640} y={mix(690, 790, s4slam)} w={660} size={52} opacity={Math.min(s4in, 1 - prog(f, F.s5, 8))} scale={s4in} rot={s4slam * -4} />
      )}
      <Title text="مشروع *صغير*" from={F.s5 + 4} to={F.s6 + 6} accent={C.blueSoft} />
      {f >= B.s5bubble && f < F.s6 + 10 && (
        <Words text="بلا ما تحلم بزاف" x={520} y={mix(470, 1110, s5fall)} w={520} size={56} opacity={1 - prog(f, F.s6, 10)} rot={mix(-8, 3, s5fall)} />
      )}
      <Title text="*نصيحة* ولا *تثبيط؟*" from={F.s6 + 4} to={F.s7 + 6} accent={C.ivory} />
      <Pill text="النصيحة كتصلح" x={770} y={1330} bg={C.blue} from={segStart('s6b')} to={F.s7 + 6} />
      <Pill text="التثبيط كيوقف" x={310} y={1330} bg={C.red} from={segStart('s6c')} to={F.s7 + 6} />
      {f >= F.s7 && f < F.s8 + 8 && (
        <div dir="rtl" lang="ar" style={{ position: 'absolute', top: 180, left: SAFE.left, right: SAFE.right, display: 'flex', flexDirection: 'column', gap: 22, opacity: 1 - prog(f, F.s8, 8) }}>
          {steps.map((s) => {
            const p = prog(f, s.at, 12, ease.out);
            const done = f >= B.d;
            return (
              <div key={s.n} style={{ display: 'flex', alignItems: 'center', gap: 28, opacity: p, transform: `translateX(${(1 - p) * -60}px)` }}>
                <div style={{ width: 92, height: 92, borderRadius: 46, background: C.blue, border: `5px solid ${C.ivory}`, color: C.ivory, fontFamily: TITLE_FONT, fontWeight: 900, fontSize: 54, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{s.n}</div>
                <div style={{ fontFamily: TITLE_FONT, fontWeight: 800, fontSize: 76, color: done ? C.ivory : C.ivory, lineHeight: 1.15 }}>{s.text}</div>
              </div>
            );
          })}
        </div>
      )}
      <Caption text="ما تحكمش على النوايا… *شوف الأثر*" from={B.d + 4} to={F.s8 + 6} top={1460} size={50} bg={C.metal} />
      <Title text="ما محتاجش *موافقة السطل*" from={B.s8} to={F.end + 2} accent={C.blueSoft} />
      <Caption text="كتاب وبس" from={F.end - sec(2.0)} to={F.end + 10} top={1520} size={52} color={C.ivory} weight={700} />
    </AbsoluteFill>
  );
};

const Paper: React.FC = () => (
  <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
    <defs>
      <filter id="paper">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={11} />
        <feColorMatrix values="0 0 0 0 0.96  0 0 0 0 0.94  0 0 0 0 0.9  0 0 0 0.09 0" />
      </filter>
      <radialGradient id="vignette" cx="50%" cy="45%" r="75%">
        <stop offset="60%" stopColor="#000" stopOpacity={0} />
        <stop offset="100%" stopColor="#000" stopOpacity={0.45} />
      </radialGradient>
    </defs>
    <rect width={W} height={H} filter="url(#paper)" />
    <rect width={W} height={H} fill="url(#vignette)" />
  </svg>
);

export const Reel: React.FC = () => (
  <AbsoluteFill style={{ background: C.bg }}>
    <Paper />
    <World />
    <Texts />
    {TL.segments.filter((s) => s.measured).map((s) => (
      <Sequence key={s.id} from={sec(s.start)} layout="none">
        <Audio src={staticFile(`voice/${s.id}.wav`)} />
      </Sequence>
    ))}
    {SFX.map(([name, at, vol], i) => (
      <Sequence key={i} from={Math.max(0, at)} durationInFrames={sec(0.8)} layout="none">
        <Audio src={staticFile(`sfx/${name}.wav`)} volume={vol} />
      </Sequence>
    ))}
  </AbsoluteFill>
);
