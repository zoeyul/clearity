# Clearity

Next.js 14 기반 크로스 플랫폼 모노레포 프로젝트. 웹, 데스크톱(Tauri v2), 모바일(Capacitor)을 단일 코드베이스로 지원합니다.

## 기술 스택

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + Shadcn UI
- **Desktop**: Tauri v2
- **Mobile**: Capacitor
- **Backend**: Supabase
- **AI**: Vercel AI SDK
- **Monorepo**: pnpm workspace + Turborepo

## 프로젝트 구조

```
clearity/
├── apps/
│   ├── web/                    # Next.js 14 메인 앱
│   ├── desktop/                # Tauri v2 데스크톱 래퍼
│   └── mobile/                 # Capacitor 모바일 래퍼
├── packages/
│   ├── ui/                     # 공통 UI 컴포넌트 (Shadcn UI 기반)
│   ├── lib/                    # Supabase 연동 및 Vercel AI SDK 로직
│   └── tsconfig/               # 공유 TypeScript 설정
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

### 패키지 의존 관계

```
apps/web ──→ packages/ui
         ──→ packages/lib

apps/desktop ──→ apps/web (빌드 결과물 참조)
apps/mobile  ──→ apps/web (빌드 결과물 참조)
```

## 시작하기

### 사전 요구사항

- Node.js >= 20
- pnpm >= 9.15
- Rust 툴체인 (데스크톱 빌드 시)
- Xcode / Android Studio (모바일 빌드 시)

### 설치

```bash
pnpm install
```

### 개발

```bash
# 웹 개발 서버
pnpm dev:web

# 데스크톱 앱 (Tauri)
pnpm dev:desktop
```

### 빌드

```bash
# 웹 빌드
pnpm build:web

# 데스크톱 빌드
pnpm build:desktop

# 모바일 빌드 (Capacitor sync)
pnpm build:mobile
```

## 환경 변수

프로젝트 루트에 `.env.local` 파일을 생성하세요:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
```
