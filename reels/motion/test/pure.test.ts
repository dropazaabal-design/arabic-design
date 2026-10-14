// Unit tests for the pure motion helpers (node --experimental-strip-types --test test/*.test.ts).
import assert from 'node:assert/strict';
import test from 'node:test';
import { gsap } from 'gsap';
import { clock, ease, keys, tween } from '../src/clock.ts';
import { alongPath, drawn, morph, pathLength, scribbleLoop } from '../src/paths.ts';
import { dueAt, steps, STEP_RATE } from '../src/rive-steps.ts';

const near = (a: number, b: number, eps = 1e-6) => assert.ok(Math.abs(a - b) <= eps, `${a} ≉ ${b}`);

test('clock: the same instant at 30 and 60 fps', () => {
  near(clock(45, 30).t, clock(90, 60).t);
  near(clock(90, 60).f30, 45);
});

test('ease: GSAP names as pure functions; unknown names throw', () => {
  near(ease('power2.inOut')(0.5), 0.5);
  assert.ok(ease('back.out(1.7)')(0.5) > 1, 'back.out overshoots');
  near(ease('none')(0.3), 0.3);
  assert.throws(() => ease('bogus.out'), /unknown ease/);
});

test('tween/keys: clamped, eased, keyed in seconds', () => {
  near(tween(-1, 0, 1, 10, 20), 10);
  near(tween(2, 0, 1, 10, 20), 20);
  near(tween(0.5, 0, 1, 10, 20, 'none'), 15);
  const k: Array<[number, number, string?]> = [[1, 0], [2, 100, 'none'], [3, 50, 'none']];
  near(keys(0, k), 0); near(keys(1.5, k), 50); near(keys(2.5, k), 75); near(keys(9, k), 50);
});

test('GSAP timeline seeking is order-independent (what @remotion/gsap relies on)', () => {
  const build = () => {
    const o = { x: 0, s: 1 };
    const tl = gsap.timeline({ paused: true });
    tl.to(o, { x: 100, duration: 1, ease: 'power2.out' }, 0.5).to(o, { s: 2, duration: 0.6, ease: 'back.out(2)' }, '-=0.3');
    return { o, tl };
  };
  const a = build(); a.tl.totalTime(1.3, true);
  const b = build(); b.tl.totalTime(2, true); b.tl.totalTime(0.1, true); b.tl.totalTime(1.3, true);
  assert.deepEqual([a.o.x, a.o.s], [b.o.x, b.o.s]);
  near(a.o.x, 100 * ease('power2.out')(0.8));
});

const D = 'M0 0 L300 0 L300 400';
test('paths: alongPath follows the path and its heading', () => {
  near(pathLength(D), 700);
  const s = alongPath(D, 0), m = alongPath(D, 150 / 700), e = alongPath(D, 1);
  near(s.x, 0); near(s.y, 0); near(m.x, 150); near(m.angle, 0); near(e.x, 300); near(e.y, 400); near(e.angle, 90);
  assert.deepEqual(alongPath(D, 2), e, 'progress clamps');
});

test('paths: drawn() reveals exactly p of the stroke; a trail keeps only [from, p]', () => {
  // visible length = first dash − offset (evolvePath's convention)
  const shown = (p: number) => { const e = drawn(D, p); return Math.max(0, Number(String(e.strokeDasharray).split(' ')[0]) - Number(e.strokeDashoffset)); };
  near(shown(0), 0); near(shown(0.5), 350); near(shown(1), 700);
  assert.equal(drawn(D, 0.75, 0.25).strokeDasharray, '0 175 350 700');
});

test('paths: morph endpoints, scribbleLoop is seeded (same seed → same path)', () => {
  const a = 'M0 0 L100 0 L100 100 Z', b = 'M0 0 L50 -40 L100 0 Z';
  assert.equal(morph(0, a, b), a); assert.equal(morph(1, a, b), b);
  assert.notEqual(morph(0.5, a, b), a);
  assert.equal(scribbleLoop(0, 0, 100, 40, { seed: 3 }), scribbleLoop(0, 0, 100, 40, { seed: 3 }));
  assert.notEqual(scribbleLoop(0, 0, 100, 40, { seed: 3 }), scribbleLoop(0, 0, 100, 40, { seed: 4 }));
});

test('rive steps: fixed grid independent of fps; each input applied exactly once', () => {
  assert.deepEqual(steps(clock(45, 30).t), steps(clock(90, 60).t));
  assert.equal(steps(1.5).n, 1.5 * STEP_RATE);
  assert.throws(() => steps(-1), RangeError);
  const inputs = [{ at: 0, name: 'a', value: true }, { at: 0.5, name: 'b' }, { at: 0.501, name: 'c', value: 2 }];
  const seen = [] as string[];
  for (let i = 0; i <= steps(1).n; i++) seen.push(...dueAt(inputs, i).map((x) => x.name));
  assert.deepEqual(seen, ['a', 'b', 'c']);
});
