import { describe, expect, it } from 'vitest';
import { MAP_COLORS, ROAD_MIN_ZOOM, globeOutlineRadius, graticule, minZoomFor, northCap, paintFor, zoomForGlobeRadius } from './mapstyle';

describe('minZoomFor', () => {
  it('hides roads and railways until zoomed in to region level', () => {
    expect(minZoomFor({ id: 'highway_motorway_subtle', type: 'line', 'source-layer': 'transportation' })).toBe(ROAD_MIN_ZOOM);
    expect(minZoomFor({ id: 'highway_major_subtle', type: 'line', 'source-layer': 'transportation', minzoom: 6 })).toBe(ROAD_MIN_ZOOM);
  });

  it('keeps a later minzoom the style already sets', () => {
    expect(minZoomFor({ id: 'railway', type: 'line', 'source-layer': 'transportation', minzoom: 13 })).toBe(13);
  });

  it('hides labels on the whole-globe view', () => {
    expect(minZoomFor({ id: 'place_city', type: 'symbol', minzoom: 2 })).toBe(4);
  });

  it('leaves other layers alone', () => {
    expect(minZoomFor({ id: 'water', type: 'fill' })).toBeUndefined();
    expect(minZoomFor({ id: 'boundary_country_z0-4', type: 'line', 'source-layer': 'boundary' })).toBeUndefined();
  });
});

describe('paintFor', () => {
  it('draws the sea in paper and the land in the land colour', () => {
    expect(paintFor({ id: 'water', type: 'fill', 'source-layer': 'water' })).toEqual({ 'fill-color': MAP_COLORS.paper });
    expect(paintFor({ id: 'background', type: 'background' })).toEqual({ 'background-color': MAP_COLORS.land });
    expect(paintFor({ id: 'park', type: 'fill', 'source-layer': 'park' })).toEqual({ 'fill-color': MAP_COLORS.land });
    expect(paintFor({ id: 'landcover_wood', type: 'fill', 'source-layer': 'landcover' })).toEqual({ 'fill-color': MAP_COLORS.land });
  });

  it('draws rivers like the sea', () => {
    expect(paintFor({ id: 'waterway', type: 'line', 'source-layer': 'waterway' })).toEqual({ 'line-color': MAP_COLORS.paper });
  });

  it('draws roads as paper lines with a light casing', () => {
    expect(paintFor({ id: 'highway_major_inner', type: 'line', 'source-layer': 'transportation' })).toEqual({ 'line-color': MAP_COLORS.paper });
    expect(paintFor({ id: 'highway_major_casing', type: 'line', 'source-layer': 'transportation' })).toEqual({ 'line-color': MAP_COLORS.line });
  });

  it('sets labels in ink on a paper halo, water names muted', () => {
    expect(paintFor({ id: 'label_city', type: 'symbol', 'source-layer': 'place' })).toEqual({ 'text-color': MAP_COLORS.ink, 'text-halo-color': MAP_COLORS.paper });
    expect(paintFor({ id: 'water_name_point_label', type: 'symbol', 'source-layer': 'water_name' })).toMatchObject({ 'text-color': MAP_COLORS.mute });
  });

  it('keeps country borders faint', () => {
    expect(paintFor({ id: 'boundary_2', type: 'line', 'source-layer': 'boundary' })).toEqual({ 'line-color': MAP_COLORS.mute, 'line-opacity': 0.4 });
  });

  it('leaves unknown layers alone', () => {
    expect(paintFor({ id: 'hillshade', type: 'hillshade' })).toBeUndefined();
  });
});

describe('graticule', () => {
  const lines = graticule(10).geometry.coordinates;

  it('has a meridian every 10° and a parallel every 10° between 80°S and 80°N', () => {
    const meridians = lines.filter((l) => l[0][0] === l[1][0]);
    const parallels = lines.filter((l) => l[0][1] === l[1][1]);
    expect(meridians.map((l) => l[0][0])).toEqual([-180, -170, -160, -150, -140, -130, -120, -110, -100, -90, -80, -70, -60, -50, -40, -30, -20, -10, 0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160, 170]);
    expect(parallels.map((l) => l[0][1])).toEqual([-80, -70, -60, -50, -40, -30, -20, -10, 0, 10, 20, 30, 40, 50, 60, 70, 80]);
  });

  it('samples every degree so lines follow the curve of the globe', () => {
    const equator = lines.find((l) => l[0][1] === 0 && l[1][1] === 0)!;
    expect(equator).toHaveLength(361);
    expect(equator.at(-1)).toEqual([180, 0]);
  });
});

describe('globeOutlineRadius', () => {
  it('is a bit smaller than the sphere radius because of perspective', () => {
    // Zoom 1 at the equator: sphere radius 1024 / 2π ≈ 163px; the camera is 1.5 × 800px from the surface.
    expect(globeOutlineRadius(1, 0, 800)).toBeCloseTo(144.5, 0);
  });

  it('doubles roughly with each zoom level', () => {
    const ratio = globeOutlineRadius(2, 0, 800) / globeOutlineRadius(1, 0, 800);
    expect(ratio).toBeGreaterThan(1.8);
    expect(ratio).toBeLessThan(2);
  });

  it('grows away from the equator, as MapLibre keeps the scale at the centre', () => {
    expect(globeOutlineRadius(1, 60, 800)).toBeGreaterThan(globeOutlineRadius(1, 0, 800) * 1.8);
  });
});

describe('zoomForGlobeRadius', () => {
  it('finds the zoom that gives the globe the wanted size', () => {
    const zoom = zoomForGlobeRadius(300, 10, 700);
    expect(globeOutlineRadius(zoom, 10, 700)).toBeCloseTo(300, 3);
  });

  it('zooms out for a smaller globe', () => {
    expect(zoomForGlobeRadius(120, 10, 300)).toBeLessThan(zoomForGlobeRadius(300, 10, 700));
  });
});

describe('northCap', () => {
  it('is a closed band from 84°N to just past the edge of the tiles', () => {
    const [ring] = northCap().geometry.coordinates;
    expect(ring[0]).toEqual(ring.at(-1));
    const lats = ring.map(([, lat]) => lat);
    expect(Math.min(...lats)).toBe(84);
    expect(Math.max(...lats)).toBeGreaterThan(85.0511);
  });
});
