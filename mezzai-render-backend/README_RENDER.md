# MezzAI Backend (Render-ready, Express)

Simple Node/Express backend that proxies OpenAI and Firebase so your keys stay secret.

## Endpoints
- `POST /api/chat` – one-shot chat completion (JSON)
- `POST /api/stream-gpt` – streaming chat via Server-Sent Events (SSE)
- `POST /api/email/draft` – generates a polite reply
- `POST /api/leads/classify` – tags messages (Sales/Support/HR)
- `POST /api/metrics/seed` – writes demo metrics to Realtime DB
- `GET  /api/metrics/peek` – reads recent metrics
- `GET  /` – health check

## Deploy to Render
1) Create a new **Web Service** in Render and connect this folder's repo/zip.
2) **Environment**: add these variables:
   - `OPENAI_API_KEY` = your org/project key (sk-proj-… or sk-admin-…)
   - Either **one** of the following for Firebase Admin:
     - `FIREBASE_SERVICE_ACCOUNT` = full JSON (escape newlines in private_key as \n)
     - or split vars:
       - `FIREBASE_PROJECT_ID`
       - `FIREBASE_CLIENT_EMAIL`
       - `FIREBASE_PRIVATE_KEY` (use \n newlines)
3) Build command: *(Render detects Node)* – leave empty or `npm install`
4) Start command: `node server.js`
5) After deploy, note your base URL, e.g. `https://mezzai-api.onrender.com`

## Frontend changes
In your HTML/JS:
```js
const API_BASE = "https://YOUR-SERVICE.onrender.com";
async function runGPT(prompt){
  const res = await fetch(API_BASE + "/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: [{role:"user", content: prompt}] })
  });
  const data = await res.json();
  return data.text;
}
// Email:
fetch(API_BASE + "/api/email/draft", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ body }) })
// Leads:
fetch(API_BASE + "/api/leads/classify", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ messages }) })
// Metrics:
fetch(API_BASE + "/api/metrics/seed", { method:"POST" })
fetch(API_BASE + "/api/metrics/peek")
```