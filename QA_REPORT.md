# QA report: tape-result mode & regression (2026-04-04)

## Executive summary

Tape-result mode is **aligned with the TM engine** for all pack items: the marked correct MCQ row matches `step()` from the initial configuration, dynamic distractors are de-duplicated by full configuration key, and authored options are rejected if they duplicate the same configuration. A **commit-step lock** prevents double application of the same transition when the user double-clicks “Check answer” / Step / Play before React commits the next configuration.

**Automated verification:** `npx tsc --noEmit`, `npm test` (53 tests), `npm run build` — all passing after the playback follow-up QA.

**Manual / not executed here:** pixel-level fullscreen diagram checks, real browser interaction, and accessibility audit beyond static review.

---

## 1. Tape-result correctness (engine alignment)

| Check | Result |
|--------|--------|
| Correct next configuration vs `step()` | **Pass** — `tests/content/pack.test.ts` + `tests/content/tapeResultPackQuality.test.ts` |
| Write / move / next state | **Pass** — grading uses `configurationsEqual` (state, head, all cells after `ensureHeadInBounds`) |
| Blank / tape expansion on `R` | **Pass** — new `tests/lib/tm/engine.test.ts` case “extends tape with blank on move right past end” |
| Left move at index 0 with `leftEnd: 'reject'` | **Pass** — new engine test “rejects when moving left from leftmost cell” |
| Same-symbol write (scan on 0) | **Pass** — covered by pack exercises (e.g. `010` on scan machine) |

---

## 2. Answer option quality

| Check | Result |
|--------|--------|
| Exactly one option matching `step().next` | **Pass** — `tapeResultPackQuality.test.ts` asserts `matchCount === 1` |
| No duplicate configurations in MCQ | **Pass** — dynamic: `tryAdd` + `tapeConfigurationKey`; authored: `buildTapeResultMcqFromAuthor` returns `null` if duplicate configs |
| Distractor intent | **Pass (design)** — `buildTapeResultMcq` adds wrong state, write-only head, wrong write, wrong head direction variants where applicable |
| Visual / semantic labels | **Improved** — `TapeResultQuestion` now shows `label` text under the state line when present (dynamic options include descriptive labels) |

---

## 3. UI behavior (tape-result)

| Check | Result |
|--------|--------|
| Current configuration | **Pass (code review)** — header strip (state, head, symbol) + main `TapeViewer` |
| Answer cards: tape, head, state | **Pass** — `TapeResultQuestion` + compact `TapeViewer` |
| Layout / overflow | **Pass (code review)** — `overflow-x-auto` on tape strip; grid `sm:grid-cols-2` |
| Fullscreen diagram | **Pass (code review)** — modal `z-[100]` portal to `document.body`; should sit above page content |

---

## 4. Interaction flow

| Check | Result |
|--------|--------|
| Wrong answer does not change `config` | **Pass** — only `setFeedback` on incorrect path |
| Correct answer advances machine | **Pass** — `applyStepResult` / animated path |
| `applyStepResult` clears selection | **Pass** — `setSelectedId(null)` |
| Reveal / “Show correct step” | **Pass (code review)** — study-only; uses same step + animation path; guarded by `commitStepLockRef` |

---

## 5. Animation compatibility

| Check | Result |
|--------|--------|
| Tape-result correct path uses `runStepFromEngine` | **Pass** — same as next-transition |
| Instant path when animation off | **Pass** — `applyStepResult` directly |
| Double transition from double-click | **Mitigated** — `commitStepLockRef` + `useEffect` release on `config` / `stepCount` update |

---

## 6. Data model integrity

| Check | Result |
|--------|--------|
| `TapeResultExercise` / union | **Pass** — `tsc` clean |
| `buildTapeResultMcqFromAuthor` validation | **Pass** — correct id must match `step()`; duplicate configs rejected |

---

## 7. Regression: other modes

| Mode | Pack usage | Result |
|------|------------|--------|
| `next_transition` | Many exercises | **Pass** — pack tests + shared player path unchanged for incorrect; lock added for correct path |
| `tracing` (`mode` field) | **None** — no `mode: 'tracing'` rows in pack | **N/A** — type exists; UI path same as next-transition when added |
| Tracing *category* with `next_transition` | e.g. `tracing-ends-in-one` | **Pass** — still `next_transition` |
| `missing_transition` / `strategy` | **None** in pack | **N/A** — placeholders only; no runtime coverage |

