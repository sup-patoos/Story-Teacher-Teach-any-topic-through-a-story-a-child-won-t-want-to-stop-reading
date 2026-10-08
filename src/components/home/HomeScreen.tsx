/**
 * @file HomeScreen.tsx
 * Clean, professional main screen with two equal entry points:
 * Card A: Explore Anything (search + compact personalize control + 4 chips)
 * Card B: Browse by Class (NCERT Classes 7, 8, 9 shortcuts + full syllabus link)
 */

import React, { useState } from 'react';
import {
  Search,
  BookOpen,
  ArrowRight,
  Flame,
  Clock,
  AlertCircle,
  Loader2,
  SlidersHorizontal,
  X,
  Compass
} from 'lucide-react';
import { EducationLevel, TopicValidationResult, getTypicalAgeForClass } from '../../types/learning';
import {
  getStudentProfile,
  getParentSettings,
  getTodayStudyTimeSeconds,
  updateStudentAge
} from '../../services/storageService';
import { validateTopic } from '../../services/apiClient';

interface HomeScreenProps {
  onStartExploration: (topic: string, level: EducationLevel, validation: TopicValidationResult, age?: number) => void;
  onOpenClassBrowser: (classNum?: number) => void;
  onResumeTopic: (conceptId: string, title: string, subject: string) => void;
}

