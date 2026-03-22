# Clearity Desktop

macOS desktop app built with Tauri v2. Wraps the Vercel-hosted web app in a native window.

## Prerequisites

- [Rust](https://rustup.rs/) (`curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`)
- Xcode Command Line Tools (`xcode-select --install`)

## Development

```bash
pnpm dev:desktop
```

Launches a native window loading `http://localhost:3000` (Next.js dev server starts automatically).

## Build

```bash
cd apps/desktop && pnpm build
```

Output: `src-tauri/target/release/bundle/dmg/Clearity_<version>_aarch64.dmg`

## Distribution

### GitHub Releases (Current)

1. Build the `.dmg` locally
2. Create a GitHub release and attach the `.dmg`

### Mac App Store (Future)

Requires Apple Developer Program ($99/year), code signing, and notarization.

### Auto-build with GitHub Actions (Future)

Use [tauri-action](https://github.com/tauri-apps/tauri-action) to build `.dmg` automatically on push/tag.

## Notes

- Production build loads `https://clearity-taupe.vercel.app` in the webview
- Dev mode loads `http://localhost:3000`
- `src-tauri/target/` and `src-tauri/gen/` are gitignored
