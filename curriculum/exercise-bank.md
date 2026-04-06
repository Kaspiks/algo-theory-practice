# Exercise Bank — Exam-Oriented TM Drills

> **Sources:** `materials/exam/exam.md` (primary). Homework / Sipser: add variants when files exist.  
> **Purpose:** Feed `content_agent` / `pack.ts` — **not** runtime code.  
> **`machine_ref`:** `TBD` = implement in `src/content/machines/` before shipping. Otherwise use existing `machineId` from the app.

**Difficulty:** `1` easy → `4` exam.

---

## Level 1 — Basic transitions & short scans

### E-L1-01

| Field | Value |
|-------|--------|
| **id** | `bank-l1-scan-first-step-001` |
| **title** | First step: scan right on binary |
| **description** | Input `001`. Machine scans `{0,1}` unchanged until blank (P1). What is the **first** transition? |
| **category** | `scan_right` |
| **difficulty** | 1 |
| **pattern** | P1 |
| **skills** | S1.2, S2.1 |
| **machine_ref** | `mvp_scan_binary` |
| **setup** | `input: "001"`, head 0 |
| **mode** | `next_transition` |
| **correct** | `(q0, write read symbol, R)` per pack convention |
| **distractors** | accept early; write wrong symbol; move L |
| **hint** | NT.1, SCAN.1 |
| **explanation** | Under head is `0`; δ keeps 0 and moves R until blank. |

### E-L1-02

| Field | Value |
|-------|--------|
| **id** | `bank-l1-only-ones-blank-002` |
| **title** | Accept path: hit blank after all 1s |
| **description** | Input `11`. After two R-moves on `1`, what is the next δ? |
| **category** | `tm_basics` |
| **difficulty** | 1 |
| **pattern** | P1, P9 |
| **skills** | S2.1 |
| **machine_ref** | `only_ones_tm` |
| **setup** | `input: "11"` (trace to head on first blank) |
| **mode** | `next_transition` |
| **correct** | transition to `q_accept` on blank |
| **hint** | NT.2 |
| **explanation** | Blank after input means every cell was 1 → accept. |

### E-L1-03

| Field | Value |
|-------|--------|
| **id** | `bank-l1-tape-result-scan-003` |
| **title** | Tape after one step (scan) |
| **description** | `mvp_scan_binary`, input `10`, **one** step from start. Tape snapshot + state? |
| **category** | `tape_result` |
| **difficulty** | 1 |
| **pattern** | P1 |
| **skills** | S2.1 |
| **machine_ref** | `mvp_scan_binary` |
| **setup** | `input: "10"` |
| **mode** | `tape_result` |
| **correct** | state q0, head index 1, tape `10…` |
| **hint** | TR.4 |
| **explanation** | Write `1` (unchanged), R → head on `0`. |

### E-L1-04

| Field | Value |
|-------|--------|
| **id** | `bank-l1-contains001-reject-004` |
| **title** | First step detecting substring machine |
| **description** | Machine for “tape contains `001`”. Input `100`. First δ? |
| **category** | `substring` |
| **difficulty** | 1 |
| **pattern** | P1, P4 |
| **skills** | S1.2 |
| **machine_ref** | `contains_001_tm` |
| **setup** | `input: "100"` |
| **mode** | `next_transition` |
| **correct** | per actual δ table |
| **hint** | NT.1 |
| **explanation** | Match first symbol of partial match. |

---

## Level 2 — Tracing & multi-step tape results

### E-L2-01

| Field | Value |
|-------|--------|
| **id** | `bank-l2-trace-scan-binary-005` |
| **title** | Trace: scan to blank |
| **description** | Input `010`. List configurations until accept (cap 12 steps in UI). |
| **category** | `tracing` |
| **difficulty** | 2 |
| **pattern** | P1 |
| **skills** | S2.2 |
| **machine_ref** | `mvp_scan_binary` |
| **setup** | `input: "010"` |
| **mode** | `tracing` |
| **correct** | row-by-row δ application |
| **hint** | TRA.2 |
| **explanation** | Only moves R on 0/1; blank → accept. |

