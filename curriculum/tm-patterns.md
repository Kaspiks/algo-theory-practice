# TM Construction Patterns (Exam / Homework)

> **Source status:** Patterns are **standard** for one-tape DTMs in Sipser-style courses. **Validate** each “when used” clause against `materials/lectures/ThAlgo-02_TM*` and `materials/homework/hw1.pdf` when available.

Each pattern below is suitable for **tracing exercises**, **“next move”** questions, and **strategy** (phase ordering) drills.

---

## P1 — Scan right to sentinel

| Field | Content |
|-------|-----------|
| **Name** | Scan right until blank or marker |
| **Description** | In state \(q_{\text{scan}}\), move **R** while reading symbols in a set \(A\), unchanged (or with bookkeeping writes). Stop when reading sentinel \(s \in \Gamma \setminus A\) (often **⊔** or `#`). |
| **When used** | Find end of input; find delimiter; skip a marked region. |
| **Example** | “Move to the first blank after the input block.” |
| **Common mistakes** | Forgetting to **write back** the same symbol when the transition is “read-only”; overshooting past the sentinel; wrong sentinel. |

---

## P2 — Return to left end (or home mark)

| Field | Content |
|-------|-----------|
| **Name** | Sweep back left |
| **Description** | Move **L** until a **left marker** (`⊢`, `#` at left, or a stamped `X` at boundary), then step **R** to “home” if needed. |
| **When used** | Multi-pass algorithms: one pass right for data, one pass left to restart phase. |
| **Example** | After checking end, return to start for next iteration. |
| **Common mistakes** | Infinite loop at left edge if policy is wrong; losing track of **where** home is after edits. |

---

## P3 — Mark-and-sweep (visit each input symbol once)

| Field | Content |
|-------|-----------|
| **Name** | Mark processed symbol |
| **Description** | Replace current input symbol \(a\) with marker \(a'\) or generic `X`, then scan to perform action (match, find partner), later **unmark** or use distinct phases. |
| **When used** | \(\{ww\}\)-style ideas, pairing, counting down. |
| **Example** | Mark first unmarked `a`, find matching `b`, erase both, repeat. |
| **Common mistakes** | Marking without a **unique restore** strategy; confusing multiple marker types. |

---

## P4 — Match two positions (two-finger on one tape)

| Field | Content |
|-------|-----------|
| **Name** | Match / compare distant symbols |
| **Description** | Remember one symbol in **state** (finite), carry it to another position by scanning, compare, return. |
| **When used** | Palindromes, duplicated halves, pattern equality. |
| **Example** | Palindrome: read left, go to symmetric right cell, compare. |
| **Common mistakes** | Off-by-one on symmetric index; tape edits that **move** the string relative to head. |

---

## P5 — Shift / copy block

| Field | Content |
|-------|-----------|
| **Name** | Shift substring right or left |
| **Description** | Use a blank as working space; repeatedly swap or rewrite to duplicate a block, often with a **separator** `#`. |
| **When used** | Simulating space-making; building `w#w` checkers. |
| **Example** | Copy first segment after `#`. |
| **Common mistakes** | Overwriting data before copy; losing separator. |

---

## P6 — Unary counter / tally

| Field | Content |
|-------|-----------|
| **Name** | Count with tallies |
| **Description** | Use regions of `1`s or `0`s separated by `#`; **add**/**subtract** one tally by moving to end and append/erase. |
| **When used** | \(a^n b^n c^n\)-style intuition (full language may need multiple counters in sequence). |
| **Example** | Match number of `a`s to number of `b`s by erasing pairs. |
| **Common mistakes** | Restarting count from wrong boundary; mixing unary with binary logic. |

---

## P7 — Subroutine simulation (state blocks)

| Field | Content |
|-------|-----------|
| **Name** | Phase = state subset |
| **Description** | Partition \(Q\) into **phases** (e.g. `Q_find`, `Q_verify`, `Q_cleanup`). Transitions seldom cross phases except through **explicit** bridges. |
| **When used** | All structured constructions; exam explanations. |
| **Example** | Phase A: reach end; Phase B: walk back with parity. |
| **Common mistakes** | **Spaghetti** transitions between phases; missing **exit** to reject. |

---

## P8 — Zig-zag between zones

| Field | Content |
|-------|-----------|
| **Name** | Alternate between tape regions |
| **Description** | Repeatedly go from region 1 to region 2 (e.g. before/after `#`), one step or one symbol per round. |
| **When used** | \(\{a^n b^n\}\), matching two stacks. |
| **Example** | Cross `#` to consume matching symbols on each side. |
| **Common mistakes** | Wrong turn state after `#`; head ends in wrong zone for next iteration. |

---

## P9 — Accept by cleanup / empty tape

| Field | Content |
|-------|-----------|
| **Name** | Finalize to trivial configuration |
| **Description** | After verification, sweep to erase markers, ensure only blanks (or a single `⊔`), then accept. |
| **When used** | Languages defined by “erase pairs until empty”. |
| **Example** | Matching parentheses by cancellation. |
| **Common mistakes** | Accepting with **leftover** markers; rejecting valid strings due to incomplete cleanup. |

---

## Pattern → typical exam tasks

| Exam task type | Patterns |
|----------------|----------|
| Trace given machine | P1–P2 most common |
| Design for \(a^n b^n\) | P6, P8 |
| Design for palindromes | P1, P2, P4 |
| Design for \(ww^R\) | P4, P2 |
| Explain idea / phases | P7 |

---

## Content authoring checklist

1. Name the **phases** (P7) in the solution explanation.
2. List **tape alphabet** explicitly if using markers (P3, P5).
3. State **left-end** behavior (see `notation-guide.md`).
4. Tag exercises with **pattern IDs** for analytics and hints.
