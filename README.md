# Penni — your personal deal keeper

## Setup

1. Clone the repo
2. Copy `.env.local.example` to `.env.local` and fill in your keys
3. `npm install`
4. `npm run dev`

## Env variables needed
- `NEXT_PUBLIC_SUPABASE_URL` — your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon/public key (Settings → API)
- `SUPABASE_SERVICE_KEY` — Supabase service role key (Settings → API)
- `GEMINI_API_KEY` — Google Gemini API key

## Deploying to Vercel
Add all env variables in Vercel dashboard under Settings → Environment Variables.
