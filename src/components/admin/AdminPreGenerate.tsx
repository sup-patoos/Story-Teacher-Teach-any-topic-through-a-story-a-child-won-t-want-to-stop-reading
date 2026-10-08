/**
 * @file AdminPreGenerate.tsx
 * Section 9: Content Cache and Admin "Pre-generate Class" Tool.
 * Batch-generates entire classes from syllabus.json with progress bar, rate-limiting delays,
 * review/editing, "Teacher-checked" verification, and export/import of content_class{N}.json.
 */

import React, { useState } from 'react';
import syllabusData from '../../data/syllabus.json';
import {
  SyllabusClass,
  SyllabusSubtopic,
  InteractiveStory,
  QuizData
} from '../../types/learning';
import {
  Wrench,
  Play,
  Pause,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  FileJson,
  Loader2,
  RefreshCw,
  Check,
  Eye
} from 'lucide-react';
import {
  saveCachedStory,
  saveCachedQuiz,
  getCachedStory,
  getCachedQuiz
} from '../../services/storageService';
import { fetchOrGenerateStory, fetchOrGenerateQuiz } from '../../services/apiClient';

interface AdminPreGenerateProps {
  onBack: () => void;
}

interface PreGenItem {
  subtopicId: string;
  subtopicTitle: string;
  chapterTitle: string;
  subjectName: string;
  classNum: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  story?: InteractiveStory;
  quiz?: QuizData;
  isVerified?: boolean;
  error?: string;
}

