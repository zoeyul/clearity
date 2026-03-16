# Clearity

A cross-platform monorepo project built on Next.js 14. Supports web, desktop (Tauri v2), and mobile (Capacitor) from a single codebase.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + Shadcn UI
- **Desktop**: Tauri v2
- **Mobile**: Capacitor
- **Backend**: Supabase
- **AI**: Vercel AI SDK
- **Monorepo**: pnpm workspace + Turborepo

## Project Structure

```
clearity/
├── apps/
│   ├── web/                    # Next.js 14 main app
│   ├── desktop/                # Tauri v2 desktop wrapper
│   └── mobile/                 # Capacitor mobile wrapper
├── packages/
│   ├── ui/                     # Shared UI components (Shadcn UI based)
│   ├── lib/                    # Supabase client & Vercel AI SDK logic
│   └── tsconfig/               # Shared TypeScript configuration
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

### Package Dependencies

```
apps/web ──→ packages/ui
         ──→ packages/lib

apps/desktop ──→ apps/web (references build output)
apps/mobile  ──→ apps/web (references build output)
```

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

# Desktop build
pnpm build:desktop

# Mobile build (Capacitor sync)
pnpm build:mobile
```

## Environment Variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
```
