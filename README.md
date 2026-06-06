# ExamEase

ExamEase is a responsive mental wellness tracker for students during exam preparation and result seasons.

It is designed for students preparing for board exams and competitive exams such as NEET, JEE, CUET, CAT, GATE, and UPSC. The app helps students log mood, stress, energy, sleep, exam phase, stress triggers, short reflections, and support preferences, then generates safe, non-clinical wellness support.

## Challenge alignment

- Captures exam type and current exam phase.
- Tracks mood, stress, energy, and sleep quality.
- Identifies stress triggers such as syllabus pressure, mock test scores, peer comparison, burnout, and result uncertainty.
- Includes a reflection journal with exam-focused prompts and positive moments.
- Generates personalized wellness support, quick calming exercises, study-life balance tips, affirmations, and short next-step plans.
- Includes result-season anxiety support for waiting-for-results and result-day phases.
- Shows dashboard trends for mood, stress, common triggers, and recent reflections.
- Includes a high-distress safety layer with trusted-help guidance.

## Safety and privacy

ExamEase is for self-reflection and wellness support. It does not diagnose mental illness, provide medical advice, or replace professional help.

- High distress check-ins show a visible safety message encouraging support from a trusted adult, parent, teacher, counselor, local emergency service, or crisis helpline.
- Reflection text is limited to 500 characters.
- Sensitive high-distress reflection text is not stored verbatim in local check-in history.
- Check-ins are stored locally in the browser unless a backend is used for AI generation.
- The frontend never contains API keys.
- AI responses are validated before rendering, with safe fallback support if the API is unavailable or malformed.
- User-generated text is escaped before rendering.

## Project structure

```text
src/
  components/        UI render modules
  data/              Exam options, prompts, mock data, fallback support
  services/          AI support service and cache orchestration
  utils/             Validation, risk, analytics, cache, response parsing, HTML helpers
lib/                 Shared backend wellness support core
scripts/             Fast test and build verification scripts
api/                 Vercel API route
```

## Run locally

Start the backend server so the browser can call the GPT-powered support API without exposing the API key:

```bash
npm start
```

Then visit `http://localhost:8011`.

To enable GPT responses, keep the API key on the server only:

```bash
OPENAI_API_KEY=your_api_key_here npm start
```

You can optionally choose a model:

```bash
OPENAI_MODEL=gpt-4o-mini
```

Use `.env.example` as a reference only. Do not commit real API keys.

## Quality checks

Run the full static build and test suite before pushing or deploying:

```bash
npm run build
npm test
```

The tests cover risk assessment, mood analytics, form validation, AI response validation, fallback handling, cache behavior, empty dashboard rendering, high-risk safety UI, and backend core logic.

## Deployment preparation

This app includes static frontend files plus a Vercel API route that proxies GPT requests so API keys are not exposed in browser code. Configure these Vercel environment variables before production use:

```bash
OPENAI_API_KEY=your_api_key_here
OPENAI_MODEL=gpt-4o-mini
```

Before deployment, run:

```bash
npm run build
```

When you are ready to deploy to Vercel, run the deploy command from this folder:

```bash
npx vercel --prod
```

The project includes `vercel.json` for clean URLs, a generated `public/` output directory, and basic security headers.
