/**
 * @file ClassBrowser.tsx
 * DOOR 2: BROWSE BY CLASS (Curriculum Library for Classes 7-9 NCERT).
 * Structured hierarchy: Class > Subject > Branch > Chapter > Subtopic.
 */

import React, { useState } from 'react';
import syllabusData from '../../data/syllabus.json';
import {
  SyllabusClass,
  SyllabusSubject,
  SyllabusBranch,
  SyllabusChapter,
  SyllabusSubtopic,
  getTypicalAgeForClass
} from '../../types/learning';
import {
  BookOpen,
  Atom,
  FlaskConical,
  Dna,
  TreePine,
  Calculator,
  ChevronRight,
  ArrowLeft,
  Video,
  CheckCircle2,
  Sparkles,
  Info
} from 'lucide-react';
import { getAllMasteryRecords, getStudentProfile, updateStudentAge } from '../../services/storageService';

interface ClassBrowserProps {
  initialClassNum?: number;
  onSelectSubtopic: (params: {
    subtopic: SyllabusSubtopic;
    chapter: SyllabusChapter;
    subject: string;
    classNum: number;
    age?: number;
  }) => void;
  onBackToHome: () => void;
  onResumeTopic?: (conceptId: string, title: string, subject: string) => void;
}

export const ClassBrowser: React.FC<ClassBrowserProps> = ({
  initialClassNum = 8,
  onSelectSubtopic,
  onBackToHome,
  onResumeTopic
}) => {
  const profile = getStudentProfile();
  const [selectedClassNum, setSelectedClassNum] = useState<number>(initialClassNum);
  const [selectedAge, setSelectedAge] = useState<number>(() => {
    return profile.age || getTypicalAgeForClass(initialClassNum);
  });
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);

  // Sync if initialClassNum changes
  React.useEffect(() => {
    if (initialClassNum && initialClassNum !== selectedClassNum) {
      setSelectedClassNum(initialClassNum);
      setSelectedSubjectId(null);
      setSelectedBranchId(null);
      setSelectedChapterId(null);
      const typical = getTypicalAgeForClass(initialClassNum);
      setSelectedAge(typical);
    }
  }, [initialClassNum]);

  const handleClassSwitch = (cNum: number) => {
    setSelectedClassNum(cNum);
    setSelectedSubjectId(null);
    setSelectedBranchId(null);
    setSelectedChapterId(null);
    const typical = getTypicalAgeForClass(cNum);
    setSelectedAge(typical);
    updateStudentAge(typical);
  };

  const handleAgeChange = (newAge: number) => {
    const clamped = Math.min(16, Math.max(5, newAge));
    setSelectedAge(clamped);
    updateStudentAge(clamped);
  };

  const masteryRecords = getAllMasteryRecords();

  const currentClass: SyllabusClass =
    syllabusData.classes.find(c => c.class === selectedClassNum) || syllabusData.classes[0];

  const currentSubject: SyllabusSubject | undefined = currentClass.subjects.find(
    s => s.id === selectedSubjectId
  );

  const currentBranch: SyllabusBranch | undefined = currentSubject?.branches?.find(
    b => b.id === selectedBranchId
  );

  // Chapters list depends on whether subject has direct chapters (Maths) or branches (Science)
  let visibleChapters: SyllabusChapter[] = [];
  if (currentSubject) {
    if (currentSubject.chapters) {
      visibleChapters = currentSubject.chapters;
    } else if (currentBranch) {
      visibleChapters = currentBranch.chapters;
    }
  }

  const currentChapter: SyllabusChapter | undefined = visibleChapters.find(
    ch => ch.id === selectedChapterId
  );

  // Helper: Branch Icon & Color
  const getBranchVisuals = (branchName: string) => {
    switch (branchName.toLowerCase()) {
      case 'physics':
        return { icon: Atom, color: 'text-cyan-400 bg-cyan-950/60 border-cyan-800' };
      case 'chemistry':
        return { icon: FlaskConical, color: 'text-purple-400 bg-purple-950/60 border-purple-800' };
      case 'biology':
        return { icon: Dna, color: 'text-emerald-400 bg-emerald-950/60 border-emerald-800' };
      case 'environment and earth science':
      case 'environment':
        return { icon: TreePine, color: 'text-teal-400 bg-teal-950/60 border-teal-800' };
      default:
        return { icon: Sparkles, color: 'text-amber-400 bg-amber-950/60 border-amber-800' };
    }
  };

  // Helper: Chapter progress from subtopics
  const getChapterProgress = (chapter: SyllabusChapter) => {
    if (!chapter.subtopics.length) return 0;
    let totalScore = 0;
    let attempted = 0;
    chapter.subtopics.forEach(sub => {
      const rec = masteryRecords[sub.id];
      if (rec) {
        totalScore += rec.masteryScore;
        attempted += 1;
      }
    });
    return attempted > 0 ? Math.round(totalScore / chapter.subtopics.length) : 0;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-lg backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (selectedChapterId) setSelectedChapterId(null);
              else if (selectedBranchId) setSelectedBranchId(null);
              else if (selectedSubjectId) setSelectedSubjectId(null);
              else onBackToHome();
            }}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-400" />
              <span>Door 2: Browse NCERT Curriculum</span>
            </h1>
            <div className="text-xs text-slate-400 flex items-center gap-1.5 font-mono">
              <span>Class {selectedClassNum}</span>
              {currentSubject && <span>/ {currentSubject.subject}</span>}
              {currentBranch && <span>/ {currentBranch.branch}</span>}
              {currentChapter && <span>/ {currentChapter.title}</span>}
            </div>
          </div>
        </div>

        {/* Class & Age Control Group */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Class Switcher Tabs (7, 8, 9) */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            {[7, 8, 9].map(cNum => (
              <button
                key={cNum}
                onClick={() => handleClassSwitch(cNum)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                  selectedClassNum === cNum
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Class {cNum}
              </button>
            ))}
          </div>

          {/* Editable Age */}
          <div className="flex items-center gap-1.5 bg-slate-950/90 border border-slate-800 px-2.5 py-1 rounded-xl text-xs">
            <span className="text-slate-400 font-semibold">Age:</span>
            <select
              value={selectedAge}
              onChange={(e) => handleAgeChange(parseInt(e.target.value, 10))}
              className="bg-slate-900 border border-slate-700 text-amber-300 font-mono font-bold rounded-lg px-2 py-0.5 cursor-pointer focus:outline-none focus:border-amber-400"
              aria-label="Select age"
            >
              {Array.from({ length: 12 }, (_, i) => i + 5).map(ageNum => (
                <option key={ageNum} value={ageNum}>
                  {ageNum} yrs
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* LEVEL 1: Subject Selection (Maths vs Science) */}
      {/* ------------------------------------------------------------------ */}
      {!selectedSubjectId && (
        <div className="space-y-4">
          <div className="text-sm font-semibold text-slate-300">
            Select a subject for <span className="text-amber-400 font-bold">Class {selectedClassNum}</span>:
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {currentClass.subjects.map(subject => {
              const isMath = subject.subject.toLowerCase().includes('math');
              const Icon = isMath ? Calculator : Atom;
              const chapterCount = isMath
                ? subject.chapters?.length || 0
                : subject.branches?.reduce((acc, b) => acc + b.chapters.length, 0) || 0;

              return (
                <div
                  key={subject.id}
                  onClick={() => setSelectedSubjectId(subject.id)}
                  className={`group p-6 rounded-3xl border transition-all cursor-pointer shadow-xl ${
                    isMath
                      ? 'bg-gradient-to-br from-indigo-950/80 to-slate-900 border-indigo-800/80 hover:border-indigo-400'
                      : 'bg-gradient-to-br from-cyan-950/80 to-slate-900 border-cyan-800/80 hover:border-cyan-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform ${
                        isMath ? 'bg-indigo-500/20 text-indigo-400' : 'bg-cyan-500/20 text-cyan-400'
                      }`}
                    >
                      <Icon className="w-7 h-7" />
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-white transition-colors" />
                  </div>
                  <h2 className="text-xl font-bold text-white group-hover:text-amber-300 transition-colors">
                    {subject.subject}
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    {chapterCount} Chapters · {isMath ? 'Geometry, Algebra & Numbers' : 'Physics, Chemistry, Biology & Environment'}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Featured Ready-to-Learn Stories */}
          {onResumeTopic && (
            <div className="pt-4 space-y-3">
              <div className="text-xs font-semibold text-slate-400">
                Featured stories (ready to explore):
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  onClick={() =>
                    onResumeTopic(
                      'c9-physics-ch01-s1',
                      'Distance and displacement, uniform and non-uniform motion',
                      'Physics'
                    )
                  }
                  className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer flex items-center justify-between"
                >
                  <div>
                    <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase">
                      Class 9 Physics
                    </span>
                    <h4 className="text-xs font-semibold text-white mt-0.5">
                      The Great Chandni Chowk Auto Race (Distance vs Displacement)
                    </h4>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 shrink-0 ml-2" />
                </div>

                <div
                  onClick={() =>
                    onResumeTopic(
                      'c7-math-ch01-s1',
                      'Properties of addition and subtraction of integers',
                      'Mathematics'
                    )
                  }
                  className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer flex items-center justify-between"
                >
                  <div>
                    <span className="text-[10px] font-mono text-indigo-400 font-bold uppercase">
                      Class 7 Mathematics
                    </span>
                    <h4 className="text-xs font-semibold text-white mt-0.5">
                      Captain Dev & the Deep Coral Submarine (Integer Depths)
                    </h4>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 shrink-0 ml-2" />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* LEVEL 2: Science Branch Selection (if Science picked and no branch yet) */}
      {/* ------------------------------------------------------------------ */}
      {selectedSubjectId && currentSubject?.branches && !selectedBranchId && (
        <div className="space-y-4">
          <div className="text-sm font-semibold text-slate-300">
            Select a branch of <span className="text-cyan-400 font-bold">Science</span>:
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {currentSubject.branches.map(branch => {
              const visuals = getBranchVisuals(branch.branch);
              const Icon = visuals.icon;

              return (
                <div
                  key={branch.id}
                  onClick={() => setSelectedBranchId(branch.id)}
                  className="group p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-600 transition-all cursor-pointer flex items-center justify-between shadow-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${visuals.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                        {branch.branch}
                      </h2>
                      <span className="text-xs text-slate-400">
                        {branch.chapters.length} Chapters
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-white" />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* LEVEL 3: Chapter Selection */}
      {/* ------------------------------------------------------------------ */}
      {selectedSubjectId && (!currentSubject?.branches || selectedBranchId) && !selectedChapterId && (
        <div className="space-y-4">
          <div className="text-sm font-semibold text-slate-300">
            Select a chapter:
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {visibleChapters.map(chapter => {
              const progress = getChapterProgress(chapter);
              return (
                <div
                  key={chapter.id}
                  onClick={() => setSelectedChapterId(chapter.id)}
                  className="group p-4 rounded-2xl bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/60 transition-all cursor-pointer flex items-center justify-between shadow-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-amber-400 font-mono text-sm">
                      {chapter.chapterNumber}
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                        {chapter.title}
                      </h2>
                      <div className="text-[11px] text-slate-400">
                        {chapter.subtopics.length} Subtopics
                      </div>
                    </div>
                  </div>

                  {/* Progress indicator */}
                  <div className="flex items-center gap-2">
                    {progress > 0 && (
                      <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                        {progress}%
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* LEVEL 4: Subtopics in Chapter -> Launch Learning Mode! */}
      {/* ------------------------------------------------------------------ */}
      {selectedChapterId && currentChapter && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs uppercase font-mono text-amber-400 font-bold">
                Chapter {currentChapter.chapterNumber}
              </span>
              <h2 className="text-lg font-bold text-white">
                {currentChapter.title}
              </h2>
            </div>
            <button
              onClick={() => setSelectedChapterId(null)}
              className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
            >
              Choose different chapter
            </button>
          </div>

          <div className="space-y-3">
            {currentChapter.subtopics.map((sub, sIdx) => {
              const rec = masteryRecords[sub.id];
              const isVerified = Boolean(sub.videoId || sIdx === 0);

              return (
                <div
                  key={sub.id}
                  onClick={() =>
                    onSelectSubtopic({
                      subtopic: sub,
                      chapter: currentChapter,
                      subject: currentSubject?.subject || 'Science',
                      classNum: selectedClassNum,
                      age: selectedAge
                    })
                  }
                  className="group p-4 rounded-2xl bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-amber-400/80 transition-all cursor-pointer flex items-center justify-between shadow-lg"
                >
                  <div className="space-y-1 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-400">
                        {sIdx + 1}.
                      </span>
                      <h3 className="text-sm sm:text-base font-semibold text-slate-100 group-hover:text-amber-300 transition-colors">
                        {sub.title}
                      </h3>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {isVerified && (
                        <span className="bg-emerald-950/80 text-emerald-400 border border-emerald-700 px-2 py-0.5 rounded-full text-[10px] inline-flex items-center gap-1 font-medium">
                          ✓ Teacher-checked
                        </span>
                      )}
                      {sub.videoId && (
                        <span className="bg-cyan-950/80 text-cyan-400 border border-cyan-800 px-2 py-0.5 rounded-full text-[10px] inline-flex items-center gap-1 font-medium">
                          <Video className="w-3 h-3" /> Video Ready
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right Action: Mastery Badge or Start Button */}
                  <div className="flex items-center gap-3 shrink-0">
                    {rec ? (
                      <div className="text-right">
                        <div className="text-xs font-mono font-bold text-amber-400">
                          {rec.masteryScore}%
                        </div>
                        <div className="text-[10px] text-slate-400">Mastery</div>
                      </div>
                    ) : (
                      <span className="text-xs font-bold text-amber-400 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                        Explore <ChevronRight className="w-4 h-4" />
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* NCERT Footnote as requested */}
      <div className="pt-6 border-t border-slate-800/80 text-center text-xs text-slate-300 flex items-center justify-center gap-1.5">
        <Info className="w-3.5 h-3.5 text-slate-300" />
        <span>Based on the widely used NCERT chapter list.</span>
      </div>
    </div>
  );
};
