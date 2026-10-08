/**
 * @file apiClient.ts
 * Client-side interface to StoryLearn's server-side Gemini endpoints.
 * Never touches API keys directly; handles caching, robust error propagation,
 * and text-story fallback generation.
 */

import {
  TopicValidationResult,
  InteractiveStory,
  QuizData,
  UnderstandingAnalysis,
  CorrectiveStory,
  ChildAnswerRecord,
  EducationLevel,
  AgeBand,
  getAgeBand,
  getTypicalAgeForClass
} from '../types/learning';
import { PRELOADED_TOPICS } from '../data/preloadedContent';
import { getCachedStory, saveCachedStory, getCachedQuiz, saveCachedQuiz } from './storageService';

// Heuristic subject classifier for school topics as an offline / fallback safety net
function classifySubjectHeuristic(topic: string): TopicValidationResult['subject'] {
  const lower = topic.toLowerCase();

  const physicsKeywords = [
    'motion', 'speed', 'velocity', 'acceleration', 'force', 'gravity', 'gravitation',
    'inertia', 'friction', 'momentum', 'sound', 'light', 'mirror', 'lens', 'reflection',
    'refraction', 'heat', 'temperature', 'conduction', 'convection', 'radiation',
    'electricity', 'electric', 'circuit', 'current', 'magnet', 'work', 'energy',
    'pressure', 'buoyancy', 'thrust', 'density', 'newton', 'wave', 'optics'
  ];
  if (physicsKeywords.some((k) => lower.includes(k))) return 'Physics';

  const mathKeywords = [
    'integer', 'fraction', 'decimal', 'algebra', 'equation', 'linear equation',
    'triangle', 'pythagor', 'geometry', 'number', 'polynomial', 'congruen',
    'angle', 'line', 'coordinate', 'quadrilateral', 'circle', 'square root',
    'cube root', 'ratio', 'percentage', 'perimeter', 'area', 'volume', 'mensuration',
    'exponent', 'power', 'symmetry', 'graph', 'data handling', 'probability', 'statistics'
  ];
  if (mathKeywords.some((k) => lower.includes(k))) return 'Mathematics';

  const chemKeywords = [
    'acid', 'base', 'salt', 'chemical', 'indicator', 'litmus', 'turmeric',
    'reaction', 'rust', 'crystallisation', 'fibre', 'fabric', 'plastic', 'metal',
    'non-metal', 'matter', 'atom', 'molecule', 'combustion', 'flame', 'petroleum',
    'coal', 'solution', 'mixture', 'valency', 'compound', 'element'
  ];
  if (chemKeywords.some((k) => lower.includes(k))) return 'Chemistry';

  const bioKeywords = [
    'nutrition', 'photosynthesis', 'digestion', 'respiration', 'cell', 'tissue',
    'blood', 'heart', 'circulation', 'reproduction', 'flower', 'seed', 'pollination',
    'crop', 'harvest', 'microorganism', 'bacteria', 'fungi', 'virus', 'adolescence',
    'puberty', 'hormone', 'wildlife', 'animal', 'plant', 'vaccine'
  ];
  if (bioKeywords.some((k) => lower.includes(k))) return 'Biology';

  const envKeywords = [
    'season', 'weather', 'climate', 'wind', 'cyclone', 'storm', 'soil', 'water cycle',
    'forest', 'pollution', 'wastewater', 'conservation', 'global warming', 'greenhouse'
  ];
  if (envKeywords.some((k) => lower.includes(k))) return 'Environment';

  return 'Other';
}

