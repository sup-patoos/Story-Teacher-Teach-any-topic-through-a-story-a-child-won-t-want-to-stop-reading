import { describe, it, expect, beforeEach } from 'vitest';
import { calculateUpdatedMasteryScore, updateConceptMastery, getAllMasteryRecords } from '../services/storageService';

describe('Concept Mastery Score Engine', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('weights recent attempts more than prior history (60% current, 40% prior)', () => {
    // Initial attempt starting at 50, scoring 100 on new attempt
    // Expected: 50 * 0.4 + 100 * 0.6 = 20 + 60 = 80
    const score = calculateUpdatedMasteryScore(50, 100, false);
    expect(score).toBe(80);
    // Recent attempt made a 30-point leap, proving heavy weighting on recent attempt
    expect(score).toBeGreaterThan(50);
  });

  it('weights recheck attempts after corrective story even more heavily (70% current, 30% prior)', () => {
    // Student initially had weak mastery of 30, but scored 90 after reading lightbulb moment story
    // Expected: 30 * 0.3 + 90 * 0.7 = 9 + 63 = 72
    const score = calculateUpdatedMasteryScore(30, 90, true);
    expect(score).toBe(72);
  });

  it('always keeps mastery score strictly bounded within 0 to 100', () => {
    // Lower bound safety
    expect(calculateUpdatedMasteryScore(10, 0, false)).toBe(4);
    expect(calculateUpdatedMasteryScore(0, 0, false)).toBe(0);
    expect(calculateUpdatedMasteryScore(undefined, -10, false)).toBe(0);

    // Upper bound safety
    expect(calculateUpdatedMasteryScore(95, 100, false)).toBe(98);
    expect(calculateUpdatedMasteryScore(100, 100, false)).toBe(100);
    expect(calculateUpdatedMasteryScore(undefined, 150, false)).toBe(100);
  });

  it('correctly tracks progress record and detects crossing 80% mastery threshold', () => {
    const result1 = updateConceptMastery(
      'test-concept-1',
      'Laws of Motion',
      'Physics',
      'Class 9',
      70,
      []
    );
    expect(result1.updatedRecord.masteryScore).toBe(70);
    expect(result1.crossedEighty).toBe(false);

    // Second attempt pushes mastery across 80%: 70 * 0.4 + 90 * 0.6 = 28 + 54 = 82
    const result2 = updateConceptMastery(
      'test-concept-1',
      'Laws of Motion',
      'Physics',
      'Class 9',
      90,
      []
    );
    expect(result2.updatedRecord.masteryScore).toBe(82);
    expect(result2.crossedEighty).toBe(true);
    expect(result2.updatedRecord.attemptsCount).toBe(2);
  });
});
