# Voyager AI — Project Conventions

## Overview
AI-powered business travel platform. Next.js 15 (App Router) + TypeScript + Prisma + PostgreSQL + Claude API.

## Commands
- `npm run dev` — Start dev server (port 3000)
- `npm run build` — Production build
- `npx prisma generate` — Regenerate Prisma client after schema changes
- `npx prisma db push` — Push schema changes to database
- `npx prisma studio` — Database GUI
- `npx prisma db seed` — Run seed script

## Architecture
- **App Router** — all routes under `src/app/`
- **Route groups** — `(auth)` for login/register, `(dashboard)` for authenticated pages
- **API routes** — `src/app/api/` for backend endpoints
- **Server Components** by default, `"use client"` only when needed (interactivity, hooks, browser APIs)
- **Prisma** for all database operations — import from `src/lib/prisma.ts`
- **Auth.js v5** for authentication — import from `src/lib/auth.ts`

## Code Style
- TypeScript strict mode — no `any` types
- Use `interface` for object shapes, `type` for unions/intersections
- Named exports only (no default exports except pages)
- Async server components for data fetching
- Use Zod for API request validation
- Tailwind CSS for styling — no CSS modules or styled-components
- shadcn/ui components from `@/components/ui/`
- Import paths use `@/` alias (maps to `src/`)

## File Organization
- Components: `src/components/{feature}/ComponentName.tsx`
- API integrations: `src/lib/{service}/` (e.g., `src/lib/travel/amadeus.ts`)
- Types: `src/types/{domain}.ts`
- Zustand stores: `src/stores/{name}-store.ts`
- Each team has designated directories — don't modify other teams' files

## API Keys
All API integrations use real sandbox/test APIs — NO mock data, NO hardcoded responses.
- Amadeus: test environment (realistic but free)
- Duffel: test mode
- FlightAware: developer tier
- Claude: standard API

## Database
- PostgreSQL via Prisma
- Schema in `prisma/schema.prisma`
- Run `npx prisma generate` after any schema change
- Use transactions for multi-table operations
- Always include error handling for DB operations

## Error Handling
- API routes return proper HTTP status codes with JSON error bodies
- Use try/catch in server actions and API routes
- Display user-friendly error messages in UI (toast notifications via shadcn)
- Log errors server-side with context

## Key Patterns
- **AI Chat**: Streaming responses via Claude API with tool calling
- **Policy Checking**: Every booking runs through policy engine before confirmation
- **"AI proposes, human confirms"**: Never auto-execute actions without user approval
- **Receipt OCR**: Use Claude Vision (multimodal) for receipt parsing — no external OCR API needed
