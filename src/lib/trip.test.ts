import { describe, expect, it } from 'vitest';
import { dayOfTrip } from './trip';

describe('dayOfTrip', () => {
  const start = new Date('2026-11-06');

  it('counts the start date as day 1', () => {
    expect(dayOfTrip(start, start)).toBe(1);
  });

  it('counts across month boundaries', () => {
    expect(dayOfTrip(new Date('2026-12-01'), start)).toBe(26);
  });
});
