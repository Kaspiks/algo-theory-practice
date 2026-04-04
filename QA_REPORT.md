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