// Fuzzy match against syllabus topics in local syllabus.json
export async function matchTopicWithSyllabus(query: string): Promise<TopicValidationResult['matchedSyllabusSubtopic'] | undefined> {
  try {
    const syllabusModule = await import('../data/syllabus.json');
    const syllabus = syllabusModule.default || syllabusModule;
    const cleanQuery = query.toLowerCase().trim();

    for (const c of syllabus.classes) {
      for (const subj of c.subjects) {
        if (subj.chapters) {
          for (const ch of subj.chapters) {
            for (const sub of ch.subtopics) {
              if (
                sub.title.toLowerCase().includes(cleanQuery) ||
                cleanQuery.includes(sub.title.toLowerCase()) ||
                ch.title.toLowerCase().includes(cleanQuery)
              ) {
                return {
                  classNum: c.class,
                  subjectName: subj.subject,
                  chapterTitle: ch.title,
                  subtopicTitle: sub.title,
                  subtopicId: sub.id
                };
              }
            }
          }
        }
        if (subj.branches) {
          for (const br of subj.branches) {
            for (const ch of br.chapters) {
              for (const sub of ch.subtopics) {
                if (
                  sub.title.toLowerCase().includes(cleanQuery) ||
                  cleanQuery.includes(sub.title.toLowerCase()) ||
                  ch.title.toLowerCase().includes(cleanQuery)
                ) {
                  return {
                    classNum: c.class,
                    subjectName: `${subj.subject} (${br.branch})`,
                    chapterTitle: ch.title,
                    subtopicTitle: sub.title,
                    subtopicId: sub.id
                  };
                }
              }
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn('Syllabus matching error:', err);
  }
  return undefined;
}

// 1. Topic Validation
export async function validateTopic(topic: string, level: EducationLevel, age?: number): Promise<TopicValidationResult> {
  const trimmed = topic.trim();
  const slug = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const ageBand = getAgeBand(age);

  const preloadedMatch = Object.values(PRELOADED_TOPICS).find(
    p => p.conceptId === slug || p.topicTitle.toLowerCase().includes(trimmed.toLowerCase())
  );

  const matchedSubtopic = await matchTopicWithSyllabus(trimmed);

  try {
    const res = await fetch('/api/validate-topic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic: trimmed, level, age, ageBand })
    });

    if (res.ok) {
      const data: TopicValidationResult = await res.json();
      if (matchedSubtopic && !data.matchedSyllabusSubtopic) {
        data.matchedSyllabusSubtopic = matchedSubtopic;
      }
      // Ensure "motion" or other known science topics are accurately categorized
      if (data.subject === 'Other' || !data.subject) {
        const heuristic = classifySubjectHeuristic(trimmed);
        if (heuristic !== 'Other') {
          data.subject = heuristic;
        }
      }
      return data;
    }
  } catch (err) {
    console.warn('Validation server call failed, using client heuristic:', err);
  }

  // Graceful client fallback
  const subject = classifySubjectHeuristic(trimmed);

  return {
    isValidLearningTopic: true,
    subject: preloadedMatch ? (preloadedMatch.subject as any) : subject,
    isSafeForKids: true,
    suggestedTitle: trimmed,
    conceptId: preloadedMatch ? preloadedMatch.conceptId : slug,
    suggestedBetterQuery: trimmed,
    alternativeSuggestions: [
      'Newton\'s laws of motion',
      'Why do we have seasons?',
      'Properties of integers'
    ],
    matchedSyllabusSubtopic: matchedSubtopic
  };
}

// 2. Fetch or Generate Interactive Story
export async function fetchOrGenerateStory(params: {
  topic: string;
  conceptId: string;
  level: EducationLevel;
  classNum?: number;
  chapterTitle?: string;
  subtopicTitle?: string;
  currentMastery?: number;
  age?: number;
  ageBand?: AgeBand;
}): Promise<InteractiveStory> {
  const { conceptId, level, topic, age } = params;
  const effectiveAge = age || (params.classNum ? getTypicalAgeForClass(params.classNum) : getTypicalAgeForClass(level));
  const effectiveBand = params.ageBand || getAgeBand(effectiveAge);

  // 1. Check Preloaded
  if (PRELOADED_TOPICS[conceptId]) {
    return PRELOADED_TOPICS[conceptId].story;
  }

  // 2. Check Storage Cache
  const cached = getCachedStory(conceptId, level, effectiveAge);
  if (cached) {
    return cached;
  }

  // 3. Request from Gemini API
  const res = await fetch('/api/generate-story', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...params,
      age: effectiveAge,
      ageBand: effectiveBand
    })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const errorMsg = errorData.error || `Server responded with status ${res.status}`;
    console.error(`[Story Generation Error] ${errorMsg}`);
    throw new Error(errorMsg);
  }

  const generated: InteractiveStory = await res.json();
  generated.targetAge = effectiveAge;
  generated.ageBand = effectiveBand;
  saveCachedStory(generated, effectiveAge);
  return generated;
}

// 3. Simple Fallback: Generate Plain Text Story (4 to 6 paragraphs)
export async function fetchOrGenerateTextStoryFallback(params: {
  topic: string;
  conceptId: string;
  level: EducationLevel;
  classNum?: number;
  chapterTitle?: string;
  subtopicTitle?: string;
  age?: number;
  ageBand?: AgeBand;
}): Promise<InteractiveStory> {
  const { topic, conceptId, level, classNum, age } = params;
  const effectiveAge = age || (classNum ? getTypicalAgeForClass(classNum) : getTypicalAgeForClass(level));
  const effectiveBand = params.ageBand || getAgeBand(effectiveAge);

  // Try server endpoint
  try {
    const res = await fetch('/api/generate-text-story', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...params,
        age: effectiveAge,
        ageBand: effectiveBand
      })
    });

    if (res.ok) {
      const data = await res.json();
      const storyObj: InteractiveStory = {
        title: data.title || `The Story of ${topic}`,
        concept: topic,
        conceptId: conceptId,
        level: level,
        targetAge: effectiveAge,
        ageBand: effectiveBand,
        subject: data.subject || classifySubjectHeuristic(topic),
        targetAgeGroup: `Ages ${effectiveBand} (${effectiveAge} years old)`,
        summary: data.summary || `A readable story explaining ${topic} step by step.`,
        isTeacherVerified: false,
        scenes: (data.paragraphs || []).map((para: string, idx: number) => ({
          sceneNumber: idx + 1,
          header: `Chapter ${idx + 1}`,
          text: para,
          visual: {
            type: 'illustration',
            illustrationPrompt: `${topic} illustration part ${idx + 1}`,
            emoji: ['🚀', '⚡', '🔬', '💡', '🌟', '🎯'][idx % 6],
            widget: {
              template: 'none',
              parameters: {
                explanation: idx === (data.paragraphs.length - 1) ? data.keyTakeaway : undefined
              }
            }
          }
        }))
      };
      saveCachedStory(storyObj, effectiveAge);
      return storyObj;
    }
  } catch (err) {
    console.warn('Text story generation endpoint error:', err);
  }

  // Deterministic 5-paragraph fallback adapted to class
  const subject = classifySubjectHeuristic(topic);
  const fallbackStory: InteractiveStory = {
    title: `Understanding ${topic}`,
    concept: topic,
    conceptId: conceptId,
    level: level,
    subject: subject,
    targetAgeGroup: `Students in ${level}`,
    summary: `A narrative journey into the fundamental principles of ${topic}, showing how it shapes everyday observations.`,
    isTeacherVerified: false,
    scenes: [
      {
        sceneNumber: 1,
        header: 'The Everyday Mystery',
        text: `Have you ever looked closely at how things work in the world around you? Whether you are watching a cricket ball soar across the field or observing water boiling in a kettle, nature constantly follows dependable laws. Today, we step into the captivating world of ${topic}.`,
        visual: {
          type: 'illustration',
          illustrationPrompt: `Students observing ${topic}`,
          emoji: '🔍',
          widget: { template: 'none', parameters: {} }
        }
      },
      {
        sceneNumber: 2,
        header: 'The Core Principle',
        text: `At its foundation, ${topic} describes a clear relationship between cause and effect. Scientists and mathematicians did not invent these rules—they observed patterns that happen the exact same way every single time under identical conditions. When you change one parameter, the outcome changes in a predictable manner.`,
        visual: {
          type: 'illustration',
          illustrationPrompt: `Diagram of ${topic}`,
          emoji: '⚡',
          widget: { template: 'none', parameters: {} }
        }
      },
      {
        sceneNumber: 3,
        header: 'A Real-Life Example',
        text: `Think of a train pulling out of a station. At first, everything appears calm, but as energy is applied, position shifts with respect to time. Similarly, ${topic} shows us that rather than memorizing complicated words, we can understand the world by noticing what stays constant and what changes.`,
        visual: {
          type: 'illustration',
          illustrationPrompt: `Real world example of ${topic}`,
          emoji: '🚄',
          widget: { template: 'none', parameters: {} }
        }
      },
      {
        sceneNumber: 4,
        header: 'Common Traps and Misconceptions',
        text: `Many students get confused when first studying ${topic} because everyday words sometimes mean something slightly different in textbooks. For example, people often confuse total distance with straight-line displacement, or force with velocity. By keeping the precise scientific definitions clear, you avoid the most common traps!`,
        visual: {
          type: 'illustration',
          illustrationPrompt: `Clarifying misconceptions`,
          emoji: '💡',
          widget: { template: 'none', parameters: {} }
        }
      },
      {
        sceneNumber: 5,
        header: 'The Big Takeaway',
        text: `Now that you have seen the core idea behind ${topic}, you have unlocked a new lens for viewing your surroundings. True understanding is not about memorizing lines—it is about seeing the pattern and predicting what comes next. You are ready to test your knowledge!`,
        visual: {
          type: 'illustration',
          illustrationPrompt: `Student mastering the concept`,
          emoji: '🏆',
          widget: {
            template: 'none',
            parameters: {
              explanation: `Key takeaway: ${topic} is governed by consistent physical and mathematical relationships.`
            }
          }
        }
      }
    ]
  };

  saveCachedStory(fallbackStory);
  return fallbackStory;
}

