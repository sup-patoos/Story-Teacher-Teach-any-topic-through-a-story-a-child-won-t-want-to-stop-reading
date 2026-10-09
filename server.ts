import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { executeAiCallWithRetry, sanitizeInput } from './src/services/aiHandler';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// Validate and limit JSON body size to prevent payload denial of service
app.use(express.json({ limit: '500kb' }));

// Initialize GoogleGenAI with telemetry User-Agent header as required
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Helper: determine if Gemini is configured
const hasValidApiKey = Boolean(apiKey && apiKey !== 'MY_GEMINI_API_KEY');

// List of Flash models to try in order of resilience
const FLASH_MODELS = ['gemini-3.1-flash-lite', 'gemini-3.8-flash'];

// In-memory rate limiting for AI endpoints: max 60 requests/minute per client IP
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_MINUTE = 60;
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function apiRateLimiter(req: express.Request, res: express.Response, next: express.NextFunction) {
  const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown-client';
  const now = Date.now();
  const clientRecord = rateLimitMap.get(ip);

  if (!clientRecord || now > clientRecord.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return next();
  }

  if (clientRecord.count >= MAX_REQUESTS_PER_MINUTE) {
    return res.status(429).json({
      error: 'Too many requests. Please wait a moment before trying again.',
      status: 429
    });
  }

  clientRecord.count += 1;
  next();
}

app.use('/api', apiRateLimiter);

/**
 * Helper to call Gemini with Gemini Flash, JSON response schema,
 * automatic retry, and exact error logging to console.
 */
async function callGeminiFlashWithJsonRetry(
  endpointName: string,
  contents: string,
  systemInstruction: string,
  responseSchema: any
): Promise<any> {
  let lastError: any = null;

  // Try across available Flash models and retry on transient failures
  for (const model of FLASH_MODELS) {
    try {
      return await executeAiCallWithRetry(
        async () => {
          const response = await ai.models.generateContent({
            model: model,
            contents: contents,
            config: {
              systemInstruction: systemInstruction,
              responseMimeType: 'application/json',
              responseSchema: responseSchema,
            },
          });
          return { text: response.text };
        },
        {
          maxRetries: 1,
          initialBackoffMs: 800,
          logError: (msg) => {
            console.error(`[Gemini API Warning] ${endpointName} | Model: ${model} | ${msg}`);
          }
        }
      );
    } catch (err: any) {
      lastError = err;
      const statusCode = err?.status || err?.code || 500;
      const message = err?.message || String(err);
      console.error(
        `[Gemini API Error] ${endpointName} | Model: ${model} | Status: ${statusCode} | Message: ${message}`
      );
    }
  }

  throw lastError || new Error('All Gemini Flash attempts failed');
}

/**
 * Heuristic subject classifier for school topics as a reliable safety net
 */
