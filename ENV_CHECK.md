# Environment Variables Check - CRITICAL

## Backend (.env file should have):
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

## Frontend (.env.local file should have):
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_API_URL=http://localhost:5000/api

## Test if variables are loaded:
Backend: console.log(process.env.SUPABASE_URL)
Frontend: console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)

## If variables are missing:
1. Get from Supabase Dashboard → Settings → API
2. Copy EXACT values (no extra spaces)
3. Restart both frontend and backend servers
