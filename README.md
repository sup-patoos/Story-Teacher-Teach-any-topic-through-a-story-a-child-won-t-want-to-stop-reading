# StoryLearn: AI Story-Based Learning Web Application

StoryLearn is an interactive educational learning engine designed for school students, curious learners, parents, and educators. It turns NCERT curriculum concepts (Classes 7–9 Science and Mathematics) and open-ended curiosity questions into relatable, interactive stories accompanied by interactive widgets, diagnostic assessments, and AI-driven misconception diagnosis.

---

## 🌟 Key Features

1. **Two Distinct Entry Points**:
   - **Explore Anything**: Search any learning curiosity or topic (e.g., *"Why is the sky blue?"*, *"How do submarines work?"*) with intelligent safety checks and curriculum alignment.
   - **Browse by Class**: Follow the structured NCERT syllabus for Class 7, Class 8, and Class 9 across Physics, Chemistry, Biology, and Mathematics.

2. **Personalized Cognitive Adaptation**:
   - Compact personalize control seamlessly keeps learner **Age (5–16)**, **Class (6–10)**, and **Complexity Level** in sync (Class 6=11, Class 7=12, Class 8=13, Class 9=14, Class 10=15) while allowing independent editing.
   - Vocabulary, sentence length, analogy choices, and question rubrics adapt specifically to each age band (Ages 5–7, 8–10, 11–13, 14–16).

3. **Interactive Story Engine**:
   - Multi-scene animated stories with relatable narratives and Indian contextual examples.
   - Built-in interactive visual widgets (interactive sliders, real-time graphs, number lines, and drag-and-drop categorizers).
   - Browser speech narration (Read-Aloud) with speed controls (0.8x, 1.0x, 1.2x).
   - Instant zero-latency preloaded stories for key concepts alongside resilient plain-text fallback stories.

4. **Deep Understanding Diagnosis ("Test Yourself")**:
   - Diagnostic assessments built with misconception-targeting questions (predictive, application, cause-and-effect, and own-words questions).
   - AI misconception analysis that pinpoints exact conceptual confusions and generates tailored "lightbulb moment" corrective explanations.

5. **Parent & Teacher Portal**:
   - Protected by a hashed 4-digit PIN (default `1234`) with automatic migration.
   - Daily progress breakdown with time tracked, mastery status, and syllabus vs. curiosity exploration split.
   - Specific pedagogical recommendations detailing which detected misconceptions need review.
   - Daily screen-time limits and Curriculum Lock safety controls.
   - Print and save to PDF functionality.

6. **Accessibility & Security**:
   - Server-side only Gemini API key protection.
   - Input sanitization and length-limits on all endpoints.
   - In-memory rate limiting against burst traffic.
   - Safe, generic error messages to clients.
   - WCAG accessibility: skip to main content link, full keyboard focus rings, ARIA labels on icon buttons, and `prefers-reduced-motion` support.

---

## 🛠️ How We Answer the Brief

- **How understanding is checked**:
  Instead of superficial recall tests, our diagnostic quiz probes student mental models using multiple question types (predictive cause-and-effect, application scenarios, and "explain in your own words"). When a student completes a quiz, the AI analyzes their explanations against true scientific and mathematical principles, identifies intuitive traps (such as confusing scalar distance with vector displacement or confusing minus signs), and records mastery.

- **How stories adapt to age**:
  The engine segments learners into four cognitive stages:
  - *Ages 5–7*: Short sentences, playful tactile analogies (toys, playground games), 3 gentle questions.
  - *Ages 8–10*: Concrete cause-and-effect, relatable school/home scenarios, 4 questions.
  - *Ages 11–13*: Inquiry-driven adventure, "why" reasoning, 5 questions probing common intuitive traps.
  - *Ages 14–16*: Conceptual rigour, multi-step deduction, higher application of mathematical/physical formulas.

- **What parents and teachers see**:
  A dedicated portal showing student study time today, streak history, mastery progress cards, and an itemized breakdown of concepts understood well (≥70%) versus those needing attention (<70%). It highlights specific misconceptions detected with actionable next-step guidance for homework or classroom discussions.

