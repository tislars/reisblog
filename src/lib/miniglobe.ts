import { geoGraticule10, geoOrthographic, geoPath, geoDistance } from 'd3-geo';
import { feature } from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import land110m from 'world-atlas/land-110m.json' with { type: 'json' };
import type { LatLng } from './geo';

/** The Veldnotities palette (see global.css); the SVG is served as an image, so it cannot read CSS variables. */
const COLORS = { paper: '#f3eee4', ink: '#1b1f1a', line: '#d8d0bf', land: '#e3dac7', verm: '#e0442b', vermText: '#c2381f' };

const topology = land110m as unknown as Topology<{ land: GeometryCollection }>;
const LAND = feature(topology, topology.objects.land);

export interface MiniGlobeOptions {
  /** The route from home through every post, in order. */
  route: LatLng[];
  /** The stop to centre on and mark. */
  stop: LatLng;
  /** Day number shown in the marked stop. */
  day: number;
  /** Width and height of the square SVG, in user units. */
  size?: number;
}

const escapeAttr = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

/**
 * A small static globe as an SVG string, centred on `stop`: sphere, graticule, land, route and stops,
 * drawn in the same line style as the big MapLibre globe. Rendered at build time as a static file; no script needed.
 */
export function miniGlobeSvg({ route, stop, day, size = 200 }: MiniGlobeOptions): string {
  const radius = size * 0.46;
  const center = size / 2;
  const projection = geoOrthographic()
    .scale(radius)
    .translate([center, center])
    .rotate([-stop.lng, -stop.lat])
    .clipAngle(90);
  const path = geoPath(projection).digits(1);
  const visible = (p: LatLng) => geoDistance([p.lng, p.lat], [stop.lng, stop.lat]) < Math.PI / 2;
  const line = { type: 'LineString' as const, coordinates: route.map((p) => [p.lng, p.lat]) };

  const stops = route
    .slice(1)
    .filter((p) => visible(p) && !(p.lat === stop.lat && p.lng === stop.lng))
    .map((p) => {
      const [x, y] = projection([p.lng, p.lat])!;
      return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.5" fill="${COLORS.paper}" stroke="${COLORS.verm}" stroke-width="1.4"/>`;
    })
    .join('');
  const [sx, sy] = projection([stop.lng, stop.lat])!;

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">`,
    `<circle cx="${center}" cy="${center}" r="${radius}" fill="${COLORS.paper}"/>`,
    `<path d="${path(geoGraticule10())}" fill="none" stroke="${COLORS.line}" stroke-width="0.6"/>`,
    `<path d="${path(LAND)}" fill="${COLORS.land}" stroke="${COLORS.ink}" stroke-width="0.6" stroke-linejoin="round"/>`,
    `<circle cx="${center}" cy="${center}" r="${radius}" fill="none" stroke="${COLORS.ink}" stroke-width="1"/>`,
    route.length > 1 ? `<path d="${path(line) ?? ''}" fill="none" stroke="${COLORS.verm}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>` : '',
    stops,
    `<g transform="translate(${sx.toFixed(1)} ${sy.toFixed(1)})">`,
    `<circle r="10" fill="${COLORS.vermText}" stroke="${COLORS.verm}" stroke-width="1.4"/>`,
    `<text y="3.6" text-anchor="middle" font-family="'IBM Plex Mono', ui-monospace, monospace" font-size="10" font-weight="500" fill="${COLORS.paper}">${escapeAttr(String(day))}</text>`,
    `</g>`,
    `</svg>`,
  ].join('');
}