function classifySubjectHeuristic(topic: string): 'Mathematics' | 'Physics' | 'Chemistry' | 'Biology' | 'Environment' | 'Other' {
  const lower = topic.toLowerCase();

  // Physics
  const physicsKeywords = [
    'motion', 'speed', 'velocity', 'acceleration', 'force', 'gravity', 'gravitation',
    'inertia', 'friction', 'momentum', 'sound', 'light', 'mirror', 'lens', 'reflection',
    'refraction', 'heat', 'temperature', 'conduction', 'convection', 'radiation',
    'electricity', 'electric', 'circuit', 'current', 'magnet', 'work', 'energy',
    'pressure', 'buoyancy', 'thrust', 'density', 'newton', 'wave', 'optics'
  ];
  if (physicsKeywords.some((k) => lower.includes(k))) return 'Physics';

  // Mathematics
  const mathKeywords = [
    'integer', 'fraction', 'decimal', 'algebra', 'equation', 'linear equation',
    'triangle', 'pythagor', 'geometry', 'number', 'polynomial', 'congruen',
    'angle', 'line', 'coordinate', 'quadrilateral', 'circle', 'square root',
    'cube root', 'ratio', 'percentage', 'perimeter', 'area', 'volume', 'mensuration',
    'exponent', 'power', 'symmetry', 'graph', 'data handling', 'probability', 'statistics'
  ];
  if (mathKeywords.some((k) => lower.includes(k))) return 'Mathematics';

  // Chemistry
  const chemKeywords = [
    'acid', 'base', 'salt', 'chemical', 'indicator', 'litmus', 'turmeric',
    'reaction', 'rust', 'crystallisation', 'fibre', 'fabric', 'plastic', 'metal',
    'non-metal', 'matter', 'atom', 'molecule', 'combustion', 'flame', 'petroleum',
    'coal', 'solution', 'mixture', 'valency', 'compound', 'element'
  ];
  if (chemKeywords.some((k) => lower.includes(k))) return 'Chemistry';

  // Biology
  const bioKeywords = [
    'nutrition', 'photosynthesis', 'digestion', 'respiration', 'cell', 'tissue',
    'blood', 'heart', 'circulation', 'reproduction', 'flower', 'seed', 'pollination',
    'crop', 'harvest', 'microorganism', 'bacteria', 'fungi', 'virus', 'adolescence',
    'puberty', 'hormone', 'wildlife', 'animal', 'plant', 'vaccine'
  ];
  if (bioKeywords.some((k) => lower.includes(k))) return 'Biology';

  // Environment
  const envKeywords = [
    'season', 'weather', 'climate', 'wind', 'cyclone', 'storm', 'soil', 'water cycle',
    'forest', 'pollution', 'wastewater', 'conservation', 'global warming', 'greenhouse'
  ];
  if (envKeywords.some((k) => lower.includes(k))) return 'Environment';

  return 'Other';
}

/**
 * Age band mapping helper
 */
function getAgeBand(age?: number): '5-7' | '8-10' | '11-13' | '14-16' {
  if (!age || isNaN(age)) return '11-13';
  if (age <= 7) return '5-7';
  if (age <= 10) return '8-10';
  if (age <= 13) return '11-13';
  return '14-16';
}

function getTypicalAgeForClass(classNum?: number | string): number {
  const num = typeof classNum === 'string' ? parseInt(classNum.replace(/\D/g, ''), 10) : classNum;
  switch (num) {
    case 5: return 10;
    case 6: return 11;
    case 7: return 12;
    case 8: return 13;
    case 9: return 14;
    case 10: return 15;
    default: return 13;
  }
}

