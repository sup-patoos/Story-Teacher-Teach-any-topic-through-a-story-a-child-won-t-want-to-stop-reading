/**
 * @file StoryPlayer.tsx
 * Interactive story reader for StoryLearn Mode 1.
 * Features scene navigation, interactive choices, speech synthesis read-aloud,
 * live visual widgets, and progress tracking.
 */

import React, { useState, useEffect, useRef } from 'react';
import { InteractiveStory, StoryScene, SceneInteraction } from '../../types/learning';
import { VisualWidget } from './VisualWidget';
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  Square,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  HelpCircle,
  Sparkles,
  Trophy,
  ArrowRight
} from 'lucide-react';
import { addTodayStudyTime } from '../../services/storageService';

interface StoryPlayerProps {
  story: InteractiveStory;
  onCompleteToQuiz: () => void;
  onBack: () => void;
}

export const StoryPlayer: React.FC<StoryPlayerProps> = ({
  story,
  onCompleteToQuiz,
  onBack
}) => {
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [userChoice, setUserChoice] = useState<string | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Read-Aloud SpeechSynthesis state
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speechRate, setSpeechRate] = useState<number>(1.0);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const scene: StoryScene = story.scenes[currentSceneIndex] || story.scenes[0];
  const interaction: SceneInteraction | null = scene?.interaction || null;
  const isLastScene = currentSceneIndex === story.scenes.length - 1;

  // Track study time (e.g. 15 seconds per scene transition)
  useEffect(() => {
    addTodayStudyTime(15);
  }, [currentSceneIndex]);

  // Clean up speech synthesis when component unmounts or scene changes
  useEffect(() => {
    stopSpeech();
    setUserChoice(null);
    setHasInteracted(false);
  }, [currentSceneIndex]);

  useEffect(() => {
    return () => {
      stopSpeech();
    };
  }, []);

  // SpeechSynthesis helpers
  const handlePlaySpeech = () => {
    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech is not supported by your browser.');
      return;
    }

    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsSpeaking(true);
      return;
    }

    window.speechSynthesis.cancel();
    const textToRead = `${scene.header}. ${scene.text}`;
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.rate = speechRate;
    utterance.pitch = 1.05; // Slightly cheerful and friendly for kids
    utterance.lang = 'en-IN'; // Relatable Indian English accent if available

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };

    utteranceRef.current = utterance;
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

  const stopSpeech = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
    }
  };

  const handleChoiceSelect = (opt: string) => {
    setUserChoice(opt);
    setHasInteracted(true);
  };

  const handleNext = () => {
    if (!isLastScene) {
      setCurrentSceneIndex(prev => prev + 1);
    } else {
      onCompleteToQuiz();
    }
  };

  const handlePrev = () => {
    if (currentSceneIndex > 0) {
      setCurrentSceneIndex(prev => prev - 1);
    }
  };

  const isChoiceCorrect = interaction && userChoice === interaction.correctAnswer;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* Top Bar with back, story title, level badge, and Read-Aloud controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-lg backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Back to Learning Modes"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
              <span>{story.title}</span>
              {story.isTeacherVerified && (
                <span className="text-[11px] font-medium bg-emerald-950/80 text-emerald-400 border border-emerald-700 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                  ✓ Teacher-checked
                </span>
              )}
            </h2>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <span className="text-amber-400 font-medium">{story.level}</span>
              <span>·</span>
              <span>{story.subject}</span>
              {story.targetAge && (
                <>
                  <span>·</span>
                  <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[11px] font-medium border border-slate-700">
                    Written for age {story.targetAge}
                  </span>
                </>
              )}
              <span>·</span>
              <span>Scene {currentSceneIndex + 1} of {story.scenes.length}</span>
            </div>
          </div>
        </div>

        {/* Read-Aloud Voice Controller */}
        <div className="flex items-center gap-2 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800">
          <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mr-1">
            <Volume2 className={`w-4 h-4 ${isSpeaking ? 'text-amber-400 animate-pulse' : 'text-slate-400'}`} />
            <span className="hidden sm:inline">Read Aloud:</span>
          </div>

          {!isSpeaking || isPaused ? (
            <button
              onClick={handlePlaySpeech}
              className="p-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-all cursor-pointer"
              title="Play Narration"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
            </button>
          ) : (
            <button
              onClick={handlePauseSpeech}
              className="p-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-all cursor-pointer"
              title="Pause Narration"
            >
              <Pause className="w-3.5 h-3.5 fill-current" />
            </button>
          )}

          <button
            onClick={stopSpeech}
            disabled={!isSpeaking && !isPaused}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 transition-all cursor-pointer"
            title="Stop"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
          </button>

          {/* Speed Selector */}
          <select
            value={speechRate}
            onChange={(e) => {
              setSpeechRate(parseFloat(e.target.value));
              if (isSpeaking) {
                stopSpeech();
              }
            }}
            className="text-[11px] bg-slate-800 text-slate-300 border border-slate-700 rounded px-1.5 py-1 focus:outline-none cursor-pointer"
          >
            <option value="0.8">0.8x</option>
            <option value="1.0">1.0x</option>
            <option value="1.2">1.2x</option>
          </select>
        </div>
      </div>

      {/* Progress Dots across Scenes */}
      <div className="flex items-center justify-between gap-1 px-2">
        {story.scenes.map((s, idx) => (
          <div
            key={idx}
            onClick={() => setCurrentSceneIndex(idx)}
            className={`h-2 flex-1 rounded-full cursor-pointer transition-all duration-300 ${
              idx === currentSceneIndex
                ? 'bg-amber-400 shadow-md shadow-amber-400/50'
                : idx < currentSceneIndex
                ? 'bg-emerald-500'
                : 'bg-slate-800'
            }`}
          />
        ))}
      </div>

      {/* Main Scene Display */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Story Prose & Interactions (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 p-6 sm:p-7 rounded-3xl shadow-xl backdrop-blur-md space-y-4">
            {/* Scene Header */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold bg-amber-500/20 text-amber-300 px-2.5 py-1 rounded-lg border border-amber-500/30">
                SCENE {currentSceneIndex + 1}
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {scene.header}
              </h3>
            </div>

            {/* Narrative Prose */}
            <div className="text-slate-200 text-base sm:text-lg leading-relaxed font-normal space-y-3">
              <p>{scene.text}</p>
            </div>

            {/* Interactive Moment (Choice / Predict / Question) */}
            {interaction && (
              <div className="mt-6 pt-5 border-t border-slate-800/80 space-y-3">
                <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
                  <HelpCircle className="w-4 h-4" />
                  <span>Interactive Mission: What will you do?</span>
                </div>
                <p className="text-sm sm:text-base text-slate-100 font-medium">
                  {interaction.prompt}
                </p>

                {/* Options List */}
                {interaction.options && interaction.options.length > 0 && (
                  <div className="space-y-2 mt-3">
                    {interaction.options.map((option, idx) => {
                      const isSelected = userChoice === option;
                      const isCorrect = option === interaction.correctAnswer;
                      let btnStyle =
                        'bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border-slate-700';

                      if (hasInteracted) {
                        if (isCorrect) {
                          btnStyle =
                            'bg-emerald-950/80 border-emerald-500 text-emerald-200 ring-2 ring-emerald-500/40';
                        } else if (isSelected && !isCorrect) {
                          btnStyle =
                            'bg-rose-950/80 border-rose-500 text-rose-200 ring-2 ring-rose-500/40';
                        } else {
                          btnStyle = 'opacity-50 bg-slate-900 text-slate-500 border-slate-800';
                        }
                      }

                      return (
                        <button
                          key={idx}
                          onClick={() => handleChoiceSelect(option)}
                          className={`w-full text-left p-3.5 rounded-xl border text-sm font-medium transition-all flex items-center justify-between cursor-pointer ${btnStyle}`}
                        >
                          <span>{option}</span>
                          {hasInteracted && isCorrect && (
                            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 ml-2" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Feedback Reaction Box */}
                {hasInteracted && (
                  <div
                    className={`p-4 rounded-xl border mt-3 text-sm animate-fadeIn ${
                      isChoiceCorrect
                        ? 'bg-emerald-950/60 border-emerald-700/70 text-emerald-200'
                        : 'bg-amber-950/60 border-amber-700/70 text-amber-200'
                    }`}
                  >
                    <div className="font-bold mb-1">
                      {isChoiceCorrect ? '🎉 ' + interaction.reactionCorrect : '🤔 ' + interaction.reactionIncorrect}
                    </div>
                    <div className="text-xs sm:text-sm text-slate-300">
                      {interaction.explanation}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Scene Navigation Buttons */}
          <div className="flex items-center justify-between gap-4 pt-2">
            <button
              onClick={handlePrev}
              disabled={currentSceneIndex === 0}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-slate-200 font-semibold text-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>

            {!isLastScene ? (
              <button
                onClick={handleNext}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                Next Scene <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={onCompleteToQuiz}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 cursor-pointer animate-pulse"
              >
                <Trophy className="w-4 h-4" />
                Take the Understanding Quiz!
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Interactive Visual Simulation Widget (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <VisualWidget visual={scene.visual} topicTitle={story.concept} />

          {/* Quick Concept Hint Card */}
          <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-800/50 text-indigo-200 text-xs sm:text-sm flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-indigo-300">Why this matters: </span>
              In {story.subject}, understanding comes from observing cause and effect rather than memorizing formulas!
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
