/**
 * @file App.tsx
 * StoryLearn: AI Story-Based Learning Web Application.
 * Full-stack educational experience with two entry points (Explore Anything & Browse by Class),
 * interactive visual story engine, adaptive diagnostic assessment, AI misconception analysis,
 * mastery meter, parent/teacher dashboard, and resilient plain-text fallback.
 */

import React, { useState } from 'react';
import { Navbar, AppTab } from './components/navigation/Navbar';
import { HomeScreen } from './components/home/HomeScreen';
import { ClassBrowser } from './components/library/ClassBrowser';
import { ModeSelector } from './components/modes/ModeSelector';
import { StoryPlayer } from './components/story/StoryPlayer';
import { VideoPlayerView } from './components/video/VideoPlayerView';
import { TextStoryView } from './components/story/TextStoryView';
import { QuizPlayer } from './components/quiz/QuizPlayer';
import { AnalysisResult } from './components/analysis/AnalysisResult';
import { StudentDashboard } from './components/dashboard/StudentDashboard';
import { ParentDashboard } from './components/parents/ParentDashboard';
import { AdminPreGenerate } from './components/admin/AdminPreGenerate';

import {
  InteractiveStory,
  QuizData,
  UnderstandingAnalysis,
  ChildAnswerRecord,
  EducationLevel,
  TopicValidationResult,
  SyllabusSubtopic,
  SyllabusChapter
} from './types/learning';

import {
  fetchOrGenerateStory,
  fetchOrGenerateTextStoryFallback,
  fetchOrGenerateQuiz,
  analyzeAnswers
} from './services/apiClient';
import { PRELOADED_TOPICS } from './data/preloadedContent';
import { addRecentTopic, getStudentProfile, updateStudentAge } from './services/storageService';
import { getTypicalAgeForClass } from './types/learning';
import { Loader2, AlertCircle, RotateCcw, BookOpen, ArrowLeft } from 'lucide-react';

type ActiveView =
  | 'home'
  | 'mode_select'
  | 'story_player'
  | 'video_player'
  | 'text_story'
  | 'quiz_player'
  | 'analysis_result'
  | 'library'
  | 'progress'
  | 'parents'
  | 'admin';

