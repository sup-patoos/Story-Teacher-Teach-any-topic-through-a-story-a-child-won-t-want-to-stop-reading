/**
 * @file storageService.ts
 * Clean, modular LocalStorage database layer for StoryLearn.
 * Manages student profiles, streak tracking, concept mastery scores,
 * content cache, session reports, and parental control settings.
 */

import {
  StudentProfile,
  ConceptMasteryRecord,
  InteractiveStory,
  QuizData,
  SessionReportItem,
  ParentSettings,
  MasteryTier,
  EducationLevel,
  getAgeBand,
  getTypicalAgeForClass
} from '../types/learning';
import { PRELOADED_TOPICS } from '../data/preloadedContent';

const STORAGE_KEYS = {
  PROFILE: 'storylearn_student_profile',
  MASTERY: 'storylearn_mastery_records',
  CACHE_STORIES: 'storylearn_cached_stories',
  CACHE_QUIZZES: 'storylearn_cached_quizzes',
  REPORTS: 'storylearn_session_reports',
  PARENT_SETTINGS: 'storylearn_parent_settings',
  VERIFIED_TOPICS: 'storylearn_verified_topics',
  TODAY_STUDY_TIME: 'storylearn_today_seconds'
};

// Helper: today YYYY-MM-DD
export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper: calculate yesterday YYYY-MM-DD
function getYesterdayDateString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// ---------------- STUDENT PROFILE & STREAK ----------------

const DEFAULT_PROFILE: StudentProfile = {
  name: 'Aarav',
  avatarEmoji: '🚀',
  preferredClass: 8,
  age: 13, // Typical age for Class 8
  streakDays: 3,
  lastActiveDate: getTodayDateString(),
  totalMinutesStudied: 32,
  badgesEarned: [
    {
      id: 'welcome',
      title: 'First Curiosity Step',
      description: 'Embarked on your first interactive story learning adventure!',
      icon: '🌟',
      earnedAt: getTodayDateString()
    },
    {
      id: 'streak_3',
      title: '3-Day Story Streak',
      description: 'Kept the fire burning for 3 consecutive days of wonder!',
      icon: '🔥',
      earnedAt: getTodayDateString()
    }
  ],
  recentTopics: [
    {
      conceptId: 'c9-physics-ch01-s1',
      title: 'Distance and displacement, uniform and non-uniform motion',
      subject: 'Physics',
      timestamp: new Date().toISOString(),
      modeUsed: 'story'
    },
    {
      conceptId: 'c7-math-ch01-s1',
      title: 'Properties of addition and subtraction of integers',
      subject: 'Mathematics',
      timestamp: new Date().toISOString(),
      modeUsed: 'story'
    }
  ]
};

export function getStudentProfile(): StudentProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (!raw) {
      saveStudentProfile(DEFAULT_PROFILE);
      return DEFAULT_PROFILE;
    }
    const profile: StudentProfile = JSON.parse(raw);

    // If age is not set, use typical age for preferred class
    if (profile.age === undefined || profile.age === null) {
      profile.age = getTypicalAgeForClass(profile.preferredClass);
    }

    // Update streak logic on load
    const today = getTodayDateString();
    const yesterday = getYesterdayDateString();

    if (profile.lastActiveDate !== today) {
      if (profile.lastActiveDate === yesterday) {
        // Active yesterday! Streak maintained and incremented
        profile.streakDays += 1;
        profile.lastActiveDate = today;
      } else if (profile.lastActiveDate < yesterday) {
        // Missed a day: gentle reset to 1 without negative tone
        profile.streakDays = 1;
        profile.lastActiveDate = today;
      }
      saveStudentProfile(profile);
    }

    return profile;
  } catch (err) {
    console.error('Failed to load profile:', err);
    return DEFAULT_PROFILE;
  }
}

export function saveStudentProfile(profile: StudentProfile): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  } catch (err) {
    console.error('Failed to save profile:', err);
  }
}

export function updateStudentAge(age: number): void {
  const profile = getStudentProfile();
  profile.age = Math.min(16, Math.max(5, age));
  saveStudentProfile(profile);
}

