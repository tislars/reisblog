/** Style rules for the base map: a quiet line drawing so the post markers stand out. */

export const ROAD_MIN_ZOOM = 8;
export const LABEL_MIN_ZOOM = 4;
export const GRATICULE_STEP = 10;

/** The Veldnotities palette, mirrored from the tokens in global.css (MapLibre cannot read CSS variables). */
export const MAP_COLORS = {
  paper: '#f3eee4',
  ink: '#1b1f1a',
  mute: '#6d6a60',
  line: '#d8d0bf',
  land: '#e3dac7',
} as const;

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

/** Paint properties that turn a positron base-map layer into the paper-and-ink drawing, or undefined to leave it. */
export function paintFor(layer: StyleLayer): Record<string, string | number> | undefined {
  const { id, type } = layer;
  const source = layer['source-layer'];
  if (type === 'background') return { 'background-color': MAP_COLORS.land };
  if (id === 'water') return { 'fill-color': MAP_COLORS.paper };
  if (source === 'waterway') return type === 'line' ? { 'line-color': MAP_COLORS.paper } : undefined;
  if (type === 'fill') return { 'fill-color': MAP_COLORS.land };
  if (type === 'line' && source === 'boundary') return { 'line-color': MAP_COLORS.mute, 'line-opacity': 0.4 };
  if (type === 'line' && (source === 'transportation' || source === 'aeroway')) {
    return { 'line-color': /casing/.test(id) ? MAP_COLORS.line : MAP_COLORS.paper };
  }
  if (type === 'symbol') {
    const water = source === 'water_name' || source === 'waterway';
    return { 'text-color': water ? MAP_COLORS.mute : MAP_COLORS.ink, 'text-halo-color': MAP_COLORS.paper };
  }
  return undefined;
}

type Position = [lng: number, lat: number];

// Where Web Mercator tiles end.
const MAX_LATITUDE = 85.051129;

/** Meridians and parallels every `step` degrees, as one GeoJSON MultiLineString feature. */
export function graticule(step = GRATICULE_STEP) {
  const lines: Position[][] = [];
  // Points every degree so the lines curve with the globe instead of cutting across it.
  const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i);
  for (let lng = -180; lng < 180; lng += step) lines.push(range(-80, 80).map((lat): Position => [lng, lat]));
  for (let lat = -80; lat <= 80; lat += step) lines.push(range(-180, 180).map((lng): Position => [lng, lat]));
  return { type: 'Feature' as const, properties: {}, geometry: { type: 'MultiLineString' as const, coordinates: lines } };
}

/**
 * A band around the North Pole, up to the edge of the Mercator tiles. Outlining the water polygons draws that
 * edge as a ring at 85°N; covering it in paper hides the ring (it is all sea up there).
 */
export function northCap(from = 84) {
  const edge = MAX_LATITUDE + 0.01;
  const ring: Position[] = [];
  for (let lng = -180; lng <= 180; lng += 1) ring.push([lng, from]);
  for (let lng = 180; lng >= -180; lng -= 1) ring.push([lng, edge]);
  ring.push(ring[0]);
  return { type: 'Feature' as const, properties: {}, geometry: { type: 'Polygon' as const, coordinates: [ring] } };
}

/** MapLibre's default vertical field of view (36.87°). */
const FOV = 0.6435011087932844;
const TILE_SIZE = 512;

/**
 * Radius in CSS pixels of the globe's outline on screen, for an unpitched globe projection:
 * MapLibre sizes the sphere by zoom and centre latitude, and the perspective camera sees a little less than half of it.
 */
export function globeOutlineRadius(zoom: number, latitude: number, height: number): number {
  const scale = Math.cos((Math.min(Math.abs(latitude), MAX_LATITUDE) * Math.PI) / 180);
  const radius = (TILE_SIZE * 2 ** zoom) / (2 * Math.PI) / scale;
  const focal = 0.5 / Math.tan(FOV / 2) * height;
  return (focal * radius) / Math.sqrt(focal * focal + 2 * focal * radius);
}

/** The zoom at which the globe's outline has `radius` CSS pixels: the inverse of globeOutlineRadius. */
export function zoomForGlobeRadius(radius: number, latitude: number, height: number): number {
  let [low, high] = [-2, 24];
  for (let i = 0; i < 40; i++) {
    const mid = (low + high) / 2;
    if (globeOutlineRadius(mid, latitude, height) < radius) low = mid;
    else high = mid;
  }
  return (low + high) / 2;
}
