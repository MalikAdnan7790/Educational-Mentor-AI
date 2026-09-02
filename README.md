# Educational Mentor AI — Multilingual AI Voice Mentor

A full-stack, multilingual (English / Urdu / Roman Urdu) learning platform with a **voice AI teacher**, **Ask Anything chat**, **image + PDF input**, and a structured **independent problem-solving loop**:

```
AI → Challenge → Student Thinking → Attempt → Feedback → Retry → Independent Solution
```

The central design principle: **AI success = student needs less AI.**

## Features

### Voice Teacher (`/voice`)
- Talk to your AI teacher in English, Urdu, or Roman Urdu.
- Professional animated avatar (male/female), adjustable voice speed (0.75x – 1.5x).
- Tap-to-interrupt; STT pauses while the teacher speaks and auto-resumes.
- Uses the browser Web Speech API (Chrome / Edge recommended for Urdu `ur-PK` voices).

### Ask Anything (`/ask`)
- Free-form text chat with streaming replies.
- Auto-detects **language, subject, topic, education level** on the first turn.
- Image upload (auto-downscaled ≤1568 px, vision analysis via GPT-4o).
- PDF upload (text extraction via `pdfjs-dist`; scanned PDFs routed to vision).
- **Explain-It-Back** — after an explanation, the student explains it back; scored on accuracy / completeness / reasoning; misconceptions feed the Error Journal.
- Mode-aware: GUIDED uses Socratic questions, AI-FREE refuses help until the student submits an attempt.

### Independent Practice (home page)
- 13 seeded problems across Math, Physics, CS, Chemistry, Biology.
- Filters: subject × difficulty × mode (Dependent / Guided / Adaptive / Independent / AI-Free).
- 6-level progressive hint ladder — the engine gives the *minimum necessary* assistance.
- Confidence checks before result reveal; reflection prompts after finish.
- **Mock-engine fallback**: if `OPENAI_API_KEY` is missing or OpenAI errors out, the rule-based engine in `lib/independent-engine.ts` takes over transparently.

### My Learning dashboard (`/dashboard`)
- Independence Score + AI Dependency meter (this-week vs last-week trend).
- AI-Free success rate.
- Knowledge vs Confidence matrix (under / over / balanced per topic).
- Mistake DNA (% breakdown by mistake type).
- Exactly one **Next Best Action** with a working CTA.
- Error Journal with occurrence counts.
- Recent voice + text sessions.
- Achievements (first independent solve, streaks, hint saver, thinker, self-learner, AI-free master).

### History (`/history`)
- Voice + text conversations, ALL / TEXT / VOICE filters, click to reopen and continue.

### Settings (`/settings`)
- Education level, preferred language, default learning mode, avatar gender, voice speed.

## Tech stack

- **Next.js 14.2** (App Router, TypeScript, React Server Components + `"use client"`)
- **Prisma 6.x** + **SQLite** (enums supported; single-file dev.db, zero setup)
- **Tailwind CSS** (custom `mint` / `coral` / `ink` palette, voice + avatar animations, RTL helpers)
- **OpenAI SDK** (`gpt-4o-mini` default; `gpt-4o` for vision)
- **bcryptjs** for password hashing
- **pdfjs-dist 4.10** legacy build for PDF extraction
- **Web Speech API** for STT/TTS (no server-side audio deps)
- **Zod** for validation
- Auth: opaque session token in an `httpOnly` cookie (`emai_session`, 30-day expiry). Edge middleware checks cookie presence; real session + ownership validation per route in `lib/auth.ts`.

## Running it locally

### 1. Prerequisites

- **Node.js ≥ 20** (Node 24 tested)
- **Chrome or Edge** for full voice support (Edge has the best Urdu `ur-PK` online voices; stock Windows often lacks a local Urdu TTS voice)
- An **OpenAI API key** — optional but recommended. Without it, the mock engine runs everything except chat/voice streaming.

### 2. Install & set up

```bash
cd "Educational Mentor AI"
cp .env.example .env      # then add your OPENAI_API_KEY (optional)
npm install
npx prisma migrate dev    # creates SQLite schema in prisma/dev.db
npx prisma db seed        # seeds demo student + 13 problems + 76 subjects + 332 topics + 10 teacher profiles
```