export function addRecentTopic(
  conceptId: string,
  title: string,
  subject: string,
  modeUsed: 'story' | 'video' | 'text'
): void {
  const profile = getStudentProfile();
  // Filter out duplicates and add to front
  const filtered = profile.recentTopics.filter(t => t.conceptId !== conceptId);
  filtered.unshift({
    conceptId,
    title,
    subject,
    timestamp: new Date().toISOString(),
    modeUsed
  });
  profile.recentTopics = filtered.slice(0, 8); // Keep last 8
  saveStudentProfile(profile);
}

export function awardBadgeIfEligible(badgeId: string, title: string, description: string, icon: string): boolean {
  const profile = getStudentProfile();
  if (profile.badgesEarned.some(b => b.id === badgeId)) return false;

  profile.badgesEarned.push({
    id: badgeId,
    title,
    description,
    icon,
    earnedAt: getTodayDateString()
  });
  saveStudentProfile(profile);
  return true;
}

// ---------------- STUDY TIME TRACKING ----------------

export function addTodayStudyTime(seconds: number): number {
  try {
    const today = getTodayDateString();
    const storedDate = localStorage.getItem('storylearn_study_date');
    let currentSeconds = 0;

    if (storedDate === today) {
      currentSeconds = parseInt(localStorage.getItem(STORAGE_KEYS.TODAY_STUDY_TIME) || '0', 10);
    } else {
      localStorage.setItem('storylearn_study_date', today);
    }

    const updatedSeconds = currentSeconds + seconds;
    localStorage.setItem(STORAGE_KEYS.TODAY_STUDY_TIME, updatedSeconds.toString());

    // Also update total minutes in profile
    const profile = getStudentProfile();
    profile.totalMinutesStudied = Math.floor(updatedSeconds / 60);
    saveStudentProfile(profile);

    return updatedSeconds;
  } catch (err) {
    return 0;
  }
}

export function getTodayStudyTimeSeconds(): number {
  try {
    const today = getTodayDateString();
    const storedDate = localStorage.getItem('storylearn_study_date');
    if (storedDate !== today) return 0;
    return parseInt(localStorage.getItem(STORAGE_KEYS.TODAY_STUDY_TIME) || '0', 10);
  } catch {
    return 0;
  }
}

// ---------------- CONCEPT MASTERY ENGINE ----------------

export function getMasteryTier(score: number): MasteryTier {
  if (score >= 90) return 'Mastered';
  if (score >= 70) return 'Strong';
  if (score >= 40) return 'Getting There';
  return 'Needs Help';
}

export function getAllMasteryRecords(): Record<string, ConceptMasteryRecord> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MASTERY);
    if (!raw) {
      // Seed with sample initial records for preloaded topics
      const initial: Record<string, ConceptMasteryRecord> = {
        'c9-physics-ch01-s1': {
          conceptId: 'c9-physics-ch01-s1',
          topicTitle: 'Distance and displacement, uniform and non-uniform motion',
          subject: 'Physics',
          level: 'Class 9',
          masteryScore: 82,
          attemptsCount: 2,
          lastAttemptDate: getTodayDateString(),
          misconceptionsEncountered: []
        },
        'c7-math-ch01-s1': {
          conceptId: 'c7-math-ch01-s1',
          topicTitle: 'Properties of addition and subtraction of integers',
          subject: 'Mathematics',
          level: 'Class 7',
          masteryScore: 74,
          attemptsCount: 1,
          lastAttemptDate: getTodayDateString(),
          misconceptionsEncountered: []
        }
      };
      localStorage.setItem(STORAGE_KEYS.MASTERY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load mastery records:', err);
    return {};
  }
}

export function getConceptMastery(conceptId: string): ConceptMasteryRecord | null {
  const all = getAllMasteryRecords();
  return all[conceptId] || null;
}

