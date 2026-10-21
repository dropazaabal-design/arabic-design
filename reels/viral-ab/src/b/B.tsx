import React from 'react';
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from 'remotion';
import { BODY, TITLE } from '../fonts';
import { Figure, ease, joints, mix, mixPose, pose, prog, walk, type Pose } from '../rig';
import B from './beats.json';

// B «النخلة»: an old man plants a palm offshoot at dusk; a boy laughs — when will you ever eat from it?
// Years pass in six days and nights: the palm grows, the boy grows up, the old man is gone and his cane leans
// on the trunk. The young man eats its dates, takes the cane and an offshoot, and plants again; a girl asks
// him the same question. Ends where it began, so it loops. Dusk pink, violet and navy; plain silhouettes.
export const W = 1080, H = 1920;
export const B_FRAMES = Math.round(B.duration * 60);
const C = {
  skyTop: '#232650', skyMid: '#4B3A78', skyLow: '#B0668F', sun: '#F3C6D8', night: '#0B0B24', star: '#F7EEF5',
  dunesFar: '#3A2C5A', dunes: '#271F42', ground: '#17122A', ink: '#0A0812', eye: '#F7EEF5', notch: '#1C1530',
  date: '#8A3460', water: '#B9C6F2', soil: '#0F0B1C', text: '#FBF3F8', textDim: '#D9C2D6', bubble: '#FBF3F8',
};
const GY = 1480, PALM = 500, HOLE2 = 894, S = 1.12, KID = 0.62;
const at = (s: number) => Math.round(s * 60);
type Cam = { x: number; y: number; z: number };
const camMix = (a: Cam, b: Cam, t: number): Cam => ({ x: mix(a.x, b.x, t), y: mix(a.y, b.y, t), z: mix(a.z, b.z, t) });
/** A camera that keeps the horizon at y 1430 on screen. */
const view = (x: number, z: number): Cam => ({ x, y: GY - 470 / z, z });
const toScreen = (c: Cam, q: [number, number]): [number, number] => [(q[0] - c.x) * c.z + W / 2, (q[1] - c.y) * c.z + H / 2];
/** A figure's wrists in world space. */
const wrists = (p: Pose, x: number, s: number, facing: 1 | -1) => {
  const j = joints(p);
  const w = (q: [number, number]): [number, number] => [x + facing * s * q[0], GY + s * q[1]];
  return { F: w(j.armF.wrist), N: w(j.armN.wrist) };
};
const STARS = Array.from({ length: 46 }, (_, k) => ({ x: (k * 239.7) % W, y: 60 + ((k * 151.3) % 900), r: 1.4 + (k % 3) * 0.8 }));

const Sky: React.FC<{ c: Cam; night: number }> = ({ c, night }) => (
  <>
    <defs>
      <linearGradient id="bsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={C.skyTop} /><stop offset="0.5" stopColor={C.skyMid} /><stop offset="0.82" stopColor={C.skyLow} /></linearGradient>
      <filter id="bglow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
    </defs>
    <rect x={0} y={0} width={W} height={H} fill="url(#bsky)" />
    <circle cx={W / 2 + (760 - c.x) * 0.1} cy={(1330 - c.y) * 0.2 + H * 0.62 + night * 420} r={120} fill={C.sun} opacity={0.9} />
    <rect x={0} y={0} width={W} height={H} fill={C.night} opacity={night * 0.74} />
    {STARS.map((s, k) => <circle key={k} cx={s.x} cy={s.y} r={s.r} fill={C.star} opacity={night * (0.5 + 0.5 * Math.sin(k * 7.1))} />)}
    <g transform={`translate(${-(c.x - 560) * 0.08} ${(1330 - c.y) * 0.25 + 40})`}>
      <path d="M-200 1200 Q120 1080 400 1170 T980 1140 T1400 1180 L1400 1700 L-200 1700 Z" fill={C.dunesFar} />
      <path d="M-200 1290 Q260 1190 640 1280 T1400 1260 L1400 1800 L-200 1800 Z" fill={C.dunes} />
    </g>
  </>
);

