// The globe nudges zoom when the centre moves in latitude, so "on a level" needs slack.
const EPSILON = 0.25;

/** `count` evenly spaced zoom levels from `min` to `max`, inclusive. */
export const zoomLevels = (min: number, max: number, count: number) =>
  Array.from({ length: count }, (_, i) => min + ((max - min) * i) / (count - 1));

/** The next level in `direction` (1 = in, -1 = out) from `zoom`, clamped to the ends. */
export function stepZoom(levels: number[], zoom: number, direction: 1 | -1): number {
  const next = direction > 0 ? levels.find((l) => l > zoom + EPSILON) : levels.findLast((l) => l < zoom - EPSILON);
  return next ?? (direction > 0 ? levels.at(-1)! : levels[0]);
}

/** Level to settle on after a free zoom from `from` to `to`: the first level reached in that direction. */
export function snapZoom(levels: number[], from: number, to: number): number {
  const exact = levels.find((l) => Math.abs(l - to) < EPSILON);
  if (exact !== undefined) return exact;
  return to > from ? stepZoom(levels, to, 1) : stepZoom(levels, to, -1);
}

// Viewport edge (px) at which the base arrival zoom shows the whole globe comfortably.
const REFERENCE_EDGE = 1000;

/** Zoom to arrive at: `base` on large screens, less on small ones so the globe still fits. */
export function arrivalZoom(base: number, min: number, width: number, height: number): number {
  const fit = base + Math.log2(Math.min(width, height) / REFERENCE_EDGE);
  return Math.min(base, Math.max(min, fit));
}