---

## 🚀 Setup & Getting Started

### Prerequisites
- Node.js (v18+)
- npm or bun

### Installation
```bash
npm install
```

### Environment Variables
Configure your environment in `.env` (refer to `.env.example`):
```env
# GEMINI_API_KEY: Configured in Google AI Studio or server environment
GEMINI_API_KEY="your-gemini-api-key-here"
```
*Note: The Gemini API key remains strictly server-side and is never exposed in client bundles or client logs.*

---

## 🏃 Running the Application

### Development Mode (Runs full-stack with Vite & Express on Port 3000)
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build
```bash
npm run build
npm start
```

---

## 🧪 Automated Testing

We use **Vitest** with **React Testing Library** and **JSDOM** to ensure complete coverage without external network dependencies. All AI endpoints and LocalStorage states are cleanly isolated.

### Run All Unit & Component Tests
```bash
npm test
```

### Test Coverage Highlights
- `src/test/ageMapping.test.ts`: Boundaries 5, 7, 8, 10, 11, 13, 14, 16 mapping to cognitive age bands.
- `src/test/classAgeSync.test.ts`: Class 6–10 and age 11–15 two-way synchronization.
- `src/test/cacheKey.test.ts`: Collision prevention across different age bands and education levels.
- `src/test/masteryUpdate.test.ts`: Mastery score weighting (recent attempts weighted more) strictly bounded within [0, 100].
- `src/test/aiRetry.test.ts`: AI response handling for valid JSON, malformed JSON recovery, and HTTP 503/429 retries with backoff.
- `src/test/syllabusIntegrity.test.ts`: Validates unique IDs, subtopic titles, and videoId presence across the syllabus tree.
- `src/test/dailyReport.test.ts`: Daily report generator metrics and pedagogical recommendation logic.
- `src/test/personalizeControl.test.tsx`: UI component test verifying synchronized age and class updates.

---

## 📁 Folder Structure

```
├── .env.example                    # Environment variable template
├── index.html                      # Entry HTML with meta & accessibility links
├── metadata.json                   # Applet metadata & permissions
├── package.json                    # Project dependencies & scripts
├── server.ts                       # Secure Express backend with Gemini Flash API & rate limiting
├── vitest.config.ts                # Vitest test runner configuration
├── src/
│   ├── main.tsx                    # React client entry point
│   ├── App.tsx                     # Main application layout, routing & accessibility skip link
│   ├── index.css                   # Global styles, Tailwind CSS & prefers-reduced-motion
│   ├── components/
│   │   ├── admin/                  # Content pre-generation admin tools
│   │   ├── analysis/               # AI misconception & diagnostic result views
│   │   ├── dashboard/              # Student progress meter & badge view
│   │   ├── home/                   # HomeScreen (Explore Anything & Browse by Class)
│   │   ├── library/                # NCERT syllabus chapter & subtopic browser
│   │   ├── modes/                  # Learning mode selection (Story, Video, Text)
│   │   ├── navigation/             # Accessible desktop & mobile navigation bars
│   │   ├── parents/                # PIN-protected parent/teacher dashboard
│   │   ├── quiz/                   # Diagnostic quiz player
│   │   ├── story/                  # Interactive visual story player & widgets
│   │   └── video/                  # Educational video player view
│   ├── data/
│   │   ├── preloadedContent.ts     # Offline verified stories & quizzes
│   │   └── syllabus.json           # NCERT Classes 7-9 science & mathematics curriculum
│   ├── services/
│   │   ├── aiHandler.ts            # AI execution helper, JSON retry & input sanitization
│   │   ├── apiClient.ts            # Client-side API proxy layer
│   │   └── storageService.ts       # Hashed PIN storage, mastery engine, caching & reports
│   ├── test/                       # Vitest automated unit & component tests
│   └── types/
│       └── learning.ts             # TypeScript data models & pure sync helpers
```