---

## 8. State consistency

| Check | Result |
|--------|--------|
| Exercise switch | **Pass** — `<MvpPlayer key={exercise.id} />` remounts clean state |
| Reset | **Pass** — clears lock, timers, config, selection, feedback |
| Rapid correct submit | **Pass** — `commitStepLockRef` |

---

## 9. Console + runtime

| Check | Result |
|--------|--------|
| Production build | **Pass** — `npm run build` |
| DEV warning | **Minor** — `MvpPlayer` warns if `exercise.machineId !== machine.id` (intentional) |

---

## Issues list

### Critical

_None found in automated + code review scope._  
(Any incorrect δ in **content** would still be critical; pack tests catch first-step / tape-result MCQ consistency.)

### Medium (addressed in this pass)

1. **Double-click / race on correct submit or Step / Play** — could theoretically apply two steps before `config` updated. **Fix:** `commitStepLockRef` set before committing a step; released after `config`/`stepCount` update (and explicitly on reset).

2. **Duplicate authored tape-result rows** — two options with identical full configuration could confuse students. **Fix:** `buildTapeResultMcqFromAuthor` returns `null` if any two options project to the same `tapeConfigurationKey`.

### Minor

1. **`gradeTapeResult` then `step` again on correct submit** — redundant second `step()` call; harmless, small perf cost.

2. **Placeholder modes** — `missing_transition` / `strategy` / `mode: 'tracing'` not exercised by current pack; add content when those drills ship.

3. **Option `explanation` on `TapeResultOption`** — still not surfaced in UI (metadata only unless wired later).

4. **Post-submit option styling (tape-result)** — “correct” / “incorrect” card chrome after **Check answer** is not implemented; feedback is still the text panel only. Preview (sky) vs submit (amber selection) remains visually distinct.

---

## 10. Tape-result playback preview — follow-up QA

### 10.1 Playback ↔ engine synchronization

| Check | Result |
|--------|--------|
| Correct option derived from same `step()` result as animation | **Pass** — `runTapeResultPlaybackStep` passes captured `r` into `runStepFromEngine` after delay |
| Match uses state + tape cells + head (`configurationsEqual` / `ensureHeadInBounds`) | **Pass** — `findMatchingTapeResultOptionId` |
| `findMatchingTapeResultOptionId` === `built.correctOptionId` for **every** step until halt, all pack `tape_result` exercises | **Pass** — `tests/content/tapeResultPlaybackSync.test.ts` |
| Preview cleared when step commits | **Pass** — `setPreviewCorrectOptionId(null)` first in `applyStepResult` |
| Next playback step gets fresh MCQ + new preview | **Pass** — refs + `schedulePlayNext` recompute from `configRef` / `stepCountRef` |

### 10.2 Visual / sequencing (code review)

| Check | Result |
|--------|--------|
| Preview before machine update | **Pass** — `PLAYBACK_CORRECT_PREVIEW_MS` delay before `runStepFromEngine` |
| correct-preview distinct from grading | **Pass** — sky ring + pulse + “Correct next configuration:”; submit remains amber selection |
| Only one preview id | **Pass** — single `previewCorrectOptionId`; duplicates log warn and pick first |
| Manual MCQ | **Pass** — no preview on oracle / show-correct / submit paths (preview cleared); `submitDisabled` while `playing` or active preview wait |

### 10.3 Controls / state

| Check | Result |
|--------|--------|
| Pause during preview wait | **Pass** — clears preview timer, preview id, `commitStepLockRef` when not animating |
| Reset | **Pass** — clears timers, preview, playing |
| Skip animation | **Pass** — `applyStepResult` clears preview; `schedulePlayNext` if still playing |
| Exercise switch | **Pass** — `key={exercise.id}` remount |

### 10.4 Regression (other modes)

| Mode | Result |
|------|--------|
| `next_transition` Play | **Pass** — non–tape-result branch still calls `runStepFromEngine` directly |
| Placeholder `missing_transition` / `strategy` / `mode: 'tracing'` | **N/A** — no pack rows |

