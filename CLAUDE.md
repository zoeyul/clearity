# Clearity Project Guidelines

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
