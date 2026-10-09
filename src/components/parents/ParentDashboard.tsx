/**
 * @file ParentDashboard.tsx
 * Section 8: Parent / Teacher Dashboard.
 * Protected by 4-digit PIN (default "1234").
 * Provides daily learning reports, misconception audits, syllabus vs explored tracking,
 * daily time limit controls, and print/download reports.
 */

import React, { useState } from 'react';
import {
  ParentSettings,
  SessionReportItem,
  ConceptMasteryRecord,
  getAgeBand
} from '../../types/learning';
import {
  getParentSettings,
  saveParentSettings,
  getAllSessionReports,
  getAllMasteryRecords,
  getTodayStudyTimeSeconds,
  getStudentProfile,
  updateStudentAge,
  verifyParentPin,
  hashParentPin,
  generateDailyReportSummary
} from '../../services/storageService';
import {
  Lock,
  Unlock,
  Shield,
  Clock,
  Printer,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Settings,
  Flame,
  BookOpen,
  Compass,
  Download,
  KeyRound,
  Wrench,
  User
} from 'lucide-react';

interface ParentDashboardProps {
  onOpenAdminTool: () => void;
  onExit: () => void;
}

export const ParentDashboard: React.FC<ParentDashboardProps> = ({
  onOpenAdminTool,
  onExit
}) => {
  const profile = getStudentProfile();
  const [childAge, setChildAge] = useState<number>(profile.age || 13);
  const [settings, setSettings] = useState<ParentSettings>(getParentSettings());
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  const handleChildAgeChange = (newAge: number) => {
    const clamped = Math.min(16, Math.max(5, newAge));
    setChildAge(clamped);
    updateStudentAge(clamped);
  };

  // Editing PIN modal state
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [newPin, setNewPin] = useState('');

  // Selected report date filter
  const allReports = getAllSessionReports();
  const uniqueDates = Array.from(new Set(allReports.map(r => r.date)));
  const [selectedDate, setSelectedDate] = useState<string>(
    uniqueDates[0] || new Date().toISOString().split('T')[0]
  );

  const masteryRecords = getAllMasteryRecords();
  const todaySeconds = getTodayStudyTimeSeconds();
  const todayMinutes = Math.floor(todaySeconds / 60);

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyParentPin(pinInput, settings)) {
      setIsAuthenticated(true);
      setPinError(false);
    } else {
      setPinError(true);
      setPinInput('');
    }
  };

  const handleSaveSettings = (newSettings: Partial<ParentSettings>) => {
    const updated = { ...settings, ...newSettings };
    saveParentSettings(updated);
    setSettings(updated);
  };

  const handleChangePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length === 4) {
      handleSaveSettings({ pinHash: hashParentPin(newPin) });
      setIsChangingPin(false);
      setNewPin('');
    }
  };

  // Filter reports by selected date
  const dateReports = allReports.filter(r => r.date === selectedDate);
  const syllabusReports = dateReports.filter(r => r.isSyllabusTopic);
  const exploredReports = dateReports.filter(r => !r.isSyllabusTopic);

  // Concepts understood well (>= 70) vs needing help (< 70)
  const understoodWell = dateReports.filter(r => r.conceptMasteryScore >= 70);
  const needsImprovement = dateReports.filter(r => r.conceptMasteryScore < 70);

  // Print or Download daily report
  const handlePrint = () => {
    window.print();
  };

  // If locked, render PIN entry screen
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-white">Parent & Teacher Portal</h1>
            <p className="text-xs text-slate-400">
              Enter 4-digit PIN to access child progress, analytics, and safety limits. (Default PIN: 1234)
            </p>
          </div>

          <form onSubmit={handlePinSubmit} className="space-y-4">
            <input
              type="password"
              maxLength={4}
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
              placeholder="••••"
              autoFocus
              className="w-36 mx-auto text-center tracking-[1em] text-2xl font-mono bg-slate-950 border border-slate-700 rounded-2xl py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
            />

            {pinError && (
              <div className="text-xs text-rose-400 font-semibold animate-shake">
                Incorrect PIN. Please try again or use default 1234.
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onExit}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-colors cursor-pointer"
              >
                Back to Student View
              </button>
              <button
                type="submit"
                disabled={pinInput.length !== 4}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 text-sm font-bold shadow-md transition-all cursor-pointer"
              >
                Unlock
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 print:p-0 print:m-0">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Parent & Teacher Dashboard</h1>
            <p className="text-xs text-slate-400">Child Progress & Educational Reports</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenAdminTool()}
            className="px-3 py-1.5 rounded-xl bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700 text-indigo-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Pre-generate curriculum content"
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Admin Pre-Generator</span>
          </button>

          <button
            onClick={handlePrint}
            aria-label="Print or save daily progress report as PDF"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
            title="Print or Save PDF"
          >
            <Printer className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsChangingPin(true)}
            aria-label="Change parent portal 4-digit PIN"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
            title="Change PIN"
          >
            <KeyRound className="w-4 h-4" />
          </button>

          <button
            onClick={onExit}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer"
          >
            Exit Portal
          </button>
        </div>
      </div>

      {/* Change PIN Modal */}
      {isChangingPin && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleChangePin}
            className="bg-slate-900 border border-slate-700 p-6 rounded-3xl max-w-xs w-full space-y-4 shadow-2xl"
          >
            <h2 className="text-base font-bold text-white">Change Portal PIN</h2>
            <input
              type="password"
              maxLength={4}
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
              placeholder="New 4-digit PIN"
              className="w-full text-center tracking-widest text-xl font-mono bg-slate-950 border border-slate-700 rounded-xl py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsChangingPin(false)}
                className="flex-1 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={newPin.length !== 4}
                className="flex-1 py-1.5 rounded-xl bg-amber-500 disabled:opacity-40 text-slate-950 font-bold text-xs"
              >
                Save PIN
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ---------------- SECTION: Parent Controls & Limits ---------------- */}
      <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl space-y-4 print:hidden">
        <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <Settings className="w-4 h-4 text-amber-400" />
          <span>Screen Time & Content Safety Controls</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Age Setting */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-1.5">
                <User className="w-4 h-4 text-amber-400" /> Age
              </div>
              <div className="text-xs text-slate-400">
                Age <strong className="text-amber-300">{childAge}</strong> (Band: {getAgeBand(childAge)})
              </div>
            </div>
            <select
              value={childAge}
              onChange={(e) => handleChildAgeChange(parseInt(e.target.value, 10))}
              className="bg-slate-800 text-amber-300 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold cursor-pointer"
            >
              {Array.from({ length: 12 }, (_, i) => i + 5).map(ageNum => (
                <option key={ageNum} value={ageNum}>
                  Age {ageNum}
                </option>
              ))}
            </select>
          </div>

          {/* Daily Time Limit */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-cyan-400" /> Daily Learning Limit
              </div>
              <div className="text-xs text-slate-400">
                Today studied: <strong className="text-cyan-300">{todayMinutes}m</strong> / {settings.dailyTimeLimitMinutes}m
              </div>
            </div>
            <select
              value={settings.dailyTimeLimitMinutes}
              onChange={(e) => handleSaveSettings({ dailyTimeLimitMinutes: parseInt(e.target.value, 10) })}
              className="bg-slate-800 text-slate-200 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-semibold cursor-pointer"
            >
              <option value="15">15 mins</option>
              <option value="30">30 mins</option>
              <option value="45">45 mins</option>
              <option value="60">60 mins</option>
              <option value="90">90 mins</option>
            </select>
          </div>

          {/* Syllabus Only Safety Toggle */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-emerald-400" /> Curriculum Lock
              </div>
              <div className="text-xs text-slate-400">
                {settings.syllabusOnly ? 'NCERT Syllabus only' : 'Open (NCERT + Curiosity)'}
              </div>
            </div>
            <button
              onClick={() => handleSaveSettings({ syllabusOnly: !settings.syllabusOnly })}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                settings.syllabusOnly ? 'bg-emerald-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                  settings.syllabusOnly ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* ---------------- SECTION: Date Filter ---------------- */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 print:hidden">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
          <Calendar className="w-4 h-4 text-amber-400" />
          <span>Daily Progress Report</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Viewing Date:</span>
          <select
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-slate-200 rounded-xl px-3 py-1 text-xs font-mono cursor-pointer"
          >
            {uniqueDates.map(d => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ---------------- SECTION: Summary Cards First ---------------- */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="text-2xl font-bold font-mono text-white">{dateReports.length}</div>
          <div className="text-xs text-slate-400 font-medium mt-1">Concepts Studied</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="text-2xl font-bold font-mono text-emerald-400">{understoodWell.length}</div>
          <div className="text-xs text-slate-400 font-medium mt-1">Understood Well (≥70%)</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="text-2xl font-bold font-mono text-amber-400">{needsImprovement.length}</div>
          <div className="text-xs text-slate-400 font-medium mt-1">Needs Improvement (&lt;70%)</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="text-2xl font-bold font-mono text-cyan-400">
            {Math.floor(dateReports.reduce((acc, r) => acc + r.timeSpentSeconds, 0) / 60)}m
          </div>
          <div className="text-xs text-slate-400 font-medium mt-1">Total Time Logged</div>
        </div>
      </div>

      {/* ---------------- SECTION: Daily Report Details ---------------- */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-bold text-white">
              Session Details for {selectedDate}
            </h2>
            <p className="text-xs text-slate-400">
              Clear analytical breakdown of topics, detected misconceptions, and actionable next steps.
            </p>
          </div>
        </div>

        {dateReports.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm italic">
            No study sessions logged on this date.
          </div>
        ) : (
          <div className="space-y-6">
            {/* Syllabus Topics vs Explored Topics Split */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                <span>NCERT Syllabus Topics ({syllabusReports.length})</span>
              </h3>

              {syllabusReports.length === 0 ? (
                <div className="text-xs text-slate-500 italic pl-5">None logged on this date.</div>
              ) : (
                <div className="space-y-3">
                  {syllabusReports.map(rep => (
                    <ReportCard key={rep.id} report={rep} />
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-800">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-cyan-400" />
                <span>Curiosity Explored Topics ({exploredReports.length})</span>
              </h3>

              {exploredReports.length === 0 ? (
                <div className="text-xs text-slate-500 italic pl-5">None logged on this date.</div>
              ) : (
                <div className="space-y-3">
                  {exploredReports.map(rep => (
                    <ReportCard key={rep.id} report={rep} />
                  ))}
                </div>
              )}
            </div>

            {/* Clear Next Action Recommendation for Teacher/Parent */}
            <div className="p-4 rounded-2xl bg-indigo-950/60 border border-indigo-700/60 space-y-2">
              <div className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                💡 Recommended Focus for Next Session
              </div>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                {needsImprovement.length > 0
                  ? `Review ${needsImprovement[0].topicTitle}: address detected misconception "${needsImprovement[0].misconceptionsDetected[0] || 'core principle'}" with a tangible hands-on example before moving to new chapters.`
                  : `Great mastery demonstrated across topics! Encourage the student to advance to next higher-level subtopics in ${syllabusReports[0]?.subject || 'Science'}.`}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Sub-component: Individual Report Card
const ReportCard: React.FC<{ report: SessionReportItem }> = ({ report }) => {
  return (
    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="text-[10px] font-mono text-amber-400 uppercase font-bold">
            {report.subject}
          </span>
          <h4 className="text-sm font-bold text-white">{report.topicTitle}</h4>
        </div>
        <div className="text-right">
          <span
            className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${
              report.conceptMasteryScore >= 70
                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                : 'bg-rose-950 text-rose-400 border border-rose-800'
            }`}
          >
            {report.conceptMasteryScore}% Mastery
          </span>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
            Quiz: {report.quizScorePercentage}% · {Math.round(report.timeSpentSeconds / 60)}m
          </div>
        </div>
      </div>

      {/* Misconceptions detected */}
      {report.misconceptionsDetected && report.misconceptionsDetected.length > 0 && (
        <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-800/40 text-xs text-amber-300">
          <span className="font-bold">⚠️ Misconception noticed: </span>
          {report.misconceptionsDetected.join('; ')}
        </div>
      )}

      {/* Strengths observed */}
      {report.strengthsObserved && report.strengthsObserved.length > 0 && (
        <div className="text-xs text-slate-400 flex items-center gap-1.5">
          <span className="text-emerald-400 font-bold">✓</span>
          <span>Strengths: {report.strengthsObserved.join(', ')}</span>
        </div>
      )}
    </div>
  );
};
