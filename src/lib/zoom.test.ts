import { describe, expect, it } from 'vitest';
import { snapZoom, stepZoom, zoomLevels } from './zoom';

const levels = zoomLevels(1, 15, 8);

describe('zoomLevels', () => {
  it('spreads levels evenly from min to max', () => {
    expect(levels).toEqual([1, 3, 5, 7, 9, 11, 13, 15]);
  });
});

describe('stepZoom', () => {
  it('steps to the next level in either direction', () => {
    expect(stepZoom(levels, 5, 1)).toBe(7);
    expect(stepZoom(levels, 5.8, -1)).toBe(5);
    expect(stepZoom(levels, 5.8, 1)).toBe(7);
  });

  it('stays at the ends', () => {
    expect(stepZoom(levels, 15, 1)).toBe(15);
    expect(stepZoom(levels, 1, -1)).toBe(1);
  });
});

describe('snapZoom', () => {
  it('keeps a zoom that is already on a level', () => {
    expect(snapZoom(levels, 3, 5.001)).toBe(5);
  });

  it('settles on the next level in the direction of the zoom', () => {
    expect(snapZoom(levels, 3, 4)).toBe(5);
    expect(snapZoom(levels, 5, 4)).toBe(3);
  });
});
