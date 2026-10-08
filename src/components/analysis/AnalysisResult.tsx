/**
 * @file AnalysisResult.tsx
 * Section 6: AI Understanding Analysis & Mastery Meter.
 * Diagnoses misconceptions, renders animated mastery gauge, celebrates >80% mastery with confetti,
 * and launches Corrective Stories with BEFORE vs AFTER re-check questions!
 */

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  UnderstandingAnalysis,
  CorrectiveStory,
  EducationLevel
} from '../../types/learning';
import {
  Trophy,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  BookOpen,
  RotateCcw,
  Home,
  Compass,
  Lightbulb,
  Check
} from 'lucide-react';
import {
  updateConceptMastery,
  logSessionReport,
  getMasteryTier
} from '../../services/storageService';
import { fetchOrGenerateCorrective } from '../../services/apiClient';

interface AnalysisResultProps {
  analysis: UnderstandingAnalysis;
  topicTitle: string;
  conceptId: string;
  level: EducationLevel;
  subject: string;
  isSyllabusTopic: boolean;
  age?: number;
  onHome: () => void;
  onExploreMore: (topic: string) => void;
  onRetakeQuiz: () => void;
}

export const AnalysisResult: React.FC<AnalysisResultProps> = ({
  analysis,
  topicTitle,
  conceptId,
  level,
  subject,
  isSyllabusTopic,
  age,
  onHome,
  onExploreMore,
  onRetakeQuiz
}) => {
  const [masteryScore, setMasteryScore] = useState(analysis.overallMastery);
  const [preScore, setPreScore] = useState<number | null>(null);
  const [postScore, setPostScore] = useState<number | null>(null);

  // Corrective Story state
  const [correctiveStory, setCorrectiveStory] = useState<CorrectiveStory | null>(null);
  const [isLoadingCorrective, setIsLoadingCorrective] = useState(false);
  const [activeCorrectiveScene, setActiveCorrectiveScene] = useState(0);
  const [showCorrectiveModal, setShowCorrectiveModal] = useState(false);
  const [recheckAnswers, setRecheckAnswers] = useState<Record<number, string>>({});
  const [recheckSubmitted, setRecheckSubmitted] = useState(false);

  // On mount: persist mastery and log session
  useEffect(() => {
    const detected = analysis.misconceptions.map(m => m.description);
    const { updatedRecord, crossedEighty } = updateConceptMastery(
      conceptId,
      topicTitle,
      subject,
      level,
      analysis.overallMastery,
      detected
    );

    setMasteryScore(updatedRecord.masteryScore);

    // Fire confetti celebration if score >= 80 or crossed eighty!
    if (updatedRecord.masteryScore >= 80 || crossedEighty) {
      triggerCelebration();
    }

    // Log to Parent Session Reports
    logSessionReport({
      date: new Date().toISOString().split('T')[0],
      topicTitle,
      conceptId,
      subject,
      isSyllabusTopic,
      timeSpentSeconds: 300,
      quizScorePercentage: analysis.overallMastery,
      conceptMasteryScore: updatedRecord.masteryScore,
      misconceptionsDetected: detected,
      strengthsObserved: analysis.strengths,
      suggestedNextAction: analysis.nextStep.content
    });
  }, []);

  const triggerCelebration = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch {
      // safe fallback
    }
  };

  const tier = getMasteryTier(masteryScore);

  const getTierBadge = () => {
    switch (tier) {
      case 'Mastered':
        return { label: 'Mastered! 🏆', color: 'from-amber-400 to-yellow-500 text-slate-950 ring-amber-300' };
      case 'Strong':
        return { label: 'Strong Understanding ⭐', color: 'from-emerald-400 to-teal-500 text-slate-950 ring-emerald-300' };
      case 'Getting There':
        return { label: 'Getting There 👍', color: 'from-cyan-400 to-blue-500 text-slate-950 ring-cyan-300' };
      default:
        return { label: 'Needs a Little Help 🌱', color: 'from-orange-400 to-rose-500 text-white ring-rose-300' };
    }
  };

  const tierBadge = getTierBadge();

  // Handle Launching Corrective Story
  const handleOpenCorrective = async () => {
    setShowCorrectiveModal(true);
    if (!correctiveStory) {
      setIsLoadingCorrective(true);
      const misconception = analysis.misconceptions[0]?.description || 'Fundamental misconception';
      const result = await fetchOrGenerateCorrective({
        topic: topicTitle,
        conceptId,
        level,
        misconception,
        age
      });
      setCorrectiveStory(result);
      setIsLoadingCorrective(false);
    }
  };

  // Handle submitting recheck questions in Corrective Story
  const handleCheckRecheckAnswers = () => {
    if (!correctiveStory) return;
    setRecheckSubmitted(true);

    let recheckCorrect = 0;
    correctiveStory.recheckQuestions.forEach((q, idx) => {
      if (recheckAnswers[idx] === q.correctAnswer) {
        recheckCorrect += 1;
      }
    });

    const recheckScore = Math.round((recheckCorrect / correctiveStory.recheckQuestions.length) * 100);

    // Update mastery with recheck weighted boost
    setPreScore(masteryScore);
    const { updatedRecord } = updateConceptMastery(
      conceptId,
      topicTitle,
      subject,
      level,
      recheckScore,
      [],
      true // isRecheck
    );

    setPostScore(updatedRecord.masteryScore);
    setMasteryScore(updatedRecord.masteryScore);

    if (updatedRecord.masteryScore >= 80) {
      triggerCelebration();
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Top Banner */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-700 text-xs font-mono text-amber-400">
          <Sparkles className="w-3.5 h-3.5" />
          AI Understanding Diagnosis
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Concept Mastery Report
        </h1>
        <p className="text-sm text-slate-300">
          Topic: <span className="text-amber-400 font-semibold">{topicTitle}</span> ({level})
        </p>
      </div>

      {/* Main Mastery Meter Card */}
      <div className="bg-slate-900/90 border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-xl backdrop-blur-md space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-6 border-b border-slate-800">
          {/* Animated Gauge Ring */}
          <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#1e293b"
                strokeWidth="10"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="url(#masteryGrad)"
                strokeWidth="10"
                strokeDasharray="251.2"
                strokeDashoffset={251.2 - (251.2 * masteryScore) / 100}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
              <defs>
                <linearGradient id="masteryGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="50%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#f59e0b" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-extrabold text-white font-mono">{masteryScore}%</span>
              <span className="text-[10px] uppercase font-bold text-slate-400">Mastery</span>
            </div>
          </div>

          {/* Tier & Encouraging Feedback */}
          <div className="space-y-3 text-center sm:text-left">
            <div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-gradient-to-r shadow-md ${tierBadge.color}`}>
                {tierBadge.label}
              </span>
            </div>
            <p className="text-slate-200 text-sm sm:text-base leading-relaxed font-medium">
              "{analysis.feedbackForChild}"
            </p>
          </div>
        </div>

        {/* BEFORE vs AFTER Progress (if recheck was completed) */}
        {preScore !== null && postScore !== null && (
          <div className="p-4 bg-emerald-950/60 border border-emerald-700/80 rounded-2xl space-y-2 animate-fadeIn">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase">
              <CheckCircle2 className="w-4 h-4" />
              <span>Corrective Learning Proof: Before vs After!</span>
            </div>
            <div className="flex items-center justify-around text-center pt-2">
              <div>
                <div className="text-xs text-slate-400">Before Corrective Story</div>
                <div className="text-2xl font-bold font-mono text-rose-400">{preScore}%</div>
              </div>
              <ArrowRight className="w-6 h-6 text-emerald-400 animate-pulse" />
              <div>
                <div className="text-xs text-slate-400">After Corrective Story</div>
                <div className="text-2xl font-bold font-mono text-emerald-400">{postScore}%</div>
              </div>
            </div>
          </div>
        )}

        {/* Diagnosed Misconceptions */}
        {analysis.misconceptions.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Subtle Misconceptions Detected:</span>
            </div>
            <div className="space-y-2">
              {analysis.misconceptions.map((m, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-800/50 text-xs sm:text-sm text-amber-200 space-y-1"
                >
                  <div className="font-bold">{m.description}</div>
                  <div className="text-slate-400 text-xs italic">{m.evidence}</div>
                </div>
              ))}
            </div>

            {/* Launch Corrective Story CTA */}
            <div className="pt-2">
              <button
                onClick={handleOpenCorrective}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Lightbulb className="w-4 h-4" />
                Read Corrective Mini-Story & Prove Your Improvement!
              </button>
            </div>
          </div>
        )}

        {/* Strengths Observed */}
        {analysis.strengths.length > 0 && (
          <div className="space-y-2 pt-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <CheckCircle2 className="w-4 h-4" />
              <span>Your Key Strengths:</span>
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-slate-300">
              {analysis.strengths.map((str, sIdx) => (
                <li key={sIdx} className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60 flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>{str}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommended Next Topics */}
        {analysis.recommendedNextTopics.length > 0 && (
          <div className="space-y-2 pt-2">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Recommended Next Adventures:
            </div>
            <div className="flex flex-wrap gap-2">
              {analysis.recommendedNextTopics.map((nextT, nIdx) => (
                <button
                  key={nIdx}
                  onClick={() => onExploreMore(nextT)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>{nextT}</span>
                  <ArrowRight className="w-3 h-3 text-cyan-400 ml-1" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
        <button
          onClick={onHome}
          className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm flex items-center gap-2 transition-all cursor-pointer"
        >
          <Home className="w-4 h-4" /> Back to Home
        </button>

        <button
          onClick={onRetakeQuiz}
          className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 font-semibold text-sm flex items-center gap-2 border border-slate-700 transition-all cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" /> Practice Quiz Again
        </button>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* CORRECTIVE STORY MODAL */}
      {/* ------------------------------------------------------------------ */}
      {showCorrectiveModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-amber-500/50 rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <Lightbulb className="w-5 h-5" />
                <span>Corrective Mini-Story</span>
              </div>
              <button
                onClick={() => setShowCorrectiveModal(false)}
                className="text-slate-400 hover:text-white text-sm cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            {isLoadingCorrective ? (
              <div className="py-12 text-center text-slate-300 text-sm animate-pulse space-y-3">
                <div className="text-3xl">✨</div>
                <div>Creating your personalized analogy...</div>
              </div>
            ) : correctiveStory ? (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">
                    {correctiveStory.title}
                  </h3>
                  <div className="text-xs text-amber-400 font-medium">
                    Targeted fix: {correctiveStory.targetedMisconception}
                  </div>
                </div>

                {/* Scenes */}
                <div className="space-y-4">
                  {correctiveStory.scenes.map((sc, sIdx) => (
                    <div
                      key={sIdx}
                      className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2"
                    >
                      <div className="flex items-center gap-2 font-bold text-amber-300 text-sm">
                        <span className="text-xl">{sc.visualEmoji}</span>
                        <span>{sc.header}</span>
                      </div>
                      <p className="text-slate-200 text-sm leading-relaxed">
                        {sc.text}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Clear Takeaway */}
                <div className="p-3.5 bg-indigo-950/60 border border-indigo-700/60 rounded-xl text-xs sm:text-sm text-indigo-200 font-medium">
                  🎯 <strong>Takeaway:</strong> {correctiveStory.takeaway}
                </div>

                {/* Quick Re-Check Questions */}
                <div className="space-y-3 pt-2 border-t border-slate-800">
                  <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Quick Re-Check: Prove your new understanding!</span>
                  </div>

                  {correctiveStory.recheckQuestions.map((rq, qIdx) => (
                    <div key={qIdx} className="space-y-2 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                      <p className="text-xs sm:text-sm font-semibold text-slate-100">
                        {rq.prompt}
                      </p>
                      <div className="space-y-1.5">
                        {rq.options.map((opt, oIdx) => {
                          const isSelected = recheckAnswers[qIdx] === opt;
                          const isCorrect = opt === rq.correctAnswer;
                          return (
                            <button
                              key={oIdx}
                              onClick={() => !recheckSubmitted && setRecheckAnswers(prev => ({ ...prev, [qIdx]: opt }))}
                              disabled={recheckSubmitted}
                              className={`w-full text-left p-2.5 rounded-xl text-xs font-medium transition-all flex items-center justify-between cursor-pointer ${
                                recheckSubmitted
                                  ? isCorrect
                                    ? 'bg-emerald-950 border border-emerald-500 text-emerald-200'
                                    : isSelected
                                    ? 'bg-rose-950 border border-rose-500 text-rose-200'
                                    : 'bg-slate-900 text-slate-500 border border-slate-800'
                                  : isSelected
                                  ? 'bg-amber-500/20 border border-amber-400 text-amber-200 font-bold'
                                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                              }`}
                            >
                              <span>{opt}</span>
                              {recheckSubmitted && isCorrect && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                            </button>
                          );
                        })}
                      </div>
                      {recheckSubmitted && (
                        <p className="text-[11px] text-slate-400 pt-1 italic">
                          {rq.explanation}
                        </p>
                      )}
                    </div>
                  ))}

                  {!recheckSubmitted ? (
                    <button
                      onClick={handleCheckRecheckAnswers}
                      disabled={Object.keys(recheckAnswers).length === 0}
                      className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer"
                    >
                      Check My Answers & Update Mastery
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowCorrectiveModal(false)}
                      className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all cursor-pointer"
                    >
                      Done! View Updated Mastery Report
                    </button>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};
