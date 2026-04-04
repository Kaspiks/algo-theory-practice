# Project Structure

This layout targets **Vite + React + TypeScript + Tailwind**, client-only, Dockerized. It separates **TM execution**, **grading**, **declarative content**, and **UI** so `tm_engine_agent`, `ui_gameplay_agent`, and `content_agent` can work in parallel.

---

## Repository layout (proposed)

```text
algo-theory/
├── architecture/              # Design docs (this folder)
├── curriculum/                # Learning requirements (input to architecture)
├── materials/                 # Course source (not committed or optional)
├── public/
├── src/
│   ├── app/                   # App shell, providers, global layout
│   │   ├── App.tsx
│   │   ├── routes.tsx         # React Router route table
│   │   └── providers.tsx    # Mode, theme (optional)
│   ├── pages/                 # Route-level screens (thin)
│   │   ├── HomePage.tsx
│   │   ├── ExerciseListPage.tsx
│   │   ├── ExercisePlayerPage.tsx
│   │   └── SessionResultsPage.tsx
│   ├── features/
│   │   └── exercise-player/   # Player feature: tape, diagram, question, feedback
│   │       ├── components/
│   │       ├── hooks/
│   │       └── exercise-player.types.ts  # UI-local types only if needed
│   ├── components/            # Shared presentational components
│   │   ├── ui/                # Buttons, panels, typography (design system)
│   │   └── tm/                # Reusable TM visuals: TapeStrip, StateNode, etc.
│   ├── lib/
│   │   ├── tm/                # TM engine (pure, no React)
│   │   │   ├── engine.ts      # step(), runUntil(), initial config
│   │   │   ├── types.ts       # Re-export or colocate with src/types/tm.ts
│   │   │   └── tape.ts        # Tape helpers, blank normalization
│   │   └── grading/           # Pure functions: compare answers to canonical
│   │       ├── nextTransition.ts
│   │       ├── tapeResult.ts
│   │       ├── missingTransition.ts
│   │       ├── strategy.ts
│   │       └── tracing.ts
│   ├── content/               # Declarative data only (no engine imports)
│   │   ├── machines/          # Named machine definitions
│   │   ├── packs/             # Content packs (optional grouping)
│   │   ├── exercises/         # Exercise objects (import machines by id)
│   │   ├── hints.ts           # Map hint id → string (from curriculum IDs)
│   │   └── index.ts           # Registry: all exercises, lookup by id
│   ├── hooks/                 # Cross-feature hooks (e.g. useSessionMode)
│   ├── types/                 # Shared TS domain types (see data-model.md)
│   │   ├── tm.ts
│   │   ├── exercise.ts
│   │   └── session.ts
│   ├── styles/
│   │   └── index.css          # Tailwind entry
│   └── main.tsx
├── tests/
│   ├── lib/tm/                # Engine unit tests (priority)
│   ├── lib/grading/
│   └── setup.ts
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
├── package.json
├── Dockerfile.dev
├── Dockerfile.prod
├── docker-compose.yml
└── README.md
```

---

## Dependency rules (enforced by convention / ESLint)

| Layer | May import |
|-------|------------|
| `lib/tm`, `lib/grading` | Only other `lib/*` utilities, `types/*` |
| `content/*` | Only `types/*` (and static assets if any) — **no** `lib/tm` in exercise files; machines are plain data |
| `features/*`, `pages/*`, `components/*` | `lib/*`, `types/*`, `content/*` (registry), React |
| `app/*` | Everything |

**Rationale:** Keeps the engine testable without a DOM and lets QA run pure tests on transitions and graders.

**Exception:** A thin **build-time or `content/validate.ts` script** (optional) may import `lib/tm` to verify that every exercise’s machine and solution are consistent. That script is not part of the runtime bundle if desired.

---

## Path aliases (recommended)

In `vite.config.ts` / `tsconfig`:

- `@/` → `src/`
- `@/lib/` → `src/lib/`
- `@/types/` → `src/types/`
- `@/content/` → `src/content/`

---

## Testing placement

- **Unit:** `tests/lib/tm/**` — step function, tape growth, left-end policy, undefined transitions, max steps.
- **Unit:** `tests/lib/grading/**` — one file per question mode; golden cases from `content`.
- **Component tests (optional later):** colocated `*.test.tsx` or `tests/components/**`.

---

## Docker

Existing `Dockerfile.dev` / `Dockerfile.prod` / `docker-compose.yml` should assume:

- Dev: mount `src`, run Vite on a fixed port.
- Prod: multi-stage build → static `dist/` → nginx (or similar).

No backend services.

---

## Alignment with curriculum

- **Exercise packs:** `content/exercises/*.ts` + `content/machines/*.ts` match `exercise-spec.md` (policies per machine, modes, hints by ID).
- **Patterns / skills:** Use `tags` and `skills` string arrays on exercises (`tm-patterns.md`, `skills-map.md`).
- **Notation:** Blank rendering and policies live on **machine definition** or **exercise pack defaults** (`notation-guide.md`).

---

## What v1 explicitly does **not** include

- Free-form TM editor as the main product surface.
- Backend or auth.
- Nondeterministic TM (reserved for future types in `data-model.md`).