// 4. Fetch or Generate Quiz
export async function fetchOrGenerateQuiz(params: {
  topic: string;
  conceptId: string;
  level: EducationLevel;
  classNum?: number;
  subtopicTitle?: string;
  age?: number;
  ageBand?: AgeBand;
}): Promise<QuizData> {
  const { conceptId, level, topic, age } = params;
  const effectiveAge = age || (params.classNum ? getTypicalAgeForClass(params.classNum) : getTypicalAgeForClass(level));
  const effectiveBand = params.ageBand || getAgeBand(effectiveAge);

  if (PRELOADED_TOPICS[conceptId]) {
    return PRELOADED_TOPICS[conceptId].quiz;
  }

  const cached = getCachedQuiz(conceptId, level, effectiveAge);
  if (cached) {
    return cached;
  }

  try {
    const res = await fetch('/api/generate-quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...params,
        age: effectiveAge,
        ageBand: effectiveBand
      })
    });

    if (res.ok) {
      const quiz: QuizData = await res.json();
      quiz.targetAge = effectiveAge;
      quiz.ageBand = effectiveBand;
      saveCachedQuiz(quiz, effectiveAge);
      return quiz;
    }
  } catch (err) {
    console.warn('Gemini quiz generation failed, using robust fallback:', err);
  }

  // Adaptive question set based on age band
  const allDefaultQuestions = [
    {
      id: 'q1',
      type: 'multiple_choice' as const,
      prompt: `Which of the following statements best describes the core idea of ${topic}?`,
      options: [
        `It operates under consistent, dependable rules`,
        `It changes completely at random without reason`,
        `It only happens in giant laboratories`
      ],
      correctAnswer: `It operates under consistent, dependable rules`,
      misconceptionTarget: `Believing ${topic} is arbitrary rather than rule-based`,
      rubric: `Demonstrates understanding that natural principles apply uniformly.`
    },
    {
      id: 'q2',
      type: 'prediction' as const,
      prompt: `What happens when you change the main action in ${topic}?`,
      options: [
        `The outcome changes in a clear, predictable way`,
        `Nothing will ever change`,
        `The principle disappears entirely`
      ],
      correctAnswer: `The outcome changes in a clear, predictable way`,
      misconceptionTarget: `Assuming inputs have zero effect on outcomes`,
      rubric: `Shows cause-and-effect reasoning.`
    },
    {
      id: 'q3',
      type: 'in_your_own_words' as const,
      prompt: `In one sentence, tell what you learned about ${topic}:`,
      acceptableKeywords: ['nature', 'works', 'pattern', 'helps', 'world', 'rule', 'learn'],
      misconceptionTarget: `Difficulty articulating the main takeaway`,
      rubric: `Articulates conceptual value in own words.`
    },
    {
      id: 'q4',
      type: 'application' as const,
      prompt: `Where in daily life can you see ${topic} in action?`,
      options: [
        `In games, transport, cooking, or nature around us`,
        `Only in deep outer space`,
        `Nowhere on Earth`
      ],
      correctAnswer: `In games, transport, cooking, or nature around us`,
      misconceptionTarget: `Disconnecting concepts from real life`,
      rubric: `Relates knowledge to concrete daily phenomena.`
    },
    {
      id: 'q5',
      type: 'short_answer' as const,
      prompt: `What standard measurement or quantity is essential when analyzing ${topic}?`,
      acceptableKeywords: ['unit', 'standard', 'magnitude', 'meter', 'second', 'ratio', 'value'],
      misconceptionTarget: `Not recalling standard terminology`,
      rubric: `Identification of measurement parameters.`
    }
  ];

  let selectedQuestions = allDefaultQuestions;
  if (effectiveBand === '5-7') {
    // 3 questions: 2 multiple choice, 1 own words
    selectedQuestions = [allDefaultQuestions[0], allDefaultQuestions[1], allDefaultQuestions[2]];
  } else if (effectiveBand === '8-10') {
    // 4 questions
    selectedQuestions = [allDefaultQuestions[0], allDefaultQuestions[1], allDefaultQuestions[3], allDefaultQuestions[2]];
  }

  const fallbackQuiz: QuizData = {
    topic,
    conceptId,
    level,
    targetAge: effectiveAge,
    ageBand: effectiveBand,
    questions: selectedQuestions
  };

  saveCachedQuiz(fallbackQuiz, effectiveAge);
  return fallbackQuiz;
}