/** A date palm at growth g (0 = an offshoot of a few fronds, 1 = grown, with dates). */
const Palm: React.FC<{ x: number; g: number; dates?: number }> = ({ x, g, dates = 0 }) => {
  const h = 560 * Math.max(0, g - 0.06) / 0.94;
  const wb = 8 + 18 * g, wt = 6 + 9 * g, lean = 26 * g;
  const top: [number, number] = [x + lean, GY - h];
  const trunk = `M${x - wb} ${GY} Q${x - wb * 0.7 + lean * 0.2} ${GY - h * 0.5} ${top[0] - wt} ${top[1]} L${top[0] + wt} ${top[1]} Q${x + wb * 0.7 + lean * 0.4} ${GY - h * 0.5} ${x + wb} ${GY} Z`;
  const fronds = 9, len = 46 + 200 * g;
  return (
    <g>
      {h > 4 && <path d={trunk} fill={C.ink} />}
      {h > 4 && Array.from({ length: Math.floor(h / 22) }, (_, k) => {
        const t = (k + 0.5) / Math.max(1, Math.floor(h / 22)), y = GY - h * t, cx = mix(x, top[0], t * t), w = mix(wb, wt, t) * 0.8;
        return <path key={k} d={`M${cx - w} ${y} L${cx + w} ${y - 4}`} stroke={C.notch} strokeWidth={3} />;
      })}
      {dates > 0 && [-1, 1].map((sd) => <g key={sd} opacity={dates}>
        {Array.from({ length: 14 }, (_, k) => <circle key={k} cx={top[0] + sd * (14 + (k % 4) * 7)} cy={top[1] + 14 + Math.floor(k / 4) * 9 + (k % 2) * 3} r={5.5} fill={C.date} />)}
      </g>)}
      {Array.from({ length: fronds }, (_, k) => {
        const a = mix(-168, -12, k / (fronds - 1)) * (Math.PI / 180);
        const droop = 0.35 + 0.45 * Math.abs(Math.cos(a));
        const l = len * (k % 2 ? 0.86 : 1);
        const tip: [number, number] = [top[0] + Math.cos(a) * l, top[1] + Math.sin(a) * l * 0.55 + l * droop * 0.55];
        const mid: [number, number] = [top[0] + Math.cos(a) * l * 0.55, top[1] + Math.sin(a) * l * 0.75];
        const along = (t: number): [number, number] => [(1 - t) ** 2 * top[0] + 2 * (1 - t) * t * mid[0] + t * t * tip[0], (1 - t) ** 2 * top[1] + 2 * (1 - t) * t * mid[1] + t * t * tip[1]];
        return <g key={k}>
          <path d={`M${top[0]} ${top[1]} Q${mid[0]} ${mid[1]} ${tip[0]} ${tip[1]}`} fill="none" stroke={C.ink} strokeWidth={3 + 4 * g} strokeLinecap="round" />
          {Array.from({ length: 9 }, (_, m) => {
            const t = 0.15 + m * 0.09, [px, py] = along(t), [qx, qy] = along(t + 0.02);
            const dx = qx - px, dy = qy - py, d = Math.hypot(dx, dy) || 1, ll = (8 + 22 * g) * (1 - Math.abs(t - 0.45));
            return [1, -1].map((sd) => <path key={`${m}${sd}`} d={`M${px} ${py} L${px + (dx / d) * ll * 0.6 - (dy / d) * ll * sd} ${py + (dy / d) * ll * 0.6 + (dx / d) * ll * sd + ll * 0.3}`} stroke={C.ink} strokeWidth={2 + 2.5 * g} strokeLinecap="round" />);
          })}
        </g>;
      })}
    </g>
  );
};

