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

/**
 * Calculates updated concept mastery score:
 * - Weights recent attempts more (60% regular attempt, 70% post-corrective recheck)
 * - Always clamped strictly within 0 - 100
 */
export function calculateUpdatedMasteryScore(
  prevScore: number | undefined,
  quizScore: number,
  isRecheck: boolean = false
): number {
  const boundedQuiz = Math.min(100, Math.max(0, quizScore));
  if (prevScore === undefined) {
    return Math.min(100, Math.max(0, Math.round(boundedQuiz)));
  }
  const boundedPrev = Math.min(100, Math.max(0, prevScore));
  if (isRecheck) {
    return Math.min(100, Math.max(0, Math.round(boundedPrev * 0.3 + boundedQuiz * 0.7)));
  }
  return Math.min(100, Math.max(0, Math.round(boundedPrev * 0.4 + boundedQuiz * 0.6)));
}

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
    newMasteryScore = calculateUpdatedMasteryScore(prevScore, quizScore, isRecheck);
    if (isRecheck) {
      existing.postCorrectiveScore = newMasteryScore;
      existing.hasPassedRecheck = quizScore >= 70;
    } else {
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

/**
 * Generates cache key for stories and quizzes ensuring different
 * age bands or education levels never collide.
 */
export function generateCacheKey(conceptId: string, level: string, age?: number): string {
  const band = getAgeBand(age);
  return `${conceptId}__${level}__${band}`;
}

export function getCachedStory(conceptId: string, level: string, age?: number): InteractiveStory | null {
  // Check preloaded first
  if (PRELOADED_TOPICS[conceptId]) {
    return PRELOADED_TOPICS[conceptId].story;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CACHE_STORIES);
    if (!raw) return null;
    const cache = JSON.parse(raw);
    const keyWithBand = generateCacheKey(conceptId, level, age);
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
    const keyWithBand = generateCacheKey(story.conceptId, story.level, age || story.targetAge);
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
    const keyWithBand = generateCacheKey(conceptId, level, age);
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
    const keyWithBand = generateCacheKey(quiz.conceptId, quiz.level, age || quiz.targetAge);
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

export interface DailyReportSummary {
  date: string;
  totalSessions: number;
  understoodWellCount: number;
  needsImprovementCount: number;
  totalTimeSpentMinutes: number;
  syllabusReportsCount: number;
  exploredReportsCount: number;
  recommendedFocus: string;
}

/**
 * Pure helper to calculate daily summary metrics from session report items.
 */
export function generateDailyReportSummary(date: string, reports: SessionReportItem[]): DailyReportSummary {
  const dateReports = reports.filter(r => r.date === date);
  const syllabusReports = dateReports.filter(r => r.isSyllabusTopic);
  const exploredReports = dateReports.filter(r => !r.isSyllabusTopic);
  const understoodWell = dateReports.filter(r => r.conceptMasteryScore >= 70);
  const needsImprovement = dateReports.filter(r => r.conceptMasteryScore < 70);
  const totalSeconds = dateReports.reduce((acc, r) => acc + (r.timeSpentSeconds || 0), 0);

  let recommendedFocus = 'Great progress! Continue exploring new topics.';
  if (needsImprovement.length > 0) {
    const primary = needsImprovement[0];
    const misconception = primary.misconceptionsDetected?.[0] || 'core principle';
    recommendedFocus = `Review ${primary.topicTitle}: address detected misconception "${misconception}" with a tangible hands-on example before moving to new chapters.`;
  } else if (syllabusReports.length > 0) {
    recommendedFocus = `Great mastery demonstrated across topics! Encourage the student to advance to next higher-level subtopics in ${syllabusReports[0]?.subject || 'Science'}.`;
  }

  return {
    date,
    totalSessions: dateReports.length,
    understoodWellCount: understoodWell.length,
    needsImprovementCount: needsImprovement.length,
    totalTimeSpentMinutes: Math.floor(totalSeconds / 60),
    syllabusReportsCount: syllabusReports.length,
    exploredReportsCount: exploredReports.length,
    recommendedFocus
  };
}

// ---------------- PARENT SETTINGS & PIN SECURITY ----------------

/**
 * Fast synchronous SHA-256 implementation for client-side salted PIN hashing.
 */
function computeSha256(ascii: string): string {
  function rightRotate(value: number, amount: number) {
    return (value >>> amount) | (value << (32 - amount));
  }
  let i: number, j: number;
  let result = '';

  const words: number[] = [];
  const asciiBitLength = ascii.length * 8;

  let hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
  ];

  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];

  for (i = 0; i < ascii.length; i++) {
    const code = ascii.charCodeAt(i);
    words[i >> 2] |= code << (24 - (i % 4) * 8);
  }

  words[asciiBitLength >> 5] |= 0x80 << (24 - (asciiBitLength % 32));
  words[(((asciiBitLength + 64) >> 9) << 4) + 15] = asciiBitLength;

  for (i = 0; i < words.length; i += 16) {
    const w = words.slice(i, i + 16);
    const oldHash = hash.slice(0);

    for (j = 0; j < 64; j++) {
      if (j >= 16) {
        const s0 = rightRotate(w[j - 15], 7) ^ rightRotate(w[j - 15], 18) ^ (w[j - 15] >>> 3);
        const s1 = rightRotate(w[j - 2], 17) ^ rightRotate(w[j - 2], 19) ^ (w[j - 2] >>> 10);
        w[j] = (w[j - 16] + s0 + w[j - 7] + s1) | 0;
      }

      const s1 = rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25);
      const ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
      const temp1 = (hash[7] + s1 + ch + k[j] + (w[j] | 0)) | 0;
      const s0 = rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22);
      const maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
      const temp2 = (s0 + maj) | 0;

      hash = [(temp1 + temp2) | 0, hash[0], hash[1], hash[2], (hash[3] + temp1) | 0, hash[4], hash[5], hash[6]];
    }

    for (j = 0; j < 8; j++) {
      hash[j] = (hash[j] + oldHash[j]) | 0;
    }
  }

  for (i = 0; i < 8; i++) {
    for (j = 3; j >= 0; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += (b < 16 ? '0' : '') + b.toString(16);
    }
  }

  return result;
}