// ----------------------------------------------------
// 1. POST /api/validate-topic
// ----------------------------------------------------
app.post('/api/validate-topic', async (req, res) => {
  const { topic, level = 'Class 8', age, ageBand } = req.body || {};
  const cleanTopic = sanitizeInput(topic, 200);
  if (!cleanTopic) {
    return res.status(400).json({ error: 'Valid topic string is required (up to 200 characters)' });
  }

  const effectiveAge = age ? Number(age) : getTypicalAgeForClass(level);
  const effectiveAgeBand = ageBand || getAgeBand(effectiveAge);

  if (!hasValidApiKey) {
    console.warn('[Gemini Warning] process.env.GEMINI_API_KEY is not configured or empty');
    const slug = cleanTopic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const subject = classifySubjectHeuristic(cleanTopic);
    return res.json({
      isValidLearningTopic: true,
      subject: subject,
      isSafeForKids: true,
      suggestedTitle: cleanTopic,
      conceptId: slug || 'curiosity-concept',
      suggestedBetterQuery: cleanTopic,
      alternativeSuggestions: ["Newton's laws of motion", "Why do we have seasons?", "Photosynthesis in plants"]
    });
  }

  const schema = {
    type: Type.OBJECT,
    properties: {
      isValidLearningTopic: { type: Type.BOOLEAN },
      subject: {
        type: Type.STRING,
        description: "Strictly one of: Mathematics, Physics, Chemistry, Biology, Environment, Other"
      },
      isSafeForKids: { type: Type.BOOLEAN },
      suggestedTitle: { type: Type.STRING },
      conceptId: { type: Type.STRING, description: "lowercase-hyphen slug" },
      suggestedBetterQuery: { type: Type.STRING },
      refusalReason: { type: Type.STRING },
      alternativeSuggestions: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    },
    required: [
      'isValidLearningTopic',
      'subject',
      'isSafeForKids',
      'suggestedTitle',
      'conceptId',
      'alternativeSuggestions'
    ]
  };

  const systemInstruction = `You are an educational curriculum analyzer for school students and curious learners.
Learner profile: Age ${effectiveAge} (Age Band: ${effectiveAgeBand}), level: ${level}.
Evaluate if the query is a genuine, safe learning topic.
IMPORTANT SUBJECT RULES:
- Topics about motion, velocity, speed, acceleration, force, gravity, friction, light, sound, heat, electricity, work, energy MUST be classified as "Physics".
- Topics about numbers, fractions, equations, algebra, triangles, geometry MUST be classified as "Mathematics".
- Topics about acids, bases, chemical reactions, atoms, molecules, metals, rust MUST be classified as "Chemistry".
- Topics about cells, tissues, plants, animals, digestion, reproduction, vaccines MUST be classified as "Biology".
- Topics about weather, climate, seasons, pollution, soil, water cycle MUST be classified as "Environment".
Always return clean JSON following the schema.`;

  try {
    const parsed = await callGeminiFlashWithJsonRetry(
      'POST /api/validate-topic',
      `Validate this learning topic for student (${level}, Age ${effectiveAge}, Band ${effectiveAgeBand}): "${cleanTopic}". Determine the exact subject.`,
      systemInstruction,
      schema
    );

    // Ensure subject is never incorrectly 'Other' if a known heuristic matches
    if (parsed.subject === 'Other' || !parsed.subject) {
      const heuristic = classifySubjectHeuristic(cleanTopic);
      if (heuristic !== 'Other') {
        parsed.subject = heuristic;
      }
    }

    return res.json(parsed);
  } catch (error: any) {
    const status = error?.status || error?.code || 500;
    console.error(`[Gemini API Fatal Error] /api/validate-topic: Status: ${status}, Message: ${error?.message || error}`);

    const fallbackSlug = cleanTopic.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const heuristicSubject = classifySubjectHeuristic(cleanTopic);

    return res.json({
      isValidLearningTopic: true,
      subject: heuristicSubject,
      isSafeForKids: true,
      suggestedTitle: cleanTopic,
      conceptId: fallbackSlug,
      alternativeSuggestions: ["Laws of Motion", "Why do we have seasons?", "Pythagoras theorem"]
    });
  }
});

