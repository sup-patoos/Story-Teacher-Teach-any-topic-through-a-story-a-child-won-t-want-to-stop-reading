/**
 * @file learning.ts
 * Core types and data models for StoryLearn.
 * Documented in plain English for clean maintenance and future backend migration.
 */

// --- SYLLABUS TYPES ---
export interface SyllabusSubtopic {
  id: string;
  title: string;
  videoId: string | null;
}

export interface SyllabusChapter {
  id: string;
  chapterNumber: number;
  title: string;
  subtopics: SyllabusSubtopic[];
}

export interface SyllabusBranch {
  branch: string;
  id: string;
  chapters: SyllabusChapter[];
}

export interface SyllabusSubject {
  subject: string;
  id: string;
  chapters?: SyllabusChapter[]; // for Mathematics
  branches?: SyllabusBranch[];   // for Science
}

export interface SyllabusClass {
  class: number;
  subjects: SyllabusSubject[];
}

export interface SyllabusData {
  source: string;
  classes: SyllabusClass[];
}

// --- LEARNING LEVELS & AGE BANDS ---
export type EducationLevel =
  | 'Class 6'
  | 'Class 7'
  | 'Class 8'
  | 'Class 9'
  | 'Class 10'
  | 'Beginner'
  | 'Intermediate'
  | 'Advanced';

export type AgeBand = '5-7' | '8-10' | '11-13' | '14-16';

export function getAgeBand(age?: number): AgeBand {
  if (!age || isNaN(age)) return '11-13'; // Default middle-school band
  if (age <= 7) return '5-7';
  if (age <= 10) return '8-10';
  if (age <= 13) return '11-13';
  return '14-16';
}

export function getTypicalAgeForClass(classNum?: number | string): number {
  const num = typeof classNum === 'string' ? parseInt(classNum.replace(/\D/g, ''), 10) : classNum;
  switch (num) {
    case 5:
      return 10;
    case 6:
      return 11;
    case 7:
      return 12;
    case 8:
      return 13;
    case 9:
      return 14;
    case 10:
      return 15;
    default:
      return 13;
  }
}

/**
 * Maps typical age back to corresponding school Class.
 * Class 6=11, 7=12, 8=13, 9=14, 10=15.
 */
export function getClassForTypicalAge(age?: number): EducationLevel {
  if (!age || age <= 11) return 'Class 6';
  if (age === 12) return 'Class 7';
  if (age === 13) return 'Class 8';
  if (age === 14) return 'Class 9';
  return 'Class 10';
}

// --- TOPIC VALIDATION ---
export interface TopicValidationResult {
  isValidLearningTopic: boolean;
  subject: 'Mathematics' | 'Physics' | 'Chemistry' | 'Biology' | 'Environment' | 'Other';
  isSafeForKids: boolean;
  suggestedTitle: string;
  conceptId: string;
  suggestedBetterQuery?: string;
  refusalReason?: string;
  alternativeSuggestions: string[];
  matchedSyllabusSubtopic?: {
    classNum: number;
    subjectName: string;
    chapterTitle: string;
    subtopicTitle: string;
    subtopicId: string;
  };
}

// --- INTERACTIVE STORY ENGINE ---
export type WidgetTemplate = 'slider' | 'graph' | 'numberline' | 'dragdrop' | 'pie' | 'none';

export interface SceneWidgetConfig {
  template: WidgetTemplate;
  parameters: {
    label?: string;
    unit?: string;
    min?: number;
    max?: number;
    defaultValue?: number;
    step?: number;
    targetValue?: number;
    // For graphs
    xAxisLabel?: string;
    yAxisLabel?: string;
    // For dragdrop
    categories?: string[];
    items?: Array<{ id: string; text: string; correctCategory: string; emoji?: string }>;
    // For numberline
    points?: Array<{ value: number; label: string; color?: string }>;
    // For pie
    slices?: Array<{ label: string; value: number; color?: string }>;
    explanation?: string;
  };
}

export interface SceneVisual {
  type: 'illustration' | 'widget' | 'both';
  illustrationPrompt: string;
  emoji: string;
  artStyle?: string;
  accentColor?: string;
  widget: SceneWidgetConfig;
}

export interface SceneInteraction {
  type: 'choice' | 'predict' | 'question' | 'slider';
  prompt: string;
  options?: string[];
  correctAnswer: string | number;
  explanation: string;
  reactionCorrect: string;
  reactionIncorrect: string;
}

