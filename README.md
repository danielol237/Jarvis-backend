# Jarvis AI Backend

Your own AI API that rotates between Gemini, Groq and OpenRouter automatically.
No rate limits — when one hits the limit, it switches to the next instantly.

## Deploy to Railway (Free)

1. Go to railway.app and sign up free
2. Click "New Project" → "Deploy from GitHub"
3. Push this folder to GitHub first OR use Railway CLI
4. Add environment variables in Railway dashboard:
   - GEMINI_KEY = your Gemini API key
   - GROQ_KEY = your Groq API key (get free at console.groq.com)
   - OPENROUTER_KEY = your OpenRouter key (get free at openrouter.ai)
5. Deploy — Railway gives you a URL like: https://jarvis-backend.up.railway.app

## Test it
curl -X POST https://your-url.up.railway.app/ai \
  -H "Content-Type: application/json" \
  -d '{"prompt":"tell me a joke","name":"Jarvis","style":"casual"}'

## Update Jarvis Android app
In MainActivity.kt change GEMINI_API_KEY to your Railway URL and update
the processOnline() function to call your backend instead.