// 5. Analyze Answers
export async function analyzeAnswers(params: {
  topic: string;
  level: EducationLevel;
  questions: any[];
  answers: ChildAnswerRecord[];
  age?: number;
  ageBand?: AgeBand;
}): Promise<UnderstandingAnalysis> {
  const effectiveAge = params.age || getTypicalAgeForClass(params.level);
  const effectiveBand = params.ageBand || getAgeBand(effectiveAge);

  try {
    const res = await fetch('/api/analyze-answers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...params,
        age: effectiveAge,
        ageBand: effectiveBand
      })
    });

    if (res.ok) {
      const analysis: UnderstandingAnalysis = await res.json();
      analysis.evaluatedAt = new Date().toISOString();
      return analysis;
    }
  } catch (err) {
    console.warn('AI answer analysis failed, using expert rule-based evaluation:', err);
  }

  // Rule-based fallback
  let correctCount = 0;
  const misconceptionsDetected: Array<{ description: string; evidence: string }> = [];

  params.answers.forEach((ans, idx) => {
    const q = params.questions[idx];
    if (q) {
      if (q.correctAnswer && ans.childAnswer === q.correctAnswer) {
        correctCount += 1;
      } else if (q.acceptableKeywords && q.acceptableKeywords.some((kw: string) => ans.childAnswer.toLowerCase().includes(kw))) {
        correctCount += 1;
      } else {
        misconceptionsDetected.push({
          description: q.misconceptionTarget || `Misconception on question ${idx + 1}`,
          evidence: `Learner answered: "${ans.childAnswer}"`
        });
      }
    }
  });

  const percentage = Math.round((correctCount / Math.max(1, params.answers.length)) * 100);

  return {
    conceptScores: [{ concept: params.topic, score: percentage }],
    misconceptions: misconceptionsDetected,
    strengths: [
      'Showed active problem-solving curiosity',
      'Engaged thoughtfully with conceptual questions'
    ],
    feedbackForChild:
      percentage >= 70
        ? `Superb work! You really understood the core ideas behind ${params.topic}. Keep exploring!`
        : `Great effort! You are making great progress with ${params.topic}. Let's look at one key trick to master it completely!`,
    nextStep: {
      type: percentage < 70 ? 'corrective_story' : 'move_on',
      title: percentage < 70 ? 'Corrective Story: A Deeper Look' : 'Next Adventure',
      content:
        percentage < 70
          ? `Let's see a short story that clears up: ${misconceptionsDetected[0]?.description || 'this concept'}`
          : `You are ready to advance to more challenging subtopics!`
    },
    recommendedNextTopics: [
      'Newton\'s laws of motion',
      'Energy conservation in daily life',
      'Atmospheric pressure mysteries'
    ],
    overallMastery: percentage,
    evaluatedAt: new Date().toISOString()
  };
}