const FOUR_SUGGESTION_CHIPS = [
  "Newton's laws of motion",
  'How do vaccines work?',
  'Why do we have seasons?',
  'Pythagoras theorem'
];

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onStartExploration,
  onOpenClassBrowser
}) => {
  const profile = getStudentProfile();
  const parentSettings = getParentSettings();
  const todayMinutes = Math.floor(getTodayStudyTimeSeconds() / 60);

  const isTimeLimitReached =
    parentSettings.dailyTimeLimitMinutes > 0 &&
    todayMinutes >= parentSettings.dailyTimeLimitMinutes;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<EducationLevel>(
    (`Class ${profile.preferredClass}` as EducationLevel) || 'Class 8'
  );
  const [selectedAge, setSelectedAge] = useState<number>(() => {
    return profile.age || getTypicalAgeForClass(profile.preferredClass);
  });

  const [isPersonalizeOpen, setIsPersonalizeOpen] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [alternativeSuggestions, setAlternativeSuggestions] = useState<string[]>([]);

  // Keep age and class in sync when one changes, while allowing independent editing
  const handleAgeChange = (newAge: number) => {
    const clamped = Math.min(16, Math.max(5, newAge));
    setSelectedAge(clamped);
    updateStudentAge(clamped);

    // Sync typical class if age aligns
    if (clamped <= 11) setSelectedLevel('Class 6');
    else if (clamped === 12) setSelectedLevel('Class 7');
    else if (clamped === 13) setSelectedLevel('Class 8');
    else if (clamped === 14) setSelectedLevel('Class 9');
    else setSelectedLevel('Class 10');
  };

  const handleClassChange = (cls: string) => {
    setSelectedLevel(cls as EducationLevel);
    const typical = getTypicalAgeForClass(cls);
    setSelectedAge(typical);
    updateStudentAge(typical);
  };

  const handleLevelTierChange = (lvl: 'Beginner' | 'Intermediate' | 'Advanced') => {
    setSelectedLevel(lvl);
  };

  const handleSearchSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim() || isValidating) return;

    if (parentSettings.syllabusOnly) {
      setValidationMessage('Curriculum Lock is active. Please use Browse by Class to explore the syllabus.');
      return;
    }

    setIsValidating(true);
    setValidationMessage(null);

    const validation = await validateTopic(searchQuery, selectedLevel, selectedAge);
    setIsValidating(false);

    if (!validation.isSafeForKids || !validation.isValidLearningTopic) {
      setValidationMessage(
        validation.refusalReason ||
          "Please try a different topic. Here are some educational suggestions:"
      );
      setAlternativeSuggestions(validation.alternativeSuggestions || FOUR_SUGGESTION_CHIPS.slice(0, 3));
      return;
    }

    onStartExploration(validation.suggestedTitle, selectedLevel, validation, selectedAge);
  };

  const handleChipClick = (chip: string) => {
    setSearchQuery(chip);
    setValidationMessage(null);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-4 sm:py-6 space-y-5">
      {/* ---------------- TIME LIMIT BANNER (IF ACTIVE) ---------------- */}
      {isTimeLimitReached && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 flex items-center justify-between text-xs">
          <span>Daily study limit reached ({parentSettings.dailyTimeLimitMinutes} mins). Take a short break before continuing.</span>
        </div>
      )}

      {/* ---------------- 4. SLIM SINGLE-LINE WELCOME BAR ---------------- */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400">
        <div className="flex items-center gap-2 text-slate-200">
          <span className="font-semibold text-white">Welcome back, {profile.name}</span>
          <span className="text-slate-600">·</span>
          <span className="text-slate-400 font-mono">
            {selectedLevel.startsWith('Class') ? selectedLevel : `Level: ${selectedLevel}`}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-amber-300 font-mono font-medium">
            <Flame className="w-3.5 h-3.5 text-amber-400 fill-current" />
            {profile.streakDays} day streak
          </span>
          <span className="text-slate-700">·</span>
          <span className="flex items-center gap-1.5 text-slate-300 font-mono font-medium">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            {todayMinutes}m today
          </span>
        </div>
      </div>

      {/* ---------------- 1. TWO ENTRY POINTS, SIDE BY SIDE ---------------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
        {/* CARD A: EXPLORE ANYTHING */}
        <div className="flex flex-col justify-between bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
          <div className="space-y-1.5">
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Compass className="w-4 h-4 text-amber-400" />
              <span>Explore Anything</span>
            </h2>
            <p className="text-xs text-slate-400">
              Search any topic and learn it as an interactive story
            </p>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="space-y-3">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={parentSettings.syllabusOnly}
                placeholder={
                  parentSettings.syllabusOnly
                    ? 'Curriculum Lock active: use Browse by Class'
                    : 'Search any concept or topic...'
                }
                className="w-full bg-slate-950 border border-slate-700 hover:border-slate-600 focus:border-amber-400 rounded-xl py-3 pl-10 pr-28 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-400 transition-all"
              />
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

              <button
                type="submit"
                disabled={!searchQuery.trim() || isValidating || parentSettings.syllabusOnly}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
              >
                {isValidating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Checking</span>
                  </>
                ) : (
                  <>
                    <span>Create Story</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>

            {/* 2. PERSONALIZE CONTROL: Compact button under search bar */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsPersonalizeOpen(prev => !prev)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 hover:text-white transition-all cursor-pointer"
              >
                <SlidersHorizontal className="w-3 h-3 text-amber-400" />
                <span className="font-mono text-[11px] text-amber-300">Age {selectedAge}</span>
                <span className="text-slate-600">·</span>
                <span className="text-[11px] text-slate-300">{selectedLevel}</span>
                <span className="text-slate-600">·</span>
                <span className="text-[11px] text-amber-400 underline font-medium">Change</span>
              </button>

              {/* Personalize Control Modal / Popover */}
              {isPersonalizeOpen && (
                <div className="absolute left-0 top-8 z-30 w-72 sm:w-80 p-4 rounded-xl bg-slate-950 border border-slate-700 shadow-2xl space-y-3.5 animate-fadeIn">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-xs font-bold text-white">Personalize Settings</span>
                    <button
                      type="button"
                      onClick={() => setIsPersonalizeOpen(false)}
                      className="p-1 rounded text-slate-400 hover:text-white cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Age (5-16) */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Age:</span>
                      <span className="font-mono font-bold text-amber-300">Age {selectedAge}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min={5}
                        max={16}
                        step={1}
                        value={selectedAge}
                        onChange={(e) => handleAgeChange(parseInt(e.target.value, 10))}
                        className="w-full accent-amber-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                      />
                      <select
                        value={selectedAge}
                        onChange={(e) => handleAgeChange(parseInt(e.target.value, 10))}
                        className="bg-slate-900 border border-slate-700 text-slate-200 text-xs font-mono rounded-lg px-2 py-0.5 cursor-pointer"
                      >
                        {Array.from({ length: 12 }, (_, i) => i + 5).map(ageNum => (
                          <option key={ageNum} value={ageNum}>
                            {ageNum}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Class (6-10) */}
                  <div className="space-y-1.5">
                    <span className="text-xs text-slate-400">Class:</span>
                    <div className="grid grid-cols-5 gap-1">
                      {[6, 7, 8, 9, 10].map(cNum => {
                        const val = `Class ${cNum}`;
                        const isSelected = selectedLevel === val;
                        return (
                          <button
                            key={cNum}
                            type="button"
                            onClick={() => handleClassChange(val)}
                            className={`py-1 text-xs font-mono rounded-lg border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-amber-400 text-slate-950 font-bold border-amber-400'
                                : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            {cNum}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Level tier options */}
                  <div className="space-y-1.5">
                    <span className="text-xs text-slate-400">General Level:</span>
                    <div className="grid grid-cols-3 gap-1">
                      {(['Beginner', 'Intermediate', 'Advanced'] as const).map(tier => {
                        const isSelected = selectedLevel === tier;
                        return (
                          <button
                            key={tier}
                            type="button"
                            onClick={() => handleLevelTierChange(tier)}
                            className={`py-1 text-[11px] rounded-lg border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-amber-400 text-slate-950 font-bold border-amber-400'
                                : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            {tier}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </form>

          {/* 4 Suggestion Chips */}
          <div className="space-y-2 pt-1">
            <span className="text-[11px] text-slate-400 font-medium">Suggested topics:</span>
            <div className="flex flex-wrap gap-1.5">
              {FOUR_SUGGESTION_CHIPS.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleChipClick(chip)}
                  className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs transition-colors cursor-pointer"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          {/* Validation Feedback */}
          {validationMessage && (
            <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/60 text-xs space-y-2">
              <div className="flex items-center gap-1.5 text-amber-300 font-medium">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{validationMessage}</span>
              </div>
              {alternativeSuggestions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {alternativeSuggestions.map((alt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleChipClick(alt)}
                      className="px-2.5 py-0.5 rounded-lg bg-slate-900 border border-slate-700 text-[11px] text-amber-200 hover:bg-slate-800 cursor-pointer"
                    >
                      {alt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* CARD B: BROWSE BY CLASS */}
        <div className="flex flex-col justify-between bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-cyan-400" />
                <span>Browse by Class</span>
              </h2>
              <button
                type="button"
                onClick={() => onOpenClassBrowser()}
                className="text-xs text-cyan-400 hover:text-cyan-300 underline font-medium cursor-pointer"
              >
                View full syllabus
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Follow the NCERT syllabus for Classes 7-9
            </p>
          </div>

          {/* Three Simple Buttons for Class 7, Class 8, Class 9 */}
          <div className="grid grid-cols-3 gap-2.5 my-auto">
            {[7, 8, 9].map(cNum => (
              <button
                key={cNum}
                type="button"
                onClick={() => onOpenClassBrowser(cNum)}
                className="group p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 hover:bg-slate-850 text-left transition-all cursor-pointer flex flex-col justify-between h-24"
              >
                <div className="text-base font-bold font-mono text-white group-hover:text-cyan-300 transition-colors">
                  Class {cNum}
                </div>
                <div className="text-[11px] text-slate-400 group-hover:text-slate-300 flex items-center justify-between">
                  <span>Syllabus</span>
                  <ArrowRight className="w-3 h-3 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            ))}
          </div>

          {/* Footer note in Card B */}
          <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-800/80 flex items-center justify-between">
            <span>Mathematics & Science</span>
            <button
              type="button"
              onClick={() => onOpenClassBrowser()}
              className="text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>Explore all classes</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