// ----------------------------------------------------
// 2. POST /api/generate-story (Interactive Story)
// ----------------------------------------------------
app.post('/api/generate-story', async (req, res) => {
  const {
    topic,
    conceptId,
    level = 'Class 8',
    classNum,
    chapterTitle = '',
    subtopicTitle = '',
    currentMastery = 50,
    age,
    ageBand
  } = req.body || {};

  const cleanTopic = sanitizeInput(topic, 300);
  if (!cleanTopic) {
    return res.status(400).json({ error: 'Valid topic is required (up to 300 characters)' });
  }

  const cleanChapter = sanitizeInput(chapterTitle, 200);
  const cleanSubtopic = sanitizeInput(subtopicTitle, 200);
  const cleanConceptId = sanitizeInput(conceptId, 100);

  const effectiveAge = age ? Number(age) : getTypicalAgeForClass(classNum || level);
  const effectiveAgeBand = ageBand || getAgeBand(effectiveAge);

  if (!hasValidApiKey) {
    console.error('[Gemini API Error] /api/generate-story: Status: 503, Message: process.env.GEMINI_API_KEY is not configured or empty');
    return res.status(503).json({
      error: 'Gemini API Key is not configured on the server. Please configure GEMINI_API_KEY in Secrets.',
      status: 503
    });
  }

  // Exact age band instructions tailored to cognitive stages
  let ageBandSpecificInstructions = '';
  if (effectiveAgeBand === '5-7') {
    ageBandSpecificInstructions = `
AGE BAND (5-7) RULES - CRITICAL:
- Sentences: VERY SHORT sentences strictly 6 to 10 words each.
- Context: Familiar objects (toys, animals, food, family, pets, playground, bedtime).
- Tone & Style: Repetition, gentle humour, warmth, exactly ONE simple core idea.
- Structure: Exactly 3 to 4 scenes, 40 to 70 words per scene. Total words: 150-250.
- ABSOLUTELY NO formulas, NO scientific jargon. Everything explained through tangible play.
- Interactive moments: Very simple multiple-choice questions or picture-like choices with friendly emojis.`;
  } else if (effectiveAgeBand === '8-10') {
    ageBandSpecificInstructions = `
AGE BAND (8-10) RULES - CRITICAL:
- Reasoning: Simple, clear cause-and-effect thinking.
- Context: Relatable home, school, games, and playground situations.
- Vocabulary: Basic terms introduced and immediately explained in plain, friendly everyday words.
- Structure: Exactly 4 to 5 scenes, 50 to 80 words per scene. Total words: 220-350.
- Interactive moments: Simple predictions of what will happen next.`;
  } else if (effectiveAgeBand === '11-13') {
    ageBandSpecificInstructions = `
AGE BAND (11-13) RULES - CRITICAL:
- Plot style: Adventure or mystery plots with detective curiosity, "why" and "what if" reasoning.
- Vocabulary: Proper terminology with relatable analogies and intuitive explanations.
- Quantitative: Simple numbers, measurements, and comparison ratios.
- Structure: Exactly 5 to 6 scenes, 60 to 90 words per scene. Total words: 300-450.
- Interactive moments: Choices or sliders that test cause-and-effect reasoning.`;
  } else {
    // 14-16
    ageBandSpecificInstructions = `
AGE BAND (14-16) RULES - CRITICAL:
- Reasoning: Conceptual abstraction, multi-step deductive reasoning, and physical intuition.
- Terminology: Precise scientific and mathematical terminology (aligned with NCERT Classes 9-10).
- Formulas: Introduce formulas and calculations where the topic naturally uses them (e.g., equations of motion, energy conservation).
- Structure: Exactly 5 to 6 scenes, 70 to 100 words per scene. Total words: 350-500.
- Interactive moments: Application scenarios, parameter variations, and quantitative predictions.`;
  }

  const levelPromptModifier = `
Learner Profile: ${effectiveAge} years old (Age Band: ${effectiveAgeBand}), Level: ${level}. Current concept mastery: ${currentMastery}%.
${ageBandSpecificInstructions}
- Set the story in relatable Indian settings (schools, cricket, kitchen, monsoon, train journeys, festivals, bustling markets) with relatable names (Aarav, Kabir, Diya, Riya, Rohan, Uncle Vikram).
- Concept must be woven into the plot: characters MUST solve an obstacle using the concept. Never lecture!
- In 2 or 3 scenes, include an interactive moment ("choice", "predict", "question", or "slider") with clear options, correct answer, and warm immediate reaction.
- Assign a visual widget to each scene from: 'slider', 'graph', 'numberline', 'dragdrop', 'pie', 'none'. Include widget parameters.
`;

  const schema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      concept: { type: Type.STRING },
      conceptId: { type: Type.STRING },
      level: { type: Type.STRING },
      subject: { type: Type.STRING },
      targetAgeGroup: { type: Type.STRING },
      summary: { type: Type.STRING },
      scenes: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            sceneNumber: { type: Type.INTEGER },
            header: { type: Type.STRING },
            text: { type: Type.STRING },
            visual: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING, description: "illustration, widget, or both" },
                illustrationPrompt: { type: Type.STRING },
                emoji: { type: Type.STRING },
                widget: {
                  type: Type.OBJECT,
                  properties: {
                    template: {
                      type: Type.STRING,
                      description: "slider, graph, numberline, dragdrop, pie, or none"
                    },
                    parameters: {
                      type: Type.OBJECT,
                      properties: {
                        label: { type: Type.STRING },
                        unit: { type: Type.STRING },
                        min: { type: Type.NUMBER },
                        max: { type: Type.NUMBER },
                        defaultValue: { type: Type.NUMBER },
                        step: { type: Type.NUMBER },
                        xAxisLabel: { type: Type.STRING },
                        yAxisLabel: { type: Type.STRING },
                        explanation: { type: Type.STRING }
                      }
                    }
                  },
                  required: ['template', 'parameters']
                }
              },
              required: ['type', 'illustrationPrompt', 'emoji', 'widget']
            },
            interaction: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING, description: "choice, predict, question, or slider" },
                prompt: { type: Type.STRING },
                options: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                correctAnswer: { type: Type.STRING },
                explanation: { type: Type.STRING },
                reactionCorrect: { type: Type.STRING },
                reactionIncorrect: { type: Type.STRING }
              },
              required: [
                'type',
                'prompt',
                'options',
                'correctAnswer',
                'explanation',
                'reactionCorrect',
                'reactionIncorrect'
              ]
            }
          },
          required: ['sceneNumber', 'header', 'text', 'visual']
        }
      }
    },
    required: [
      'title',
      'concept',
      'conceptId',
      'level',
      'subject',
      'targetAgeGroup',
      'summary',
      'scenes'
    ]
  };

  const systemInstruction = `You are an expert children's educational author and curriculum designer specializing in NCERT STEM education.
You turn difficult science and maths concepts into unforgettable, heartwarming interactive adventures.
Always output pure structured JSON conforming strictly to the response schema.`;

  try {
    const parsed = await callGeminiFlashWithJsonRetry(
      'POST /api/generate-story',
      `Create an interactive learning story for:
Topic: "${cleanTopic}"
Concept ID: "${cleanConceptId || 'concept'}"
Syllabus Context: Chapter "${cleanChapter}", Subtopic "${cleanSubtopic}", Class ${classNum || level}.
${levelPromptModifier}`,
      systemInstruction,
      schema
    );

    return res.json(parsed);
  } catch (error: any) {
    const status = error?.status || error?.code || 500;
    const message = error?.message || String(error);
    console.error(`[Gemini API Fatal Error] /api/generate-story: Status: ${status}, Message: ${message}`);
    return res.status(status).json({
      error: 'Unable to generate interactive story at this time. Please try again.',
      status: status
    });
  }
});