### E-L2-02

| Field | Value |
|-------|--------|
| **id** | `bank-l2-tape-result-halt-006` |
| **title** | Halt: accept or reject? |
| **description** | `only_ones_tm` on `1101`. Final outcome? |
| **category** | `tape_result` |
| **difficulty** | 2 |
| **pattern** | P1 |
| **skills** | S2.4 |
| **machine_ref** | `only_ones_tm` |
| **setup** | `input: "1101"` |
| **mode** | `tape_result` |
| **correct** | reject |
| **hint** | TR.3 |
| **explanation** | First `0` sends to reject. |

### E-L2-03

| Field | Value |
|-------|--------|
| **id** | `bank-l2-markers-007` |
| **title** | Tape symbol after mark step |
| **description** | Use a **TBD** machine that marks first `a` as `X` and moves R (homework-style). Input `aab`. After first **non-trivial** step? |
| **category** | `marking` |
| **difficulty** | 2 |
| **pattern** | P3 |
| **skills** | S2.1, S3.3 |
| **machine_ref** | `TBD_mark_first_a` |
| **setup** | `input: "aab"` |
| **mode** | `tape_result` |
| **correct** | `Xab…`, head 1, state as designed |
| **hint** | TR.4, EX.7 |
| **explanation** | Marker is a tape symbol; δ must handle `X` later. |

---

## Level 3 — Pattern recognition & strategy (exam-shaped)

### E-L3-01 — EXAM mirror: triple block idea

| Field | Value |
|-------|--------|
| **id** | `bank-l3-strategy-akbkak-008` |
| **title** | Strategy: \(a^k b^k a^k\) (EXAM 1 Q1 style) |
| **description** | Which **high-level plan** matches the language \(L=\{a^k b^k a^k \mid k\ge 0\}\)? |
| **category** | `exam:1-q1` |
| **difficulty** | 3 |
| **pattern** | P10, P8, P6 |
| **skills** | S4.1, S4.2, S3.5 |
| **machine_ref** | — (strategy only) |
| **mode** | `strategy` |
| **options** | A) Check \(a^*b^*a^*\) only; B) Match first \(a\)-run to \(b\)-run by pairing, then match remaining \(a\)s to same count; C) Count all \(a\)s then all \(b\)s once; D) Sort symbols |
| **correct** | B |
| **hint** | ST.2, EX.1 |
| **explanation** | Shape alone is insufficient; **two** equalities of counts are needed (first \(a^k\) vs \(b^k\), then \(b^k\) vs second \(a^k\)). |

### E-L3-02 — EXAM mirror: \(a^k b^{2k}\) loop

| Field | Value |
|-------|--------|
| **id** | `bank-l3-strategy-akb2k-009` |
| **title** | Strategy: relate EXAM 1 Q3 sweep to phases |
| **description** | Given algorithm: erase `a`, go to blank, step left, check `b`, erase, step left, check `b`, erase, return start. What invariant does each **outer** iteration enforce? |
| **category** | `exam:1-q3` |
| **difficulty** | 3 |
| **pattern** | P11, P12 |
| **skills** | S4.2, S5.T1 |
| **mode** | `strategy` |
| **options** | A) Removes one `a` and two `b`s per round; B) Removes two `a`s and one `b`; C) Only checks order; D) Sorts tape |
| **correct** | A |
| **hint** | ST.2, EX.2 |
| **explanation** | Matches \(a^k b^{2k}\): each `a` pairs with **two** `b`s. |

### E-L3-03 — EXAM mirror: more `a` than `b`

