import React from 'react';
import { Img } from 'remotion';
import { BODY, COLORS, COVER_RATIO, LINK, ORDINAL, PICK, PRICE, STEP, TEXT, TINT, TITLE, TRACKS, cover, page } from './config';
import { clamp01, ease, kf, life, mix, p } from './motion';
import { Brand, Chip, Cover3D, FileIcon, Stage3D, T, type CoverPose } from './parts';
import { PATH_END } from './shelf';
import { L0, S, w } from './timing';
import { countUp, Words } from './type';

// Scenes 3–7. The six covers are one set of objects that travel through the ad: they come out of the blue line
// (3), fan out, file into six tracks drawn by the line (4), one is picked and opens into its real pages (5), the
// pages go into a phone as files (6), and the six come back together for the end (7).

const mixPose = (a: CoverPose, b: CoverPose, t: number): CoverPose => ({
  x: mix(a.x, b.x, t), y: mix(a.y, b.y, t), w: mix(a.w, b.w, t), ry: mix(a.ry ?? 0, b.ry ?? 0, t), rz: mix(a.rz ?? 0, b.rz ?? 0, t),
  z: mix(a.z ?? 0, b.z ?? 0, t), o: mix(a.o ?? 1, b.o ?? 1, clamp01(t)), lift: mix(a.lift ?? 0, b.lift ?? 0, t),
});
// Overlaps run so that each cover's right half (its title, set right to left) stays in view: track 6 is nearest.
const fan = (i: number): CoverPose => ({ x: 520 + (2.5 - i) * 116, y: 800 + Math.abs(i - 2.5) * 10, w: 250, ry: -8, rz: (2.5 - i) * 2, z: i * 40 });
/** Six tracks, read right to left: track 1 top right, track 4 bottom right. */
export const GRID = { w: 230, cols: [795, 540, 285], rows: [632, 1042] };
const grid = (i: number): CoverPose => ({ x: GRID.cols[i % 3], y: GRID.rows[Math.floor(i / 3)], w: GRID.w });
/** The picked cover, open as a document in the viewer (scene 5). */
export const DOC = { x: 540, y: 740, w: 520 };
const arc = (i: number): CoverPose => ({ x: 540 + (2.5 - i) * 116, y: 622 + (i - 2.5) ** 2 * 7, w: 200, rz: (2.5 - i) * 3.2, z: i * 34 });

const coverAt = (i: number, f: number): { pose: CoverPose; dim: number } | null => {
  if (f < S.s3 + 6) return null;
  if (f >= S.s7) {
    const t = p(f, S.s7 + 16 + i * 5, 50, ease.settle);
    const a = arc(i);
    const pose = mixPose({ ...a, y: a.y + 560, rz: 0, o: 0 }, a, t);
    return { pose: { ...pose, y: pose.y + Math.sin(f / 46 + i * 1.3) * 3 * t }, dim: 0 };
  }
  if (f >= S.s6) return null;
  const from: CoverPose = { x: PATH_END[0], y: PATH_END[1], w: 26, o: 0 };
  let pose = mixPose(from, fan(i), p(f, S.s3 + 6 + i * 6, 50, ease.settle));
  pose = mixPose(pose, grid(i), p(f, S.s4 + 2 + i * 4, 42, ease.inOut));
  const sel = p(f, w(6, 2) - 4, 18, ease.out);
  let dim = 0;
  if (i === PICK) pose = { ...pose, lift: sel };
  else dim = 0.62 * sel;
  if (f >= S.s5) {
    if (i === PICK) {
      if (f >= S.s5 + 40) return null; // the document viewer takes it from here
      pose = mixPose(pose, { ...DOC, lift: 0 }, p(f, S.s5, 40, ease.inOut));
    } else {
      const g = p(f, S.s5, 20, ease.in);
      pose = { ...pose, o: (pose.o ?? 1) * (1 - g), w: pose.w * (1 - 0.12 * g) };
    }
  }
  return { pose, dim };
};

export const Covers: React.FC<{ f: number }> = ({ f }) => {
  const list = TRACKS.map((_, i) => ({ i, c: coverAt(i, f) })).filter((x) => x.c);
  // paint back to front (track 1 furthest), the picked one last once it is lifted
  list.sort((a, b) => (a.i === PICK && f > w(6, 2) - 4 ? 1 : b.i === PICK && f > w(6, 2) - 4 ? -1 : a.i - b.i));
  return <Stage3D>{list.map(({ i, c }) => <Cover3D key={i} n={TRACKS[i].n} pose={c!.pose} dim={c!.dim} />)}</Stage3D>;
};