// ----------------------------------------------------
// 3. POST /api/generate-text-story (Plain Text Story Fallback)
// ----------------------------------------------------
app.post('/api/generate-text-story', async (req, res) => {
  const { topic, level = 'Class 8', classNum, age, ageBand } = req.body || {};

  const cleanTopic = sanitizeInput(topic, 300);
  if (!cleanTopic) {
    return res.status(400).json({ error: 'Valid topic is required (up to 300 characters)' });
  }

  const effectiveAge = age ? Number(age) : getTypicalAgeForClass(classNum || level);
  const effectiveAgeBand = ageBand || getAgeBand(effectiveAge);

  if (!hasValidApiKey) {
    console.error('[Gemini API Error] /api/generate-text-story: Status: 503, Message: process.env.GEMINI_API_KEY is not configured');
    return res.status(503).json({
      error: 'Gemini API Key is not configured on the server.',
      status: 503
    });
  }

  const schema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      concept: { type: Type.STRING },
      level: { type: Type.STRING },
      subject: { type: Type.STRING },
      summary: { type: Type.STRING },
      paragraphs: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "3 to 6 short, engaging narrative paragraphs adapted to the child's age"
      },
      keyTakeaway: { type: Type.STRING }
    },
    required: ['title', 'concept', 'level', 'subject', 'summary', 'paragraphs', 'keyTakeaway']
  };

  const systemInstruction = `You are an educational storyteller for children.
Learner is ${effectiveAge} years old (Age Band: ${effectiveAgeBand}).
Adapt vocabulary, sentences, and examples to this exact age group:
- Ages 5-7: very short sentences, playful tone, 3-4 short paragraphs, familiar toys/pets/play.
- Ages 8-10: clear cause and effect, relatable school and home situations, 4 short paragraphs.
- Ages 11-13: mystery or adventure curiosity, 'why' reasoning, 4-5 paragraphs.
- Ages 14-16: precise terminology, conceptual principles, 5 paragraphs.
Include everyday Indian relatable examples and dialogue.`;

  try {
    const parsed = await callGeminiFlashWithJsonRetry(
      'POST /api/generate-text-story',
      `Write an engaging educational narrative story explaining: "${cleanTopic}" for age ${effectiveAge} (Band: ${effectiveAgeBand}, ${level}).`,
      systemInstruction,
      schema
    );

    return res.json(parsed);
  } catch (error: any) {
    const status = error?.status || error?.code || 500;
    const message = error?.message || String(error);
    console.error(`[Gemini API Fatal Error] /api/generate-text-story: Status: ${status}, Message: ${message}`);
    return res.status(status).json({
      error: 'Unable to generate story summary at this time. Please try again.',
      status: status
    });
  }
});