| Field | Value |
|-------|--------|
| **id** | `bank-l3-strategy-more-a-010` |
| **title** | Strategy: strictly more `a` than `b` (EXAM 2 Q1) |
| **description** | Which approach **cannot** work on one-tape DTM for \(\{w \mid \#_a(w)>\#_b(w)\}\) over \(\{a,b\}\)? |
| **category** | `exam:2-q1` |
| **difficulty** | 3 |
| **pattern** | P13 |
| **skills** | S4.1 |
| **mode** | `strategy` |
| **options** | A) Pair `a` with `b` and erase until one symbol remains; B) Use finite states only, no marks; C) Mark pairs then scan for leftover `a`; D) Two-sweep tally with markers |
| **correct** | B |
| **hint** | ST.4 |
| **explanation** | Language is not regular; finite memory without tape use is insufficient — need marks or crossing. |

### E-L3-04 — EXAM mirror: \(a^k b^{2k+1}\)

| Field | Value |
|-------|--------|
| **id** | `bank-l3-strategy-akb2k1-011` |
| **title** | Contrast \(2k\) vs \(2k+1\) (EXAM 3 Q1) |
| **description** | Compared to \(a^k b^{2k}\), what changes for \(a^k b^{2k+1}\)? |
| **category** | `exam:3-q1` |
| **difficulty** | 3 |
| **pattern** | P11 |
| **skills** | S4.4 |
| **mode** | `strategy` |
| **options** | A) One extra `b` after pairing each `a` with two `b`s; B) One fewer `b`; C) No change; D) Add `c` block |
| **correct** | A |
| **hint** | EX.3 |
| **explanation** | For each `k`, \(2k+1 = 2k + 1\) — one surplus `b` in the right block relative to “pair two `b`s per `a`”. |

### E-L3-05

| Field | Value |
|-------|--------|
| **id** | `bank-l3-runtime-sweep-012` |
| **title** | Runtime: nested linear scans |
| **description** | A TM runs \(k\) outer rounds; each round scans all \(n\) cells once. Tight bound? |
| **category** | `complexity_tm` |
| **difficulty** | 3 |
| **pattern** | P12 |
| **skills** | S5.T2 |
| **mode** | `strategy` (MCQ) |
| **options** | \(O(n)\), \(O(n\log n)\), \(O(n^2)\), \(O(n^3)\) |
| **correct** | \(O(n^2)\) when \(k=\Theta(n)\) |
| **hint** | EX.9 |
| **explanation** | EXAM-style: multiply **number of rounds** by **cost per round**. |

---

## Level 4 — Exam-style tricky & partial machines

### E-L4-01

| Field | Value |
|-------|--------|
| **id** | `bank-l4-missing-delta-akbk-013` |
| **title** | Complete δ for pairing phase |
| **description** | Partial TM for \(a^n b^n\) skeleton: in `q_match` reading `X`, should head move? (Choose missing δ.) |
| **category** | `missing_transition` |
| **difficulty** | 4 |
| **pattern** | P6, P8 |
| **skills** | S1.3, S4.2 |
| **machine_ref** | `TBD_anbn_partial` |
| **mode** | `missing_transition` |
| **correct** | per invariant (often skip `X` with R) |
| **hint** | MT.2 |
| **explanation** | Marked cells are “done”; typical loop skips `X` until next real symbol. |

### E-L4-02

| Field | Value |
|-------|--------|
| **id** | `bank-l4-false-trace-akbkak-014` |
| **title** | Find the error in a given trace |
| **description** | A **wrong** trace for input `aaabbb` claims language \(a^k b^k a^k\) — first illegal step? |
| **category** | `exam:1-q1` |
| **difficulty** | 4 |
| **pattern** | P10 |
| **skills** | S2.2 |
| **mode** | `tracing` |
| **correct** | step index where second \(a\)-block is treated as complete too early |
| **hint** | EX.1 |
| **explanation** | `aaabbb` has \(k=3\) for first two blocks but **no** third \(a\)-block — machine should reject, not accept mid-trace. |

### E-L4-03

| Field | Value |
|-------|--------|
| **id** | `bank-l4-epsilon-akbkak-015` |
| **title** | Empty string in \(a^k b^k a^k\) |
| **description** | Is \(\varepsilon \in \{a^k b^k a^k\}\)? How should TM behave on blank tape? |
| **category** | `exam:1-q1` |
| **difficulty** | 4 |
| **pattern** | P10 |
| **skills** | S4.4 |
| **mode** | `strategy` |
| **options** | Reject; Accept \(k=0\); Loop; Undefined |
| **correct** | Accept \(k=0\) |
| **hint** | EX.10 |
| **explanation** | \(k\ge 0\) includes empty string: zero \(a\), zero \(b\), zero \(a\). |