// ——— scene 3: the name, 99, files ———
export const Product: React.FC<{ f: number }> = ({ f }) => {
  if (f < S.s3 || f > S.s4 + 30) return null;
  const n99 = w(4, 0);
  const up = p(f, n99 - 12, 26, ease.inOut); // the name moves up to make room for 99
  const out = p(f, S.s4 - 4, 18, ease.in);
  const count = countUp(f, n99, TEXT.s3.count, 44);
  const show99 = p(f, n99 - 4, 20, ease.out) * (1 - out);
  const unit = p(f, n99 + 18, 22, ease.out) * (1 - out);
  const files = life(f, S.s3 + 74, S.s4 - 6, 20, 16);
  return (
    <>
      <div style={{ position: 'absolute', left: 0, top: 0, width: 1080, transformOrigin: '540px 120px', transform: `translateY(${-34 * up}px) scale(${mix(1, 0.62, up)})` }}>
        <Words f={f} text={TEXT.s3.name} at={w(3, 1) - 6} top={112} size={96} out={S.s4 - 6} stagger={7} />
      </div>
      {show99 > 0.001 && (
        <div dir="rtl" style={{ position: 'absolute', left: 90, width: 900, top: 158, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 26 }}>
          <div style={{ fontFamily: TITLE, fontWeight: 800, fontSize: 236, lineHeight: 1, color: COLORS.green, opacity: show99, transform: `scale(${mix(0.7, 1, show99)})`, fontVariantNumeric: 'tabular-nums', minWidth: 270, textAlign: 'center', paddingTop: 18 }}>{count}</div>
          <div lang="ar" style={{ fontFamily: TITLE, fontWeight: 800, fontSize: 70, lineHeight: 1.1, color: COLORS.white, opacity: unit, transform: `translateX(${mix(-30, 0, unit)}px)` }}>{TEXT.s3.unit}</div>
        </div>
      )}
      {files > 0.001 && (
        <Chip cx={540} cy={1112} o={files} s={mix(0.9, 1, files)}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 14 }}>
            <span style={{ position: 'relative', width: 28, height: 36, display: 'inline-block' }}><FileIcon x={0} y={0} w={28} color={COLORS.blue} /></span>
            {TEXT.s3.files}
          </span>
        </Chip>
      )}
    </>
  );
};

// ——— scene 4: the six tracks, drawn by the line ———
const RAIL = { y1: 440, y2: 864, right: 942, left: 168 };
export const Tracks: React.FC<{ f: number }> = ({ f }) => {
  if (f < S.s4 - 4 || f > S.s5 + 30) return null;
  const out = p(f, S.s5 - 2, 20, ease.in);
  const word = [w(5, 0), w(5, 1), w(5, 2), w(5, 4), w(5, 5), w(5, 6)];
  const r1 = kf(f, [[word[0] - 14, 0], [word[0], 0.19], [word[1], 0.52], [word[2], 0.85], [word[2] + 12, 1]], ease.inOut);
  const len2 = (RAIL.y2 - RAIL.y1) + (RAIL.right - RAIL.left);
  const at2 = (x: number) => ((RAIL.y2 - RAIL.y1) + (RAIL.right - x)) / len2;
  const r2 = kf(f, [[word[2] + 6, 0], [word[3], at2(795)], [word[4], at2(540)], [word[5], at2(285)], [word[5] + 12, 1]], ease.inOut);
  const sel = w(6, 2) - 4;
  const ring = p(f, sel + 4, 26, ease.inOut);
  const g = grid(PICK);
  const gh = GRID.w * COVER_RATIO;
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: 1 - out }}>
      <svg width={1080} height={1350} style={{ position: 'absolute', overflow: 'visible' }}>
        <circle cx={RAIL.right} cy={RAIL.y1} r={10 * p(f, word[0] - 22, 10)} fill={COLORS.blue} />
        <path d={`M${RAIL.right} ${RAIL.y1} H${RAIL.left}`} fill="none" stroke={COLORS.blue} strokeWidth={6} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - r1} />
        <path d={`M${RAIL.right} ${RAIL.y1} V${RAIL.y2} H${RAIL.left}`} fill="none" stroke={COLORS.blue} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - r2} />
        {TRACKS.map((_, i) => {
          const c = grid(i), top = c.y - gh / 2, y0 = i < 3 ? RAIL.y1 : RAIL.y2;
          const d = p(f, word[i] - 2, 10, ease.out);
          return <line key={i} x1={c.x} x2={c.x} y1={y0} y2={mix(y0, top, d)} stroke={COLORS.blue} strokeWidth={6} strokeLinecap="round" opacity={d > 0 ? 1 : 0} />;
        })}
        {ring > 0 && (
          <rect x={g.x - g.w / 2 - 14} y={g.y - gh / 2 - 14 - 14} width={g.w + 28} height={gh + 28} rx={18} fill="none" stroke={COLORS.green} strokeWidth={7} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - ring} />
        )}
      </svg>
      {TRACKS.map((t, i) => {
        const c = grid(i), top = c.y + gh / 2 + 8;
        const o = p(f, word[i] - 4, 14, ease.out);
        const picked = i === PICK && f > sel;
        const dim = i !== PICK ? p(f, sel, 18) : 0;
        return (
          <T key={i} x={c.x - 130} y={top} w={260} size={36} weight={700} o={o * (1 - 0.55 * dim)} color={picked ? COLORS.green : COLORS.white} style={{ transform: `translateY(${mix(14, 0, o)}px)` }}>{t.short}</T>
        );
      })}
      <Words f={f} text={TEXT.s4[0]} at={S.s4 + 6} top={112} size={86} out={S.s5 - 6} hi={{ 0: COLORS.green }} />
      <Words f={f} text={TEXT.s4[1]} at={w(6, 0) - 4} top={222} size={62} out={S.s5 - 4} hi={{ 2: COLORS.green }} />
    </div>
  );
};

