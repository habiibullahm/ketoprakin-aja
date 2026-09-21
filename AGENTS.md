# Repository Guidelines

## Project Structure & Module Organization

- `frontend/` contains the React 19 + Vite client. Keep screens in `frontend/src/pages/customer/` or `frontend/src/pages/merchant/`, reusable UI in `frontend/src/components/`, and API/auth helpers in `frontend/src/lib/`.
- `backend/` contains the Hono API. Routes live in `backend/src/routes/`, shared middleware and helpers in `backend/src/middleware/` and `backend/src/lib/`, and Drizzle schema/connection code in `backend/src/db/`.
- `frontend/public/` holds static PWA assets. `docs/` contains product and technical references. Root Docker Compose and Vercel files define deployment behavior.

## Build, Test, and Development Commands

Install dependencies separately for each workspace:

```powershell
cd frontend; npm install
cd ..\backend; npm install
```

- `cd backend; npm run db:init` creates the configured PostgreSQL schema and seed data.
- `cd backend; npm run dev` starts the API with file watching on port `3000`.
- `cd frontend; npm run dev` starts Vite, normally on port `5173`.
- `npm run build` in either workspace type-checks and produces production output.
- `cd frontend; npm run lint` runs Oxlint.
- `cd backend; npm test` runs Node's built-in test runner through `tsx`.
- `cd frontend; npm run test:e2e` runs Playwright browser flows; start the backend and frontend first.

## Coding Style & Naming Conventions

Use TypeScript throughout. Match the existing two-space indentation, double quotes, and no-semicolon style. Name React components and page files in `PascalCase` (for example, `OrderTracking.tsx`); use `camelCase` for functions, variables, and route modules such as `orders.ts`. Prefer explicit types at API boundaries and validate request data with Zod. Reuse existing `components/ui` primitives and Tailwind utilities instead of introducing new UI dependencies.

## Testing Guidelines

Place backend unit tests next to the implementation as `*.test.ts`, using `node:test` and `node:assert/strict`. Keep tests deterministic and cover malformed input at trust boundaries. Add end-to-end journeys to `frontend/tests/` with Playwright; use behavior-oriented names such as `guest checkout validates WhatsApp`.

## Commit & Pull Request Guidelines

Follow the existing Conventional Commit pattern: `feat: complete merchant workflow`, `fix: support Neon pooler connections`, or `docs: update deployment guide`. Keep commits focused. Pull requests should describe the user-visible effect, list relevant checks, link a provided issue, and include screenshots for visual frontend changes. Do not commit `.env` files, JWT secrets, database URLs, or Vercel local metadata.