const PIN_SALT = 'storylearn_pin_salt_v1';

/**
 * Creates salted SHA-256 hash of 4-digit Parent Portal PIN.
 */
export function hashParentPin(pin: string): string {
  return computeSha256(`${PIN_SALT}:${pin.trim()}`);
}

/**
 * Verifies user entered PIN against stored hashed PIN.
 * Supports transparent fallback verification for unmigrated plain PINs.
 */
export function verifyParentPin(inputPin: string, settings: ParentSettings): boolean {
  const clean = inputPin.trim();
  if (settings.pinHash) {
    return hashParentPin(clean) === settings.pinHash;
  }
  if (settings.pin) {
    return clean === settings.pin.trim();
  }
  return false;
}

const DEFAULT_PARENT_SETTINGS: ParentSettings = {
  pinHash: hashParentPin('1234'),
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
    const parsed = JSON.parse(raw);
    let migrated = false;

    // Security: migrate legacy plain PIN to salted SHA-256 hash on first read
    if (parsed.pin && !parsed.pinHash) {
      parsed.pinHash = hashParentPin(parsed.pin);
      delete parsed.pin;
      migrated = true;
    } else if (!parsed.pinHash) {
      parsed.pinHash = hashParentPin('1234');
      migrated = true;
    }

    if (migrated) {
      try {
        localStorage.setItem(STORAGE_KEYS.PARENT_SETTINGS, JSON.stringify(parsed));
      } catch (err) {
        console.error('Failed to persist migrated PIN hash:', err);
      }
    }

    return { ...DEFAULT_PARENT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_PARENT_SETTINGS;
  }
}

export function saveParentSettings(settings: ParentSettings): void {
  try {
    // Ensure plain PIN is never written back to storage
    const sanitized = { ...settings };
    if (sanitized.pin && !sanitized.pinHash) {
      sanitized.pinHash = hashParentPin(sanitized.pin);
      delete sanitized.pin;
    }
    localStorage.setItem(STORAGE_KEYS.PARENT_SETTINGS, JSON.stringify(sanitized));
  } catch (err) {
    console.error('Failed to save parent settings:', err);
  }
}
