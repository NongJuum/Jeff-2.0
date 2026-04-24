# Jeff Inspired Fitness App

A Next.js workout planner for 3, 4 and 5 day training splits.

## Features
- 3 day full body, 4 day upper/lower, 5 day bodypart split
- A-tier-or-better exercise seed database
- Muscle focus per day
- Exercise substitutions when equipment is unavailable
- Warmup flag per exercise
- lbs set and rep logging
- Instant PR replacement based on weight × reps
- Demo button via YouTube search
- LocalStorage persistence

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Deploy to Vercel

1. Push this folder to GitHub.
2. Go to Vercel.
3. New Project.
4. Import the GitHub repo.
5. Framework preset: Next.js.
6. Build command: npm run build.
7. Output directory: leave default.
8. Click Deploy.

## Production notes
This MVP uses localStorage. For real accounts and cross-device sync, add:
- Supabase or Neon Postgres
- Prisma
- NextAuth/Auth.js
- Cloudinary or local media library for licensed GIFs/images