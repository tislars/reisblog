import { describe, expect, it, vi } from 'vitest';

vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(async () => '{"hanoi": {"lat": 21.03, "lng": 105.85}}'),
  writeFile: vi.fn(async () => undefined),
}));

const { coordsFor, roundCoords } = await import('./geocode');

describe('coordsFor', () => {
  it('uses manual lat/lng over lookup, rounded to ~1 km', async () => {
    const lookup = vi.fn();
    expect(await coordsFor({ place: 'X', lat: 15.87654, lng: 108.33521 }, lookup)).toEqual({ lat: 15.88, lng: 108.34 });
    expect(lookup).not.toHaveBeenCalled();
  });

  it('treats null lat/lng from the CMS as empty', async () => {
    expect(await coordsFor({ place: 'Hanoi', lat: null, lng: null }, vi.fn())).toEqual({ lat: 21.03, lng: 105.85 });
  });

  it('serves cached places case-insensitively without a lookup', async () => {
    const lookup = vi.fn();
    expect(await coordsFor({ place: ' Hanoi ' }, lookup)).toEqual({ lat: 21.03, lng: 105.85 });
    expect(lookup).not.toHaveBeenCalled();
  });

  it('looks up and rounds unknown places', async () => {
    const lookup = vi.fn(async () => ({ lat: 10.776889, lng: 106.700806 }));
    expect(await coordsFor({ place: 'Ho Chi Minh City' }, lookup)).toEqual({ lat: 10.78, lng: 106.7 });
  });

  it('fails the build with a clear message when a place is not found', async () => {
    await expect(coordsFor({ place: 'Nergenshuizen' }, async () => undefined)).rejects.toThrow(/set lat\/lng/);
  });
});

describe('roundCoords', () => {
  it('rounds negative coordinates too', () => {
    expect(roundCoords({ lat: -33.86785, lng: -151.20732 })).toEqual({ lat: -33.87, lng: -151.21 });
  });
});
