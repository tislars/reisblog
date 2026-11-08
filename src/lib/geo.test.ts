import { describe, expect, it } from 'vitest';
import { distanceKm, formatKm, formatLat, formatLatLng, formatLng, routeKm } from './geo';

describe('formatLat / formatLng', () => {
  it('writes degrees and minutes with N/Z and O/W', () => {
    expect(formatLatLng({ lat: 10.39, lng: -75.51 })).toBe('10°23′N 75°31′W');
    expect(formatLatLng({ lat: 52.37, lng: 4.9 })).toBe('52°22′N 4°54′O');
    expect(formatLatLng({ lat: -33.45, lng: -70.67 })).toBe('33°27′Z 70°40′W');
  });

  it('pads minutes to two digits', () => {
    expect(formatLat(6.05)).toBe('6°03′N');
  });

  it('carries rounded minutes over into the next degree', () => {
    expect(formatLat(4.9999)).toBe('5°00′N');
    expect(formatLng(-75.995)).toBe('76°00′W');
  });

  it('leaves out the hemisphere on the equator and the prime meridian', () => {
    expect(formatLat(0)).toBe('0°00′');
    expect(formatLng(-0.001)).toBe('0°00′');
  });
});

describe('distanceKm', () => {
  it('is zero for the same point', () => {
    expect(distanceKm({ lat: 4.6, lng: -74.07 }, { lat: 4.6, lng: -74.07 })).toBe(0);
  });

  it('measures the great circle', () => {
    // Amsterdam to Bogotá is about 8,850 km.
    expect(distanceKm({ lat: 52.37, lng: 4.9 }, { lat: 4.6, lng: -74.07 })).toBeCloseTo(8850, -2);
    // A quarter of the way around the equator.
    expect(distanceKm({ lat: 0, lng: 0 }, { lat: 0, lng: 90 })).toBeCloseTo((Math.PI / 2) * 6371, 6);
  });
});

describe('routeKm', () => {
  it('adds up the legs in order', () => {
    const a = { lat: 0, lng: 0 };
    const b = { lat: 0, lng: 10 };
    const c = { lat: 0, lng: 20 };
    expect(routeKm([a, b, c])).toBeCloseTo(distanceKm(a, c), 6);
    expect(routeKm([a, c, b])).toBeCloseTo(3 * distanceKm(a, b), 6);
  });

  it('is zero for no route at all', () => {
    expect(routeKm([])).toBe(0);
    expect(routeKm([{ lat: 1, lng: 1 }])).toBe(0);
  });
});

describe('formatKm', () => {
  it('rounds and uses a Dutch thousands separator', () => {
    expect(formatKm(9710.4)).toBe('9.710');
    expect(formatKm(12)).toBe('12');
  });
});
