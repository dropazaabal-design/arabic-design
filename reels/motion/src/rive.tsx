import RiveCanvasInit from '@rive-app/canvas-advanced';
import type { Artboard, File as RiveFile, RiveCanvas } from '@rive-app/canvas-advanced';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { continueRender, delayRender, useCurrentFrame, useVideoConfig } from 'remotion';
import { RiveInput, STEP_RATE, dueAt, steps } from './rive-steps';

// A Rive character drawn at an exact time, for renders. Why not @remotion/rive (4.0.534): it advances the animation
// by the difference from the previously rendered frame (so a frame's pose depends on render order), fetches the
// WASM from unpkg at render time, and plays linear animations only (no state machines). This actor uses the same
// runtime package directly and draws every frame from scratch:
//   linear animation → a fresh instance advanced from 0 to t;
//   state machine    → a fresh instance replayed 0 → t in fixed 1/120 s steps with the scheduled inputs (rive-steps.ts).
// The WASM is bundled with the reel (no network), runtime and files are cached per render tab, per-frame instances
// are deleted after drawing, and a load failure renders `fallback` (a TSX/SVG stand-in) instead of a blank frame.

const WASM = new URL('@rive-app/canvas-advanced/rive.wasm', import.meta.url).href;
const runtimes = new Map<string, Promise<RiveCanvas>>();
const files = new Map<string, Promise<RiveFile>>();

const runtime = (wasm: string) => {
  let r = runtimes.get(wasm);
  if (!r) {
    r = RiveCanvasInit({ locateFile: () => wasm });
    runtimes.set(wasm, r);
  }
  return r;
};
const loadFile = (rive: RiveCanvas, wasm: string, src: string) => {
  const key = `${wasm}|${src}`;
  let f = files.get(key);
  if (!f) {
    f = fetch(src)
      .then((r) => {
        if (!r.ok) throw new Error(`${src}: HTTP ${r.status}`);
        return r.arrayBuffer();
      })
      .then((b) => rive.load(new Uint8Array(b)));
    f.catch(() => files.delete(key));   // a failed load is retried by the next mount, not cached
    files.set(key, f);
  }
  return f;
};

export type RiveActorProps = {
  src: string;
  artboard?: string;
  /** a linear animation by name (default: the artboard's first) — ignored when stateMachine is set */
  animation?: string;
  stateMachine?: string;
  inputs?: RiveInput[];
  /** seconds; default = current frame / fps (inside a Sequence: since the Sequence's start) */
  time?: number;
  width: number;
  height: number;
  fit?: 'contain' | 'cover';
  style?: React.CSSProperties;
  /** rendered when the runtime or the file cannot be loaded; without it a load failure fails the render */
  fallback?: React.ReactNode;
  wasm?: string;
};

export const RiveActor: React.FC<RiveActorProps> = ({ src, artboard, animation, stateMachine, inputs = [], time, width, height, fit = 'contain', style, fallback, wasm = WASM }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = time ?? frame / fps;
  const canvas = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<{ rive: RiveCanvas; file: RiveFile } | { error: Error } | null>(null);

  useEffect(() => {
    let live = true, held = true;
    const handle = delayRender(`Rive ${src}`);
    const release = () => { if (held) { held = false; continueRender(handle); } };
    runtime(wasm)
      .then((rive) => loadFile(rive, wasm, src).then((file) => live && setState({ rive, file })))
      .catch((error: Error) => {
        if (!live) return;
        if (fallback === undefined) setState({ error });
        else {
          console.warn(`RiveActor: ${src} not loaded (${error.message}); drawing the fallback`);
          setState({ error });
        }
      })
      .finally(release);
    return () => { live = false; release(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, wasm]);

  const renderer = useRef<ReturnType<RiveCanvas['makeRenderer']> | null>(null);
  useLayoutEffect(() => {
    if (!state || 'error' in state || !canvas.current) return;
    const { rive, file } = state;
    renderer.current ??= rive.makeRenderer(canvas.current);
    const r = renderer.current;
    const ab: Artboard = artboard ? file.artboardByName(artboard) : file.defaultArtboard();
    if (!ab) throw new Error(`Rive ${src}: no artboard ${artboard}`);
    const trash: Array<{ delete: () => void }> = [];
    try {
      if (stateMachine) {
        const def = ab.stateMachineByName(stateMachine);
        if (!def) throw new Error(`Rive ${src}: no state machine ${stateMachine}`);
        const sm = new rive.StateMachineInstance(def, ab);
        trash.push(sm);
        const byName = new Map<string, ReturnType<typeof sm.input>>();
        for (let k = 0; k < sm.inputCount(); k++) byName.set(sm.input(k).name, sm.input(k));
        const apply = (list: RiveInput[]) => list.forEach((x) => {
          const inp = byName.get(x.name);
          if (!inp) throw new Error(`Rive ${src}: state machine ${stateMachine} has no input "${x.name}"`);
          if (x.value === undefined) inp.asTrigger().fire();
          else if (typeof x.value === 'boolean') inp.asBool().value = x.value;
          else inp.asNumber().value = x.value;
        });
        const { n, rest } = steps(t);
        apply(dueAt(inputs, 0));
        sm.advance(0); ab.advance(0);
        for (let i = 1; i <= n; i++) {
          apply(dueAt(inputs, i));
          sm.advance(1 / STEP_RATE); ab.advance(1 / STEP_RATE);
        }
        if (rest > 0) {
          apply(inputs.filter((x) => x.at > n / STEP_RATE + 1e-9 && x.at <= t + 1e-9));
          sm.advance(rest); ab.advance(rest);
        }
      } else {
        const def = animation ? ab.animationByName(animation) : ab.animationByIndex(0);
        if (!def) throw new Error(`Rive ${src}: no animation ${animation}`);
        const a = new rive.LinearAnimationInstance(def, ab);
        trash.push(a);
        a.advance(t);
        a.apply(1);
        ab.advance(0);
      }
      r.clear();
      r.save();
      r.align(fit === 'cover' ? rive.Fit.cover : rive.Fit.contain, rive.Alignment.center, { minX: 0, minY: 0, maxX: width, maxY: height }, ab.bounds);
      ab.draw(r);
      r.restore();
      rive.resolveAnimationFrame();
    } finally {
      trash.forEach((x) => x.delete());
      (ab as unknown as { delete?: () => void }).delete?.();
    }
  }, [state, t, artboard, animation, stateMachine, JSON.stringify(inputs), width, height, fit, src]);

  useEffect(() => () => { (renderer.current as unknown as { delete?: () => void } | null)?.delete?.(); renderer.current = null; }, []);

  if (state && 'error' in state) {
    if (fallback === undefined) throw state.error;
    return <>{fallback}</>;
  }
  return <canvas ref={canvas} width={width} height={height} style={{ width, height, ...style }} />;
};
