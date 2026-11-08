import { describe, expect, it } from 'vitest';
import { ROAD_MIN_ZOOM, minZoomFor } from './mapstyle';

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