// ----------------------------------------------------
// 4. POST /api/generate-quiz
// ----------------------------------------------------
app.post('/api/generate-quiz', async (req, res) => {
  const { topic, conceptId, level = 'Class 8', classNum, subtopicTitle = '', age, ageBand } = req.body || {};

  const cleanTopic = sanitizeInput(topic, 300);
  if (!cleanTopic) {
    return res.status(400).json({ error: 'Valid topic is required (up to 300 characters)' });
  }

  const cleanSubtopic = sanitizeInput(subtopicTitle, 200);
  const cleanConceptId = sanitizeInput(conceptId, 100);

  const effectiveAge = age ? Number(age) : getTypicalAgeForClass(classNum || level);
  const effectiveAgeBand = ageBand || getAgeBand(effectiveAge);

  if (!hasValidApiKey) {
    console.error('[Gemini API Error] /api/generate-quiz: Status: 503, Message: process.env.GEMINI_API_KEY is not configured');
    return res.status(503).json({ error: 'Gemini API Key is not configured on server', status: 503 });
  }

  const schema = {
    type: Type.OBJECT,
    properties: {
      topic: { type: Type.STRING },
      conceptId: { type: Type.STRING },
      level: { type: Type.STRING },
      questions: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            type: {
              type: Type.STRING,
              description: "multiple_choice, prediction, application, short_answer, or in_your_own_words"
            },
            prompt: { type: Type.STRING },
            options: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            correctAnswer: { type: Type.STRING },
            acceptableKeywords: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            misconceptionTarget: { type: Type.STRING },
            rubric: { type: Type.STRING },
            hint: { type: Type.STRING }
          },
          required: ['id', 'type', 'prompt', 'misconceptionTarget', 'rubric']
        }
      }
    },
    required: ['topic', 'conceptId', 'level', 'questions']
  };

  let targetQuestionCount = 5;
  let quizInstructions = '';
  if (effectiveAgeBand === '5-7') {
    targetQuestionCount = 3;
    quizInstructions = `
AGE 5-7 QUIZ REQUIREMENTS:
- Exactly 3 questions total.
- Question 1: Simple multiple choice with familiar objects / pictures (or emojis).
- Question 2: Another simple choice / prediction.
- Question 3: An "explain in a sentence" question (in_your_own_words).
- Very gentle, encouraging language, no confusing traps.`;
  } else if (effectiveAgeBand === '8-10') {
    targetQuestionCount = 4;
    quizInstructions = `
AGE 8-10 QUIZ REQUIREMENTS:
- Exactly 4 questions total.
- Mix: 2 multiple choice, 1 cause-and-effect prediction ("What will happen if...?"), 1 simple application/own words question.`;
  } else if (effectiveAgeBand === '11-13') {
    targetQuestionCount = 5;
    quizInstructions = `
AGE 11-13 QUIZ REQUIREMENTS:
- Exactly 5 questions total.
- 1 multiple choice, 1 prediction, 1 application, 1 short answer, 1 'explain in your own words'.
- Probes 'why' and exposes common intuitive misconceptions.`;
  } else {
    // 14-16
    targetQuestionCount = 5;
    quizInstructions = `
AGE 14-16 QUIZ REQUIREMENTS:
- Exactly 5 questions total.
- Probes conceptual rigour, multi-step deduction, and higher application of formulas/principles.
- Exposes common high-school conceptual traps.`;
  }

  const systemInstruction = `You are an expert diagnostic test maker for school science and mathematics.
Learner profile: ${effectiveAge} years old (Age Band: ${effectiveAgeBand}).
${quizInstructions}
At least one question MUST expose a common misconception! Return pure JSON.`;

  try {
    const parsed = await callGeminiFlashWithJsonRetry(
      'POST /api/generate-quiz',
      `Generate a ${targetQuestionCount}-question diagnostic quiz for: Topic: "${cleanTopic}" (${level}, Age ${effectiveAge}, Band ${effectiveAgeBand}). Subtopic: "${cleanSubtopic}". Concept: "${cleanConceptId}".`,
      systemInstruction,
      schema
    );
    return res.json(parsed);
  } catch (error: any) {
    const status = error?.status || error?.code || 500;
    const message = error?.message || String(error);
    console.error(`[Gemini API Fatal Error] /api/generate-quiz: Status: ${status}, Message: ${message}`);
    return res.status(status).json({ error: 'Unable to generate quiz at this time. Please try again.', status: status });
  }
});

