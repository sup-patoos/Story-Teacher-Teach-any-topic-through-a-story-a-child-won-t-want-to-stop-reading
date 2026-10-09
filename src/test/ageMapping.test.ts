import { describe, it, expect } from 'vitest';
import { getAgeBand } from '../types/learning';

describe('Age to Age-Band Mapping', () => {
  it('maps age boundaries correctly according to cognitive developmental stages', () => {
    // 5-7 Band (Early foundational learners)
    expect(getAgeBand(5)).toBe('5-7');
    expect(getAgeBand(6)).toBe('5-7');
    expect(getAgeBand(7)).toBe('5-7');

    // 8-10 Band (Primary elementary learners)
    expect(getAgeBand(8)).toBe('8-10');
    expect(getAgeBand(9)).toBe('8-10');
    expect(getAgeBand(10)).toBe('8-10');

    // 11-13 Band (Middle school exploratory learners)
    expect(getAgeBand(11)).toBe('11-13');
    expect(getAgeBand(12)).toBe('11-13');
    expect(getAgeBand(13)).toBe('11-13');

    // 14-16 Band (Secondary academic mastery learners)
    expect(getAgeBand(14)).toBe('14-16');
    expect(getAgeBand(15)).toBe('14-16');
    expect(getAgeBand(16)).toBe('14-16');
  });

  it('handles edge cases and invalid or undefined ages safely with sensible fallback', () => {
    expect(getAgeBand(undefined)).toBe('11-13');
    expect(getAgeBand(NaN)).toBe('11-13');
    expect(getAgeBand(4)).toBe('5-7');
    expect(getAgeBand(18)).toBe('14-16');
  });
});
