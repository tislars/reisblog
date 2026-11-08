/** Zoom-range rules that keep the base map quiet so post markers stand out. */

export const ROAD_MIN_ZOOM = 8;
export const LABEL_MIN_ZOOM = 4;

interface StyleLayer {
  id: string;
  type: string;
  'source-layer'?: string;
  minzoom?: number;
}

/** The minzoom a base-map layer should get, or undefined to leave it as the style has it. */
export function minZoomFor(layer: StyleLayer): number | undefined {
  const later = (min: number) => Math.max(min, layer.minzoom ?? 0);
  if (layer.type === 'symbol') return later(LABEL_MIN_ZOOM);
  if (layer.type === 'line' && layer['source-layer'] === 'transportation') return later(ROAD_MIN_ZOOM);
  return undefined;
}
