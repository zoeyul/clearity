# Clearity Web

Next.js web application deployed on Vercel.

## Development

```bash
pnpm dev:web
```

Opens at `http://localhost:3000`.

## Deployment

Deployed automatically via Vercel on push to `main`.

**Live URL:** https://clearity-taupe.vercel.app

### Environment Variables (Vercel Dashboard)

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY`

### Manual Deploy

```bash
pnpm build:web
```