const Shovel: React.FC<{ a: [number, number]; b: [number, number] }> = ({ a, b }) => {
  const d = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, u: [number, number] = [(b[0] - a[0]) / d, (b[1] - a[1]) / d];
  const s0: [number, number] = [a[0] - u[0] * 14, a[1] - u[1] * 14], s1: [number, number] = [b[0] + u[0] * 70, b[1] + u[1] * 70];
  const ang = (Math.atan2(u[1], u[0]) * 180) / Math.PI - 90;
  return <g>
    <path d={`M${s0[0]} ${s0[1]} L${s1[0]} ${s1[1]}`} stroke={C.ink} strokeWidth={7} strokeLinecap="round" />
    <g transform={`translate(${s1[0]} ${s1[1]}) rotate(${ang})`}><path d="M-16 -4 L16 -4 L13 26 Q0 38 -13 26 Z" fill={C.ink} /></g>
  </g>;
};
const Cane: React.FC<{ top: [number, number]; tip: [number, number] }> = ({ top, tip }) => (
  <path d={`M${tip[0]} ${tip[1]} L${top[0]} ${top[1]} q${(top[0] - tip[0]) * 0.1 - 10} -18 -22 -4`} fill="none" stroke={C.ink} strokeWidth={6} strokeLinecap="round" />
);
const Jug: React.FC<{ tilt: number }> = ({ tilt }) => (
  <g transform={`rotate(${-tilt})`}><path d="M-12 -24 Q-20 0 -14 14 L14 14 Q20 0 12 -24 Z M12 -18 L26 -26" fill={C.ink} stroke={C.ink} strokeWidth={5} strokeLinejoin="round" /></g>
);
const Plate: React.FC = () => <g><ellipse cx={0} cy={6} rx={26} ry={6} fill={C.ink} />{[-12, -4, 4, 12, -8, 0, 8].map((x, k) => <circle key={k} cx={x} cy={k < 4 ? 0 : -6} r={4.5} fill={C.date} />)}</g>;

const Text: React.FC<{ text: string; o: number; top: number; size: number; color?: string; weight?: number }> = ({ text, o, top, size, color = C.text, weight = 800 }) =>
  o <= 0 ? null : <div dir="rtl" lang="ar" style={{ position: 'absolute', top, left: 80, right: 80, textAlign: 'center', fontFamily: TITLE, fontWeight: weight, fontSize: size, lineHeight: 1.25, color, opacity: o,
    transform: `translateY(${mix(26, 0, o)}px) scale(${mix(0.94, 1, o)})`, textShadow: '0 4px 24px rgba(10,8,18,0.7)' }}>{text}</div>;

/** A speech bubble high over the heads, its tail pointing down towards the speaker at screen x. */
const Bubble: React.FC<{ text: string; o: number; x: number }> = ({ text, o, x }) => {
  if (o <= 0) return null;
  const left = Math.max(50, Math.min(W - 770, x - 360));
  return <div style={{ position: 'absolute', left, top: 470, width: 720, opacity: o, transform: `scale(${mix(0.7, 1, o)})`, transformOrigin: `${x - left}px 140px` }}>
    <div dir="rtl" lang="ar" style={{ background: C.bubble, color: C.ink, fontFamily: BODY, fontWeight: 800, fontSize: 56, lineHeight: 1.3, padding: '22px 30px', borderRadius: 44, textAlign: 'center', whiteSpace: 'nowrap' }}>{text}</div>
    <div style={{ position: 'absolute', left: Math.max(40, Math.min(680, x - left)) - 20, top: '100%', width: 0, height: 0, borderLeft: '20px solid transparent', borderRight: '20px solid transparent', borderTop: `40px solid ${C.bubble}` }} />
  </div>;
};

const years = (n: number) => (n === 1 ? 'سنة' : n === 2 ? 'سنتين' : n <= 10 ? `${n} سنوات` : `${n} سنة`);

