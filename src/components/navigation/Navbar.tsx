/**
 * @file Navbar.tsx
 * Top and bottom navigation for StoryLearn.
 * Tabs: Explore, NCERT Library, My Progress, Parents.
 */

import React from 'react';
import {
  Compass,
  BookOpen,
  Trophy,
  Shield,
  Flame
} from 'lucide-react';
import { getStudentProfile, getTodayStudyTimeSeconds } from '../../services/storageService';

export type AppTab = 'explore' | 'library' | 'progress' | 'parents' | 'admin';

interface NavbarProps {
  currentTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  onHomeClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onHomeClick
}) => {
  const profile = getStudentProfile();

  const navItems: Array<{ id: AppTab; label: string; icon: React.FC<{ className?: string }> }> = [
    { id: 'explore', label: 'Explore', icon: Compass },
    { id: 'library', label: 'NCERT Library', icon: BookOpen },
    { id: 'progress', label: 'My Progress', icon: Trophy },
    { id: 'parents', label: 'Parents', icon: Shield }
  ];

  return (
    <>
      {/* ---------------- DESKTOP & TABLET TOP NAVBAR ---------------- */}
      <header className="sticky top-0 z-40 w-full bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Brand Logo & Name */}
          <div
            role="button"
            tabIndex={0}
            onClick={onHomeClick}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onHomeClick();
              }
            }}
            aria-label="StoryLearn - return to Explore"
            className="flex items-center gap-2.5 cursor-pointer group focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none rounded-xl p-1"
          >
            <img
              src="/logo.svg"
              alt="StoryLearn application logo"
              className="w-10 h-10 sm:w-11 sm:h-11 object-contain shrink-0 group-hover:scale-105 transition-transform"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-bold tracking-tight text-white group-hover:text-amber-400 transition-colors">
                  Story<span className="text-amber-400">Learn</span>
                </span>
                <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 rounded font-bold">
                  AI
                </span>
              </div>
              <div className="text-[10px] text-slate-400 -mt-0.5 hidden sm:block">
                Stories · Understanding · Mastery
              </div>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav aria-label="Main Navigation" className="hidden md:flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none ${
                    isActive
                      ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Profile Quick Stats */}
          <div className="flex items-center gap-2.5">
            <div className="hidden sm:flex items-center gap-1 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800 text-xs" title={`${profile.streakDays} day streak`}>
              <Flame className="w-3.5 h-3.5 text-amber-400 fill-current" />
              <span className="font-mono font-medium text-amber-300">
                {profile.streakDays}d
              </span>
            </div>

            <button
              onClick={() => onSelectTab('progress')}
              aria-label={`Student profile for ${profile.name}`}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 cursor-pointer transition-colors text-xs text-slate-200 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
            >
              <span className="font-medium">{profile.name}</span>
            </button>
          </div>
        </div>
      </header>

      {/* ---------------- MOBILE BOTTOM NAVIGATION BAR ---------------- */}
      <nav aria-label="Mobile Navigation" className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-lg border-t border-slate-800 px-2 py-1.5 flex items-center justify-around">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`flex flex-col items-center justify-center p-1.5 rounded-lg text-[10px] font-semibold transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none ${
                isActive
                  ? 'text-amber-400 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4 mb-0.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};

