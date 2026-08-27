/**
 * The one sequential ramp in the app.
 *
 * The dial already encodes how close an area is to what the person described,
 * as the length of its arc. This ramp says the same thing a second time in
 * luminance, because a redundant encoding is what makes a small arc readable
 * at a glance and a long one readable without counting.
 *
 * It deliberately does not run from red to green. Red and green are spoken for
 * — on the conflict map they mean "these two goals fight" and "these two goals
 * help" — and a second, unrelated red would teach people the wrong thing. It
 * also isn't a verdict: an area far from its vision is not failing, it is just
 * further away, so the far end is dim rather than alarming.
 */

/** Far from what they described. Dim, cool, unemphatic. */
export const RAMP_FAR: readonly [number, number, number] = [63, 95, 124];
/** Living it. Bright, still the same hue. */
export const RAMP_NEAR: readonly [number, number, number] = [156, 194, 222];

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/** Straight sRGB interpolation — the two stops are close enough in hue that
 *  nothing muddy happens between them, and it stays trivially predictable. */
export function rampColour(fill: number): string {
  const t = clamp01(fill);
  const ch = (i: 0 | 1 | 2) => Math.round(RAMP_FAR[i] + (RAMP_NEAR[i] - RAMP_FAR[i]) * t);
  return `rgb(${ch(0)} ${ch(1)} ${ch(2)})`;
}

/**
 * Fill 0 would otherwise draw a hairline nobody can see, and fill 1 an arc that
 * touches the rim and reads as an error. Both are pulled in.
 */
export const MIN_ARC_FRACTION = 0.06;

export function arcFraction(fill: number): number {
  return MIN_ARC_FRACTION + clamp01(fill) * (1 - MIN_ARC_FRACTION);
}
