import { describe, expect, it } from 'vitest';
import { factsSchema } from './facts';

const fact = (label: string, value = 'x') => ({ label, value });

describe('factsSchema', () => {
  it('is an empty list when a post has no facts', () => {
    expect(factsSchema.parse(undefined)).toEqual([]);
    expect(factsSchema.parse(null)).toEqual([]);
    expect(factsSchema.parse([])).toEqual([]);
  });

  it('keeps the facts in the order they were written', () => {
    const facts = [fact('Aankomst', '8 uur bus'), fact('Temperatuur', '±25°')];
    expect(factsSchema.parse(facts)).toEqual(facts);
  });

  it('accepts up to 6 facts and refuses a 7th with a clear message', () => {
    const six = Array.from({ length: 6 }, (_, i) => fact(`Feit ${i}`));
    expect(factsSchema.parse(six)).toHaveLength(6);
    const result = factsSchema.safeParse([...six, fact('Zeven')]);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('Maximaal 6 feiten per post.');
  });

  it('limits labels to 20 and values to 30 characters', () => {
    expect(factsSchema.safeParse([fact('a'.repeat(20), 'b'.repeat(30))]).success).toBe(true);
    const label = factsSchema.safeParse([fact('a'.repeat(21))]);
    expect(label.error?.issues[0].message).toBe('Het label van een feit mag maximaal 20 tekens zijn.');
    const value = factsSchema.safeParse([fact('Hoogte', 'b'.repeat(31))]);
    expect(value.error?.issues[0].message).toBe('De waarde van een feit mag maximaal 30 tekens zijn.');
  });

  it('reads a bare number as text', () => {
    expect(factsSchema.parse([{ label: 'Treden', value: 740 }])).toEqual([{ label: 'Treden', value: '740' }]);
  });

  it('requires both a label and a value', () => {
    expect(factsSchema.safeParse([fact('')]).success).toBe(false);
    expect(factsSchema.safeParse([fact('Hoogte', '  ')]).success).toBe(false);
    expect(factsSchema.safeParse([{ label: 'Hoogte' }]).success).toBe(false);
  });
});
