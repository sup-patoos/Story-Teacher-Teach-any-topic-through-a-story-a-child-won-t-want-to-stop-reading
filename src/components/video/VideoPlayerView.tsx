/**
 * @file VideoPlayerView.tsx
 * Mode 2: "Watch & Explore" Video player.
 * Embeds educational YouTube videos inside the app, or shows a friendly
 * "Video coming soon" card offering the Interactive Story mode.
 */

import React from 'react';
import { ArrowLeft, Video, Sparkles, BookOpen, Trophy } from 'lucide-react';

interface VideoPlayerViewProps {
  topicTitle: string;
  videoId: string | null | undefined;
  onBack: () => void;
  onSwitchToStory: () => void;
  onProceedToQuiz: () => void;
}

export const VideoPlayerView: React.FC<VideoPlayerViewProps> = ({
  topicTitle,
  videoId,
  onBack,
  onSwitchToStory,
  onProceedToQuiz
}) => {
  // Extract pure 11-char ID if full URL passed
  const getCleanVideoId = (raw: string | null | undefined): string | null => {
    if (!raw) return null;
    const trimmed = raw.trim();
    if (trimmed.length === 11 && !trimmed.includes('/')) return trimmed;
    // regex for youtube id
    const match = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    return match ? match[1] : trimmed.length >= 11 ? trimmed.slice(0, 11) : null;
  };

  const cleanId = getCleanVideoId(videoId);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* Header bar */}
      <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-lg backdrop-blur-md">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-300 hover:text-white px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-semibold transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Modes
        </button>
        <div className="text-right">
          <span className="text-xs uppercase font-mono text-cyan-400 font-bold">Watch & Explore Mode</span>
          <h2 className="text-sm sm:text-base font-bold text-slate-100 max-w-md truncate">
            {topicTitle}
          </h2>
        </div>
      </div>

      {cleanId ? (
        /* Embedded YouTube Video Container */
        <div className="bg-slate-900/90 border border-slate-800 p-4 sm:p-6 rounded-3xl shadow-xl space-y-6">
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl">
            <iframe
              className="w-full h-full"
              src={`https://www.youtube-nocookie.com/embed/${cleanId}?autoplay=1&rel=0`}
              title={topicTitle}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            <button
              onClick={onSwitchToStory}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-amber-400" />
              Prefer reading? Switch to Interactive Story
            </button>

            <button
              onClick={onProceedToQuiz}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Trophy className="w-4 h-4" />
              Ready? Test Yourself!
            </button>
          </div>
        </div>
      ) : (
        /* Friendly Video Coming Soon Card */
        <div className="bg-slate-900/90 border border-slate-800 p-8 sm:p-12 rounded-3xl shadow-xl text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-cyan-950/60 border border-cyan-800 flex items-center justify-center text-cyan-400 shadow-lg">
            <Video className="w-10 h-10" />
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-xl sm:text-2xl font-bold text-white">
              Curated Video Coming Soon!
            </h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              Our educational team is curating the perfect verified video for{' '}
              <span className="text-cyan-300 font-medium">"{topicTitle}"</span>.
              In the meantime, the interactive story teaches this concept with live animations!
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <button
              onClick={onSwitchToStory}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/25 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              Start Interactive Story Mode
            </button>
            <button
              onClick={onProceedToQuiz}
              className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm border border-slate-700 transition-all cursor-pointer"
            >
              Jump to Assessment Quiz
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
