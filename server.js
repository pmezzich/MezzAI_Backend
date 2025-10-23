// server.js — MezzAI backend (Render-ready)
import express from 'express';
import cors from 'cors';
import { OpenAI } from 'openai';
import { getDbOrMock } from './utils/firebaseAdmin.js';

const app = express();
const HOST = '0.0.0.0';
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '2mb' }));

// Optional OpenAI client
const client = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
const db = getDbOrMock();

// Root + health (frontend probes these)
app.get('/', (_req, res) => res.json({ ok: true, service: 'mezzai-backend' }));
const ok = (_req, res) => res.json({ message: 'OK' });
app.get('/api/health', ok);
app.get('/health', ok);
app.get('/.well-known/health', ok);

// ---- GPT Chat (non-streaming) ----
app.post('/api/chat', async (req, res) => {
  try {
    const prompt = String(req.body?.prompt ?? '').slice(0, 8000);
    if (!prompt) return res.json({ text: 'Empty prompt.' });
    if (client) {
      const out = await client.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      });
      const text = out.choices?.[0]?.message?.content ?? '(no output)';
      return res.json({ text });
    }
    // Fallback: echo
    return res.json({ text: `Echo: ${prompt}` });
  } catch (e) {
    res.status(500).json({ error: e.message || 'chat failed' });
  }
});
app.post('/chat', (req, res) => res.redirect(307, '/api/chat'));
app.post('/v1/chat', (req, res) => res.redirect(307, '/api/chat'));

// ---- Email Draft ----
app.post('/api/email-draft', async (req, res) => {
  try {
    const email = String(req.body?.email ?? '').slice(0, 16000);
    if (!email) return res.json({ text: 'Please paste the email content.' });
    if (client) {
      const out = await client.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Write a concise, professional reply (3–6 sentences). Be clear and helpful.' },
          { role: 'user', content: email }
        ],
        temperature: 0.5,
      });
      const text = out.choices?.[0]?.message?.content ?? '(no output)';
      return res.json({ text: text.trim() });
    }
    return res.json({ text: 'Thanks for the note — I’ll take a look and get back to you shortly.' });
  } catch (e) {
    res.status(500).json({ error: e.message || 'email-draft failed' });
  }
});
app.post('/email-draft', (req, res) => res.redirect(307, '/api/email-draft'));
app.post('/v1/email', (req, res) => res.redirect(307, '/api/email-draft'));

// ---- Lead Classifier ----
app.post('/api/classify', (req, res) => {
  const raw = String(req.body?.text ?? '');
  const items = raw.split(/---/g).map(s => s.trim()).filter(Boolean);
  const out = items.map((msg, i) => ({
    id: i + 1,
    text: msg,
    bucket: /demo|meeting|call|schedule|quote|pricing/i.test(msg) ? 'Lead'
          : /login|cannot|error|bug|issue|fail|down/i.test(msg) ? 'Support'
          : 'Other',
    priority: /cannot|urgent|error|down|asap/i.test(msg) ? 'high' : 'normal'
  }));
  res.json({ items: out });
});
app.post('/classify', (req, res) => res.redirect(307, '/api/classify'));
app.post('/v1/classify', (req, res) => res.redirect(307, '/api/classify'));

// ---- Metrics (seed / peek) ----
app.post('/api/metrics/seed', async (_req, res) => {
  try {
    const payload = {
      at: Date.now(),
      opensToday: Math.floor(40 + Math.random() * 240),
      leadsThisWeek: Math.floor(5 + Math.random() * 35),
      proposals: Math.floor(1 + Math.random() * 16),
    };
    await db.ref('metrics/demo').set(payload);
    res.json(payload);
  } catch (e) {
    res.status(500).json({ error: e.message || 'Firebase error' });
  }
});

app.get('/api/metrics/peek', async (_req, res) => {
  try {
    const snap = await db.ref('metrics/demo').get();
    res.json(snap.val() || {});
  } catch (e) {
    res.status(500).json({ error: e.message || 'Firebase error' });
  }
});

// ---- Pie endpoints (3 variants the frontend probes) ----
function makePie(type = 'leads') {
  const palettes = {
    leads:   ['Inbound','Outbound','Referral','Partner','Events'],
    tickets: ['Bug','How-to','Feature','Billing','Other'],
    outcomes:['Resolved','Escalated','Pending','Closed-No-Action']
  };
  const labels = palettes[type] || ['A','B','C','D'];
  const values = labels.map(() => Math.floor(10 + Math.random() * 90));
  const total = values.reduce((a,b)=>a+b, 0);
  return { labels, values, total };
}
app.get('/api/metrics/pie', (req, res) => res.json(makePie(String(req.query.type || 'leads'))));
app.get('/api/pie',        (req, res) => res.json(makePie(String(req.query.type || 'leads'))));
app.get('/pie',            (req, res) => res.json(makePie(String(req.query.type || 'leads'))));

// ---- Start ----
app.listen(PORT, HOST, () => console.log(`MezzAI backend listening on ${HOST}:${PORT}`));
