// server.js (Express backend for Render)
import express from 'express';
import cors from 'cors';
import { OpenAI } from 'openai';
import { db } from './utils/firebaseAdmin.js';

const app = express();
app.use(cors({ origin: '*'}));
app.use(express.json({ limit: '2mb' }));

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.get('/', (req, res) => res.json({ ok: true, service: 'mezzai-backend' }));

// Non-streaming chat (easiest for frontends)
app.post('/api/chat', async (req, res) => {
  try {
    const messages = req.body?.messages || [{ role: 'user', content: 'Hello' }];
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages
    });
    const text = completion.choices?.[0]?.message?.content || '';
    res.json({ text, raw: completion });
  } catch (e) {
    const status = e.status || 500;
    res.status(status).json({ error: e.message || 'OpenAI error', detail: e.response?.data || null });
  }
});

// Streaming chat via SSE
app.post('/api/stream-gpt', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  try {
    const messages = req.body?.messages || [{ role: 'user', content: 'Hello' }];
    const stream = await client.chat.completions.create({ model: 'gpt-4o-mini', messages, stream: true });
    for await (const part of stream) {
      const chunk = part.choices?.[0]?.delta?.content || '';
      if (chunk) res.write(`data: ${JSON.stringify(chunk)}\n\n`);
    }
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (e) {
    res.write(`data: ${JSON.stringify('[ERROR] ' + (e.message || 'OpenAI error'))}\n\n`);
    res.end();
  }
});

app.post('/api/email/draft', async (req, res) => {
  try {
    const body = req.body?.body || '';
    if (!body) return res.status(400).json({ error: 'Missing email body' });
    const prompt = `Write a polite, concise professional reply (<=170 words) and propose next steps.\n\nEmail:\n${body}`;
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }]
    });
    res.json({ html: completion.choices?.[0]?.message?.content || '' });
  } catch (e) {
    const status = e.status || 500;
    res.status(status).json({ error: e.message || 'OpenAI error' });
  }
});

app.post('/api/leads/classify', async (req, res) => {
  try {
    const messages = req.body?.messages || '';
    const sys = `You are a tagger. Categories: Sales, Support, HR. Return JSON array of {message, category, confidence}.`;
    const user = `Messages delimited by ---:\n${messages}`;
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [{ role: 'system', content: sys }, { role: 'user', content: user }]
    });
    let out;
    try { out = JSON.parse(completion.choices?.[0]?.message?.content || '{}'); } catch { out = {}; }
    res.json(out);
  } catch (e) {
    const status = e.status || 500;
    res.status(status).json({ error: e.message || 'OpenAI error' });
  }
});

app.post('/api/metrics/seed', async (req, res) => {
  try {
    const ref = db.ref('metrics/demo');
    const payload = {
      timestamp: Date.now(),
      opensToday: Math.floor(Math.random()*200 + 40),
      leadsThisWeek: Math.floor(Math.random()*30 + 5),
      proposals: Math.floor(Math.random()*15 + 1),
    };
    await ref.set(payload);
    res.json({ ok: true, wrote: payload });
  } catch (e) {
    res.status(500).json({ error: e.message || 'Firebase error' });
  }
});

app.get('/api/metrics/peek', async (req, res) => {
  try {
    const snap = await db.ref('metrics').limitToLast(25).get();
    res.json(snap.val() || {});
  } catch (e) {
    res.status(500).json({ error: e.message || 'Firebase error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('MezzAI backend on :' + PORT));
