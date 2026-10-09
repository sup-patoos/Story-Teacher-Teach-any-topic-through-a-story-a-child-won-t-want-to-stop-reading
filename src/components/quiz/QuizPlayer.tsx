/**
 * @file QuizPlayer.tsx
 * Section 5: Assessment ("Test Yourself").
 * 5-question diagnostic quiz checking conceptual understanding & misconceptions.
 */

import React, { useState } from 'react';
import { QuizData, ChildAnswerRecord, QuizQuestion } from '../../types/learning';
import {
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Lightbulb,
  Send,
  Loader2
} from 'lucide-react';

interface QuizPlayerProps {
  quiz: QuizData;
  onSubmitAnswers: (answers: ChildAnswerRecord[]) => void;
  onBack: () => void;
  isSubmitting?: boolean;
}

export const QuizPlayer: React.FC<QuizPlayerProps> = ({
  quiz,
  onSubmitAnswers,
  onBack,
  isSubmitting = false
}) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showHint, setShowHint] = useState<Record<string, boolean>>({});

  const question: QuizQuestion = quiz.questions[currentIdx] || quiz.questions[0];
  const totalQuestions = quiz.questions.length;
  const isLast = currentIdx === totalQuestions - 1;

  const currentAnswer = answers[question.id] || '';

  const handleSelectOption = (opt: string) => {
    setAnswers(prev => ({ ...prev, [question.id]: opt }));
  };

  const handleTextChange = (val: string) => {
    setAnswers(prev => ({ ...prev, [question.id]: val }));
  };

  const toggleHint = (qId: string) => {
    setShowHint(prev => ({ ...prev, [qId]: !prev[qId] }));
  };

  const handleNext = () => {
    if (!isLast) {
      setCurrentIdx(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx(prev => prev - 1);
    }
  };

  const handleSubmit = () => {
    const records: ChildAnswerRecord[] = quiz.questions.map(q => ({
      questionId: q.id,
      questionType: q.type,
      prompt: q.prompt,
      childAnswer: answers[q.id] || '(No answer provided)'
    }));
    onSubmitAnswers(records);
  };

  // Helper label for question type
  const getQuestionBadge = (type: QuizQuestion['type']) => {
    switch (type) {
      case 'multiple_choice':
        return { label: '1. Core Principle (MCQ)', color: 'text-amber-400 border-amber-500/40 bg-amber-500/10' };
      case 'prediction':
        return { label: '2. Prediction Challenge', color: 'text-cyan-400 border-cyan-500/40 bg-cyan-500/10' };
      case 'application':
        return { label: '3. Real-World Application', color: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10' };
      case 'short_answer':
        return { label: '4. Precision Check', color: 'text-purple-400 border-purple-500/40 bg-purple-500/10' };
      case 'in_your_own_words':
        return { label: '5. In Your Own Words', color: 'text-pink-400 border-pink-500/40 bg-pink-500/10' };
      default:
        return { label: 'Question', color: 'text-slate-400 border-slate-700 bg-slate-800' };
    }
  };

  const badge = getQuestionBadge(question.type);
  const answeredCount = Object.keys(answers).filter(k => answers[k]?.trim()).length;

  if (isSubmitting) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 animate-spin">
          <Loader2 className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white">Analyzing Understanding...</h2>
          <p className="text-slate-300 text-sm">
            Our AI engine is evaluating your answers, checking for misconceptions, and measuring concept mastery!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-lg backdrop-blur-md">
        <button
          onClick={onBack}
          aria-label="Back to Story"
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="text-right">
          <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-bold">
            Test Yourself Assessment
          </span>
          <h1 className="text-sm sm:text-base font-bold text-white max-w-sm truncate">
            {quiz.topic}
          </h1>
        </div>
      </div>

      {/* Progress Dots */}
      <div className="flex items-center justify-between gap-1.5 px-1">
        {quiz.questions.map((q, idx) => {
          const isAnswered = Boolean(answers[q.id]?.trim());
          const isCurrent = idx === currentIdx;
          return (
            <button
              key={q.id}
              onClick={() => setCurrentIdx(idx)}
              aria-label={`Jump to question ${idx + 1}`}
              className={`h-2.5 flex-1 rounded-full transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none ${
                isCurrent
                  ? 'bg-amber-400 ring-2 ring-amber-400/50 scale-105'
                  : isAnswered
                  ? 'bg-emerald-500'
                  : 'bg-slate-800'
              }`}
              title={`Question ${idx + 1}`}
            />
          );
        })}
      </div>

      {/* Question Card */}
      <div className="bg-slate-900/90 border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-xl space-y-6">
        {/* Question Type Banner */}
        <div className="flex items-center justify-between">
          <span className={`text-xs font-bold font-mono px-3 py-1 rounded-lg border ${badge.color}`}>
            {badge.label}
          </span>
          <span className="text-xs text-slate-400 font-mono">
            {answeredCount} of {totalQuestions} answered
          </span>
        </div>

        {/* Question Prompt */}
        <div className="space-y-2">
          <h2 className="text-lg sm:text-xl font-bold text-white leading-snug">
            {question.prompt}
          </h2>
          <div className="text-xs text-slate-400 flex items-center gap-1.5 italic">
            <span>Tests:</span>
            <span>{question.misconceptionTarget}</span>
          </div>
        </div>

        {/* Multiple Choice / Prediction Options */}
        {question.options && question.options.length > 0 ? (
          <div className="space-y-3 pt-2">
            {question.options.map((opt, oIdx) => {
              const isSelected = currentAnswer === opt;
              return (
                <button
                  key={oIdx}
                  onClick={() => handleSelectOption(opt)}
                  className={`w-full text-left p-4 rounded-2xl border text-sm font-medium transition-all flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500/20 border-amber-400 text-amber-200 ring-2 ring-amber-400/30 font-semibold'
                      : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border-slate-700/80'
                  }`}
                >
                  <span className="pr-4">{opt}</span>
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'border-amber-400 bg-amber-400 text-slate-950 font-bold text-xs'
                        : 'border-slate-600'
                    }`}
                  >
                    {isSelected && '✓'}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          /* Short Answer / Explain in Your Own Words Input */
          <div className="space-y-3 pt-2">
            <textarea
              rows={question.type === 'in_your_own_words' ? 4 : 2}
              value={currentAnswer}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder={
                question.type === 'in_your_own_words'
                  ? 'Type your explanation in plain words, as if explaining to a curious friend...'
                  : 'Type your short answer or key term here...'
              }
              className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400/50 resize-none"
            />
            <p className="text-xs text-slate-400">
              {question.type === 'in_your_own_words'
                ? 'Don\'t worry about complex jargon! Focus on the cause and effect.'
                : 'Enter your answer or keyword.'}
            </p>
          </div>
        )}

        {/* Helpful Hint Toggle */}
        {question.hint && (
          <div className="pt-2">
            <button
              onClick={() => toggleHint(question.id)}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Lightbulb className="w-3.5 h-3.5" />
              {showHint[question.id] ? 'Hide Hint' : 'Need a hint?'}
            </button>
            {showHint[question.id] && (
              <div className="mt-2 p-3 bg-amber-950/40 border border-amber-800/60 rounded-xl text-xs text-amber-200">
                💡 {question.hint}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={handlePrev}
          disabled={currentIdx === 0}
          className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-slate-200 font-semibold text-sm transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Previous
        </button>

        {!isLast ? (
          <button
            onClick={handleNext}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            Next Question <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            className="px-7 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/25 transition-all flex items-center gap-2 cursor-pointer animate-pulse"
          >
            <Send className="w-4 h-4" />
            Submit Answers & Analyze Understanding
          </button>
        )}
      </div>
    </div>
  );
};
