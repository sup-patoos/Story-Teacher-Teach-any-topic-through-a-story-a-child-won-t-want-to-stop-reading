import { describe, it, expect } from 'vitest';
import { generateCacheKey } from '../services/storageService';

describe('Cache Key Generation and Collision Prevention', () => {
  it('generates deterministic cache keys with concept, level, and age band', () => {
    const key = generateCacheKey('c9-physics-ch01-s1', 'Class 9', 14);
    expect(key).toBe('c9-physics-ch01-s1__Class 9__14-16');
  });

  it('guarantees different age bands never collide for the same concept and class', () => {
    const concept = 'photosynthesis';
    const level = 'Class 7';

    const keyAge6 = generateCacheKey(concept, level, 6);   // Band 5-7
    const keyAge9 = generateCacheKey(concept, level, 9);   // Band 8-10
    const keyAge12 = generateCacheKey(concept, level, 12); // Band 11-13
    const keyAge15 = generateCacheKey(concept, level, 15); // Band 14-16

    const keys = [keyAge6, keyAge9, keyAge12, keyAge15];
    const uniqueKeys = new Set(keys);

    expect(uniqueKeys.size).toBe(4);
    expect(keyAge6).not.toBe(keyAge9);
    expect(keyAge9).not.toBe(keyAge12);
    expect(keyAge12).not.toBe(keyAge15);
  });

  it('guarantees different education levels never collide for the same concept and age', () => {
    const concept = 'newtons-laws';
    const age = 13;

    const keyClass7 = generateCacheKey(concept, 'Class 7', age);
    const keyClass8 = generateCacheKey(concept, 'Class 8', age);
    const keyClass9 = generateCacheKey(concept, 'Class 9', age);
    const keyAdvanced = generateCacheKey(concept, 'Advanced', age);

    const levels = [keyClass7, keyClass8, keyClass9, keyAdvanced];
    const uniqueLevels = new Set(levels);

    expect(uniqueLevels.size).toBe(4);
  });
});
