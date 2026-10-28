// Pure timing for RiveActor (no Rive, no DOM), so it can be unit-tested.
//
// A Rive state machine has no "seek": its state depends on every input change and step before it. To render frame
// N deterministically — in any frame order, in any render process, at 30 or 60 fps — the actor rebuilds the machine
// and replays it from 0 to t in fixed steps of 1/STEP_RATE s, applying each scheduled input on the first step at or
// after its time. The step grid does not depend on the composition's fps, so t = 1.5 s gives the same pose at both.

export const STEP_RATE = 120;

/** An input change on the state machine: a bool or number value, or a trigger fire when value is omitted. */
export type RiveInput = { at: number; name: string; value?: boolean | number };

/** Whole fixed steps up to t and the remainder (seconds) after them. */
export const steps = (t: number, rate = STEP_RATE) => {
  if (!Number.isFinite(t) || t < 0) throw new RangeError(`rive time must be a finite number ≥ 0, got ${t}`);
  const n = Math.floor(t * rate + 1e-9);
  return { n, rest: Math.max(0, t - n / rate) };
};

/** Inputs to apply before step i (the step that advances from (i−1)/rate to i/rate): those with at in ((i−1)/rate, i/rate].
 *  Step 0 = before any advance: everything at ≤ 0. Each input is applied exactly once over the whole replay. */
export const dueAt = (inputs: RiveInput[], i: number, rate = STEP_RATE) =>
  inputs.filter((x) => (i === 0 ? x.at <= 0 : x.at > (i - 1) / rate + 1e-9 && x.at <= i / rate + 1e-9));
