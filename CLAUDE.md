# FitTrack — Claude Project File

## Project Overview
AI-powered fitness tracking app built with Next.js 16 (App Router). Users can log nutrition, workouts, and body photos. Claude AI provides analysis and insights across all three domains.

## Tech Stack
- **Framework**: Next.js 16.1.6 (App Router, React 19)
- **Auth**: NextAuth v5 beta (Google OAuth)
- **Database**: Neon (serverless Postgres) + Drizzle ORM
- **AI**: Anthropic SDK (`@anthropic-ai/sdk`) — streaming analysis
- **Storage**: Cloudinary (body photos, meal photos)
- **Wearables**: Garmin API integration (workout sync)
- **Charts**: Recharts
- **Styling**: Tailwind CSS v4

## Dev Commands
```bash
npm run dev          # start dev server
npm run db:push      # push schema to Neon (no migration files)
npm run db:studio    # open Drizzle Studio
npm run db:generate  # generate migration files
npm run db:migrate   # run migrations
```

## Project Structure
```
app/
  (dashboard)/
    nutrition/          ✅ complete — log + analysis
    workouts/           ✅ complete — log + analysis + strength charts
    photos/             ✅ complete — upload + timeline + AI analysis
  auth/signin/          ✅ complete
  api/
    auth/[...nextauth]/ ✅ complete
    goals/              ✅ GET + PUT
    nutrition/log/      ✅ complete
    nutrition/analyze-photo/ ✅ complete
    nutrition/analysis/ ✅ complete (streaming)
    workouts/log/       ✅ complete
    workouts/sync-garmin/ ✅ complete
    workouts/analysis/  ✅ complete (streaming)
    photos/upload/      ✅ complete
    photos/analysis/    ✅ complete (streaming)

components/
  layout/sidebar.tsx    ✅ complete
  ui/ (card, button, input, badge) ✅ complete
  analysis/analysis-stream.tsx ✅ complete (SSE streaming)
  charts/
    macro-progress-bar.tsx       ✅
    nutrition-timeline-chart.tsx ✅
    workout-timeline-chart.tsx   ✅
  nutrition/meal-log-form.tsx    ✅
  workouts/workout-log-form.tsx  ✅
  photos/photo-timeline-client.tsx ✅

lib/
  db/ (schema, relations, index) ✅ complete
  auth.ts                        ✅ complete
  anthropic.ts                   ✅ complete
  cloudinary.ts                  ✅ complete
  garmin.ts                      ✅ complete
  utils.ts                       ✅ complete
```

## Database Schema
- `users` — NextAuth users + Garmin OAuth tokens
- `accounts`, `sessions`, `verificationTokens` — NextAuth adapter tables
- `goals` — per-user nutrition, body, and lift targets
- `nutritionLogs` — daily denormalized macro totals (one row per user per day)
- `meals` — individual meal entries (manual | photo_ai | text_ai)
- `workouts` — workout sessions (manual | garmin), with activity type + effort
- `exercises` — exercise entries per workout, tracks PRs + volume
- `bodyPhotos` — Cloudinary-hosted body progress photos with optional weight

## Current Status (as of 2026-02-21)

### Infrastructure
| Item | Status | Notes |
|------|--------|-------|
| GitHub repo | ✅ | `https://github.com/davidesra/fittrack.git` — pushed |
| Neon DB | ✅ | `DATABASE_URL` set, schema pushed |
| .env.local | ✅ | All keys present |
| Vercel deploy | ✅ | Live at `https://fittrack-liard.vercel.app` — all 13 env vars set, `NEXTAUTH_URL` points to production |
| Google OAuth redirect | ⚠️ | Must add `https://fittrack-liard.vercel.app/api/auth/callback/google` to Google Cloud Console authorized redirect URIs |

### Features vs Spec

