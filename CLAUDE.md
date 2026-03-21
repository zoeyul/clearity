# Clearity Project Guidelines

## About Clearity
A "cognitive mirror" that reflects the user's complex mind. The goal is to prune unnecessary branches and leave only the essential core.

### Slogan
"Clear your mind, find your clarity"

### Target User
People who think a lot, feel stuck, and want a structured way to process their thoughts — not people in crisis or seeking mental health treatment.

### Clara (The Insightful Compass) — AI Companion
- An intellectual partner who clarifies the user's confusion and proposes new perspectives
- Not a "Question-Bot": Provide insight first, limit to one question at the end

### Core Logic
- **Hypothetical Diagnosis:** Define the user's psychological deadlock or contradiction in a single sentence
- **Personality Insight:** Feedback on how thought patterns (perfectionism, risk aversion, need for approval) affect current concerns
- **Reframing:** Propose a new perspective or alternative direction to break the frame the user is stuck in
- **Data-Driven Connection:** Use specific figures, people, or events mentioned by the user as logical evidence

### Flow & Closing Rules
- **Insight 70%, Question 30%:** Analysis and suggestions first, one question at the end
- **No Methodological Interrogation:** Never ask "How will you do it?" or "What is the plan?"
- **Flexible Closing:** If the user has decided or clarified, summarize and give choice to continue or stop
- **Concise Directness:** Remove cliché empathy, use bold text to highlight core insights


---

## UI Theme Rules

### Background
- Base color: `bg-[#f0f4f4]` (light), `bg-[#1a1d1d]` (dark)
- Mesh blobs: `#d0e4e4`, `#c8dede`, `#dceaea` with `blur-[120px]`
- Always add `absolute inset-0 backdrop-blur-3xl` layer between blobs and content
- Noise texture overlay at `opacity-[0.02]`
- All pages must use identical background (login, dashboard, chat)

### Glass Cards
- Use CSS classes from `globals.css`: `glass`, `glass-subtle`, `glass-interactive`, `glass-solid`
- NEVER modify `globals.css` glass classes without explicit permission
- NEVER add color to glass cards — cards are transparent white only
- Color comes from background blobs, not from cards
- No `saturate()` changes without permission

### Common Components
- Always use `<LeftSidebar />` from `@/components/dashboard/left-sidebar` — never inline sidebar
- All pages share the same sidebar component for consistency
- Logo: Sparkles icon from lucide-react, `glass-solid` background, `h-10 w-10 rounded-2xl`

### Layout Structure
- Content wrapper: `relative z-10 flex h-full w-full gap-4 p-4 lg:gap-5 lg:p-5`
- Sidebar: `w-[280px] shrink-0 h-full`
- Main content: `flex-1 min-h-0 h-full`

### Color Palette
- Text: `zinc-800` (primary), `zinc-500` (secondary), `zinc-400` (muted)
- Dark mode text: `zinc-100`, `zinc-400`, `zinc-500`
- Buttons/Logo: `glass-solid` (monochrome dark)
- No teal, indigo, emerald, or any saturated color in card elements

### Fonts
- Primary: Plus Jakarta Sans (`--font-sans`)
- Korean: Pretendard (`--font-kr`)

### Supabase
- All DB inserts must include `user_id: user.id` (RLS requires it)
- Browser client: `createBrowserClient` from `@supabase/ssr`
- Server client: `createServerSupabaseClient` from `@clearity/lib/supabase/server`
- Env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

### Auth
- Google OAuth only (no email/password)
- Middleware at `apps/web/middleware.ts` handles session refresh + route protection
- Unauthenticated → `/login`, authenticated on `/login` → `/`

---

## Core Logic: Thought Canvas Pipeline

### 1. Data Creation (Input & Extraction)
- **Input**: User's raw sentence (e.g. "도예 배우고 싶은데 돈이 걱정돼")
- **Extraction (Gemini)**:
  - Main keyword: "도예와 비용" → capsule node on canvas
  - Sub keywords: ["장비값", "수입 불안정", "초기 투자"] → displayed inside note card

### 2. Similarity & Deduplication (hit_count)
- **Target**: Main keywords only (short phrase), NOT full sentences
- **Method**: Main keyword text → Gemini Embedding API → vector
- **Compare**: Cosine similarity against existing main keyword vectors in DB
- **Why short phrase**: "도예" ↔ "취미" connects more clearly than full sentence embeddings
- **Dedup logic**:
  1. New keyword extracted → compute similarity with all existing main keywords
  2. Similarity ≥ 0.85 → **same topic**: no new record, existing keyword's `hit_count` +1, `updated_at` refreshed
  3. Similarity < 0.85 → **new topic**: create new record with `hit_count = 1`

### 3. Dashboard Layout — Solar System Model
Think of it as: **center keyword = sun, related keywords = orbiting planets**

#### A. Node Mass/Size
- `hit_count` higher → capsule visually larger
- Most frequently thought-about topic is most prominent

#### B. Center Gravity (`forceX`/`forceY`)
- `hit_count` higher → stronger pull toward canvas center
- Highest `hit_count` keyword naturally anchors at center like a sun
- If no hit_count data → newest keyword at center

#### C. Link Distance (Similarity Lines)
- Similarity score **only** controls line length between nodes
- High similarity (e.g. 0.9) → short distance (nodes stay close, ~100px)
- Low similarity → long distance (nodes drift apart)
- Even low `hit_count` keywords cluster near center if highly similar to the center keyword

#### D. Visual Result
- **Center cluster**: Most-thought keyword + highly similar recent keywords, tightly grouped
- **Outer fragments**: Low `hit_count` AND low similarity to center = lonely nodes floating at edges

#### E. d3-force Parameters
- `forceManyBody` (repulsion): All nodes repel each other (prevent overlap)
- `forceLink` (attraction): `strength = similarity * 1.5` (higher similarity = tighter rubber band)
- `forceX`/`forceY` (center gravity): Strength proportional to `hit_count` (pulls heavy nodes to center)
- `forceCollide`: Prevent node overlap

### 4. Note UI (Detail View)
- **Action**: Click a main node (capsule)
- **Result**: Dashed line extends from capsule → note card appears
- **Note content**: Sub keywords as text (e.g. #장비값, #수입 불안정...)
- **Bottom**: "Deep Dive →" button to start a focused chat session on that keyword
