# AGENTS.md

## Cursor Cloud specific instructions

This is a **purely client-side** React + TypeScript app (Vite build toolchain, Tailwind CSS). No backend, database, or API keys are needed.

### Quick reference

| Task | Command |
|------|---------|
| Install deps | `npm install` |
| Dev server | `npm run dev` (http://localhost:5173) |
| Run tests | `npm test` (Vitest, 164 tests, Node environment) |
| Type check | `npx tsc --noEmit` |
| Production build | `npm run build` |

### Notes

- The project uses `package-lock.json` — use **npm** (not pnpm/yarn).
- Vite dev server binds to `localhost` by default; pass `--host 0.0.0.0` if you need external access.
- There is no ESLint config in the repo; `npx tsc --noEmit` is the primary static check.
- Path alias `@/*` maps to `src/*` (configured in `tsconfig.json` and `vite.config.ts`).