### 10.5 Issues found (this follow-up)

| Severity | Issue | Resolution |
|----------|--------|------------|
| **Critical** | None | — |
| **Medium** | If matching ever failed, playback still waited full preview delay with **no** highlight | **Fixed:** when `findMatchingTapeResultOptionId` returns `null`, log error and call `runStepFromEngine` **immediately** (no dead-air pause) |
| **Minor** | Browser-only checks (rapid Play/Pause, pixel polish) | Not automated here |

---

## Fixes applied (cumulative)

- `MvpPlayer.tsx`: commit-step lock; tape-result playback preview pipeline; skip preview delay when no matching option.
- `tapeResult.ts`: `tapeConfigurationKey`; duplicate-authored guard; `buildTapeResultMcqForState`; `findMatchingTapeResultOptionId`.
- `TapeResultQuestion.tsx`: playback cue, preview pulse/dim, labels.
- Tests: `tapeResultPackQuality.test.ts`, `tapeResultPlaybackSync.test.ts`, engine edge cases, duplicate-authored test.

---

## Final status

**Ready for study use:** engine-aligned playback preview (tested across full traces for all pack tape-result items), no critical sync bugs found, one medium UX fix applied. A short **manual** pass in the browser (Play chain, Pause mid-preview, animation on/off) remains recommended.

---

# QA report: state diagram transition labels (2026-04-04)

## Executive summary

Edge transition labels are drawn **after** nodes in SVG paint order, so they are not covered by state rectangles. The SVG **viewBox** includes padded bounds for every label chip (including vertical chip padding). Placement uses **chip-inclusive** hit targets against `nodeObstacles`, middle-third curve sampling, and **−tangent** bias away from arrowheads. **Fit** in the fullscreen modal now scales against the **same** width/height as the rendered SVG (including labels), fixing an undersized fit box that ignored label extent.

**Automated verification:** `npx tsc --noEmit`, `npm test` (62 tests), `npm run build` — all passing. New tests: `tests/lib/tm/stateDiagramScene.test.ts` (obstacle clearance for `contains001` embedded).

**Manual / not executed here:** pixel-level checks in Chrome/Safari, rapid resize stress, and accessibility beyond static review.

---

## 1. Label visibility (critical)

| Check | Result |
|--------|--------|
| Labels not hidden behind nodes | **Pass (code)** — render order: edge paths → nodes → label groups (`pointerEvents="none"` on labels). |
| Labels on top of edges and nodes | **Pass (code)** — label `<g>` elements are last in the SVG. |
| Not clipped by viewBox | **Pass (code)** — `labelPad` expands `minL/minT/maxR/maxB`; chip half-height uses `(lh + chipExtraH)/2`. |
| Embedded vs expanded | **Pass (code)** — same pipeline; `SIZE_PRESETS` differ stroke/font/chip metrics only. |

---

## 2. Label positioning

| Check | Result |
|--------|--------|
| Not inside node shapes | **Pass (placement)** — `placeCubicEdgeLabel` / `nudgeSelfLoopLabel` use `rectHitsAnyObstacle` with inflated node rects (`clearance` + terminal ring pad). |
| Offset from nodes | **Pass** — clearance 14 embedded / 17 expanded; chip height included in geometry. |
| Away from arrowheads | **Pass** — `headClears` pulls along −tangent from `p3`. |
| Middle of edge | **Pass** — `MIDDLE_THIRD_T_CANDIDATES` in [1/3, 2/3]. |
| Short edges | **Pass (heuristic)** — smaller span increases base normal offset in `placeCubicEdgeLabel`. |

---

## 3. Label overlap / collisions

| Check | Result |
|--------|--------|
| Pairwise label separation | **Improved** — `separateEdgeLabelRects` alternates **vertical** and **horizontal** nudges (8 iterations). |
| Stacking on same spot | **Mitigated** — horizontal passes reduce pure vertical stacks in dense graphs. |
| Node borders after separation | **Improved** — post-pass tries **horizontal** dx if vertical dy cannot clear obstacles. |
| Dense accept/reject | **Pass (automated sample)** — `contains001` embedded: every label rect misses obstacles in `stateDiagramScene` test. |

---

## 4. Label styling