export const ReelB: React.FC = () => {
  const f = useCurrentFrame();
  const shot = [...B.shots].reverse().find(([, t]) => f >= at(t as number))![0] as string;
  const idx = (name: string) => B.shots.findIndex(([n]) => n === name);
  const shotStart = (name: string) => at(B.shots[idx(name)][1] as number);
  const shotEnd = (name: string) => (idx(name) + 1 < B.shots.length ? at(B.shots[idx(name) + 1][1] as number) : at(B.duration));
  const local = (name: string) => prog(f, shotStart(name), shotEnd(name) - shotStart(name), (t) => t);
  const D = B.dig, P = B.plant, Y = B.years, Sh = B.shade, A = B.again, K = B.ask;

  // ——— time ———
  const yt = prog(f, at(Y.from), at(Y.to) - at(Y.from), (t) => t);
  const night = f >= at(Y.from) && f < at(Y.to) ? 0.5 - 0.5 * Math.cos(2 * Math.PI * Y.days * yt) : 0;
  const g = f < at(P.set) ? 0 : f < at(Y.from) ? 0.04 : mix(0.04, 1, prog(f, at(Y.from), at(Y.to) - at(Y.from) - 30, ease.inOut));
  const grown = prog(f, at(Y.from) + 20, at(Y.to) - at(Y.from) - 70, ease.inOut);

  // ——— the old man (x 590, faces the hole: −x) ———
  const GX = 590;
  const raise = pose({ lean: 8, head: 10, handN: [40, -190], handF: [62, -150] });
  const push = pose({ lean: 26, crouch: 14, head: 16, handN: [56, -120], handF: [76, -80] });
  const toss = pose({ lean: 4, head: 6, handN: [22, -156], handF: [60, -150] });
  const kneel = pose({ lean: 58, crouch: 22, head: 22, footF: [26, 0], footN: [-26, 0], handF: [84, -14], handN: [70, -16] });
  const stand = pose({ head: 2, shF: 10, elF: 14, shN: -6, elN: 10 });
  let gp: Pose = raise;
  if (f < at(P.kneel)) {
    for (const s of D.strokes) {
      const t = at(s);
      gp = mixPose(mixPose(mixPose(gp, push, prog(f, t - 10, 10, ease.in)), toss, prog(f, t + 4, 12)), raise, prog(f, t + 18, 10));
    }
    gp = { ...gp, head: mix(gp.head, -2, prog(f, at(D.ask), 10)) };
  } else if (f < at(P.stand)) {
    const pat = f >= at(P.pat) && f < at(P.jug) ? Math.abs(Math.sin((f - at(P.pat)) / 3)) * 10 : 0;
    const k = mixPose(raise, kneel, prog(f, at(P.kneel), 12));
    gp = { ...k, handF: [80, -12 - pat], handN: [64, -14 - pat * 0.6] };
    if (f >= at(P.jug)) gp = mixPose(gp, { ...kneel, handF: [74, -70], handN: [40, -60] }, prog(f, at(P.jug), 8));
  } else if (f < at(Y.from)) {
    gp = mixPose(mixPose({ ...kneel, handF: [74, -70], handN: [40, -60] }, stand, prog(f, at(P.stand), 10)), pose({ lean: 22, head: 14, shF: 10, elF: 14, handN: [104, -150] }), prog(f, at(P.pet) - 8, 10));
  } else {
    // years: he leans on his cane and stoops a little more each year, then he is gone
    gp = pose({ lean: mix(4, 16, grown), head: mix(4, 14, grown), handF: [36, -112], shN: -6, elN: 12 });
  }
  const goneO = 1 - prog(f, at(Y.fade), 40, ease.inOut);
  const gw = wrists(gp, GX, S, -1);

  // ——— the boy, who grows into the young man ———
  const boyRun = walk(f, 0, 420, at(D.boyIn), at(D.boyAt) - at(D.boyIn), 30);
  const boyStep = walk(f, 0, 68, at(P.boyStep), 14, 30);
  let bx = -20 + boyRun.x + boyStep.x;
  let bs = KID, bFacing: 1 | -1 = 1;
  let bp: Pose = pose({ bob: boyRun.bob + boyStep.bob, footF: f < at(D.boyAt) ? boyRun.footF : boyStep.footF, footN: f < at(D.boyAt) ? boyRun.footN : boyStep.footN, shF: 30 * Math.sin(f / 4), shN: -30 * Math.sin(f / 4) });
  let bEyes: 'open' | 'laugh' | 'closed' = 'open';
  if (f >= at(D.boyAt) && f < at(D.ask)) { const k = Math.sin((f - at(D.laugh)) / 3.5); bp = pose({ lean: -10 + 4 * k, head: -8 + 6 * k, handF: [30, -130], shN: 60, elN: 10 }); bEyes = 'laugh'; }
  else if (f >= at(D.ask) && f < at(P.boyStep)) bp = pose({ head: -16, shF: 24, elF: 40, shN: -10, elN: 20 });
  else if (f >= at(P.boyStep) + 14 && f < at(Y.from)) { bp = pose({ head: -18, shF: 6, elF: 8 }); if (f >= at(P.pet)) bEyes = 'closed'; }
  let yHeld: { F?: React.ReactNode; N?: React.ReactNode } = {};
  let caneTop: [number, number] | null = null, caneTip: [number, number] | null = null;
  let shootInHand = false;
  if (f >= at(Y.from)) {
    bx = mix(468, 380, prog(f, at(Y.from), 40, ease.inOut));
    bs = mix(KID, S, grown);
    bp = pose({ head: -6 + 4 * Math.sin(f / 30), shF: 6, elF: 8 });
    bEyes = 'open';
  }
  // the cane: in the old man's hand, then leaning on the palm where he left it
  if (f >= at(Y.from) && f < at(Sh.date1) - 30) {
    const lean = prog(f, at(Y.fade) + 10, 40, ease.in);
    caneTip = [gw.F[0] - 6, GY];
    caneTop = [mix(gw.F[0], PALM + 26, lean), mix(gw.F[1], GY - 196, lean)];
    caneTip = [mix(caneTip[0], PALM + 64, lean), GY];
  }
  const youngGhutra = bs > 0.95;
  // shade: he sits where the old man stood, facing the palm, with a plate of its dates
  const YX = 640;
  if (f >= at(Y.to)) {
    bs = S; bx = YX; bFacing = -1;
    const sit = pose({ head: 4, handN: [70, -122], handF: [56, -126] });
    const eat = (t: number) => prog(f, at(t), 12) * (1 - prog(f, at(t) + 18, 12));
    const e = Math.max(eat(Sh.date1), eat(Sh.date2));
    bp = { ...sit, handF: [mix(56, 24, e), mix(-126, -222, e)], head: mix(4, f >= at(Sh.look) ? 20 : -10, prog(f, at(Sh.date1) - 20, 20)) };
    yHeld = { N: <Plate /> };
    caneTop = [PALM + 26, GY - 196]; caneTip = [PALM + 64, GY];
  }
  // again: he stands, takes the cane and an offshoot, walks on, kneels and plants it
  if (f >= at(A.stand)) {
    const up = prog(f, at(A.stand), 14);
    const standP = pose({ head: 6, handF: [60, -170], shN: 6, elN: 10 });
    const takeShoot = pose({ lean: 46, crouch: 30, head: 16, handF: [44, -96], handN: [52, -14] });
    bp = mixPose(mixPose(bp, standP, up), takeShoot, prog(f, at(A.shoot) - 6, 8) * (1 - prog(f, at(A.shoot) + 6, 8)));
    yHeld = {};
    if (f >= at(A.cane)) { caneTop = null; caneTip = null; }
    shootInHand = f >= at(A.shoot) && f < at(A.set);
    if (f >= at(A.walk) - 4) {
      const wk = walk(f, 0, 160, at(A.walk), at(A.walkEnd) - at(A.walk), 40);
      bFacing = 1; bx = YX + wk.x;
      bp = pose({ bob: wk.bob, footF: wk.footF, footN: wk.footN, head: 2, handF: [58, -118], handN: [30, -120] });
      if (f >= at(A.kneel)) {
        const sc = A.scoop.reduce((m, s) => Math.max(m, prog(f, at(s), 6) * (1 - prog(f, at(s) + 8, 6))), 0);
        bp = mixPose(bp, pose({ lean: 58, crouch: 22, head: 22, footF: [26, 0], footN: [-26, 0], handF: [60, -100], handN: [84 - 14 * sc, -14 - 20 * sc] }), prog(f, at(A.kneel), 10));
      }
    }
  }
  // ask: the girl comes; he stands, takes one step, and puts his hand on her head
  const girlWalk = walk(f, 0, 185, at(K.girl), at(K.girlAt) - at(K.girl), 28);
  const girlX = 1160 - girlWalk.x;
  if (f >= at(K.stand)) {
    const st = walk(f, 0, 30, at(K.stand) + 4, 12, 40);
    bx = YX + 160 + st.x;
    const pat = Math.sin(Math.max(0, f - at(K.pat)) / 9) * 6;
    bp = mixPose(pose({ lean: 58, crouch: 22, head: 22, footF: [26, 0], footN: [-26, 0], handF: [60, -100], handN: [84, -14] }),
      pose({ lean: 30, head: 16, footF: st.footF, footN: st.footN, bob: st.bob, handF: [30, -112], handN: [(girlX - bx) / S + 4, -152 + pat] }), prog(f, at(K.stand), 14));
  }
  const bw = wrists(bp, bx, bs, bFacing);
  if (f >= at(A.cane)) { caneTop = [bw.F[0], bw.F[1]]; caneTip = [bw.F[0] + 4 * bFacing, Math.min(GY, bw.F[1] + 200 * (bs / S))]; }

  // ——— cameras ———
  const cams: Record<string, Cam> = {
    dig: camMix(view(496, 1.95), view(500, 2.02), local('dig')),
    plant: camMix(view(530, 2.3), view(532, 2.38), local('plant')),
    years: camMix(view(520, 1.9), view(520, 0.95), ease.inOut(local('years'))),
    shade: camMix(view(560, 1.5), view(562, 1.56), local('shade')),
    again: camMix(view(690, 1.25), view(720, 1.25), local('again')),
    ask: camMix(view(950, 1.95), view(952, 2.02), local('ask')),
  };
  const c = cams[shot];

  // soil from the hole: tossed at each stroke onto a mound beside it
  const strokesDone = D.strokes.filter((s) => f >= at(s) + 16).length;
  const mound = f < at(Y.from) ? 6 + strokesDone * 7 : 0;
  const soil: React.ReactNode[] = [];
  if (f < at(P.kneel)) D.strokes.forEach((s, k) => {
    const t = (f - at(s) - 6) / 16;
    if (t < 0 || t > 1) return;
    for (let m = 0; m < 6; m++) soil.push(<circle key={`${k}${m}`} cx={mix(PALM + 6, PALM - 70 + m * 6, t)} cy={GY - 24 - 80 * 4 * t * (1 - t) - m * 3 + t * 22} r={4} fill={C.soil} />);
  });
  const water = f >= at(P.water) && f < at(P.waterEnd) ? <path d={`M${gw.F[0] - 18} ${gw.F[1] - 22} Q${PALM + 30} ${gw.F[1]} ${PALM + 8} ${GY - 10}`} fill="none" stroke={C.water} strokeWidth={4} strokeDasharray="10 8" strokeDashoffset={-f * 3} opacity={0.9} /> : null;
  const jugOnGround = f < at(P.jug);
  const sapling2 = f >= at(A.set) ? <Palm x={HOLE2} g={0.05} /> : null;
  const shootAtBase = f >= at(Y.to) && f < at(A.shoot) ? <Palm x={PALM + 80} g={0.025} /> : null;

  const world = (
    <g transform={`translate(${W / 2} ${H / 2}) scale(${c.z}) translate(${-c.x} ${-c.y})`}>
      <rect x={-2000} y={GY} width={5000} height={2000} fill={C.ground} />
      {f < at(P.set) && <ellipse cx={PALM} cy={GY + 2} rx={38} ry={8} fill={C.soil} />}
      {mound > 0 && <path d={`M${PALM - 112} ${GY} Q${PALM - 72} ${GY - mound * 2} ${PALM - 32} ${GY}`} fill={C.ink} />}
      {f >= at(A.scoop[0]) && f < at(A.set) && <ellipse cx={HOLE2} cy={GY + 2} rx={30} ry={7} fill={C.soil} />}
      {jugOnGround && <g transform={`translate(650 ${GY - 14})`}><Jug tilt={0} /></g>}
      {g > 0 && <Palm x={PALM} g={g} dates={f >= at(Y.to) - 60 ? prog(f, at(Y.to) - 60, 40) : 0} />}
      {shootAtBase}
      {sapling2}
      {caneTop && caneTip && <Cane top={caneTop} tip={caneTip} />}
      {f < at(Y.to) && goneO > 0 && <g filter="url(#bglow)" opacity={goneO}>
        <Figure p={gp} x={GX} y={GY} s={S} facing={-1} robe ghutra beard color={C.ink} eyeColor={C.eye} eyes={f >= at(D.smile) && f < at(P.kneel) ? 'laugh' : f >= at(P.pet) ? 'laugh' : 'open'} look={[0.6, 0.3]}
          held={{ F: f >= at(P.kneel) && f < at(P.set) ? <g transform="translate(-10 -6)"><Palm x={0} g={0.03} /></g> : f >= at(P.jug) && f < at(P.stand) ? <Jug tilt={f >= at(P.water) ? 70 : 0} /> : undefined }} />
        {f < at(P.kneel) && <Shovel a={gw.N} b={gw.F} />}
      </g>}
      <g filter="url(#bglow)">
        <Figure p={bp} x={bx} y={GY} s={bs} facing={bFacing} robe ghutra={f >= at(Y.from) && youngGhutra} color={C.ink} eyeColor={C.eye} eyes={bEyes}
          look={f >= at(Sh.look) && f < at(A.stand) ? [0.2, 0.8] : f >= at(K.girl) ? [0.6, 0.6] : [0.6, -0.4]}
          held={{ ...yHeld, N: shootInHand ? <g transform="translate(0 30)"><Palm x={0} g={0.025} /></g> : yHeld.N }} />
      </g>
      {f >= at(K.girl) && <g filter="url(#bglow)">
        <Figure p={f < at(K.girlAt) ? pose({ bob: girlWalk.bob, footF: girlWalk.footF, footN: girlWalk.footN, shF: 26 * Math.sin(f / 4), shN: -26 * Math.sin(f / 4) }) : pose({ head: -18, shF: 8, elF: 10 })}
          x={girlX} y={GY} s={0.6} facing={-1} robe bun color={C.ink} eyeColor={C.eye} eyes={f >= at(K.pat) ? 'closed' : 'open'} look={[0.6, -0.5]} />
      </g>}
      {soil}
      {water}
    </g>
  );

  // the words
  const head = (x: number, s: number): [number, number] => toScreen(c, [x, GY - 300 * s]);
  const ask1 = prog(f, at(D.ask), 8, ease.back) * (1 - prog(f, at(D.askEnd), 8));
  const ask2 = prog(f, at(K.askText), 8, ease.back) * (1 - prog(f, at(K.askEnd), 8));
  const t1 = prog(f, at(Sh.text), 14) * (1 - prog(f, at(A.walk), 10)) + prog(f, at(K.text) - 10, 14);
  const t2 = prog(f, at(K.text), 14, ease.back);
  const sign = prog(f, at(K.sign), 14);
  const yearsShown = f >= at(Y.from) + 20 && f < at(Y.to) ? Math.max(1, Math.round(1 + 39 * prog(f, at(Y.from) + 20, at(Y.to) - at(Y.from) - 60, ease.inOut))) : 0;
  const yo = prog(f, at(Y.from) + 20, 10) * (1 - prog(f, at(Y.to) - 10, 10));
  return (
    <AbsoluteFill style={{ background: C.skyTop }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: 'absolute', inset: 0 }}>
        <Sky c={c} night={night} />
        {world}
      </svg>
      <Bubble text="يا جدّي… متى بتاكل منها؟" o={ask1} x={head(bx, KID)[0]} />
      <Bubble text="يا بابا… متى بتاكل منها؟" o={ask2} x={head(girlX, 0.6)[0]} />
      {yearsShown > 0 && <Text text={years(yearsShown)} o={yo} top={250} size={96} />}
      <Text text="زرعوا… فأكلنا." o={Math.min(1, t1)} top={shot === 'ask' ? 230 : 260} size={shot === 'ask' ? 84 : 112} color={shot === 'ask' ? C.textDim : C.text} />
      <Text text="ونزرع… فيأكلون." o={t2} top={350} size={118} />
      <Text text="كتاب وبس" o={sign * 0.85} top={1600} size={40} weight={700} color={C.textDim} />
      <Audio src={staticFile('audio/b-mix.wav')} />
    </AbsoluteFill>
  );
};