Or one-shot:

```bash
npm run setup             # install + migrate + seed (alias defined in package.json)
```

### 3. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Register a new account — there is no auto-created demo student anymore.

### 4. Try it

1. **Register** at `/register` (email + password + name + education level). Already-registered emails get a friendly 409.
2. **Home** — browse 13 problems, filter by subject / difficulty / mode, click **Start** to open a session. Submit an attempt; notice the AI evaluates reasoning, classifies mistakes, and offers progressively stronger hints only when asked.
3. **Ask Anything** (`/ask`) — type any question in English, Urdu, or Roman Urdu. Try uploading an image of a handwritten problem or a PDF page.
4. **Voice Teacher** (`/voice`) — pick a mode, language, and avatar, then tap the mic. Tap again to interrupt.
5. **My Learning** (`/dashboard`) — independence score, AI dependency trend, mistake DNA, knowledge vs confidence, next best action.
6. **History** (`/history`) — reopen any conversation.
7. **Settings** (`/settings`) — change level, language, mode, avatar, voice speed.

## Environment variables

Create a `.env` at the project root (never committed):

```env
DATABASE_URL="file:./dev.db"
OPENAI_API_KEY="sk-..."                 # optional — enables real LLM; mock engine runs without it
# OPENAI_MODEL="gpt-4o-mini"            # override default model
# SESSION_DAYS=30                       # cookie / session TTL in days
```

`.gitignore` excludes `.env`, `prisma/*.db*`, and `node_modules/`.

## API map

All authenticated endpoints read the student from the session cookie — never from the request body. Foreign IDs return `404` (not `403`) to avoid enumeration.

| Method | Route | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Create account (email + password) |
| POST | `/api/auth/login` | Issue session cookie |
| POST | `/api/auth/logout` | Clear session |
| GET | `/api/auth/me` | Current student profile |
| GET | `/api/problems` | List seeded problems |
| POST/GET | `/api/sessions` | Create / list practice sessions |
| GET | `/api/sessions/[id]` | Read session + attempts |
| POST | `/api/sessions/[id]/attempt` | Submit attempt (real LLM + mock fallback) |
| POST | `/api/sessions/[id]/hint` | Request next hint level |
| POST | `/api/sessions/[id]/confidence` | Record confidence check |
| POST | `/api/sessions/[id]/reflection` | Record reflection |
| POST | `/api/sessions/[id]/finish` | Close session, recompute score, emit next action |
| GET | `/api/independence` | Dashboard metrics |
| GET | `/api/achievements` | Earned achievements |
| POST/GET | `/api/conversations` | Create / list Ask Anything or voice conversations |
| GET/DEL | `/api/conversations/[id]` | Read or delete conversation |
| POST | `/api/conversations/[id]/messages` | Send message (SSE streaming reply) |
| GET | `/api/subjects`, `/api/topics` | Subject catalog + topics |
| POST | `/api/explain-back` | Submit and score an explain-back |
| GET | `/api/analytics/ai-dependency` | AI dependency score + trend |
| GET | `/api/analytics/mistake-dna` | Mistake breakdown by type |
| GET | `/api/analytics/knowledge-confidence` | Per-topic matrix |
| GET/PATCH | `/api/next-action`, `/api/next-action/[id]/complete` | Next best action |
| POST | `/api/challenge`, `/api/challenge/[id]/submit` | Generate and grade challenge |
| GET | `/api/mistakes` | Error journal |
| GET/PATCH | `/api/settings` | Read / update student settings |

## Project layout