// ——— scenes 5–6: the document, then the phone ———
const VIEW = { x: 120, y: 330, w: 840, h: 820 };
const SCREEN = { x: 354, y: 384, w: 372, h: 786 };
const PHONE = { x: 340, y: 370, w: 400, h: 814 };
/** Where the doc camera looks: [page, zoom, focus u, focus v] at each moment. */
const docShots = () => [
  { t: S.s5 + 40, page: 5, z: 1, u: 0.5, v: 0.5 },
  { t: S.s5 + 104, page: 5, z: 1.7, u: 0.54, v: 0.33 }, // the title «قوة العادات»
  { t: w(7, 0) + 10, page: 5, z: 1.9, u: 0.56, v: 0.62 }, // «المفاهيم الجوهرية»
  { t: w(7, 2) + 18, page: 7, z: 1.9, u: 0.56, v: 0.4 }, // «دراسات الحالة»
  { t: w(7, 3) + 18, page: 8, z: 2.1, u: 0.56, v: 0.33 }, // «هندسة السلوك»: the three steps
  { t: S.s6 + 8, page: 8, z: 1, u: 0.5, v: 0.5 }, // the whole page, before it goes into the phone
];
export const Doc: React.FC<{ f: number }> = ({ f }) => {
  if (f < S.s5 + 30 || f > S.s7 + 30) return null;
  const shots = docShots();
  let k = 0;
  for (let i = 0; i < shots.length; i++) if (f >= shots[i].t - 40) k = i;
  const a = shots[Math.max(0, k - 1)], b = shots[k];
  const t = k === 0 ? 1 : p(f, b.t - 40, 40, ease.inOut);
  const z = mix(a.z, b.z, t), u = mix(a.u, b.u, t), v = mix(a.v, b.v, t);
  const ph = DOC.w * COVER_RATIO;
  const left = DOC.x - DOC.w / 2, top = DOC.y - ph / 2;
  const fx = left + u * DOC.w, fy = top + v * ph;
  // the viewer frame: grows around the opened file, then becomes the phone's screen (scene 6)
  const toPhone = p(f, S.s6 + 6, 34, ease.inOut);
  const frame = p(f, S.s5 + 30, 20, ease.out);
  const vx = mix(VIEW.x, SCREEN.x, toPhone), vy = mix(VIEW.y, SCREEN.y, toPhone), vw = mix(VIEW.w, SCREEN.w, toPhone), vh = mix(VIEW.h, SCREEN.h, toPhone);
  const cur = b.page as 5 | 7 | 8, prev = a.page as 5 | 7 | 8;
  const flip = cur !== prev ? p(f, b.t - 46, 34, ease.inOut) : 1;
  const coverFlip = p(f, S.s5 + 40, 34, ease.inOut);
  const cam = `translate(${540}px, ${740}px) scale(${z}) translate(${-fx}px, ${-fy}px)`;
  const pageEl = (n: 5 | 7 | 8, style: React.CSSProperties = {}) => (
    <div style={{ position: 'absolute', left, top, width: DOC.w, height: ph, background: COLORS.white, borderRadius: 6, overflow: 'hidden', backfaceVisibility: 'hidden', ...style }}>
      <Img src={page(n)} style={{ width: '100%', height: '100%', display: 'block' }} />
    </div>
  );
  // inside the phone: the opened page → the file list → tap «العادات» → the summary opens
  const list = p(f, S.s6 + 40, 22, ease.inOut);
  const tap = w(8, 4) - 6;
  const opened = p(f, w(8, 5), 26, ease.inOut);
  const inPhone = toPhone > 0;
  const docO = 1 - list;
  const phoneO = p(f, S.s6 + 14, 26, ease.out) * (1 - p(f, S.s7, 22, ease.in));
  const phoneY = 260 * p(f, S.s7, 26, ease.in);
  const viewerO = (1 - p(f, S.s7, 22, ease.in));
  return (
    <div style={{ position: 'absolute', inset: 0, transform: `translateY(${phoneY}px)` }}>
      {/* the phone body */}
      {phoneO > 0 && (
        <div style={{ position: 'absolute', left: PHONE.x, top: PHONE.y, width: PHONE.w, height: PHONE.h, borderRadius: 58, background: TINT.navyLift, border: `3px solid ${TINT.line}`, boxShadow: '0 30px 60px rgba(0,0,0,0.5)', opacity: phoneO }} />
      )}
      {/* the viewer / the phone screen */}
      <div style={{ position: 'absolute', left: vx, top: vy, width: vw, height: vh, borderRadius: mix(30, 44, toPhone), overflow: 'hidden', opacity: viewerO * frame,
        background: inPhone ? COLORS.white : TINT.panel, border: inPhone ? 'none' : `2px solid ${TINT.line}` }}>
        <div style={{ position: 'absolute', left: -vx, top: -vy, width: 1080, height: 1350 }}>
          {/* the pages, under the camera; in the phone they shrink with the screen */}
          <div style={{ position: 'absolute', inset: 0, opacity: docO, transformOrigin: '540px 740px', transform: inPhone ? `translate(0px, ${mix(0, SCREEN.y + (ph * SCREEN.w) / DOC.w / 2 - DOC.y, toPhone)}px) scale(${mix(1, SCREEN.w / DOC.w, toPhone)})` : undefined }}>
            <div style={{ position: 'absolute', inset: 0, perspective: 2400, perspectiveOrigin: '540px 740px' }}>
              <div style={{ position: 'absolute', inset: 0, transformOrigin: '0 0', transform: cam, transformStyle: 'preserve-3d' }}>
                {pageEl(cur)}
                {flip < 1 && pageEl(prev, { transformOrigin: 'right center', transform: `rotateY(${-178 * flip}deg)`, boxShadow: '0 10px 30px rgba(0,0,0,0.3)' })}
                {coverFlip < 1 && (
                  <div style={{ position: 'absolute', left, top, width: DOC.w, height: ph, transformOrigin: 'right center', transform: `rotateY(${-178 * coverFlip}deg)`, backfaceVisibility: 'hidden', borderRadius: DOC.w * 0.035, overflow: 'hidden' }}>
                    <Img src={cover(TRACKS[PICK].n)} style={{ width: '100%', height: '100%', display: 'block' }} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        {inPhone && list > 0 && <FileList f={f} o={list} tap={tap} opened={opened} />}
      </div>
    </div>
  );
};

/** The phone's file list (what the buyer has: six PDF files), then the picked file open. Screen units. */
const FileList: React.FC<{ f: number; o: number; tap: number; opened: number }> = ({ f, o, tap, opened }) => {
  const ripple = p(f, tap, 22, ease.out);
  const rowH = 104, top0 = 120;
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: o, background: COLORS.white }}>
      <div style={{ position: 'absolute', inset: 0, transform: `translateX(${-SCREEN.w * 0.35 * opened}px)`, opacity: 1 - opened }}>
        <T x={24} y={52} w={SCREEN.w - 48} size={34} weight={800} font={TITLE} color={COLORS.navy} align="right">{TEXT.s6.files}</T>
        {TRACKS.map((t, i) => {
          const y = top0 + i * rowH;
          return (
            <div key={i} style={{ position: 'absolute', left: 16, top: y, width: SCREEN.w - 32, height: rowH - 12, borderRadius: 18, background: i === PICK && ripple > 0 ? `rgba(46,123,197,${0.18 * (1 - ripple * 0.4)})` : 'rgba(7,21,37,0.04)', overflow: 'hidden' }}>
              <FileIcon x={SCREEN.w - 32 - 62} y={18} w={42} color={COLORS.blue} fill="rgba(46,123,197,0.1)" />
              <T x={14} y={14} w={SCREEN.w - 32 - 96} size={24} weight={700} color={COLORS.navy} align="right" lh={1.25}>{`المسار ${ORDINAL[i]} · ${t.short}`}</T>
              <T x={14} y={50} w={SCREEN.w - 32 - 96} size={20} weight={600} color="rgba(7,21,37,0.55)" align="right">{`${t.pages} ${TEXT.s6.pages}`}</T>
              {i === PICK && ripple > 0 && ripple < 1 && <div style={{ position: 'absolute', left: SCREEN.w / 2 - 16 - 120 * ripple, top: (rowH - 12) / 2 - 120 * ripple, width: 240 * ripple, height: 240 * ripple, borderRadius: '50%', background: COLORS.blue, opacity: 0.22 * (1 - ripple) }} />}
            </div>
          );
        })}
      </div>
      {/* the opened summary, scrolling gently */}
      {opened > 0 && (
        <div style={{ position: 'absolute', inset: 0, transform: `translateX(${(1 - opened) * SCREEN.w}px)`, background: COLORS.white }}>
          <Img src={page(5)} style={{ position: 'absolute', left: 0, top: -kf(f, [[S.s6 + 120, 0], [S.s7, 120]], ease.inOut), width: SCREEN.w, height: SCREEN.w * COVER_RATIO }} />
        </div>
      )}
    </div>
  );
};