#### Nutrition (/nutrition)
| Feature | Status | Notes |
|---------|--------|-------|
| Text meal logging | ✅ | Claude estimates macros from text |
| Photo meal logging | ✅ | Claude vision identifies food + macros |
| Daily totals vs goals | ✅ | Calorie ring + macro progress bars |
| Calorie/macro chart + period toggle | ✅ | 7D / 30D / 90D + Calories / Protein / Carbs / Fat toggles; weekly aggregation for 90D |
| AI analysis (insights + 4-week plan) | ✅ | Streaming SSE, prompts for 4-week plan |
| Delete meals | ✅ | Trash button on each meal row; recalculates daily totals |
| loading.tsx / error.tsx | ✅ | Added for all sections |

#### Workouts (/workouts)
| Feature | Status | Notes |
|---------|--------|-------|
| Manual logging (sets/reps/weight/effort) | ✅ | Full form with multi-exercise support |
| Garmin sync | ⚠️ | API route exists; `lib/garmin.ts` is stub — OAuth 1.0a not implemented |
| Garmin OAuth connect UI | ❌ | No `/api/auth/garmin/*` routes, no connect button |
| PR tracking | ✅ | Flagged per exercise, shown with badge |
| Strength progression charts | ✅ | Top 3 exercises; goal lines from targetLifts |
| Goal lines on workout charts | ✅ | Dashed amber ReferenceLine when targetLift matches exercise name |
| Weekly frequency metric | ❌ | Not tracked or displayed |
| Delete workouts | ✅ | Trash button on each workout row; cascades to exercises |
| AI analysis (training plan) | ✅ | Streaming, prompts for 4-week periodized plan |

#### Body Photos (/photos)
| Feature | Status | Notes |
|---------|--------|-------|
| Upload with date/weight/note | ✅ | Click-to-upload, Cloudinary hosted |
| Photo timeline grid | ✅ | Sorted by date, hover overlays |
| Side-by-side comparison | ✅ | Select any 2 photos, side-by-side view |
| AI analysis (vision + stats) | ✅ | Sends photo URLs + user stats to Claude vision |

#### Goals (/goals)
| Feature | Status | Notes |
|---------|--------|-------|
| Goals UI page | ✅ | Set calories, macros, target weight, target lifts |
| Goals API | ✅ | GET + PUT, Zod-validated, upserts |
| Goal lines on charts | ✅ | Calorie goal on nutrition chart; lift goals on workout charts |

#### Shared / Cross-cutting
| Feature | Status | Notes |
|---------|--------|-------|
| Auth (Google OAuth) | ✅ | NextAuth v5 |
| DB schema | ✅ | Drizzle, all tables present |
| Sidebar (5 sections) | ✅ | Dashboard, Nutrition, Workouts, Body Photos, Goals |
| Mobile sidebar drawer | ✅ | Hamburger + backdrop + slide-in drawer (< lg) |
| Dashboard home | ✅ | `/dashboard` — today's calories, recent workouts, latest photo, goals snapshot |
| loading.tsx per section | ✅ | All 5 dashboard sections |
| error.tsx per section | ✅ | All 5 dashboard sections |
| Date filter / search | ❌ | Not implemented |
| Tests | ❌ | Playwright installed, zero test files |
| Vercel deployment | ✅ | Live at `https://fittrack-liard.vercel.app`; project `prj_e5iApBDmXkagmpH2X2hxgCMeQeid` |
| Garmin OAuth | ❌ | OAuth 1.0a not implemented; `lib/garmin.ts` is a stub |

### Remaining Gaps
1. **Google OAuth redirect URI** — add `https://fittrack-liard.vercel.app/api/auth/callback/google` to authorized redirect URIs in [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials → OAuth 2.0 Client ID (manual — requires Google login)
2. **GitHub auto-deploy** — connect repo in Vercel dashboard: Settings → Git → Connect Repository (optional; can still `vercel --prod --yes` manually)
3. **Garmin OAuth** — install `oauth-1.0a` + `crypto`, implement `/api/auth/garmin/request` and `/api/auth/garmin/callback`, add Connect button to goals/settings page
4. **Weekly training frequency** — calculate sessions per week in workouts page stats row
4. **Tests** — write Playwright e2e tests for auth flow, log meal, log workout
