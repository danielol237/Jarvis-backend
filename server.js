const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

// ── API Keys — add yours here ─────────────────────────────────────────────────
const APIS = [
  {
    name: 'Gemini',
    key: process.env.GEMINI_KEY || '',
    enabled: true,
    async call(prompt) {
      const res = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.key}`,
        { contents: [{ parts: [{ text: prompt }] }] },
        { timeout: 10000 }
      );
      return res.data.candidates[0].content.parts[0].text.trim();
    }
  },
  {
    name: 'Groq',
    key: process.env.GROQ_KEY || '',
    enabled: true,
    async call(prompt) {
      const res = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: 'llama3-8b-8192',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 150
        },
        {
          headers: { Authorization: `Bearer ${this.key}` },
          timeout: 10000
        }
      );
      return res.data.choices[0].message.content.trim();
    }
  },
  {
    name: 'OpenRouter',
    key: process.env.OPENROUTER_KEY || '',
    enabled: true,
    async call(prompt) {
      const res = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: 'meta-llama/llama-3.2-3b-instruct:free',
          messages: [{ role: 'user', content: prompt }]
        },
        {
          headers: {
            Authorization: `Bearer ${this.key}`,
            'HTTP-Referer': 'https://jarvis-ai.app'
          },
          timeout: 10000
        }
      );
      return res.data.choices[0].message.content.trim();
    }
  }
];

// ── Rate limit tracker ────────────────────────────────────────────────────────
const rateLimited = {};

// ── Main AI endpoint ──────────────────────────────────────────────────────────
app.post('/ai', async (req, res) => {
  const { prompt, name = 'Jarvis', style = 'formal' } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'No prompt provided' });
  }

  const stylePrompt = style === 'casual'
    ? 'Reply casually and friendly in 1-2 sentences.'
    : style === 'savage'
    ? 'Reply with confidence and sass in 1-2 sentences.'
    : 'Reply formally and professionally in 1-2 sentences.';

  const fullPrompt = `You are ${name}, a voice assistant. ${stylePrompt} User says: ${prompt}`;

  // Try each API in order — skip rate limited ones
  for (const api of APIS) {
    if (!api.enabled || !api.key) continue;
    if (rateLimited[api.name] && Date.now() < rateLimited[api.name]) continue;

    try {
      console.log(`Trying ${api.name}...`);
      const text = await api.call(fullPrompt);
      console.log(`✓ ${api.name} responded`);
      return res.json({ text, source: api.name });
    } catch (err) {
      const status = err.response?.status;
      if (status === 429) {
        // Rate limited — skip for 60 seconds
        rateLimited[api.name] = Date.now() + 60000;
        console.log(`${api.name} rate limited. Trying next...`);
      } else {
        console.log(`${api.name} error: ${err.message}`);
      }
    }
  }

  // All APIs failed — return fallback
  return res.status(503).json({
    error: 'All AI services unavailable',
    text: 'I am currently offline. Please try again shortly.'
  });
});

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    status: 'Jarvis AI Backend Online',
    apis: APIS.map(a => ({
      name: a.name,
      enabled: a.enabled && !!a.key,
      rateLimited: !!(rateLimited[a.name] && Date.now() < rateLimited[a.name])
    }))
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Jarvis backend running on port ${PORT}`));