| Check | Result |
|--------|--------|
| Contrast | **Pass (code)** — chip fill `#020617`, text `fill-slate-100`, stroke slate/amber on highlight. |
| Padding / chip | **Pass** — rounded rect with `chipPadY` / `chipExtraH` per size. |
| Font embedded / expanded | **Pass** — 12px vs 16px per `SIZE_PRESETS`. |
| Cut-off / overflow | **Pass (logic)** — `edgeLabelMaxChars` truncates with ellipsis; `lw` capped to `vwRef * 0.42`. |

---

## 5. Edge ↔ label correspondence

| Check | Result |
|--------|--------|
| One label group per `edgeLayouts` row | **Pass** — same `key` ties path and label; label text from same merged transition string. |
| Detached labels | **Pass (code)** — `lx,ly` derived from the same cubic/self-loop as `pathD`. |
| Ambiguity between edges | **Mitigated** — separation moves centers apart; remaining ambiguity possible only in pathological identical geometry (not seen in pack machines). |

---

## 6. Zoom / fullscreen

| Check | Result |
|--------|--------|
| Zoom scales entire SVG | **Pass** — CSS `transform: scale` on wrapper; viewBox fixed in user units → alignment preserved. |
| Fit uses label-inclusive size | **Fixed** — `expandedScene` from `computeStateDiagramScene` (was `computeDiagramViewBox` only). |
| Fullscreen readability | **Pass (design)** — larger fonts/strokes/markers in `expanded` preset. |
| Resize jitter | **Not reproduced in code** — single `useMemo` scene; zoom is state + transform (manual check recommended). |

---

## 7. Regression checks (code paths)

| Area | Result |
|------|--------|
| Node layout | **Pass** — still `resolveDiagramNodes` + unchanged `diagramLayout`. |
| Current-state / pulse / hint | **Pass (code review)** — node `g` opacity/transform unchanged. |
| Animation / tape-result / playback / options | **Pass** — `MvpPlayer` still passes the same props into `StateDiagramExpandable`; diagram props unchanged. |

---

## 8. Performance / rendering

| Check | Result |
|--------|--------|
| Flicker | **None expected** — no key churn on labels beyond machine/layout/size change. |
| Re-renders | **Unchanged** — scene `useMemo` deps `[machine, nodes, size]`. |
| Responsiveness | **Pass** — O(states + edges) layout; typical TM graphs are small. |

---

## 9. Console / runtime

| Check | Result |
|--------|--------|
| Build | **Pass** — `npm run build`. |
| New warnings | **None introduced** — static review of `stateDiagramScene` / viewer. |

---

## Issues categorization

### Critical

_None found_ in automated + structural review. (Any future machine with extreme density could still need content-side layout hints.)

### Medium (addressed in this pass)

1. **Fit zoom ignored label extent** — modal Fit used node-only `computeDiagramViewBox`, so scale could be too large vs true SVG. **Fix:** `computeStateDiagramScene` drives `expandedScene.vw` / `vh` for Fit.
2. **Placement used text `lh` but chip is taller** — labels could sit slightly closer to nodes than the visible chip. **Fix:** pass `lh + chipExtraH` into placement, separation, post-nudge, and viewBox vertical padding.
3. **Vertical-only separation** — parallel edges could leave labels stacked. **Fix:** alternate **horizontal** nudges in `separateEdgeLabelRects`; optional **dx** post-nudge when **dy** fails.

### Minor

1. **Manual pixel QA** — recommended once in browser (embedded panel height, modal Fit at small viewport).
2. **Ambiguous label in exotic multi-curve overlap** — theoretical; not observed in current content.

---

## Fixes applied (state diagram pass)

- `src/lib/tm/stateDiagramScene.ts` — shared `computeStateDiagramScene` + `collectDiagramEdgeLabels`; chip-inclusive geometry; post-nudge `dx` fallback.
- `src/lib/tm/diagramEdgeGeometry.ts` — `separateEdgeLabelRects` vertical/horizontal alternation.
- `src/components/tm/StateDiagramViewer.tsx` — uses `computeStateDiagramScene`; exports `diagramScenePreset`; modal Fit uses full scene bounds.
- `tests/lib/tm/stateDiagramScene.test.ts` — obstacle clearance regression for `contains001`.

---

## Final status (state diagram)

