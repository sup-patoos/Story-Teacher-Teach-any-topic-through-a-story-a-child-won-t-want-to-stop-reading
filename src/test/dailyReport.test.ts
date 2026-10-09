import { describe, it, expect } from 'vitest';
import { generateDailyReportSummary } from '../services/storageService';
import { SessionReportItem } from '../types/learning';

describe('Daily Report Generator', () => {
  const sampleSessions: SessionReportItem[] = [
    {
      id: 'rep_1',
      date: '2026-10-08',
      topicTitle: 'Distance and displacement',
      conceptId: 'c9-physics-ch01-s1',
      subject: 'Physics',
      isSyllabusTopic: true,
      timeSpentSeconds: 600, // 10 mins
      quizScorePercentage: 85,
      conceptMasteryScore: 82, // >= 70 Understood well
      misconceptionsDetected: [],
      strengthsObserved: ['Strong vector grasp'],
      suggestedNextAction: 'Advance to acceleration'
    },
    {
      id: 'rep_2',
      date: '2026-10-08',
      topicTitle: 'Integers addition and subtraction',
      conceptId: 'c7-math-ch01-s1',
      subject: 'Mathematics',
      isSyllabusTopic: true,
      timeSpentSeconds: 300, // 5 mins
      quizScorePercentage: 55,
      conceptMasteryScore: 50, // < 70 Needs improvement
      misconceptionsDetected: ['Double negatives confused with positive multiplication'],
      strengthsObserved: ['Understood number line direction'],
      suggestedNextAction: 'Review sign rules'
    },
    {
      id: 'rep_3',
      date: '2026-10-08',
      topicTitle: 'Why is the sky blue?',
      conceptId: 'sky-blue-curiosity',
      subject: 'Physics',
      isSyllabusTopic: false, // Explored topic
      timeSpentSeconds: 300, // 5 mins
      quizScorePercentage: 90,
      conceptMasteryScore: 88, // >= 70 Understood well
      misconceptionsDetected: [],
      strengthsObserved: ['Understood Rayleigh scattering'],
      suggestedNextAction: 'Explore optical prisms'
    },
    {
      id: 'rep_other_date',
      date: '2026-10-07',
      topicTitle: 'Acids and bases',
      conceptId: 'c7-chem-ch01-s1',
      subject: 'Chemistry',
      isSyllabusTopic: true,
      timeSpentSeconds: 400,
      quizScorePercentage: 80,
      conceptMasteryScore: 78,
      misconceptionsDetected: [],
      strengthsObserved: [],
      suggestedNextAction: 'Next chapter'
    }
  ];

  it('filters sessions by the requested date and calculates metrics correctly', () => {
    const summary = generateDailyReportSummary('2026-10-08', sampleSessions);

    expect(summary.date).toBe('2026-10-08');
    expect(summary.totalSessions).toBe(3);
    expect(summary.understoodWellCount).toBe(2); // rep_1 (82) and rep_3 (88)
    expect(summary.needsImprovementCount).toBe(1); // rep_2 (50)
    expect(summary.totalTimeSpentMinutes).toBe(20); // (600 + 300 + 300) / 60
    expect(summary.syllabusReportsCount).toBe(2); // rep_1 and rep_2
    expect(summary.exploredReportsCount).toBe(1); // rep_3
  });

  it('generates an actionable pedagogical recommendation focusing on student misconceptions', () => {
    const summary = generateDailyReportSummary('2026-10-08', sampleSessions);

    expect(summary.recommendedFocus).toContain('Review Integers addition and subtraction');
    expect(summary.recommendedFocus).toContain('Double negatives confused with positive multiplication');
  });

  it('handles empty session days cleanly without errors', () => {
    const emptySummary = generateDailyReportSummary('2026-10-01', sampleSessions);

    expect(emptySummary.totalSessions).toBe(0);
    expect(emptySummary.understoodWellCount).toBe(0);
    expect(emptySummary.needsImprovementCount).toBe(0);
    expect(emptySummary.totalTimeSpentMinutes).toBe(0);
    expect(emptySummary.recommendedFocus).toBeDefined();
  });
});