/** Scene 5–6 words: the reading time, the structure, the real step; then the phone's lines. */
export const DocWords: React.FC<{ f: number }> = ({ f }) => {
  if (f < S.s5 - 4 || f > S.s7 + 30) return null;
  const flowIn = life(f, w(7, 0) - 10, S.s6 - 4, 18, 16);
  const act = [w(7, 0), w(7, 2), w(7, 3)];
  const stepAt = w(7, 3) + 8;
  const card = p(f, stepAt, 30, ease.settle);
  const cardOut = p(f, S.s6 - 8, 24, ease.inOut); // the card goes into the phone
  const terms = [w(8, 6), w(8, 8)];
  return (
    <>
      <Words f={f} text={TEXT.s5.time} at={S.s5 + 4} top={168} size={78} out={w(7, 3) - 12} hi={{ 3: COLORS.green }} />
      <Words f={f} text={TEXT.s5.steps} at={w(7, 3) - 2} top={168} size={78} out={S.s6 - 6} hi={{ 0: COLORS.green }} />
      {/* concepts ← examples ← application */}
      {flowIn > 0.001 && (
        <div style={{ position: 'absolute', inset: 0, opacity: flowIn }}>
          <svg width={1080} height={1350} style={{ position: 'absolute', overflow: 'visible' }}>
            {[[720, 610], [470, 360]].map(([x1, x2], k) => {
              const d = p(f, act[k + 1] - 10, 14, ease.out);
              return (
                <g key={k} opacity={0.35 + 0.65 * d}>
                  <line x1={x1} x2={mix(x1, x2, Math.max(0.15, d))} y1={1222} y2={1222} stroke={COLORS.blue} strokeWidth={5} strokeLinecap="round" />
                  {d > 0.8 && <path d={`M${x2 + 14} ${1210} L${x2} 1222 L${x2 + 14} 1234`} fill="none" stroke={COLORS.blue} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />}
                </g>
              );
            })}
          </svg>
          {TEXT.s5.flow.map((label, k) => {
            const on = p(f, act[k] - 4, 12, ease.out);
            const last = k === 2;
            return (
              <Chip key={k} cx={[830, 540, 250][k]} cy={1222} s={mix(0.94, 1.04, on)} size={36}
                fill={on > 0.5 ? (last ? COLORS.green : COLORS.blue) : TINT.panel} border={on > 0.5 ? 'transparent' : TINT.line}
                color={on > 0.5 && last ? COLORS.navy : COLORS.white}>{label}</Chip>
            );
          })}
        </div>
      )}
      {/* the real step, lifted out of page 8 */}
      {card > 0.001 && cardOut < 1 && (
        <div style={{ position: 'absolute', left: 110, top: 552, width: 860, opacity: clamp01(card * 1.6) * (1 - cardOut),
          transform: `translateY(${mix(120, 0, card) + 105 * cardOut}px) scale(${mix(0.72, 1, card) * mix(1, 0.3, cardOut)})`, transformOrigin: '430px 120px' }}>
          <div dir="rtl" style={{ background: COLORS.white, borderRadius: 26, padding: '30px 40px 34px', boxShadow: '0 30px 70px rgba(0,0,0,0.55)', borderRight: `14px solid ${COLORS.green}` }}>
            <div lang="ar" style={{ fontFamily: BODY, fontWeight: 700, fontSize: 28, color: COLORS.blue, marginBottom: 8 }}>{STEP.from}</div>
            <div lang="ar" style={{ fontFamily: TITLE, fontWeight: 800, fontSize: 48, color: COLORS.navy, lineHeight: 1.25, marginBottom: 14 }}>{STEP.title}</div>
            <div lang="ar" style={{ fontFamily: BODY, fontWeight: 700, fontSize: 38, color: COLORS.navy, lineHeight: 1.55 }}>{STEP.body}</div>
          </div>
        </div>
      )}
      {/* scene 6 */}
      <Words f={f} text={TEXT.s6.open} at={w(8, 2) - 8} top={168} size={78} out={S.s7 - 6} hi={{ 2: COLORS.green }} />
      {terms.map((t, k) => {
        const o = life(f, t - 6, S.s7 - 6, 18, 14);
        return o > 0.001 && (
          <Chip key={k} cx={[690, 390][k]} cy={1238} o={o} s={mix(0.9, 1, o)} size={38} fill={TINT.greenSoft} border={COLORS.green}>
            {TEXT.s6.terms[k]}
          </Chip>
        );
      })}
      {life(f, terms[1] - 6, S.s7 - 6, 18, 14) > 0.001 && <div style={{ position: 'absolute', left: 534, top: 1232, width: 12, height: 12, borderRadius: 6, background: COLORS.green, opacity: life(f, terms[1] - 6, S.s7 - 6, 18, 14) }} />}
    </>
  );
};

