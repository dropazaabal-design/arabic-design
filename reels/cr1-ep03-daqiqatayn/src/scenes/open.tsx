import React from 'react';
import { pose } from '../../../../motion-core/src/cartoon';
import { reach } from '../../../../motion-core/src/characters/SvgPerson';
import { BoxLid, Bedroom, NIGHTSTAND_TOP, NIGHTSTAND_X, SEAT_X, Shoe, ShoeBox } from '../props';
import { Actor, F, Frame, camMix, type Cam } from '../stage';
import { C, SULTAN } from '../theme';
import { ease, prog, sec } from '../time';

// The turn of the story, as one continuous shot (the reel plays it short: no doubt beat when doubt ≥ decide): on the bed edge he looks at the box he has avoided for a
// month, hesitates, decides, lifts the lid, takes out a shoe and looks at it. Beats are frames from `k`.
export type OpenBeats = { start: number; look: number; doubt: number; decide: number; lid: number; inside: number; take: number; up: number; end: number };

const S = 1.75; // character scale in this room
const X = SEAT_X, Y = 0;
const toChar = (wx: number, wy: number): [number, number] => [(wx - X) / S, (wy - Y) / S];
const BOX = { x: NIGHTSTAND_X + 10, y: NIGHTSTAND_TOP, w: 220, h: 96 };

export const OpenBox: React.FC<{ f: number; k: OpenBeats; dim?: number }> = ({ f, k, dim = 0 }) => {
  // hands resting on the knees (the knee is one thigh-length in front of the hip when seated)
  const seated = reach(reach(pose('seated', { headTurn: 0.55 }), 'N', [58, -84], 'open'), 'F', [70, -86], 'open');
  const lean = (l: number) => ({ ...seated, lean: l });
  // the near hand on the lid, then lifting it; the far hand into the box, then up to his face
  const onLid = reach({ ...lean(26), headTurn: 0.8 }, 'N', toChar(BOX.x - 40, BOX.y - BOX.h + 4));
  const lifted = reach({ ...onLid, lean: 18 }, 'N', toChar(BOX.x + 40, BOX.y - BOX.h - 60)); // up off the box and over to its far side
  const inBox = reach({ ...lifted, lean: 24 }, 'F', toChar(BOX.x + 30, BOX.y - BOX.h + 40));
  const shoeUp = reach({ ...lifted, shN: seated.shN, elN: seated.elN, lean: 6, headTurn: 0.7, headTilt: 8 }, 'F', toChar(X + 215, -400), 'grip', -1); // held out in front, below his eyes; elbow down so the arm never crosses his face
  const holding = f >= k.take;
  const lidHeld = f >= k.lid && f < k.inside; // then it is set down against the nightstand
  const lidDown = f >= k.inside;
  const c: Cam = camMix({ x: 20, y: -500, z: 2.1 }, { x: 50, y: -530, z: 2.35 }, prog(f, k.decide, k.up - k.decide, ease.inOut));
  return (
    <Frame c={c} bg={C.bg} world={<>
      <Bedroom dim={dim} sun={prog(f, k.decide, sec(3))} stand={NIGHTSTAND_X} />
      <g transform={`translate(${BOX.x} ${BOX.y})`}>
        <ShoeBox w={BOX.w} h={BOX.h} lid={0} drawLid={!lidHeld && !lidDown} shoes={holding ? 1 : 2} dust={1 - prog(f, k.lid, sec(0.6))} f={f} />
        {lidDown && <g transform={`translate(${BOX.w / 2 + 30} ${-BOX.y}) rotate(-78)`}><BoxLid w={BOX.w} /></g>}
        {/* the pair catches the light when the lid comes off */}
        {f >= k.inside && <g opacity={Math.sin(Math.min(1, (f - k.inside) / sec(0.9)) * Math.PI)}>
          {[[-60, -120], [50, -132], [96, -96]].map(([x, y], j) => <path key={j} transform={`translate(${x} ${y})`} d="M0 -14 L4 -4 L14 0 L4 4 L0 14 L-4 4 L-14 0 L-4 -4 Z" fill={C.shoe} />)}
        </g>}
      </g>
      <Actor f={f} d={{
        look: SULTAN, id: 'open', seed: 7, x: X, y: Y, scale: S, facing: 1, feet: 'slipper',
        pose: [
          { at: 0, to: { ...seated, lean: 4, headTilt: 6 } }, // hands on his knees
          { at: k.look, to: { ...seated, lean: 2, headTurn: 0.95, headTilt: 6 }, dur: sec(0.5) },
          ...(k.doubt < k.decide ? [{ at: k.doubt, to: { ...seated, lean: -3, shN: -150, elN: -72, headTilt: -8, headTurn: 0.6 }, dur: sec(0.4) }] : []),
          { at: k.decide, to: { ...seated, lean: 6, headTurn: 0.85, headTilt: 4 }, dur: sec(0.35) },
          { at: k.lid - sec(0.55), to: onLid, dur: sec(0.55) },
          { at: k.lid + sec(0.1), to: lifted, dur: sec(0.6) },
          { at: k.inside, to: { ...inBox, shN: seated.shN, elN: seated.elN }, dur: sec(0.6) },
          { at: k.up, to: shoeUp, dur: sec(0.7) },
        ],
        face: [
          F(0, 'calm', { gx: 0.2, gy: 0.6, lid: 0.35 }),
          F(k.look, 'calm', { gx: 1, gy: 0.4 }, sec(0.25)), F(k.look + sec(0.45), 'worried', { gx: 1, gy: 0.4 }, sec(0.3)),
          ...(k.doubt < k.decide ? [F(k.doubt, 'embarrassed', { gx: -0.6, gy: 0.2 }, sec(0.3))] : []),
          F(k.decide, 'determined', { gx: 1, gy: 0.5 }, sec(0.25)),
          F(k.inside, 'surprised', { gx: 1, gy: 0.8 }, sec(0.15)), F(k.inside + sec(0.5), 'smile', { gx: 1, gy: 0.8 }, sec(0.3)),
          F(k.up + sec(0.3), 'grin', { gx: 1, gy: 0.35, sparkle: 0.8 }, sec(0.35)),
        ],
        handF: holding || (f > k.take - sec(0.5)) ? 'grip' : 'open',
        holdF: holding ? <g transform="translate(6 -4)"><Shoe s={1.05} /></g> : undefined,
        handN: f >= k.lid - sec(0.1) && lidHeld ? 'grip' : f >= k.doubt && f < k.decide ? 'open' : f < k.doubt || f >= k.inside + sec(0.4) ? 'open' : 'fist',
        holdN: lidHeld ? <g transform={`translate(-4 ${30 / S})`}><BoxLid w={BOX.w / S} /></g> : undefined, // held in character space: the lid keeps its world size
        holdUpright: true,
        farInFront: f >= k.up - sec(0.25), // the shoe comes round in front of him
      }} />
    </>} />
  );
};