// ----------------------------------------------------
// 5. POST /api/analyze-answers
// ----------------------------------------------------
app.post('/api/analyze-answers', async (req, res) => {
  const { topic, level = 'Class 8', questions = [], answers = [], age, ageBand } = req.body || {};

  const cleanTopic = sanitizeInput(topic, 300);
  if (!cleanTopic || !Array.isArray(answers) || answers.length === 0) {
    return res.status(400).json({ error: 'Valid topic and answers array are required' });
  }

  // Length limit answers and questions to prevent payload abuse
  const boundedAnswers = answers.slice(0, 20).map(a => ({
    questionId: sanitizeInput(a?.questionId, 100),
    answer: sanitizeInput(a?.answer, 1000),
    isCorrect: Boolean(a?.isCorrect)
  }));
  const boundedQuestions = Array.isArray(questions) ? questions.slice(0, 20) : [];

  const effectiveAge = age ? Number(age) : getTypicalAgeForClass(level);
  const effectiveAgeBand = ageBand || getAgeBand(effectiveAge);

  if (!hasValidApiKey) {
    console.error('[Gemini API Error] /api/analyze-answers: Status: 503, Message: process.env.GEMINI_API_KEY is not configured');
    return res.status(503).json({ error: 'Gemini API Key is not configured on server', status: 503 });
  }

  const schema = {
    type: Type.OBJECT,
    properties: {
      conceptScores: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            concept: { type: Type.STRING },
            score: { type: Type.INTEGER }
          },
          required: ['concept', 'score']
        }
      },
      misconceptions: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            description: { type: Type.STRING },
            evidence: { type: Type.STRING }
          },
          required: ['description', 'evidence']
        }
      },
      strengths: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      },
      feedbackForChild: {
        type: Type.STRING,
        description: "Warm, encouraging, 2-3 sentences tailored to a child of this age"
      },
      nextStep: {
        type: Type.OBJECT,
        properties: {
          type: {
            type: Type.STRING,
            description: "simpler_explanation, new_example, corrective_story, or move_on"
          },
          title: { type: Type.STRING },
          content: { type: Type.STRING }
        },
        required: ['type', 'title', 'content']
      },
      recommendedNextTopics: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      },
      overallMastery: { type: Type.INTEGER }
    },
    required: [
      'conceptScores',
      'misconceptions',
      'strengths',
      'feedbackForChild',
      'nextStep',
      'recommendedNextTopics',
      'overallMastery'
    ]
  };

  const systemInstruction = `You are an empathetic, insightful educational diagnostician.
Learner is ${effectiveAge} years old (Age Band: ${effectiveAgeBand}).
Evaluate student answers deeply, comparing against true physical and mathematical principles.
Ensure feedbackForChild is warm, enthusiastic, and easily understood by a child aged ${effectiveAge}.`;

  try {
    const payload = JSON.stringify({
      topic: cleanTopic,
      level,
      age: effectiveAge,
      ageBand: effectiveAgeBand,
      questions: boundedQuestions,
      learnerAnswers: boundedAnswers
    });
    const parsed = await callGeminiFlashWithJsonRetry(
      'POST /api/analyze-answers',
      `Analyze this student's understanding based on their quiz answers:\n${payload}`,
      systemInstruction,
      schema
    );
    return res.json(parsed);
  } catch (error: any) {
    const status = error?.status || error?.code || 500;
    const message = error?.message || String(error);
    console.error(`[Gemini API Fatal Error] /api/analyze-answers: Status: ${status}, Message: ${message}`);
    return res.status(status).json({ error: 'Unable to analyze responses at this time. Please try again.', status: status });
  }
});

