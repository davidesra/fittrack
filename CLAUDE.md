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

## Current Status (as of 2026-02-20)

### Infrastructure
| Item | Status | Notes |
|------|--------|-------|
| GitHub repo | ✅ | `https://github.com/davidesra/fittrack.git` |
| Neon DB | ✅ | `DATABASE_URL` set, schema pushed |
| .env.local | ✅ | All keys present: `DATABASE_URL`, `AUTH_SECRET`, `NEXTAUTH_URL`, `AUTH_GOOGLE_ID/SECRET`, `ANTHROPIC_API_KEY`, `CLOUDINARY_URL/KEY/SECRET`, `GARMIN_CLIENT_ID/SECRET/REDIRECT_URI` |
| Vercel link | ❌ | `vercel link` was never run — not deployed |

### Features vs Spec

#### Nutrition (/nutrition)
| Feature | Status | Notes |
|---------|--------|-------|
| Text meal logging | ✅ | Claude estimates macros from text description |
| Photo meal logging | ✅ | Claude vision identifies food + macros |
| Daily totals vs goals | ✅ | Calorie ring + macro progress bars |
| Calorie/macro chart | ✅ | 30-day Recharts trend with goal line |
| Weekly/monthly toggle | ❌ | Fixed 30-day window only |
| AI analysis (insights + 4-week plan) | ✅ | Streaming via SSE, explicitly prompts for 4-week plan |

#### Workouts (/workouts)
| Feature | Status | Notes |
|---------|--------|-------|
| Manual logging (sets/reps/weight/effort) | ✅ | Full form with multi-exercise support |
| Garmin sync | ⚠️ | API route exists; `lib/garmin.ts` is a stub — `fetchGarminActivities` returns `[]`, `exchangeGarminTokens` throws. OAuth 1.0a not implemented. |
| Garmin OAuth connect UI | ❌ | No `/api/auth/garmin/*` routes, no connect button |
| PR tracking | ✅ | Flagged per exercise, shown with badge |
| Calories burned tracking | ✅ | Shown in stats row |
| Strength progression charts | ✅ | Top 3 exercises by frequency |
| Weekly frequency metric | ❌ | Not tracked or displayed |
| AI analysis (training plan) | ✅ | Streaming, prompts for 4-week periodized plan |

#### Body Photos (/photos)
| Feature | Status | Notes |
|---------|--------|-------|
| Upload with date/weight/note | ✅ | Click-to-upload, Cloudinary hosted |
| Photo timeline grid | ✅ | Sorted by date, hover overlays |
| Side-by-side comparison | ✅ | Select any 2 photos, renders side by side |
| AI analysis (vision + stats) | ✅ | Sends photo URLs + user stats to Claude vision |

#### Shared / Cross-cutting
| Feature | Status | Notes |
|---------|--------|-------|
| Auth (Google OAuth) | ✅ | NextAuth v5 |
| DB schema + migrations | ✅ | Drizzle, all tables present |
| Sidebar with Log + Analysis tabs | ✅ | All 3 sections |
| Goals API | ✅ | GET + PUT, Zod-validated |
| Goals UI page | ❌ | No `/goals` page — users can't set goals from the UI |
| Dashboard home/overview | ❌ | Root redirects directly to `/nutrition` |
| Recharts goal lines on charts | ✅ | Nutrition chart shows calorie goal line |
| Goal lines on workout charts | ❌ | Target lifts not shown on strength charts |
| Mobile navigation | ❌ | Sidebar is desktop-only; no mobile nav |
| Edit/delete meals or workouts | ❌ | Not implemented |
| Date filter / search | ❌ | Not implemented |
| Error boundaries (error.tsx) | ❌ | No error.tsx files |
| Suspense / loading states | ❌ | No loading.tsx files |
| Tests | ❌ | Playwright installed, zero test files |
| Vercel deployment | ❌ | Not linked, never deployed |

### Priority Gaps to Close
1. **Vercel deploy** — run `npx vercel link` and connect to GitHub
2. **Goals UI** — create `/app/(dashboard)/goals/page.tsx` so users can set targets
3. **Garmin OAuth** — implement OAuth 1.0a flow (`oauth-1.0a` package) + `/api/auth/garmin/request` and `/api/auth/garmin/callback` routes + connect button in settings
4. **Mobile nav** — add hamburger/drawer or bottom nav for mobile screens
5. **Edit/delete** — at minimum for meals; workouts secondarily
