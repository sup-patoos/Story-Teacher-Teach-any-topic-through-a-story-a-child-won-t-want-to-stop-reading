/**
 * @file TextStoryView.tsx
 * Mode 3: "Learn by Text Story".
 * Clean non-interactive story reader for students who prefer continuous reading,
 * equipped with full SpeechSynthesis read-aloud controls.
 */

import React, { useState, useEffect } from 'react';
import { InteractiveStory } from '../../types/learning';
import {
  ArrowLeft,
  Volume2,
  Play,
  Pause,
  Square,
  Trophy,
  Sparkles,
  BookOpen
} from 'lucide-react';
import { addTodayStudyTime } from '../../services/storageService';

interface TextStoryViewProps {
  story: InteractiveStory;
  onProceedToQuiz: () => void;
  onBack: () => void;
  onSwitchToInteractive: () => void;
}

export const TextStoryView: React.FC<TextStoryViewProps> = ({
  story,
  onProceedToQuiz,
  onBack,
  onSwitchToInteractive
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speechRate, setSpeechRate] = useState(1.0);
  const [fontSize, setFontSize] = useState<'normal' | 'large'>('normal');

  useEffect(() => {
    addTodayStudyTime(20);
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handlePlaySpeech = () => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported on this browser.');
      return;
    }

    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsSpeaking(true);
      return;
    }

    window.speechSynthesis.cancel();
    const fullText = `${story.title}. ${story.summary}. ` +
      story.scenes.map(s => `${s.header}. ${s.text}`).join(' ');

    const utterance = new SpeechSynthesisUtterance(fullText);
    utterance.rate = speechRate;
    utterance.pitch = 1.05;
    utterance.lang = 'en-IN';

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
    setIsPaused(false);
  };

  const handlePauseSpeech = () => {
    if ('speechSynthesis' in window && isSpeaking) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  };

  const handleStopSpeech = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* Top Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-lg backdrop-blur-md">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-300 hover:text-white px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-semibold transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Modes
        </button>

        {/* Font size & Read-Aloud controls */}
        <div className="flex items-center gap-2">
          {/* Font Toggle */}
          <button
            onClick={() => setFontSize(prev => (prev === 'normal' ? 'large' : 'normal'))}
            className="px-2.5 py-1 text-xs font-mono font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 cursor-pointer"
            title="Toggle Text Size"
          >
            {fontSize === 'normal' ? 'aA (Normal)' : 'AA (Large)'}
          </button>

          {/* Audio Controls */}
          <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800">
            <Volume2 className={`w-4 h-4 ${isSpeaking ? 'text-amber-400 animate-pulse' : 'text-slate-400'}`} />
            {!isSpeaking || isPaused ? (
              <button
                onClick={handlePlaySpeech}
                className="p-1 rounded bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 cursor-pointer"
                title="Play Audio"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
              </button>
            ) : (
              <button
                onClick={handlePauseSpeech}
                className="p-1 rounded bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 cursor-pointer"
                title="Pause Audio"
              >
                <Pause className="w-3.5 h-3.5 fill-current" />
              </button>
            )}
            <button
              onClick={handleStopSpeech}
              disabled={!isSpeaking && !isPaused}
              className="p-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 cursor-pointer"
              title="Stop"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
            </button>
          </div>
        </div>
      </div>

      {/* Reader Container */}
      <article className="bg-slate-900/90 border border-slate-800 p-6 sm:p-10 rounded-3xl shadow-xl space-y-6">
        {/* Title & Metadata */}
        <header className="border-b border-slate-800 pb-6 space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-xs text-amber-400 font-semibold tracking-wide uppercase">
            <BookOpen className="w-4 h-4" />
            <span>Text Story Mode · {story.level} · {story.subject}</span>
            {story.targetAge && (
              <span className="bg-slate-800 text-slate-300 normal-case px-2 py-0.5 rounded text-[11px] font-medium border border-slate-700">
                Written for age {story.targetAge}
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {story.title}
          </h1>
          <p className="text-sm sm:text-base text-slate-300 italic border-l-4 border-amber-500 pl-3 py-0.5">
            {story.summary}
          </p>
        </header>

        {/* Story Scenes in continuous reading format */}
        <div className={`space-y-8 ${fontSize === 'large' ? 'text-lg leading-relaxed' : 'text-base leading-relaxed'} text-slate-200`}>
          {story.scenes.map((scene, idx) => (
            <section key={idx} className="space-y-3">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-lg border-b border-slate-800/60 pb-1.5">
                <span className="text-xl">{scene.visual?.emoji || '📖'}</span>
                <span>{idx + 1}. {scene.header}</span>
              </div>
              <p className="text-slate-200">{scene.text}</p>
              {scene.visual?.widget?.parameters?.explanation && (
                <div className="p-3 bg-slate-800/40 border border-slate-700/60 rounded-xl text-xs sm:text-sm text-slate-300">
                  <span className="text-cyan-400 font-bold">Key takeaway: </span>
                  {scene.visual.widget.parameters.explanation}
                </div>
              )}
            </section>
          ))}
        </div>

        {/* Footer Actions */}
        <footer className="pt-8 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <button
            onClick={onSwitchToInteractive}
            className="text-xs sm:text-sm font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" /> Want animation widgets? Switch to Interactive Story
          </button>

          <button
            onClick={onProceedToQuiz}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Trophy className="w-4 h-4" />
            Proceed to Assessment Quiz
          </button>
        </footer>
      </article>
    </div>
  );
};
