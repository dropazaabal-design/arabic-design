import React from 'react';
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from 'remotion';
import { VesselDefs } from './art/props';
import { B, F } from './beats';
import { loadFonts } from './fonts';
import { BucketWorld, bucketCamera } from './scenes/bucket';
import { Compare } from './scenes/compare';
import { Exit, exitCamera } from './scenes/exit';
import { Plan } from './scenes/plan';
import { Study, bubble4 } from './scenes/study';
import { Workshop, bubble5 } from './scenes/workshop';
import { Caption, Pill, Steps, Title, Words } from './text';
import { C, H, SKY, W } from './theme';
import { TL, ease, mix, prog, sec, segAt } from './time';

loadFonts();

// ---------------------------------------------------------------------------
// Light of each part of the story, cross-faded where the parts meet.
// ---------------------------------------------------------------------------
const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mixHex = (a: string, b: string, p: number) => `rgb(${hex(a).map((v, i) => Math.round(mix(v, hex(b)[i], p))).join(',')})`;
const PARTS: Array<[number, keyof typeof SKY]> = [
  [0, 'night'], [B.toCup, 'study'], [F.s5, 'dusk'], [F.s6, 'split'], [F.s7, 'plan'], [F.s8, 'night'], [B.out + 4, 'dawn'],
];
const skyAt = (f: number): [string, string] => {
  let top = SKY.night[0];
  let bot = SKY.night[1];
  for (let i = 0; i < PARTS.length; i++) {
    const [at, name] = PARTS[i];
    const p = prog(f, at - 6, name === 'dawn' ? 40 : 20, ease.inOut);
    if (p <= 0) break;
    top = mixHex(top.startsWith('#') ? top : rgbToHex(top), SKY[name][0], p);
    bot = mixHex(bot.startsWith('#') ? bot : rgbToHex(bot), SKY[name][1], p);
  }
  return [top, bot];
};
const rgbToHex = (rgb: string) => '#' + rgb.slice(4, -1).split(',').map((v) => Number(v).toString(16).padStart(2, '0')).join('');

const Sky: React.FC = () => {
  const f = useCurrentFrame();
  const [top, bot] = skyAt(f);
  return <AbsoluteFill style={{ background: `linear-gradient(180deg, ${top} 0%, ${bot} 100%)` }} />;
};

const Grain: React.FC = () => (
  <svg width={W} height={H} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
    <defs>
      <filter id="paper">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={11} />
        <feColorMatrix values="0 0 0 0 0.97  0 0 0 0 0.93  0 0 0 0 0.86  0 0 0 0.08 0" />
      </filter>
      <radialGradient id="vignette" cx="50%" cy="46%" r="78%">
        <stop offset="58%" stopColor="#000" stopOpacity={0} />
        <stop offset="100%" stopColor="#000" stopOpacity={0.5} />
      </radialGradient>
    </defs>
    <rect width={W} height={H} filter="url(#paper)" />
    <rect width={W} height={H} fill="url(#vignette)" />
  </svg>
);

