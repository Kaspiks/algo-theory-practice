# QA Report — Turing Machine Study App

**Date:** 2026-04-04  
**Scope:** Engine, grading, content pack, tracing UI, Docker docs.

---

## 1. TM engine correctness

**Status: Pass** (with documented conventions)

- `step()` applies write → head move (R extends tape with blank; L respects `leftEnd` policy; S keeps head).
- Accept/reject halting matches `haltStatusForState` after transitions.
- Undefined δ: immediate transition to `q_reject` without mutating the tape; consistent with curriculum “implicit reject”.
- `peekNextAnswer()` for undefined δ returns a **synthetic** triple `(q_reject, read, S)` so MCQ grading can match without a real transition row. This matches `gradeNextTransition` / `step()` outcomes for all current exercises.

**Tests:** `tests/lib/tm/engine.test.ts` — scan binary paths, stay move on accept, undefined δ + peek.

**Non-issue:** `peekNextAnswer` is `null` only in accept/reject states (not “no transition while still in a non-halt state”).

---

## 2. Answer checking correctness

**Status: Pass** (after fix)

- **Fix applied:** `collectAllAnswers()` now **deduplicates** transition triples so dynamic MCQs do not show two choices with the same `(next, write, move)` (pedagogy / fairness).
- `gradeNextTransition` compares to `peekNextAnswer`; first-step authored options validated by `tests/content/pack.test.ts`.

**Tests:** `tests/lib/grading/nextTransition.test.ts` — grading vs `step`, implicit reject, unique MCQ options.

---

## 3. Exercise content vs curriculum

**Status: Pass (spot check)**

- Blank symbol ⊔, explicit accept/reject, scan / return / mark patterns align with `curriculum/tm-patterns.md` and `notation-guide.md`.
- Pack ordering by difficulty; hints reference curriculum-style IDs in `src/content/hints.ts`.
- All exercises: first-step MCQ matches engine (`pack.test.ts`).

**Residual risk:** Course-specific slide shorthand (e.g. diagram-only notation) may differ; reconcile when `materials/` are available.

---

## 4. UI clarity (tracing / next-transition flow)

**Status: Improved**

- **Change:** Configuration strip shows **state**, **head index**, and **tape symbol read** (with blank rendered like the tape), plus `aria-live="polite"` on the strip for screen reader updates when stepping.
- **Change:** Question panel footnote explains δ option format (next state, write, L/R/S).

Tape head cell remains visually highlighted in `TapeViewer`; diagram highlights current state in `StateDiagramViewer`.

---

## 5. Docker & README

**Status: Pass** (after doc tweak)

- `docker compose up --build` starts dev on **5173** with bind mount and `node_modules` volume.
- Production: `docker compose --profile prod up --build` builds and serves on **8080** → nginx **80**.
- **Change:** README production commands now include `--build` so first-time prod runs match a fresh image.

---

## 6. Critical issues fixed in this pass

| Issue | Severity | Action |
|-------|----------|--------|
| Duplicate distractors in dynamic MCQ | Medium | Deduplicate `collectAllAnswers` |
| Tracing UI: state/head/read not summarized | Medium | Configuration strip + `aria-live` |
| δ option format unexplained | Low | QuestionPanel helper text |
| Prod Docker “up” without rebuild | Low | README `--build` for prod |

---

## 7. Suggested follow-ups (non-blocking)

- Add `fired` on undefined δ for diagram edge highlight consistency.
- Expand visual layouts for larger machines in `StateDiagramViewer`.
- Optional: `npm run test` in `Dockerfile.dev` CI stage or compose `test` service.

---

## 8. Verification command

```bash
npm test && npm run build
```

---

## 9. Follow-up QA (UI / animation / diagram)

See **`qa/QA-REPORT-UI-2026-04-04.md`** for regression QA on fullscreen diagram, layout, step animation, and playback (includes a **critical animation timer fix** in `MvpPlayer`).