// ----------------------------------------------------
// 6. POST /api/generate-corrective
// ----------------------------------------------------
app.post('/api/generate-corrective', async (req, res) => {
  const { topic, level = 'Class 8', misconception, childAnswer = '', age, ageBand } = req.body || {};

  const cleanTopic = sanitizeInput(topic, 300);
  const cleanMisconception = sanitizeInput(misconception, 300);
  const cleanAnswer = sanitizeInput(childAnswer, 500);

  if (!cleanTopic || !cleanMisconception) {
    return res.status(400).json({ error: 'Valid topic and misconception strings are required' });
  }

  const effectiveAge = age ? Number(age) : getTypicalAgeForClass(level);
  const effectiveAgeBand = ageBand || getAgeBand(effectiveAge);

  if (!hasValidApiKey) {
    console.error('[Gemini API Error] /api/generate-corrective: Status: 503, Message: process.env.GEMINI_API_KEY is not configured');
    return res.status(503).json({ error: 'Gemini API Key is not configured on server', status: 503 });
  }

  const schema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      concept: { type: Type.STRING },
      targetedMisconception: { type: Type.STRING },
      scenes: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            header: { type: Type.STRING },
            text: { type: Type.STRING },
            visualEmoji: { type: Type.STRING }
          },
          required: ['header', 'text', 'visualEmoji']
        }
      },
      takeaway: { type: Type.STRING },
      recheckQuestions: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            prompt: { type: Type.STRING },
            options: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            correctAnswer: { type: Type.STRING },
            explanation: { type: Type.STRING }
          },
          required: ['prompt', 'options', 'correctAnswer', 'explanation']
        }
      }
    },
    required: ['title', 'concept', 'targetedMisconception', 'scenes', 'takeaway', 'recheckQuestions']
  };

  const systemInstruction = `You are a master teacher who creates intuitive "lightbulb moments" for kids using crystal-clear physical analogies.
Learner is ${effectiveAge} years old (Age Band: ${effectiveAgeBand}).
Adapt explanations and re-check questions to fit this age band seamlessly.`;

  try {
    const parsed = await callGeminiFlashWithJsonRetry(
      'POST /api/generate-corrective',
      `Create a punchy, warm corrective story (2 short scenes) and 1-2 re-check questions to gently cure this student misconception:
Topic: "${cleanTopic}" (${level}, Age ${effectiveAge}, Band ${effectiveAgeBand})
Misconception: "${cleanMisconception}"
Student's mistaken answer: "${cleanAnswer}"`,
      systemInstruction,
      schema
    );
    return res.json(parsed);
  } catch (error: any) {
    const status = error?.status || error?.code || 500;
    const message = error?.message || String(error);
    console.error(`[Gemini API Fatal Error] /api/generate-corrective: Status: ${status}, Message: ${message}`);
    return res.status(status).json({ error: 'Unable to generate corrective explanation at this time. Please try again.', status: status });
  }
});

// ----------------------------------------------------
// Frontend Mounting (Vite Middleware in Dev, Static in Prod)
// ----------------------------------------------------
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`StoryLearn server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
