/**
 * Seeded Chaos Mixer (v0)
 *
 * Provides deterministic randomization of knob values and palette color
 * selection given a numeric seed. Uses a simple xorshift32 PRNG so
 * results are reproducible for any given seed value.
 */
import type { StylePackKnob, StylePackPalette } from "./stylePackSchema";

/** Simple xorshift32 PRNG returning values in [0, 1) */
function makeRng(seed: number): () => number {
  // xorshift32 is undefined for 0; use 1 as fallback.
  // Note: seed=0 is treated as seed=1 for PRNG purposes.
  let s = (seed >>> 0) || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    s = s >>> 0;
    return s / 0x100000000;
  };
}

export interface KnobValue {
  id: string;
  value: number;
}

export interface MixResult {
  knobValues: KnobValue[];
  selectedColors: string[];
  seed: number;
}

/**
 * Given a seed, randomize knob values within [min, max] and optionally
 * select N colors from a palette (shuffled deterministically).
 *
 * @param seed - Integer seed for the PRNG
 * @param knobs - Knob definitions from the manifest
 * @param palette - Palette to select colors from (optional)
 * @param colorCount - How many colors to select (defaults to all)
 */
export function runChaosMix(
  seed: number,
  knobs: StylePackKnob[],
  palette?: StylePackPalette,
  colorCount?: number
): MixResult {
  const rng = makeRng(seed);

  const knobValues: KnobValue[] = knobs.map((k) => ({
    id: k.id,
    value: k.min + rng() * (k.max - k.min),
  }));

  let selectedColors: string[] = [];
  if (palette && palette.colors.length > 0) {
    // Fisher-Yates shuffle on a copy
    const shuffled = [...palette.colors];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const n = colorCount !== undefined ? Math.min(colorCount, shuffled.length) : shuffled.length;
    selectedColors = shuffled.slice(0, n);
  }

  return { knobValues, selectedColors, seed };
}

/** Generate a new random seed (not deterministic — just for "re-roll") */
export function newSeed(): number {
  return Math.floor(Math.random() * 0x7fffffff) + 1;
}