// 6. Corrective Story
export async function fetchOrGenerateCorrective(params: {
  topic: string;
  conceptId: string;
  level: EducationLevel;
  misconception: string;
  childAnswer?: string;
  age?: number;
  ageBand?: AgeBand;
}): Promise<CorrectiveStory> {
  const { conceptId, level, age } = params;
  const effectiveAge = age || getTypicalAgeForClass(level);
  const effectiveBand = params.ageBand || getAgeBand(effectiveAge);

  if (PRELOADED_TOPICS[conceptId]?.corrective) {
    return PRELOADED_TOPICS[conceptId].corrective;
  }

  try {
    const res = await fetch('/api/generate-corrective', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...params,
        age: effectiveAge,
        ageBand: effectiveBand
      })
    });

    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Corrective generation failed, using intuitive fallback:', err);
  }

  return {
    title: `The Flashlight Trick: Understanding ${params.topic}`,
    concept: params.topic,
    targetedMisconception: params.misconception,
    scenes: [
      {
        header: 'The Everyday Lightbulb Moment',
        text: `Think of a common misconception like: "${params.misconception}". At first glance it seems tempting, but notice what happens when you look at how nature truly operates.`,
        visualEmoji: '💡'
      },
      {
        header: 'Seeing the Rule in Action',
        text: `When we remove the extra noise, the rule stands out clearly. You don't have to guess—the physical law works consistently every single time!`,
        visualEmoji: '🎯'
      }
    ],
    takeaway: `Always look at the underlying cause rather than superficial appearances!`,
    recheckQuestions: [
      {
        prompt: `Based on this new way of seeing ${params.topic}, what is the correct principle?`,
        options: [
          `The principle applies consistently based on fundamental physical law`,
          `It changes depending on arbitrary luck`
        ],
        correctAnswer: `The principle applies consistently based on fundamental physical law`,
        explanation: `Fundamental laws are universal and dependable.`
      }
    ]
  };
}