export function updateConceptMastery(
  conceptId: string,
  topicTitle: string,
  subject: string,
  level: EducationLevel,
  quizScore: number, // 0 - 100
  newMisconceptions: string[] = [],
  isRecheck: boolean = false
): { updatedRecord: ConceptMasteryRecord; crossedEighty: boolean } {
  const all = getAllMasteryRecords();
  const existing = all[conceptId];

  let crossedEighty = false;
  let newMasteryScore: number;

  if (existing) {
    const prevScore = existing.masteryScore;
    if (isRecheck) {
      // If passing recheck after corrective story, weight new understanding heavily!
      newMasteryScore = Math.min(100, Math.round(prevScore * 0.3 + quizScore * 0.7));
      existing.postCorrectiveScore = newMasteryScore;
      existing.hasPassedRecheck = quizScore >= 70;
    } else {
      // Weight recent attempt 60%, prior mastery 40%
      newMasteryScore = Math.round(prevScore * 0.4 + quizScore * 0.6);
      existing.preCorrectiveScore = prevScore;
    }

    if (prevScore < 80 && newMasteryScore >= 80) {
      crossedEighty = true;
    }

    // Merge misconceptions uniquely
    const mergedMisconceptions = Array.from(
      new Set([...existing.misconceptionsEncountered, ...newMisconceptions])
    );

    all[conceptId] = {
      ...existing,
      topicTitle,
      subject,
      level,
      masteryScore: newMasteryScore,
      attemptsCount: existing.attemptsCount + 1,
      lastAttemptDate: getTodayDateString(),
      misconceptionsEncountered: mergedMisconceptions
    };
  } else {
    newMasteryScore = Math.round(quizScore);
    if (newMasteryScore >= 80) {
      crossedEighty = true;
    }
    all[conceptId] = {
      conceptId,
      topicTitle,
      subject,
      level,
      masteryScore: newMasteryScore,
      attemptsCount: 1,
      lastAttemptDate: getTodayDateString(),
      misconceptionsEncountered: newMisconceptions
    };
  }

  // Check for milestone badges
  if (newMasteryScore >= 80) {
    awardBadgeIfEligible(
      'first_mastery',
      'Concept Master',
      `Mastered "${topicTitle}" with over 80% understanding!`,
      '🏆'
    );
  }

  const masteredCount = Object.values(all).filter(r => r.masteryScore >= 80).length;
  if (masteredCount >= 5) {
    awardBadgeIfEligible(
      'five_mastered',
      'High Achiever',
      'Mastered 5 distinct topics across Science and Mathematics!',
      '🌟'
    );
  }

  try {
    localStorage.setItem(STORAGE_KEYS.MASTERY, JSON.stringify(all));
  } catch (err) {
    console.error('Failed to save mastery:', err);
  }

  return { updatedRecord: all[conceptId], crossedEighty };
}

// ---------------- CONTENT CACHE ----------------

export function getCachedStory(conceptId: string, level: string, age?: number): InteractiveStory | null {
  // Check preloaded first
  if (PRELOADED_TOPICS[conceptId]) {
    return PRELOADED_TOPICS[conceptId].story;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CACHE_STORIES);
    if (!raw) return null;
    const cache = JSON.parse(raw);
    const band = getAgeBand(age);
    const keyWithBand = `${conceptId}__${level}__${band}`;
    const keyWithoutBand = `${conceptId}__${level}`;
    // Treat old entries as valid for fallback
    return cache[keyWithBand] || cache[keyWithoutBand] || cache[conceptId] || null;
  } catch {
    return null;
  }
}

export function saveCachedStory(story: InteractiveStory, age?: number): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CACHE_STORIES);
    const cache = raw ? JSON.parse(raw) : {};
    const band = getAgeBand(age || story.targetAge);
    const keyWithBand = `${story.conceptId}__${story.level}__${band}`;
    const keyWithoutBand = `${story.conceptId}__${story.level}`;
    cache[keyWithBand] = story;
    cache[keyWithoutBand] = story;
    cache[story.conceptId] = story;
    localStorage.setItem(STORAGE_KEYS.CACHE_STORIES, JSON.stringify(cache));
  } catch (err) {
    console.error('Failed to cache story:', err);
  }
}