**Ready for study use** from an automated and code-structure perspective: labels are top-layer, viewBox includes chips, placement respects inflated obstacles, and Fit matches rendered bounds. A short **manual** fullscreen/embedded check remains recommended for typography and dense-machine polish.

---

## QA follow-up: active transition label highlight (2026-04-04)

### Checks

| # | Check | Result |
|---|--------|--------|
| 1 | Active transition labels highlight again | **Pass (code + tests)** — `computeDiagramEdgeHighlight` + amber chip/stroke/text; pulse class `tm-diagram-edge-label-pulse` when `isAnimPulse`. |
| 2 | Active edge and active label always match | **Pass (structure)** — single `edgeHighlightByKey` `Map` in `StateDiagramViewer`; edge path and label chip both read `edgeHighlightByKey.get(eg.key)` so they cannot diverge. |
| 3 | Label visibility / layering intact | **Pass** — paint order unchanged: edges → nodes → labels; labels `pointerEvents="none"`. |
| 4 | Playback / animation | **Pass (code review)** — `MvpPlayer` still sets `transitionHighlight`, `diagramPulseEdge` → `pulseActiveTransitionEdge` during edge/write/head phases; `computeDiagramEdgeHighlight` tests cover active + pulse. |
| 5 | Fullscreen | **Pass** — modal `StateDiagramViewer` receives same props via `StateDiagramExpandable`; `size="expanded"` only affects preset, not highlight logic. |
| 6 | Tape-result / other modes | **Pass (automated)** — `npm test` includes pack, `tapeResult*`, playback sync; diagram props path unchanged except prior highlight fix. |

### Automated verification

`npx tsc --noEmit`, `npm test`, `npm run build` — all passing after `edgeHighlightByKey` hardening (see latest test count in repo).

### Issues found

- **Critical:** none.  
- **Medium:** none (pre-emptive fix: shared `Map` for highlight state).  
- **Minor:** manual browser pass still useful to confirm pulse/glow and reduced-motion preferences.

### Final status (active label highlight)

**Pass** for regression QA: highlight logic is centralized, edge and label share one source per `eg.key`, and full test suite remains green.

---

## QA follow-up: transition-focus dimming (2026-04-04)

### Checks

| # | Check | Result |
|---|--------|--------|
| 1 | Inactive labels dim during playback | **Pass (code)** — when `isTransitionFocusDimmingActive(transitionHighlight)` (i.e. MvpPlayer passes `fired` during edge / write / head_from / head_to), inactive label groups use `dimLabelGroupOp` (0.58), softer chip stroke/opacity, `fill-slate-200`. |
| 2 | Active label stays bright | **Pass** — `isActive \|\| hovered` → group opacity 1; amber chip + `font-semibold` + optional pulse; slightly thicker chip stroke when focus is on. |
| 3 | Labels normal after playback | **Pass** — `transitionHighlight` cleared in `state` phase and when `!stepAnim`; dimming uses only `transitionHighlight`, not `lastTransition`. Static “last edge” view keeps baseline 0.9 / 0.68. |
| 4 | No regressions (visibility, position, fullscreen, zoom/fit, controls) | **Pass (code review + automated)** — scene `useMemo` unchanged; SVG order unchanged; `StateDiagramExpandable` props unchanged; **67** tests + build green. |
| 5 | Active edge ↔ label match | **Pass** — same `edgeHighlightByKey`; inactive edges use `dimEdgePathOp` (0.42) only when `animTransitionFocus`; active/hover stay at opacity 1. |

### Contract helper

- `isTransitionFocusDimmingActive` in `stepAnimation.ts` documents alignment with MvpPlayer’s `transitionHighlight` lifecycle; covered by `stepAnimation.test.ts`.

### Automated verification

`npx tsc --noEmit`, `npm test` (67 tests), `npm run build` — all passing.

### Issues found

- **Critical:** none.  
- **Medium:** none.  
- **Minor:** manual browser pass to tune perceived contrast (`dimEdgePathOp` / `dimLabelGroupOp`) on real exercises.

### Final status (transition-focus dimming)

**Pass** — dimming is scoped to in-flight `transitionHighlight` only; edge and label dimming stay synchronized via shared highlight map and the same `animTransitionFocus` flag.
