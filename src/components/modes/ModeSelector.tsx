/**
 * @file ModeSelector.tsx
 * Mode selection screen shown after a student picks or searches a topic.
 * Offers Mode 1 (Interactive Story), Mode 2 (Watch & Explore Video), and Mode 3 (Text Story).
 */

import React from 'react';
import { BookOpen, Video, FileText, ArrowLeft, Sparkles, CheckCircle, Trophy } from 'lucide-react';
import { EducationLevel } from '../../types/learning';

interface ModeSelectorProps {
  topicTitle: string;
  subject: string;
  level: EducationLevel;
  hasVideo: boolean;
  isVerified?: boolean;
  onSelectMode: (mode: 'story' | 'video' | 'text') => void;
  onBack: () => void;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({
  topicTitle,
  subject,
  level,
  hasVideo,
  isVerified = false,
  onSelectMode,
  onBack
}) => {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Back button and Topic Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider">
            <span>{subject}</span>
            <span>·</span>
            <span>{level}</span>
            {isVerified && (
              <span className="bg-emerald-950 text-emerald-400 border border-emerald-700/80 px-2 py-0.5 rounded-full text-[10px] inline-flex items-center gap-1">
                ✓ Teacher-checked
              </span>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            {topicTitle}
          </h1>
        </div>
      </div>

      <div className="text-slate-300 text-sm">
        How would you like to master this concept today? Choose your learning adventure:
      </div>

      {/* Mode Cards */}
      <div className="space-y-4">
        {/* Mode 1: Learn Through Story (Primary & Recommended) */}
        <div
          onClick={() => onSelectMode('story')}
          className="group relative bg-gradient-to-r from-indigo-950/80 via-slate-900/90 to-purple-950/80 border-2 border-amber-500/80 hover:border-amber-400 p-6 rounded-3xl shadow-xl hover:shadow-amber-500/10 transition-all cursor-pointer transform hover:-translate-y-0.5"
        >
          <div className="absolute top-4 right-4">
            <span className="text-[11px] font-bold uppercase tracking-wider bg-amber-500 text-slate-950 px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Recommended
            </span>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-3xl shrink-0 group-hover:scale-110 transition-transform">
              ✨
            </div>
            <div className="space-y-1.5 pr-20">
              <h2 className="text-lg sm:text-xl font-bold text-white group-hover:text-amber-300 transition-colors">
                Learn Through Story
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Step into an interactive adventure! Solve challenges with characters, play with live animated visual widgets, and see the concept in action.
              </p>
              <div className="flex flex-wrap items-center gap-3 text-xs text-amber-300/90 pt-1 font-medium">
                <span>· 4-5 interactive scenes</span>
                <span>· Interactive widgets</span>
                <span>· Read-Aloud voice</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mode 2: Watch & Explore Video */}
        <div
          onClick={() => onSelectMode('video')}
          className="group bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/60 p-5 rounded-3xl shadow-lg transition-all cursor-pointer flex items-start gap-4"
        >
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-2xl shrink-0 group-hover:scale-105 transition-transform text-cyan-400">
            <Video className="w-6 h-6" />
          </div>
          <div className="space-y-1 flex-1">
            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
                Watch & Explore
              </h2>
              {hasVideo ? (
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                  Video Ready
                </span>
              ) : (
                <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                  Coming Soon
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Watch an embedded curated video inside the app explaining this concept with clear demonstrations.
            </p>
          </div>
        </div>

        {/* Mode 3: Learn by Text Story */}
        <div
          onClick={() => onSelectMode('text')}
          className="group bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/60 p-5 rounded-3xl shadow-lg transition-all cursor-pointer flex items-start gap-4"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-2xl shrink-0 group-hover:scale-105 transition-transform text-emerald-400">
            <BookOpen className="w-6 h-6" />
          </div>
          <div className="space-y-1 flex-1">
            <h2 className="text-base sm:text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">
              Learn by Text Story
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Prefer reading at your own pace? Enjoy the complete story in a clean reader format with text-to-speech audio support.
            </p>
          </div>
        </div>
      </div>

      {/* Reassuring Assessment Notice */}
      <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl text-xs text-slate-400 flex items-center gap-3">
        <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
        <span>
          Whichever mode you choose, you will unlock the <strong className="text-slate-200">"Test Yourself" quiz</strong> to prove your understanding and boost your mastery score!
        </span>
      </div>
    </div>
  );
};
