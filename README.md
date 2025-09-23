# Movar Report Lite

Movar Report Lite focuses exclusively on the interactive Primavera P6 report experience. It retains the schedule upload, charting, DCMA analysis, and optional AI-generated narrative from the production app while removing marketing, registration, and chatbot flows.

## Features
- Upload current and baseline Primavera P6 `.xer` or schema `.xml` files for local-only processing
- Compare baseline vs. current schedules and export variance summaries
- Visualise progress, task mix, and resource trends with responsive Chart.js components
- Run a DCMA 14-point health check on parsed activities
- Generate an optional markdown narrative when Azure OpenAI credentials are provided

## Development
```bash
npm install
npm run dev -- --host --port 3424
```

## Production Build
```bash
npm run build
```

## Environment Variables
Narrative generation relies on Azure OpenAI. Define the following variables (e.g. in a `.env` file) to enable it:

```
VITE_AZURE_OPENAI_API_KEY=...
VITE_AZURE_OPENAI_ENDPOINT=...
VITE_AZURE_OPENAI_DEPLOYMENT=...
```

Without these values the rest of the report experience continues to work, and the narrative section will display a helpful message instead.
