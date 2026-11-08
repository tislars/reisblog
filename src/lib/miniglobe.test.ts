import { describe, expect, it } from 'vitest';
import { miniGlobeSvg } from './miniglobe';

const home = { lat: 52.37, lng: 4.9 };
const bogota = { lat: 4.6, lng: -74.08 };
const medellin = { lat: 6.24, lng: -75.58 };
const guatape = { lat: 6.23, lng: -75.16 };

describe('miniGlobeSvg', () => {
  const svg = miniGlobeSvg({ route: [home, bogota, medellin, guatape], stop: guatape, day: 7 });

  it('is a square SVG', () => {
    expect(svg).toMatch(/^<svg xmlns="http:\/\/www.w3.org\/2000\/svg" viewBox="0 0 200 200"/);
    expect(svg.endsWith('</svg>')).toBe(true);
  });

  it('centres the marked stop and writes its day in it', () => {
    expect(svg).toContain('<g transform="translate(100.0 100.0)">');
    expect(svg).toMatch(/<text[^>]*>7<\/text>/);
  });

  it('draws the other visible stops as open circles, not the marked one twice', () => {
    // Bogotá and Medellín are on the visible side; home (Amsterdam) is over the horizon from Guatapé.
    expect(svg.match(/<circle cx="[^"]+" cy="[^"]+" r="3.5"/g)).toHaveLength(2);
  });

  it('draws the route and land', () => {
    expect(svg).toContain('stroke="#e0442b" stroke-width="1.6"');
    expect(svg).toContain('fill="#e3dac7"');
  });

  it('rounds coordinates to keep the file small', () => {
    expect(svg).not.toMatch(/\d\.\d{2,}/);
    expect(svg.length).toBeLessThan(60_000);
  });
});