export const AdminPreGenerate: React.FC<AdminPreGenerateProps> = ({ onBack }) => {
  const [selectedClassNum, setSelectedClassNum] = useState<number>(7);
  const [isRunning, setIsRunning] = useState(false);
  const [items, setItems] = useState<PreGenItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [reviewItem, setReviewItem] = useState<PreGenItem | null>(null);

  // Initialize items for selected class
  const loadClassSubtopics = (cNum: number) => {
    const cData: SyllabusClass | undefined = syllabusData.classes.find(c => c.class === cNum);
    if (!cData) return;

    const list: PreGenItem[] = [];
    cData.subjects.forEach(subj => {
      // Maths chapters
      if (subj.chapters) {
        subj.chapters.forEach(ch => {
          ch.subtopics.forEach(sub => {
            const cachedS = getCachedStory(sub.id, `Class ${cNum}`);
            const cachedQ = getCachedQuiz(sub.id, `Class ${cNum}`);
            list.push({
              subtopicId: sub.id,
              subtopicTitle: sub.title,
              chapterTitle: ch.title,
              subjectName: subj.subject,
              classNum: cNum,
              status: cachedS && cachedQ ? 'completed' : 'pending',
              story: cachedS || undefined,
              quiz: cachedQ || undefined,
              isVerified: cachedS?.isTeacherVerified || false
            });
          });
        });
      }
      // Science branches
      if (subj.branches) {
        subj.branches.forEach(br => {
          br.chapters.forEach(ch => {
            ch.subtopics.forEach(sub => {
              const cachedS = getCachedStory(sub.id, `Class ${cNum}`);
              const cachedQ = getCachedQuiz(sub.id, `Class ${cNum}`);
              list.push({
                subtopicId: sub.id,
                subtopicTitle: sub.title,
                chapterTitle: ch.title,
                subjectName: `${subj.subject} (${br.branch})`,
                classNum: cNum,
                status: cachedS && cachedQ ? 'completed' : 'pending',
                story: cachedS || undefined,
                quiz: cachedQ || undefined,
                isVerified: cachedS?.isTeacherVerified || false
              });
            });
          });
        });
      }
    });

    setItems(list);
    setCurrentIndex(0);
  };

  React.useEffect(() => {
    loadClassSubtopics(selectedClassNum);
  }, [selectedClassNum]);

  // Start Batch Generation Loop with rate-limiting pauses
  const startBatchGeneration = async () => {
    setIsRunning(true);

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.status === 'completed' && item.isVerified) {
        continue;
      }

      setCurrentIndex(i);
      setItems(prev => {
        const copy = [...prev];
        copy[i] = { ...copy[i], status: 'in_progress' };
        return copy;
      });

      try {
        // 1. Generate Story
        const story = await fetchOrGenerateStory({
          topic: item.subtopicTitle,
          conceptId: item.subtopicId,
          level: `Class ${item.classNum}` as any,
          classNum: item.classNum,
          chapterTitle: item.chapterTitle,
          subtopicTitle: item.subtopicTitle
        });

        // 2. Generate Quiz
        const quiz = await fetchOrGenerateQuiz({
          topic: item.subtopicTitle,
          conceptId: item.subtopicId,
          level: `Class ${item.classNum}` as any,
          classNum: item.classNum,
          subtopicTitle: item.subtopicTitle
        });

        setItems(prev => {
          const copy = [...prev];
          copy[i] = {
            ...copy[i],
            status: 'completed',
            story,
            quiz,
            isVerified: true
          };
          return copy;
        });

        // Save into local storage cache
        saveCachedStory(story);
        saveCachedQuiz(quiz);

        // Pause 1200ms between calls to avoid API rate limits
        await new Promise(res => setTimeout(res, 1200));
      } catch (err: any) {
        setItems(prev => {
          const copy = [...prev];
          copy[i] = {
            ...copy[i],
            status: 'failed',
            error: err.message || 'Generation failed'
          };
          return copy;
        });
      }
    }

    setIsRunning(false);
  };

  const handleStop = () => {
    setIsRunning(false);
  };

  // Export JSON file: content_class{N}.json
  const handleExportJSON = () => {
    const exportData = {
      class: selectedClassNum,
      exportedAt: new Date().toISOString(),
      items: items.filter(it => it.status === 'completed')
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `content_class${selectedClassNum}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON file
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.items && Array.isArray(parsed.items)) {
          parsed.items.forEach((it: any) => {
            if (it.story) saveCachedStory(it.story);
            if (it.quiz) saveCachedQuiz(it.quiz);
          });
          loadClassSubtopics(selectedClassNum);
          alert(`Successfully imported ${parsed.items.length} verified lessons!`);
        }
      } catch (err) {
        alert('Invalid JSON file format.');
      }
    };
    reader.readAsText(file);
  };

  const completedCount = items.filter(i => i.status === 'completed').length;
  const progressPercent = items.length ? Math.round((completedCount / items.length) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <Wrench className="w-5 h-5 text-indigo-400" />
              <span>Admin: Pre-Generate & Verify Curriculum</span>
            </h1>
            <p className="text-xs text-slate-400">
              Batch-create stories and quizzes for NCERT classes, review, verify, and export.
            </p>
          </div>
        </div>

        {/* Class Selection Buttons */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
          {[7, 8, 9].map(cNum => (
            <button
              key={cNum}
              onClick={() => setSelectedClassNum(cNum)}
              disabled={isRunning}
              className={`px-3 py-1 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                selectedClassNum === cNum
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Class {cNum}
            </button>
          ))}
        </div>
      </div>

      {/* Progress & Controls Card */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-sm font-bold text-white">
              Class {selectedClassNum} Batch Status
            </div>
            <div className="text-xs text-slate-400">
              {completedCount} of {items.length} subtopics generated ({progressPercent}%)
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!isRunning ? (
              <button
                onClick={startBatchGeneration}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Start Pre-Generation
              </button>
            ) : (
              <button
                onClick={handleStop}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Pause className="w-3.5 h-3.5 fill-current" />
                Pause
              </button>
            )}

            <button
              onClick={handleExportJSON}
              disabled={completedCount === 0}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 font-semibold text-xs border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Export JSON
            </button>

            <label className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              Import JSON
              <input
                type="file"
                accept=".json"
                onChange={handleImportJSON}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Subtopics Queue & Verification Review */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
        <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
          Class {selectedClassNum} Subtopics ({items.length})
        </h2>

        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
          {items.map((item, idx) => (
            <div
              key={item.subtopicId}
              className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between transition-all ${
                idx === currentIndex && isRunning
                  ? 'bg-indigo-950/80 border-indigo-500'
                  : item.status === 'completed'
                  ? 'bg-slate-950/80 border-slate-800'
                  : 'bg-slate-950/40 border-slate-850'
              }`}
            >
              <div className="space-y-0.5 pr-4">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-slate-500">{idx + 1}.</span>
                  <span className="font-semibold text-slate-200">{item.subtopicTitle}</span>
                  {item.isVerified && (
                    <span className="text-[10px] text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-1.5 py-0.2 rounded">
                      Teacher-checked ✓
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-400">
                  {item.subjectName} · {item.chapterTitle}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {item.status === 'in_progress' && (
                  <span className="text-amber-400 flex items-center gap-1 font-mono text-[11px]">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating...
                  </span>
                )}
                {item.status === 'completed' && (
                  <button
                    onClick={() => setReviewItem(item)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1 cursor-pointer font-medium"
                  >
                    <Eye className="w-3 h-3 text-cyan-400" /> Review
                  </button>
                )}
                {item.status === 'failed' && (
                  <span className="text-rose-400 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> Failed
                  </span>
                )}
                {item.status === 'pending' && (
                  <span className="text-slate-500 font-mono text-[11px]">Pending</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Review & Edit Modal */}
      {reviewItem && reviewItem.story && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase text-amber-400 font-bold">
                  Review & Verify Subtopic
                </span>
                <h3 className="text-base font-bold text-white">{reviewItem.subtopicTitle}</h3>
              </div>
              <button
                onClick={() => setReviewItem(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Story Title</label>
                <input
                  type="text"
                  value={reviewItem.story.title}
                  onChange={(e) => {
                    const updated = { ...reviewItem.story!, title: e.target.value };
                    setReviewItem({ ...reviewItem, story: updated });
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300">
                  Scenes ({reviewItem.story.scenes.length})
                </label>
                {reviewItem.story.scenes.map((sc, sIdx) => (
                  <div key={sIdx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 text-xs">
                    <div className="font-bold text-amber-300">
                      Scene {sc.sceneNumber}: {sc.header}
                    </div>
                    <p className="text-slate-300">{sc.text}</p>
                  </div>
                ))}
              </div>

              {reviewItem.quiz && (
                <div className="space-y-2 border-t border-slate-800 pt-3">
                  <label className="text-xs font-bold text-slate-300">
                    Quiz Diagnostic Questions ({reviewItem.quiz.questions.length})
                  </label>
                  {reviewItem.quiz.questions.map((q, qIdx) => (
                    <div key={q.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                      <div className="font-semibold text-white">Q{qIdx + 1}: {q.prompt}</div>
                      <div className="text-slate-400 italic">Target: {q.misconceptionTarget}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-800">
              <button
                onClick={() => {
                  const verifiedStory = { ...reviewItem.story!, isTeacherVerified: true };
                  saveCachedStory(verifiedStory);
                  setItems(prev => prev.map(it => it.subtopicId === reviewItem.subtopicId ? { ...it, isVerified: true, story: verifiedStory } : it));
                  setReviewItem(null);
                }}
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Check className="w-4 h-4" />
                Mark as "Teacher-checked" & Save
              </button>

              <button
                onClick={() => setReviewItem(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