### E-L4-04

| Field | Value |
|-------|--------|
| **id** | `bank-l4-majority-half-016` |
| **title** | Half vs strict majority (EXAM 2 contrast) |
| **description** | Compare “more `a` than `b`” vs “at least half symbols are `a`” on `ab`. |
| **category** | `exam:2` |
| **difficulty** | 4 |
| **pattern** | P13, P14 |
| **skills** | S4.4 |
| **mode** | `strategy` |
| **correct** | `ab`: not in “more a”; **in** “≥ half a” (1 of 2) |
| **hint** | EX.4 |
| **explanation** | Tie or exact half: strict inequality fails; threshold language may accept. |

---

## Additional variations (shorter specs)

Use same **mode** / **pattern** scaffolding; swap inputs and machines.

| id | title | pattern | difficulty | machine_ref | setup | mode |
|----|-------|---------|------------|-------------|-------|------|
| `bank-var-017` | Next step: ends-in-one on `110` | P1 | 2 | `ends_in_one_tm` | `110` | `next_transition` |
| `bank-var-018` | Tape result: mark-zeros after 3 steps | P3 | 2 | `mark_zeros_x_tm` | `100` | `tape_result` |
| `bank-var-019` | Strategy: detect `001` without counting | P4 | 2 | — | — | `strategy` |
| `bank-var-020` | Next: return-left sentinel first hit of `#` | P2 | 2 | `return_left_sentinel_tm` | per machine | `next_transition` |
| `bank-var-021` | Tracing: contains-001 accept path | P4 | 3 | `contains_001_tm` | `x001y` | `tracing` |
| `bank-var-022` | Strategy: wrong order `b^k a^k` | P6 | 3 | — | — | `strategy` |
| `bank-var-023` | Missing δ: reject stray `c` in \(\{a,b\}\) TM | P7 | 3 | `TBD` | — | `missing_transition` |
| `bank-var-024` | Tape-result one-step: majority stub | P14 | 3 | `TBD_majority_step` | `aab` | `tape_result` |
| `bank-var-025` | EXAM 1 Q3: count outer iterations | P12 | 4 | — | — | `strategy` |
| `bank-var-026` | Pair `a` with `bb` wrong direction | P11 | 4 | `TBD` | `aabbbb` | `tracing` |
| `bank-var-027` | Strategy: \(a^k b^k\) vs \(a^k b^{2k}\) | P6 vs P11 | 3 | — | — | `strategy` |
| `bank-var-028` | False friend: \(a^n b^n c^n\) one-tape idea | P6 | 4 | — | — | `strategy` |
| `bank-var-029` | Sipser-style: \(ww^R\) phase order | P4 | 3 | — | — | `strategy` |
| `bank-var-030` | Sipser-style: \(a^n b^n\) mark first `a` | P3,P6 | 2 | `TBD` | `aabb` | `next_transition` |

---

## Difficulty progression summary

| Level | Focus | Example ids |
|-------|--------|-------------|
| 1 | δ reading, 1-step, short tape | E-L1-* |
| 2 | Multi-step trace, halt | E-L2-* |
| 3 | Exam languages (strategy), runtime | E-L3-* |
| 4 | Edge cases, wrong traces, partial TM | E-L4-* |

---

## Implementation checklist (content_agent)

1. For each `TBD` machine: add TypeScript definition + diagram test.  
2. Map `hint` IDs to `hints.ts` if new strings needed.  
3. Tag `tags: ['P10','exam:1-q1']` in `pack.ts` for analytics.  
4. Keep **one** canonical correct option id per MCQ.  
5. Paraphrase exam text if distribution policy requires; keep **mathematical** statements identical.
