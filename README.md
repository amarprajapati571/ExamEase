# ExamEase

ExamEase is a responsive mental wellness tracker for students during exam preparation and result seasons.

## Run locally

Open `index.html` in a browser to use the safe fallback response, or start the backend server for AI support:

```bash
npm start
```

Then visit `http://localhost:8011`.

To enable AI responses, keep the API key on the server only:

```bash
OPENAI_API_KEY=your_api_key_here npm start
```

You can optionally choose a model:

```bash
OPENAI_MODEL=gpt-4o-mini
```

## Deployment preparation

This app includes static frontend files plus a small Node backend that proxies AI requests so API keys are not exposed in browser code.

Before deployment, run:

```bash
npm run build
```

When you are ready to deploy to Vercel, run the deploy command from this folder:

```bash
npx vercel --prod
```

The project includes `vercel.json` for clean URLs, SPA fallback routing, and basic security headers.