export interface StoryScene {
  sceneNumber: number;
  header: string;
  text: string;
  dialogue?: Array<{ speaker: string; text: string; avatar?: string }>;
  visual: SceneVisual;
  interaction?: SceneInteraction | null;
}

export interface InteractiveStory {
  title: string;
  concept: string;
  conceptId: string;
  level: EducationLevel;
  subject: string;
  targetAgeGroup: string;
  targetAge?: number;
  ageBand?: AgeBand;
  summary: string;
  scenes: StoryScene[];
  isTeacherVerified?: boolean;
  generatedAt?: string;
}

// --- ASSESSMENT / QUIZ ---
export type QuizQuestionType =
  | 'multiple_choice'
  | 'prediction'
  | 'application'
  | 'short_answer'
  | 'in_your_own_words';

export interface QuizQuestion {
  id: string;
  type: QuizQuestionType;
  prompt: string;
  options?: string[]; // for multiple_choice & prediction
  correctAnswer?: string;
  acceptableKeywords?: string[]; // for short_answer evaluation
  misconceptionTarget: string; // The specific misconception this question probes
  rubric: string; // plain English explanation of what a correct understanding demonstrates
  hint?: string;
}

export interface QuizData {
  topic: string;
  conceptId: string;
  level: EducationLevel;
  targetAge?: number;
  ageBand?: AgeBand;
  questions: QuizQuestion[];
  isTeacherVerified?: boolean;
}

export interface ChildAnswerRecord {
  questionId: string;
  questionType: QuizQuestionType;
  prompt: string;
  childAnswer: string;
  isCorrectEstimate?: boolean;
}

// --- AI UNDERSTANDING ANALYSIS ---
export interface MisconceptionReport {
  description: string;
  evidence: string;
}

export interface NextStepRecommendation {
  type: 'simpler_explanation' | 'new_example' | 'corrective_story' | 'move_on';
  title: string;
  content: string;
}

export interface UnderstandingAnalysis {
  conceptScores: Array<{ concept: string; score: number }>;
  misconceptions: MisconceptionReport[];
  strengths: string[];
  feedbackForChild: string; // warm, encouraging, 2-3 sentences
  nextStep: NextStepRecommendation;
  recommendedNextTopics: string[];
  overallMastery: number; // 0 to 100
  evaluatedAt: string;
}

// --- CORRECTIVE CONTENT ---
export interface CorrectiveStory {
  title: string;
  concept: string;
  targetedMisconception: string;
  scenes: Array<{
    header: string;
    text: string;
    visualEmoji: string;
  }>;
  takeaway: string;
  recheckQuestions: Array<{
    prompt: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
  }>;
}

// --- MASTERY & USER DATA MODEL ---
export type MasteryTier = 'Needs Help' | 'Getting There' | 'Strong' | 'Mastered';

export interface ConceptMasteryRecord {
  conceptId: string;
  topicTitle: string;
  subject: string;
  level: EducationLevel;
  masteryScore: number; // 0 - 100
  attemptsCount: number;
  lastAttemptDate: string;
  misconceptionsEncountered: string[];
  hasPassedRecheck?: boolean;
  preCorrectiveScore?: number;
  postCorrectiveScore?: number;
}

export interface StudentProfile {
  name: string;
  avatarEmoji: string;
  preferredClass: 7 | 8 | 9 | 10;
  age?: number;
  streakDays: number;
  lastActiveDate: string; // YYYY-MM-DD
  totalMinutesStudied: number;
  badgesEarned: Array<{
    id: string;
    title: string;
    description: string;
    icon: string;
    earnedAt: string;
  }>;
  recentTopics: Array<{
    conceptId: string;
    title: string;
    subject: string;
    timestamp: string;
    modeUsed: 'story' | 'video' | 'text';
  }>;
}

export interface SessionReportItem {
  id: string;
  date: string; // YYYY-MM-DD
  topicTitle: string;
  conceptId: string;
  subject: string;
  isSyllabusTopic: boolean;
  timeSpentSeconds: number;
  quizScorePercentage: number;
  conceptMasteryScore: number;
  misconceptionsDetected: string[];
  strengthsObserved: string[];
  suggestedNextAction: string;
}

export interface ParentSettings {
  pin?: string; // Legacy plain PIN (migrated to pinHash on first use)
  pinHash: string; // Salted SHA-256 hash of 4-digit PIN
  dailyTimeLimitMinutes: number; // e.g. 30
  syllabusOnly: boolean; // disables Door 1 when true
  reminderTime: string; // e.g. "17:30"
}
