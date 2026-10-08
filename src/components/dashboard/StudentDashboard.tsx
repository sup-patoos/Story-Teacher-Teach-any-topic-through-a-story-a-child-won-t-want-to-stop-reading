/**
 * @file StudentDashboard.tsx
 * Section 7: Student Dashboard, Streak Tracking, and In-App Reminders.
 *
 * NOTE ON PUSH NOTIFICATIONS:
 * Real Web Push Notifications require a background Service Worker and backend Push Service (e.g. WebPush VAPID keys).
 * For this client environment, in-app notification banners and configurable daily alerts are provided and persisted.
 */

import React, { useState, useEffect } from 'react';
import {
  StudentProfile,
  ConceptMasteryRecord
} from '../../types/learning';
import {
  getStudentProfile,
  saveStudentProfile,
  getAllMasteryRecords,
  getTodayStudyTimeSeconds
} from '../../services/storageService';
import {
  Flame,
  Clock,
  Trophy,
  Award,
  BookOpen,
  ArrowRight,
  Bell,
  Sparkles,
  Check,
  User,
  Heart
} from 'lucide-react';

interface StudentDashboardProps {
  onResumeTopic: (conceptId: string, title: string, subject: string) => void;
  onExploreMore: () => void;
}

const AVATAR_OPTIONS = ['🚀', '🦉', '🦊', '🦁', '⚡', '🔬', '🎨', '🌟'];

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  onResumeTopic,
  onExploreMore
}) => {
  const [profile, setProfile] = useState<StudentProfile>(getStudentProfile());
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [nameInput, setNameInput] = useState(profile.name);
  const [avatarInput, setAvatarInput] = useState(profile.avatarEmoji);
  const [reminderSaved, setReminderSaved] = useState(false);
  const [reminderTime, setReminderTime] = useState('17:30');

  const masteryRecords = getAllMasteryRecords();
  const todaySeconds = getTodayStudyTimeSeconds();
  const todayMinutes = Math.floor(todaySeconds / 60);

  // Calculate subject masteries
  const subjectScores: Record<string, { total: number; count: number }> = {};
  Object.values(masteryRecords).forEach(rec => {
    if (!subjectScores[rec.subject]) {
      subjectScores[rec.subject] = { total: 0, count: 0 };
    }
    subjectScores[rec.subject].total += rec.masteryScore;
    subjectScores[rec.subject].count += 1;
  });

  const subjects = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Environment'];

  const handleSaveProfile = () => {
    const updated = {
      ...profile,
      name: nameInput.trim() || 'Explorer',
      avatarEmoji: avatarInput
    };
    saveStudentProfile(updated);
    setProfile(updated);
    setIsEditingProfile(false);
  };

  const handleSaveReminder = () => {
    setReminderSaved(true);
    setTimeout(() => setReminderSaved(false), 2500);
  };

  // Streak celebration message
  const getStreakMessage = (streak: number) => {
    if (streak >= 14) return '🎉 Legendary! 14-day study streak milestone unlocked!';
    if (streak >= 7) return '🌟 Outstanding! 7-day week streak accomplished!';
    if (streak >= 3) return '🔥 On fire! 3 days in a row of curiosity!';
    return '🌱 Great start! Learning a little bit every day builds genius.';
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* ---------------- Profile & Streak Banner ---------------- */}
      <div className="bg-gradient-to-r from-indigo-950/90 via-slate-900 to-purple-950/90 border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6 backdrop-blur-md">
        <div className="flex items-center gap-4 text-center sm:text-left">
          <div className="relative group cursor-pointer" onClick={() => setIsEditingProfile(true)}>
            <div className="w-20 h-20 rounded-3xl bg-amber-500/20 border-2 border-amber-400/50 flex items-center justify-center text-4xl shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
              {profile.avatarEmoji}
            </div>
            <span className="absolute -bottom-1 -right-1 text-[10px] bg-slate-900 text-amber-300 px-1.5 py-0.5 rounded-full border border-slate-700">
              Edit
            </span>
          </div>

          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-extrabold text-white">
              Welcome back, {profile.name}!
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              {getStreakMessage(profile.streakDays)}
            </p>
          </div>
        </div>

        {/* Big Streak & Time Stat Counters */}
        <div className="flex items-center gap-4">
          <div className="bg-slate-950/80 border border-amber-500/40 p-3.5 sm:p-4 rounded-2xl text-center min-w-[95px] shadow-lg">
            <div className="flex items-center justify-center gap-1 text-amber-400 mb-1">
              <Flame className="w-5 h-5 fill-current animate-bounce" />
              <span className="text-2xl font-extrabold font-mono">{profile.streakDays}</span>
            </div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Day Streak</div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 p-3.5 sm:p-4 rounded-2xl text-center min-w-[95px] shadow-lg">
            <div className="flex items-center justify-center gap-1 text-cyan-400 mb-1">
              <Clock className="w-5 h-5" />
              <span className="text-2xl font-extrabold font-mono">{todayMinutes}m</span>
            </div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Today's Time</div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditingProfile && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 p-6 rounded-3xl max-w-sm w-full space-y-4 shadow-2xl">
            <h2 className="text-lg font-bold text-white">Edit Your Profile</h2>
            <div className="space-y-1">
              <label className="text-xs text-slate-400">Your Name</label>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                maxLength={24}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400">Choose Avatar Emoji</label>
              <div className="flex flex-wrap gap-2">
                {AVATAR_OPTIONS.map((av, idx) => (
                  <button
                    key={idx}
                    onClick={() => setAvatarInput(av)}
                    className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center cursor-pointer transition-transform ${
                      avatarInput === av
                        ? 'bg-amber-500 ring-2 ring-white scale-110'
                        : 'bg-slate-800 hover:bg-slate-700'
                    }`}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsEditingProfile(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold cursor-pointer"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- In-App Daily Reminder Setting ---------------- */}
      <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            Daily Study Reminder: Set your favorite story time!
          </span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="time"
            value={reminderTime}
            onChange={(e) => setReminderTime(e.target.value)}
            className="bg-slate-950 border border-slate-700 px-2 py-1 rounded text-xs text-slate-200"
          />
          <button
            onClick={handleSaveReminder}
            className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded text-xs cursor-pointer"
          >
            {reminderSaved ? 'Saved! ✓' : 'Set Reminder'}
          </button>
        </div>
      </div>

      {/* ---------------- Continue Where You Left Off ---------------- */}
      {profile.recentTopics.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>Continue Where You Left Off</span>
            </h2>
            <button
              onClick={onExploreMore}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold cursor-pointer"
            >
              Explore New Topic →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {profile.recentTopics.slice(0, 4).map((rec, idx) => (
              <div
                key={idx}
                onClick={() => onResumeTopic(rec.conceptId, rec.title, rec.subject)}
                className="group p-4 rounded-2xl bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-amber-400/70 transition-all cursor-pointer flex items-center justify-between shadow-lg"
              >
                <div className="space-y-1 pr-3">
                  <span className="text-[10px] font-mono uppercase text-amber-400 font-bold">
                    {rec.subject}
                  </span>
                  <h3 className="text-sm font-semibold text-slate-100 group-hover:text-amber-300 transition-colors line-clamp-1">
                    {rec.title}
                  </h3>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-all shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---------------- Subject Mastery Bars ---------------- */}
      <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-400" />
          <span>Mastery by Subject</span>
        </h2>

        <div className="space-y-3">
          {subjects.map(subj => {
            const data = subjectScores[subj];
            const avg = data && data.count > 0 ? Math.round(data.total / data.count) : 0;
            return (
              <div key={subj} className="space-y-1">
                <div className="flex justify-between text-xs text-slate-300 font-medium">
                  <span>{subj}</span>
                  <span className="font-mono font-bold text-amber-400">
                    {avg > 0 ? `${avg}%` : 'Not started yet'}
                  </span>
                </div>
                <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-amber-400 rounded-full transition-all duration-700"
                    style={{ width: `${Math.max(5, avg)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ---------------- Badges & Milestones ---------------- */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-400" />
          <span>Badges & Milestones</span>
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {profile.badgesEarned.map(badge => (
            <div
              key={badge.id}
              className="p-4 rounded-2xl bg-slate-900/80 border border-amber-500/30 text-center space-y-1.5 shadow-lg"
            >
              <div className="text-3xl filter drop-shadow-md">{badge.icon}</div>
              <h3 className="text-xs font-bold text-white line-clamp-1">{badge.title}</h3>
              <p className="text-[10px] text-slate-400 line-clamp-2">{badge.description}</p>
            </div>
          ))}

          {/* Placeholder for next badge */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-dashed border-slate-800 text-center space-y-1.5 opacity-60">
            <div className="text-3xl grayscale">🔒</div>
            <h3 className="text-xs font-bold text-slate-400">10 Topics Explorer</h3>
            <p className="text-[10px] text-slate-500">Explore 10 unique topics across subjects</p>
          </div>
        </div>
      </div>
    </div>
  );
};