// ——— scene 7: the end ———
export const Finale: React.FC<{ f: number }> = ({ f }) => {
  if (f < S.s7) return null;
  const name = p(f, w(9, 3) - 6, 24, ease.out);
  const cta = p(f, L0(10) - 14, 28, ease.settle);
  const link = p(f, w(10, 2) - 10, 22, ease.out);
  const brand = p(f, L0(10) + 16, 24, ease.out);
  return (
    <>
      <Words f={f} text={TEXT.s7.line} at={S.s7 + 12} top={150} size={84} hi={{ 2: COLORS.green }} stagger={6} />
      <T x={90} y={880} w={900} size={66} weight={800} font={TITLE} o={name} style={{ transform: `translateY(${mix(24, 0, name)}px)` }}>{TEXT.s7.name}</T>
      <div style={{ position: 'absolute', left: PRICE.show ? 620 : 540, top: 1040, transform: `translate(-50%, -50%) scale(${mix(0.6, 1, cta)})`, opacity: clamp01(cta * 1.5) }}>
        <div dir="rtl" lang="ar" style={{ fontFamily: TITLE, fontWeight: 800, fontSize: 50, color: COLORS.navy, background: COLORS.green, borderRadius: 999, padding: '14px 64px 22px', whiteSpace: 'nowrap', boxShadow: '0 14px 30px rgba(0,0,0,0.35)' }}>{TEXT.s7.cta}</div>
      </div>
      {PRICE.show && <Chip cx={330} cy={1040} o={clamp01(cta * 1.5)} size={40}>{PRICE.text}</Chip>}
      <T x={90} y={1112} w={900} size={46} weight={700} dir="ltr" o={link} style={{ transform: `translateY(${mix(16, 0, link)}px)`, letterSpacing: 0.5 }}>{LINK}</T>
      <Brand cx={540} cy={1222} o={brand} s={0.82} name={TEXT.s7.brand} />
    </>
  );
};