const World: React.FC = () => {
  const f = useCurrentFrame();
  const seed = (Math.floor(f / 4) % 3) + 2;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: 'absolute', inset: 0 }}>
      <VesselDefs />
      <defs>
        <filter id="boil" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves={1} seed={seed} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale={4} xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
      <g filter="url(#boil)">
        {f <= B.toCup + 30 && <g transform={bucketCamera(f)}><BucketWorld f={f} /></g>}
        <Study f={f} />
        <Workshop f={f} />
        <Compare f={f} />
        <Plan f={f} />
        {f >= F.s8 - 4 && <g transform={exitCamera(f)}><Exit f={f} /></g>}
      </g>
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Words on screen: the meaning words only, one idea at a time.
// ---------------------------------------------------------------------------
const Texts: React.FC = () => {
  const f = useCurrentFrame();
  const b4 = bubble4(f);
  const b5 = bubble5(f);
  const focus = f < B.st2 ? 0 : f < B.st3 ? 1 : f < B.watch ? 2 : -1;
  return (
    <AbsoluteFill>
      <Title text={`كلما تقدّمت… {${C.red}|جرّوك للخلف}`} from={0} to={F.s2 + 6} size={116} pop />
      <Title text={`الطريق {${C.amber}|مفتوح}`} from={B.open} to={B.name + 4} />
      <Caption text={`والسحب {${C.red}|من الداخل}`} from={B.inside} to={B.name + 4} top={340} size={68} weight={800} />
      <Title text={`عقلية {${C.red}|السلطعون}`} from={B.name - 2} to={B.toCup - 2} size={128} />
      <Title text={`راح {${C.blueLight}|أتعلّم}`} from={B.learn} to={F.s5 + 4} />
      {f >= B.doubt && b4.o > 0 && (
        <Words text={"وحتى اللي تعلّموا…\nماذا حققوا؟"} x={b4.x} y={b4.y} w={720} size={60} o={b4.o} rot={b4.rot} scale={b4.scale} />
      )}
      <Title text={`مشروع {${C.green}|صغير}`} from={B.build} to={F.s6 + 4} />
      {f >= B.shrink && b5.o > 0 && <Words text="خفّف أحلامك" x={b5.x} y={b5.y} w={520} size={68} o={b5.o} rot={b5.rot} />}
      <Title text={`{${C.green}|نصيحة} ولا {${C.red}|تثبيط؟}`} from={B.warn} to={F.s7 + 4} size={108} />
      <Pill text="تصلّح الطريق" x={800} y={1474} bg={C.greenDeep} from={segAt('s11', 0.4)} to={F.s7 + 4} size={46} w={420} />
      <Pill text="توقف المحاولة" x={280} y={1474} bg={C.redDeep} from={segAt('s12', 0.3)} to={F.s7 + 4} size={46} w={420} />
      <Title text={`كيف تتعامل {${C.amber}|معه؟}`} from={B.how} to={B.st1 + 4} size={92} />
      <Steps from={B.st1} to={B.watch + 6} focus={focus} items={[
        { text: 'قلّل مشاركة خططك', at: B.st1 + 2, color: C.blue },
        { text: 'اسأل صاحب تجربة', at: B.st2 + 2, color: C.green },
        { text: 'قِس تقدّمك', at: B.st3 + 2, color: C.amberDeep },
      ]} />
      <Title text={`راقب {${C.amber}|الأثر}…\nلا النوايا`} from={B.watch + 6} to={F.s8 + 4} size={96} />
      <Title text={`عدّل… {${C.green}|وواصل}`} from={B.stumble + 2} to={B.out + 4} />
      <Title text={`ما تحتاج {${C.amber}|موافقة السطل}`} from={B.final} to={F.end + 2} size={118} />
      <Caption text="كتاب وبس" from={F.end - sec(1.6)} to={F.end + 10} top={1540} size={46} weight={800} color={C.paper} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Sound: the narration, and light effects on the actions only.
// ---------------------------------------------------------------------------
const SFX: Array<[string, number, number]> = [
  ['tick', 2, 0.15], ['tick', 13, 0.15], ['snap', B.grab, 0.5], ['whoosh', B.yank - 2, 0.4], ['thud', B.yankEnd, 0.4],
  ['scrape', B.slip - 4, 0.3], ['snap', B.slip + 14, 0.22],
  ['whoosh', F.s2, 0.2], ['snap', B.inside + 8, 0.35], ['whoosh', B.inside + 14, 0.3], ['pop', B.name + 4, 0.25],
  ['snap', B.pullAll + 6, 0.4], ['whoosh', B.pullAll + 12, 0.3], ['pageflip', B.metaphor + 2, 0.3],
  ['whoosh', B.toCup, 0.25], ['pop', B.toCup + 30, 0.22],
  ['pageflip', B.learn + 2, 0.4], ['scribble', B.learn + 14, 0.2], ['pop', B.doubt, 0.3], ['thud', B.slam, 0.6], ['pageflip', B.slam + 2, 0.3],
  ['thud', B.build + 9, 0.35], ['thud', B.build + 14, 0.35], ['thud', B.build + 19, 0.35], ['chime', B.build + 26, 0.18],
  ['pop', B.shrink, 0.25], ['crack', B.crush, 0.5], ['thud', B.crush + 18, 0.4],
  ['whoosh', F.s6, 0.22], ['pop', B.warn + 8, 0.22], ['pop', B.warn + 14, 0.22],
  ['ratchet', B.fix, 0.45], ['tick', B.fix + 14, 0.4],
  ['snap', B.stop + 8, 0.4], ['whoosh', B.stop + 10, 0.3], ['crack', B.stop + 14, 0.32], ['thud', B.stop + 30, 0.35],
  ['whoosh', F.s7, 0.2], ['click', B.st1 + 18, 0.45], ['pop', B.st1 + 20, 0.18], ['thud', B.st1 + 34, 0.4],
  ['pop', B.st2, 0.22], ['chime', B.st2 + 12, 0.25], ['ratchet', B.st2 + 28, 0.32], ['thud', B.st2 + 34, 0.4],
  ['tick', B.st3 + 6, 0.32], ['tick', B.st3 + 11, 0.32], ['tick', B.st3 + 16, 0.32], ['thud', B.st3 + 24, 0.4],
  ['pop', B.watch + 44, 0.22], ['whoosh', B.watch + 50, 0.18],
  ['whoosh', F.s8, 0.2], ['tick', B.stumble + 9, 0.25], ['tick', B.stumble + 18, 0.25], ['scrape', B.stumble + 24, 0.35],
  ['ratchet', B.adjust, 0.45], ['tick', B.adjust + 14, 0.4], ['snap', B.out + 18, 0.4], ['thud', B.out + 30, 0.4], ['chime', B.out + 30, 0.3],
];

export const Reel: React.FC = () => (
  <AbsoluteFill style={{ background: C.ink }}>
    <Sky />
    <World />
    <Grain />
    <Texts />
    {TL.segments.filter((s) => s.measured).map((s) => (
      <Sequence key={s.id} from={sec(s.start)} layout="none">
        <Audio src={staticFile(`voice/${s.id}.wav`)} />
      </Sequence>
    ))}
    {SFX.filter(([, at]) => at >= 0 && at < TL.durationInFrames).map(([name, at, vol], i) => (
      <Sequence key={i} from={at} durationInFrames={sec(1.6)} layout="none">
        <Audio src={staticFile(`sfx/${name}.wav`)} volume={vol} />
      </Sequence>
    ))}
  </AbsoluteFill>
);
