import { describe, it, expect } from 'vitest';
import { getTypicalAgeForClass, getClassForTypicalAge } from '../types/learning';

describe('Class to Typical Age Synchronization', () => {
  it('maps each school class to its typical learner age', () => {
    // String class representations
    expect(getTypicalAgeForClass('Class 6')).toBe(11);
    expect(getTypicalAgeForClass('Class 7')).toBe(12);
    expect(getTypicalAgeForClass('Class 8')).toBe(13);
    expect(getTypicalAgeForClass('Class 9')).toBe(14);
    expect(getTypicalAgeForClass('Class 10')).toBe(15);

    // Numeric class representations
    expect(getTypicalAgeForClass(6)).toBe(11);
    expect(getTypicalAgeForClass(7)).toBe(12);
    expect(getTypicalAgeForClass(8)).toBe(13);
    expect(getTypicalAgeForClass(9)).toBe(14);
    expect(getTypicalAgeForClass(10)).toBe(15);
  });

  it('maps typical age back to corresponding school class reversibly', () => {
    expect(getClassForTypicalAge(11)).toBe('Class 6');
    expect(getClassForTypicalAge(12)).toBe('Class 7');
    expect(getClassForTypicalAge(13)).toBe('Class 8');
    expect(getClassForTypicalAge(14)).toBe('Class 9');
    expect(getClassForTypicalAge(15)).toBe('Class 10');
  });

  it('handles out-of-range boundaries gracefully', () => {
    // Under 11 maps to earliest available curriculum class (Class 6)
    expect(getClassForTypicalAge(5)).toBe('Class 6');
    expect(getClassForTypicalAge(8)).toBe('Class 6');
    // Over 15 maps to senior class (Class 10)
    expect(getClassForTypicalAge(16)).toBe('Class 10');
    expect(getClassForTypicalAge(undefined)).toBe('Class 6');
  });
});