```
app/
  (app)/                    # authenticated route group (layout checks session)
    page.tsx                # home: hero + feature cards + problem browser
    ask/page.tsx            # Ask Anything chat
    voice/page.tsx          # Voice Teacher
    dashboard/page.tsx      # My Learning
    history/page.tsx        # Conversations
    settings/page.tsx       # Profile / language / mode / avatar / voice
    session/[id]/page.tsx   # Practice session
  login/, register/         # public auth pages
  api/                      # REST endpoints (see table above)
  layout.tsx                # root + fonts (Inter, JetBrains Mono, Noto Naskh Arabic)
  error.tsx, not-found.tsx  # global error boundaries
components/
  layout/navbar.tsx
  chat/                     # chat-view, message-bubble, composer, uploads
  voice/                    # voice-console, avatar, mic-button, transcript
  dashboard/                # score-ring, metrics-grid, hint-trend, achievements
  session/                  # session-view, problem-card, attempt-input, feedback, hints
  ui/                       # error-state, loading-dots, empty-state
lib/
  db.ts                     # Prisma singleton
  auth.ts                   # session create / get / require
  ai/
    client.ts               # OpenAI singleton (server-only)
    prompts.ts              # system prompt builder (stable → volatile for caching)
    detect.ts               # turn-1 language/subject/topic/level detection
    mentor.ts               # streaming chat replies with <<<META>>> sentinel
    evaluate.ts             # attempt analysis (real LLM + mock fallback)
    explain-back.ts         # score student explanations
    challenge.ts            # generate + grade challenges
    errors.ts, schemas.ts
  voice/
    use-recognition.ts      # STT hook (auto-restart, storm guard, silence debounce)
    use-speech.ts           # TTS hook (ur-PK preference, sentence queue, interruption)
  stream-client.ts          # SSE reader for the chat client
  independent-engine.ts     # mock engine + hint ladder (fallback)
  scoring.ts                # independence score, achievements, adaptation
  analytics.ts              # AI dependency, mistake DNA, knowledge vs confidence
  language.ts               # script heuristic, RTL detection, sentence split
  subjects-catalog.ts       # 76 subjects across school/college/university
  teacher-profiles.ts       # per-subject + category fallback profiles
prisma/
  schema.prisma             # data model (SQLite, 6 enums, ~20 models)
  seed.ts                   # idempotent upserts (safe to re-run)
  migrations/               # schema history
types/
  speech.d.ts               # Web Speech API typings
```

## Data model (highlights)

```
Student ──┬── AttemptSession ─── Attempt / HintEvent / ConfidenceCheck / Reflection
          ├── Achievement
          ├── IndependentScore
          ├── Conversation ─── Message        (Ask Anything + voice)
          ├── MistakeRecord                   (Error Journal, deduped by occurrences)
          ├── KnowledgeRecord                 (per subject+topic mastery)
          ├── ConfidenceRecord                (per topic, with actualCorrect)
          ├── ExplainBack                     (scored student explanations)
          ├── NextBestAction                  (exactly one PENDING at a time)
          └── Challenge                       (generated problems, hidden solutions)
Subject ──── Topic                            (seeded catalog)
TeacherProfile                                (per subjectKey or category fallback)
AuthSession                                   (opaque token, 30-day expiry)
```

## Known constraints

- **Urdu TTS** depends on browser voice availability. Microsoft Edge exposes online `ur-PK` voices; stock Windows typically does not ship a local Urdu voice. Text chat always works regardless. The app probes capabilities at runtime and shows an honest banner when no Urdu voice is available.
- **Tap-to-interrupt**, not true barge-in — real echo cancellation requires dedicated hardware. STT is paused while TTS speaks and auto-resumes ~250 ms after.
- **Streaming** relies on `Cache-Control: no-transform` + `X-Accel-Buffering: no` + `runtime="nodejs"`. Behind a reverse proxy that forces buffering, first-byte latency will degrade.
- **SQLite** is fine for a single-developer / single-server deployment. For multi-process or production scale, swap the Prisma provider (the schema itself is portable).

## Where the mock engine still runs

The rule-based engine in `lib/independent-engine.ts` is kept as a **deterministic fallback** — it runs whenever `OPENAI_API_KEY` is missing or the OpenAI call fails. It also owns the hint ladder (`nextAction` / `nextHintLevel`); pedagogy and AI-free gating never sit at the model's mercy. The LLM only classifies (`isCorrect`, `reasoning`, `mistakeType`).

## License

Private prototype — not for redistribution.
