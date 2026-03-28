# Clearity

**Clear your mind, find your clarity.**

Clearity is a personal thought-organizing app that helps you untangle complex thoughts, find direction, and gain clarity when your mind feels overwhelmed. It's not a therapist or a counseling service — it's a mirror for your mind that reflects your thinking back in an organized way, helping you see patterns you couldn't see on your own.

## What It Does

- **Thought Canvas** — Type what's on your mind and watch it get extracted into keywords, visualized as a solar system where frequently revisited topics gravitate toward the center
- **Deep Dive Chat** — Click any keyword to start a focused conversation with Clara, an AI thinking partner who helps you untangle that specific thought
- **Pattern Recognition** — Embedding-based similarity automatically connects related thoughts and tracks how often you revisit certain topics
- **Notes & Actions** — Save insights during conversations and track action items that emerge from your reflections
- **Session Clarify** — When a session ends, AI generates a summary with contradictions, reframings, and actionable next steps

## Tech Stack

- **Framework**: Next.js 14 (App Router) + React 18
- **Styling**: Tailwind CSS 4.2 + Shadcn UI (glassmorphism design)
- **AI**: Vercel AI SDK v6
  - `gemini-3-flash-preview` — Chat, greeting, keyword extraction, session analysis, tendency scoring
  - `gemini-embedding-001` — Vector embeddings for keyword similarity
- **Backend**: Supabase (auth, PostgreSQL, RLS)
- **Desktop**: Tauri v2
- **Mobile**: Capacitor
- **Monorepo**: pnpm 9.15 workspace + Turborepo

## Project Structure

```
clearity/
├── apps/
│   ├── web/                    # Next.js 14 main app
│   │   ├── app/                # App Router pages & API routes
│   │   └── src/
│   │       ├── pages/          # Page-level components
│   │       └── shared/         # Shared UI & hooks
│   ├── desktop/                # Tauri v2 desktop wrapper
│   └── mobile/                 # Capacitor mobile wrapper
├── packages/
│   ├── ui/                     # Shared UI components (Shadcn UI + Radix)
│   ├── lib/                    # Supabase client & shared utilities
│   └── tsconfig/               # Shared TypeScript configuration
```

### Package Dependencies

```
apps/web ──→ packages/ui
         ──→ packages/lib

apps/desktop ──→ apps/web (loads deployed Vercel URL)
apps/mobile  ──→ apps/web (loads deployed Vercel URL)
```

## Pages & API Routes

### Pages

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | ReflectionDashboard | Solar system keyword visualization, thought input |
| `/chat/[id]` | ClearityDashboard | Chat with Clara, note panel, session management |
| `/history` | HistoryPage | Session timeline, clarify summary modal |
| `/notes` | NotesPage | View/edit/delete saved notes |
| `/actions` | ActionsPage | Action items across all sessions |
| `/settings` | SettingsPage | API key, "About Me", account deletion |
| `/login` | LoginForm | Google OAuth sign-in |

### API Routes

| Route | Purpose |
|-------|---------|
| `POST /api/chat` | Stream chat responses (gemini-3-flash-preview) |
| `POST /api/greeting` | Generate contextual opening message |
| `POST /api/extract-keywords` | Extract keywords + embeddings from user input |
| `POST /api/sessions/[id]/clarify` | Generate session summary & user profile analysis |
| `POST /api/sessions/[id]/cleanup` | Delete empty sessions on page leave |
| `POST /api/account/delete` | Delete user account (service role) |
| `GET /auth/callback` | Google OAuth callback handler |

## Database (Supabase)

| Table | Description |
|-------|-------------|
| `chat_sessions` | Conversation sessions (id, title, status, user_id) |
| `messages` | Chat messages (session_id, role, content) |
| `session_keywords` | Extracted keywords with embeddings & hit_count |
| `keyword_relations` | Similarity scores between keywords |
| `session_notes` | Notes saved during conversations |
| `session_emotions` | Emotional tracking per session |
| `session_summaries` | AI-generated session summaries |
| `action_items` | Actionable tasks from sessions |
| `user_profiles` | Interests, patterns, assets, thresholds |
| `user_tendencies` | Thinking tendency scores (analytical/emotional, etc.) |
| `user_inputs` | Raw user input log with extracted keywords |

## Getting Started

### Prerequisites

- Node.js >= 20
- pnpm >= 9.15
- Rust toolchain (for desktop builds)
- Xcode / Android Studio (for mobile builds)

### Installation

```bash
pnpm install
```

### Environment Variables

Create `apps/web/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

Gemini API key is configured per-user in the app's Settings page (stored in browser localStorage).

### Development

```bash
# Web dev server
pnpm dev:web

# Desktop app (Tauri)
pnpm dev:desktop
```

### Build

```bash
# Web build
pnpm build:web

# Desktop build (.dmg)
pnpm build:desktop

# Mobile build (Capacitor sync)
pnpm build:mobile
```

## Core Concepts

### Solar System Visualization

Keywords are laid out using d3-force simulation:

- **Hit count** determines node size and center gravity — the most revisited topic becomes the "sun"
- **Embedding similarity** controls link distance — related thoughts cluster together
- **New thoughts** orbit outward until they prove connected to existing patterns

### Keyword Extraction & Dedup

1. User types a thought → Gemini extracts main keyword + sub keywords
2. Main keyword → Gemini Embedding API → 768-dim vector
3. Cosine similarity ≥ 0.85 → same topic (hit_count +1), < 0.85 → new topic

### Clara (AI Companion)

Clara is a sharp thinking partner, not a therapist. She:

- Gives one fresh insight or reframe, then asks one sharp question
- Matches the user's language (Korean/English)
- Never repeats what you just said or uses therapy-speak
- Keeps responses short and direct

### Auth

Google OAuth only, handled via Supabase Auth with middleware-based session management. All DB tables use RLS requiring `user_id`.

## Deployment

- **Web**: Vercel (`https://clearity-taupe.vercel.app`)
- **Desktop**: Tauri v2 wraps the Vercel URL in a native macOS window
- **Mobile**: Capacitor wraps the Vercel URL for iOS/Android