export default function App() {
  const profile = getStudentProfile();
  const [currentTab, setCurrentTab] = useState<AppTab>('explore');
  const [activeView, setActiveView] = useState<ActiveView>('home');
  const [browserClassNum, setBrowserClassNum] = useState<number>(8);

  // Currently active learning topic and child's age state
  const [currentTopicTitle, setCurrentTopicTitle] = useState('Distance and displacement');
  const [currentConceptId, setCurrentConceptId] = useState('c9-physics-ch01-s1');
  const [currentLevel, setCurrentLevel] = useState<EducationLevel>('Class 9');
  const [currentAge, setCurrentAge] = useState<number>(profile.age || 13);
  const [currentSubject, setCurrentSubject] = useState('Physics');
  const [currentClassNum, setCurrentClassNum] = useState<number | undefined>(9);
  const [currentVideoId, setCurrentVideoId] = useState<string | null | undefined>('JQf79GCKHfY');
  const [isSyllabusTopic, setIsSyllabusTopic] = useState(true);
  const [isTeacherVerified, setIsTeacherVerified] = useState(true);

  // Loaded Story & Quiz content
  const [loadedStory, setLoadedStory] = useState<InteractiveStory | null>(null);
  const [loadedQuiz, setLoadedQuiz] = useState<QuizData | null>(null);
  const [quizAnalysis, setQuizAnalysis] = useState<UnderstandingAnalysis | null>(null);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);

  // Explicit on-screen error state for story generation
  const [storyError, setStoryError] = useState<{ message: string; topic: string } | null>(null);

  // Tab switcher
  const handleSelectTab = (tab: AppTab) => {
    setCurrentTab(tab);
    setStoryError(null);
    if (tab === 'explore') setActiveView('home');
    else if (tab === 'library') setActiveView('library');
    else if (tab === 'progress') setActiveView('progress');
    else if (tab === 'parents') setActiveView('parents');
    else if (tab === 'admin') setActiveView('admin');
  };

  const handleHomeClick = () => {
    setCurrentTab('explore');
    setActiveView('home');
    setStoryError(null);
  };

  // 1. From Door 1 (Search / Explore Anything)
  const handleStartExploration = async (
    topic: string,
    level: EducationLevel,
    validation: TopicValidationResult,
    age?: number
  ) => {
    setStoryError(null);
    setCurrentTopicTitle(topic);
    setCurrentConceptId(validation.conceptId);
    setCurrentLevel(level);
    setCurrentSubject(validation.subject);
    setIsSyllabusTopic(Boolean(validation.matchedSyllabusSubtopic));
    setCurrentVideoId(null);
    setIsTeacherVerified(false);

    if (age) {
      setCurrentAge(age);
      updateStudentAge(age);
    } else {
      const typical = getTypicalAgeForClass(level);
      setCurrentAge(typical);
    }

    // If matches a preloaded verified topic
    if (PRELOADED_TOPICS[validation.conceptId]) {
      const bundle = PRELOADED_TOPICS[validation.conceptId];
      setCurrentVideoId(bundle.videoId);
      setIsTeacherVerified(bundle.isTeacherVerified);
    }

    setActiveView('mode_select');
  };

  // 2. From Door 2 (Browse by Class)
  const handleSelectSubtopic = (params: {
    subtopic: SyllabusSubtopic;
    chapter: SyllabusChapter;
    subject: string;
    classNum: number;
    age?: number;
  }) => {
    setStoryError(null);
    setCurrentTopicTitle(params.subtopic.title);
    setCurrentConceptId(params.subtopic.id);
    setCurrentLevel(`Class ${params.classNum}` as EducationLevel);
    setCurrentSubject(params.subject);
    setCurrentClassNum(params.classNum);
    setCurrentVideoId(params.subtopic.videoId);
    setIsSyllabusTopic(true);
    setIsTeacherVerified(Boolean(params.subtopic.videoId || PRELOADED_TOPICS[params.subtopic.id]));

    if (params.age) {
      setCurrentAge(params.age);
      updateStudentAge(params.age);
    } else {
      const typical = getTypicalAgeForClass(params.classNum);
      setCurrentAge(typical);
      updateStudentAge(typical);
    }

    setActiveView('mode_select');
  };

  // 3. Resume recent topic
  const handleResumeTopic = (conceptId: string, title: string, subject: string) => {
    setStoryError(null);
    setCurrentConceptId(conceptId);
    setCurrentTopicTitle(title);
    setCurrentSubject(subject);
    setIsSyllabusTopic(true);

    if (PRELOADED_TOPICS[conceptId]) {
      const bundle = PRELOADED_TOPICS[conceptId];
      setCurrentLevel(bundle.level as EducationLevel);
      setCurrentVideoId(bundle.videoId);
      setIsTeacherVerified(bundle.isTeacherVerified);
    }

    setActiveView('mode_select');
  };

  // 4. Mode Selection (Story / Video / Text)
  const handleSelectMode = async (mode: 'story' | 'video' | 'text') => {
    setStoryError(null);
    addRecentTopic(currentConceptId, currentTopicTitle, currentSubject, mode);

    if (mode === 'video') {
      setActiveView('video_player');
      return;
    }

    setIsLoadingContent(true);
    try {
      if (mode === 'text') {
        // Mode 3: Text Story
        const textStory = await fetchOrGenerateTextStoryFallback({
          topic: currentTopicTitle,
          conceptId: currentConceptId,
          level: currentLevel,
          classNum: currentClassNum,
          age: currentAge
        });
        setLoadedStory(textStory);
        setActiveView('text_story');
      } else {
        // Mode 1: Interactive Story
        const story = await fetchOrGenerateStory({
          topic: currentTopicTitle,
          conceptId: currentConceptId,
          level: currentLevel,
          classNum: currentClassNum,
          age: currentAge
        });
        setLoadedStory(story);
        setActiveView('story_player');
      }
    } catch (err: any) {
      console.error('Failed to load story:', err);
      // Surface clear on-screen error with retry and text-story fallback options
      setStoryError({
        message: err?.message || 'Could not connect to the AI story generator.',
        topic: currentTopicTitle
      });
    } finally {
      setIsLoadingContent(false);
    }
  };

  // 5. Fallback: Load Plain Text Story when interactive fails
  const handleLoadTextFallback = async () => {
    setStoryError(null);
    setIsLoadingContent(true);
    try {
      const fallbackTextStory = await fetchOrGenerateTextStoryFallback({
        topic: currentTopicTitle,
        conceptId: currentConceptId,
        level: currentLevel,
        classNum: currentClassNum,
        age: currentAge
      });
      setLoadedStory(fallbackTextStory);
      setActiveView('text_story');
    } catch (err: any) {
      console.error('Failed to load fallback text story:', err);
      setStoryError({
        message: 'Could not load text story: ' + (err?.message || 'Unknown error'),
        topic: currentTopicTitle
      });
    } finally {
      setIsLoadingContent(false);
    }
  };

  // 6. Proceed to Quiz Assessment
  const handleProceedToQuiz = async () => {
    setIsLoadingContent(true);
    try {
      const quiz = await fetchOrGenerateQuiz({
        topic: currentTopicTitle,
        conceptId: currentConceptId,
        level: currentLevel,
        classNum: currentClassNum,
        age: currentAge
      });
      setLoadedQuiz(quiz);
      setActiveView('quiz_player');
    } catch (err) {
      console.error('Failed to load quiz:', err);
    } finally {
      setIsLoadingContent(false);
    }
  };

  // 7. Submit Quiz Answers -> AI Analysis
  const handleSubmitQuizAnswers = async (answers: ChildAnswerRecord[]) => {
    if (!loadedQuiz) return;
    setIsSubmittingQuiz(true);
    try {
      const analysis = await analyzeAnswers({
        topic: currentTopicTitle,
        level: currentLevel,
        questions: loadedQuiz.questions,
        answers,
        age: currentAge
      });
      setQuizAnalysis(analysis);
      setActiveView('analysis_result');
    } catch (err) {
      console.error('Quiz analysis error:', err);
    } finally {
      setIsSubmittingQuiz(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950 via-slate-950 to-purple-950 selection:bg-amber-500 selection:text-slate-950 pb-20 md:pb-8 flex flex-col font-sans">
      {/* Global Navigation */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        onHomeClick={handleHomeClick}
      />

      {/* Main View Router */}
      <main className="flex-1">
        {/* Loading Overlay */}
        {isLoadingContent && (
          <div className="max-w-md mx-auto px-4 py-28 text-center space-y-6">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 animate-spin">
              <Loader2 className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white">
                Preparing Your Learning Experience...
              </h2>
              <p className="text-slate-400 text-sm">
                Adapting story scenes, interactive widgets, and curriculum questions for {currentLevel}!
              </p>
            </div>
          </div>
        )}

        {/* ON-SCREEN ERROR DISPLAY (Requirement 2 & 5) */}
        {!isLoadingContent && storyError && (
          <div className="max-w-2xl mx-auto px-4 py-16">
            <div className="bg-slate-900 border-2 border-rose-500/60 p-6 sm:p-8 rounded-3xl shadow-2xl space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-lg sm:text-xl font-bold text-white">
                    Could Not Generate Interactive Story
                  </h2>
                  <p className="text-slate-300 text-sm">
                    We ran into an issue while generating the interactive animated story for{' '}
                    <strong className="text-amber-400">"{storyError.topic}"</strong>.
                  </p>
                </div>
              </div>

              {/* Exact Error Detail Box */}
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono text-rose-300">
                <span className="font-bold text-slate-400">Error detail: </span>
                {storyError.message}
              </div>

              {/* Action Buttons: Retry vs Fallback Text Story */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={() => handleSelectMode('story')}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-md flex items-center gap-2 transition-all cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  Retry Interactive Story
                </button>

                <button
                  onClick={handleLoadTextFallback}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md flex items-center gap-2 transition-all cursor-pointer"
                >
                  <BookOpen className="w-4 h-4" />
                  Read Plain Text Story Instead
                </button>

                <button
                  onClick={() => {
                    setStoryError(null);
                    setActiveView('mode_select');
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Modes
                </button>
              </div>
            </div>
          </div>
        )}

        {!isLoadingContent && !storyError && (
          <>
            {/* VIEW: Home Screen */}
            {activeView === 'home' && (
              <HomeScreen
                onStartExploration={handleStartExploration}
                onOpenClassBrowser={(cNum) => {
                  if (cNum) setBrowserClassNum(cNum);
                  setCurrentTab('library');
                  setActiveView('library');
                }}
                onResumeTopic={handleResumeTopic}
              />
            )}

            {/* VIEW: Mode Selector */}
            {activeView === 'mode_select' && (
              <ModeSelector
                topicTitle={currentTopicTitle}
                subject={currentSubject}
                level={currentLevel}
                hasVideo={Boolean(currentVideoId)}
                isVerified={isTeacherVerified}
                onSelectMode={handleSelectMode}
                onBack={() => setActiveView('home')}
              />
            )}

            {/* VIEW: Mode 1 - Interactive Story Player */}
            {activeView === 'story_player' && loadedStory && (
              <StoryPlayer
                story={loadedStory}
                onCompleteToQuiz={handleProceedToQuiz}
                onBack={() => setActiveView('mode_select')}
              />
            )}

            {/* VIEW: Mode 2 - Watch & Explore Video Player */}
            {activeView === 'video_player' && (
              <VideoPlayerView
                topicTitle={currentTopicTitle}
                videoId={currentVideoId}
                onBack={() => setActiveView('mode_select')}
                onSwitchToStory={() => handleSelectMode('story')}
                onProceedToQuiz={handleProceedToQuiz}
              />
            )}

            {/* VIEW: Mode 3 - Text Story Reader */}
            {activeView === 'text_story' && loadedStory && (
              <TextStoryView
                story={loadedStory}
                onProceedToQuiz={handleProceedToQuiz}
                onBack={() => setActiveView('mode_select')}
                onSwitchToInteractive={() => handleSelectMode('story')}
              />
            )}

            {/* VIEW: Assessment Quiz Player */}
            {activeView === 'quiz_player' && loadedQuiz && (
              <QuizPlayer
                quiz={loadedQuiz}
                onSubmitAnswers={handleSubmitQuizAnswers}
                onBack={() => setActiveView('mode_select')}
                isSubmitting={isSubmittingQuiz}
              />
            )}

            {/* VIEW: AI Understanding Analysis & Mastery */}
            {activeView === 'analysis_result' && quizAnalysis && (
              <AnalysisResult
                analysis={quizAnalysis}
                topicTitle={currentTopicTitle}
                conceptId={currentConceptId}
                level={currentLevel}
                subject={currentSubject}
                isSyllabusTopic={isSyllabusTopic}
                age={currentAge}
                onHome={handleHomeClick}
                onExploreMore={(nextTopic) => {
                  handleStartExploration(
                    nextTopic,
                    currentLevel,
                    {
                      isValidLearningTopic: true,
                      subject: currentSubject as any,
                      isSafeForKids: true,
                      suggestedTitle: nextTopic,
                      conceptId: nextTopic.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                      alternativeSuggestions: []
                    },
                    currentAge
                  );
                }}
                onRetakeQuiz={handleProceedToQuiz}
              />
            )}

            {/* VIEW: Library Class Browser */}
            {activeView === 'library' && (
              <ClassBrowser
                initialClassNum={browserClassNum}
                onSelectSubtopic={handleSelectSubtopic}
                onBackToHome={handleHomeClick}
                onResumeTopic={handleResumeTopic}
              />
            )}

            {/* VIEW: Student Progress Dashboard */}
            {activeView === 'progress' && (
              <StudentDashboard
                onResumeTopic={handleResumeTopic}
                onExploreMore={() => {
                  setCurrentTab('explore');
                  setActiveView('home');
                }}
              />
            )}

            {/* VIEW: Parent & Teacher Portal */}
            {activeView === 'parents' && (
              <ParentDashboard
                onOpenAdminTool={() => setActiveView('admin')}
                onExit={handleHomeClick}
              />
            )}

            {/* VIEW: Admin Pre-Generate Tool */}
            {activeView === 'admin' && (
              <AdminPreGenerate
                onBack={() => setActiveView('parents')}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