export function getCachedQuiz(conceptId: string, level: string, age?: number): QuizData | null {
  if (PRELOADED_TOPICS[conceptId]) {
    return PRELOADED_TOPICS[conceptId].quiz;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CACHE_QUIZZES);
    if (!raw) return null;
    const cache = JSON.parse(raw);
    const band = getAgeBand(age);
    const keyWithBand = `${conceptId}__${level}__${band}`;
    const keyWithoutBand = `${conceptId}__${level}`;
    // Treat old entries as valid for fallback
    return cache[keyWithBand] || cache[keyWithoutBand] || cache[conceptId] || null;
  } catch {
    return null;
  }
}

export function saveCachedQuiz(quiz: QuizData, age?: number): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CACHE_QUIZZES);
    const cache = raw ? JSON.parse(raw) : {};
    const band = getAgeBand(age || quiz.targetAge);
    const keyWithBand = `${quiz.conceptId}__${quiz.level}__${band}`;
    const keyWithoutBand = `${quiz.conceptId}__${quiz.level}`;
    cache[keyWithBand] = quiz;
    cache[keyWithoutBand] = quiz;
    cache[quiz.conceptId] = quiz;
    localStorage.setItem(STORAGE_KEYS.CACHE_QUIZZES, JSON.stringify(cache));
  } catch (err) {
    console.error('Failed to cache quiz:', err);
  }
}

// ---------------- SESSION REPORTS (PARENT/TEACHER) ----------------

export function logSessionReport(report: Omit<SessionReportItem, 'id'>): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.REPORTS);
    const list: SessionReportItem[] = raw ? JSON.parse(raw) : [];
    const newItem: SessionReportItem = {
      ...report,
      id: 'rep_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6)
    };
    list.unshift(newItem);
    // Keep last 100 sessions
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(list.slice(0, 100)));
  } catch (err) {
    console.error('Failed to log report:', err);
  }
}

export function getAllSessionReports(): SessionReportItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.REPORTS);
    if (!raw) {
      // Seed with initial realistic demo reports for parents
      const initial: SessionReportItem[] = [
        {
          id: 'rep_init_1',
          date: getTodayDateString(),
          topicTitle: 'Distance and displacement, uniform and non-uniform motion',
          conceptId: 'c9-physics-ch01-s1',
          subject: 'Physics',
          isSyllabusTopic: true,
          timeSpentSeconds: 420,
          quizScorePercentage: 85,
          conceptMasteryScore: 82,
          misconceptionsDetected: ['Initially confused scalar distance with vector displacement in circular motion'],
          strengthsObserved: ['Strong grasp of the shortest straight-line concept', 'Understood zero displacement when returning to origin'],
          suggestedNextAction: 'Proceed to Speed and Acceleration to build upon vector velocity fundamentals.'
        },
        {
          id: 'rep_init_2',
          date: getYesterdayDateString(),
          topicTitle: 'Properties of addition and subtraction of integers',
          conceptId: 'c7-math-ch01-s1',
          subject: 'Mathematics',
          isSyllabusTopic: true,
          timeSpentSeconds: 360,
          quizScorePercentage: 80,
          conceptMasteryScore: 74,
          misconceptionsDetected: ['Stumbled slightly on double negative minus minus signs'],
          strengthsObserved: ['Excellent visualization with submarine ocean depth number line'],
          suggestedNextAction: 'Practice real-life temperature change and bank deposit word problems.'
        }
      ];
      localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

// ---------------- PARENT SETTINGS & SAFETY ----------------

const DEFAULT_PARENT_SETTINGS: ParentSettings = {
  pin: '1234',
  dailyTimeLimitMinutes: 35,
  syllabusOnly: false,
  reminderTime: '18:00'
};

export function getParentSettings(): ParentSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PARENT_SETTINGS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.PARENT_SETTINGS, JSON.stringify(DEFAULT_PARENT_SETTINGS));
      return DEFAULT_PARENT_SETTINGS;
    }
    return { ...DEFAULT_PARENT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PARENT_SETTINGS;
  }
}

export function saveParentSettings(settings: ParentSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PARENT_SETTINGS, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save parent settings:', err);
  }
}
