# QA Report — UI, diagram, and step animation (2026-04-04)

**Scope:** Fullscreen/modal diagram, auto layout & readability, staged step animation, playback controls, exercise flow.  
**Methods:** `npx tsc --noEmit`, `npm test`, `npm run build`, targeted code review of `MvpPlayer`, `StateDiagramExpandable`, `StateDiagramViewer`, `TapeViewer`, `stepAnimation`, engine/grading (unchanged contracts).

---

## Executive summary

| Area | Result |
|------|--------|
| Core exercise / TM logic | **Pass** (engine & grading covered by tests; UI defers to `step()` / `gradeNextTransition`) |
| Fullscreen diagram | **Pass** (code review: portal, backdrop, Escape, Close, props forwarded) |
| Diagram layout / readability | **Pass** (code review + layout module; truncation of very long edge labels is intentional) |
| Step animation & playback | **Fixed critical bug** then **Pass** (see below) |
| TypeScript / build | **Pass** |
| Manual browser | **Not executed** in this pass (recommend smoke test checklist below) |

---

## 1. Core exercise flow

**Status: Pass (by test + code paths)**

- MCQ submit: `handleSubmit` guards `halted`, `!mcq`, `isAnimating`; wrong path sets error feedback; correct path calls `step()` once then either instant `applyStepResult` or `runStepFromEngine`.
- Halt / accept / reject: unchanged `engine.step` + `peekNextAnswer`; feedback uses `status` from step result.
- `Show correct step`: study-only, uses same `step()` as oracle; respects `animateSteps`.

**Residual risk:** Rapid double-click **Check answer** before React re-renders could theoretically fire twice; `selectedId` is cleared only after success. Low severity; optional hardening with a synchronous ref lock.

---

## 2. TM logic integrity

**Status: Pass**

- No TM rules in UI animation layer: animation uses precomputed `before` / `after` / `fired` from `step()`.
- **Tests:** `tests/lib/tm/engine.test.ts`, `tests/lib/grading/nextTransition.test.ts`, `tests/content/pack.test.ts` — all green.

---

## 3. Fullscreen diagram behavior

**Status: Pass (code review)**

- **Expand diagram** → `setOpen(true)`, portal to `document.body`.
- **Close:** header button; **Escape** (`keydown` on `document` while open); **outside** = full-screen `button` backdrop (`aria-label="Close diagram"`).
- **Body scroll** locked while open; restored on unmount.
- **Props:** `currentState`, `displayState`, `lastTransition`, `transitionHighlight`, pulse/hint props forwarded to both embedded and modal `StateDiagramViewer` (`svgIdPrefix` differs — no marker id clash).
- **Long state names:** layout uses label-based node sizing in `diagramLayout.ts` (not re-verified pixel-perfect here).

**Manual check recommended:** Open modal during an active step animation and confirm diagram matches embedded highlights.

---

## 4. Diagram layout / readability

**Status: Pass (code review)**

- Auto layout + optional legacy positions; `computeDiagramViewBox` pads view.
- Edge labels truncated beyond `edgeLabelMaxChars` in SVG (expanded allows more).
- Accept/reject: double ring + terminal styling preserved.

---

## 5. Animation mode & playback

**Status: Fixed, then Pass**

### Critical issue fixed

- **Bug:** In `runStepFromEngine`, `myGen` was captured **before** `clearAnimTimers()`. `clearAnimTimers()` increments `animGenRef`, so every timeout saw `animGenRef.current !== myGen` and **never ran** — phases would not advance and completion would not fire.
- **Fix:** Call `clearAnimTimers()` first, then `const myGen = animGenRef.current` so callbacks validate against the current generation.

### Expected behavior (post-fix)

- Toggle **Animate steps** / speed: disabled while `isAnimating`.
- **Step / Play / Pause / Reset / Skip animation:** wired; playback uses `schedulePlayNext` + `playingRef` for pause; reset clears timers, play timer, animation state.
- **No double advance:** one `applyStepResult` per completed step; `skipAnimation` clears timers (invalidates pending callbacks) then applies once.

**Manual check recommended:** Play through 3+ steps with animation on; pause mid-sequence; skip mid-sequence; reset mid-sequence.

---

## 6. State synchronization / race conditions

**Status: Pass (review)**

- `configRef` / `machineRef` / `playingRef` updated on commit for scheduled playback.
- `animGenRef` invalidates stale animation callbacks after clear/skip/reset/new step.
- Exercise switch: `App` uses `key={exercise.id}` on `MvpPlayer` → full remount, clean state.

---

## 7. Regression checks

| Check | Result |
|-------|--------|
| `tsc --noEmit` | Pass |
| `npm test` | 26/26 pass |
| `npm run build` | Pass |
| Broken imports | None found |

---

## 8. UX clarity

**Status: Pass (review)**

- Configuration strip: state / head / read (with animation overrides via `visual`).
- Phase banner: “Now: …” + Skip while animating.
- Question panel: locked during animation with visible message.
- Feedback panel unchanged for success/error.

---

## Deliverables summary

1. **QA report:** This document.
2. **Bugs / risks:**
   - **Fixed (critical):** Animation timers never fired due to `animGenRef` / `myGen` ordering (`MvpPlayer.tsx`).
   - **Low:** Possible double submit on MCQ if user double-clicks very fast (unverified).
   - **Residual:** No automated E2E; manual smoke recommended for modal + animation timing.
3. **Fixes applied:** `clearAnimTimers()` before capturing `myGen` in `runStepFromEngine`.
4. **Confirmed working:** Engine/grading tests, production build, modal wiring, prop plumbing for diagram variants, playback guards.

---

## Suggested manual smoke checklist (5 min)

1. Pick an exercise, answer correctly with animation **on** — confirm phase banner cycles and machine advances once.
2. **Skip animation** mid-step — confirm config jumps to end of step exactly once.
3. **Play** until halt — **Pause** mid-run — confirm no extra step after pause.
4. **Expand diagram** — zoom — **Escape** and backdrop close.
5. **Reset** during animation — clean initial tape/state.

---

## Verification command

```bash
npx tsc --noEmit && npm test -- --run && npm run build
```
