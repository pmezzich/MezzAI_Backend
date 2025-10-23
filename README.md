# MezzAI Render Backend (Fixed)

This backend matches the routes your frontend probes. It runs on Render, binds to `process.env.PORT`, enables CORS, and implements GPT chat, email drafting, lead classifier, metrics (seed/peek), and pie endpoints.

## Endpoints
- Health: `/api/health`, `/health`, `/.well-known/health`
- Chat: `/api/chat` (also `/chat`, `/v1/chat` via redirects)
- Email: `/api/email-draft` (also `/email-draft`, `/v1/email` via redirects)
- Classify: `/api/classify` (also `/classify`, `/v1/classify` via redirects)
- Metrics: `/api/metrics/seed`, `/api/metrics/peek`
- Pie: `/api/metrics/pie`, `/api/pie`, `/pie`

## OpenAI (optional)
Set `OPENAI_API_KEY` (and optionally `OPENAI_MODEL`, default `gpt-4o-mini`). If not set, chat/email routes return safe echoes/dummy replies.

## Firebase (optional)
Set:
- `FIREBASE_SERVICE_ACCOUNT_JSON` (full JSON string) _or_ `FIREBASE_SERVICE_ACCOUNT_BASE64` (base64 of the JSON)
- `FIREBASE_DATABASE_URL` (e.g., `https://<project>-default-rtdb.firebaseio.com`)

If not set, the backend uses an **in-memory mock** so metrics and pie still work.

## Local run
```bash
npm i
npm start
# http://localhost:3000/api/health
```

## Render
- Start command: `npm start`
- Node: 20+
- Env (optional): `OPENAI_API_KEY`, Firebase vars above.
