# TM Construction Patterns — Exam-Oriented

> **Primary source:** `materials/exam/exam.md` (EXAM 1–3).  
> **Secondary / reference:** When `materials/homework/` and `materials/reference/Sipser.pdf` are added, cross-check each pattern against assigned problems and Sipser’s TM examples (e.g. \(a^n b^n\), \(ww^R\)).

Patterns below are tagged for **tracing**, **next-transition**, **tape-result**, **strategy**, and **exam design** questions.

---

## Exam problem → pattern map

| Exam item | Language / task | Core patterns |
|-----------|-----------------|---------------|
| EXAM 1 Q1 | \(a^k b^k a^k\) | P10 triple-block, P8, P6, P2 |
| EXAM 1 Q3 | \(a^k b^{2k}\) + given sweep algorithm | P11 ratio 2:1, P3, P1, P2, P12 (runtime sweep) |
| EXAM 2 Q1 | More `a` than `b` | P13 majority / comparison, P1, P2 |
| EXAM 2 Q3 | ≥ half symbols are `a` (mark `*`, delete non-`a`) | P3, P6, P1, P2, P12 |
| EXAM 3 Q1 | \(a^k b^{2k+1}\) | P11 variant (odd right block), P8, P6 |

Non-TM exam topics (reductions, NP, halting variants, Big-O) are **out of scope** for the TM study loop but listed so you do not confuse **course** study with **app** content.

---

## P1 — Scan right to sentinel

*(unchanged core idea — see previous revision)*

| Field | Content |
|-------|---------|
| **Name** | Scan right until blank or marker |
| **Description** | In \(q_{\text{scan}}\), move **R** while reading symbols in \(A\); stop at sentinel (often **⊔** or `#`). |
| **Exam use** | EXAM 1 Q3 “move right to first blank”; any “find end of segment”. |
| **Common mistakes** | Wrong stop symbol; forgetting to write same symbol on read-only sweep. |

---

## P2 — Return to left end (home)

| Field | Content |
|-------|---------|
| **Name** | Sweep back left |
| **Description** | Move **L** to a boundary marker, optionally step **R** to home. |
| **Exam use** | Every multi-pass construction in exams; EXAM 1 Q3 “return to start”. |
| **Common mistakes** | Left-end policy loop; losing home after erasures. |

---

## P3 — Mark-and-sweep

| Field | Content |
|-------|---------|
| **Name** | Mark processed symbol |
| **Description** | Replace with \(X\), `*`, or primed variant; later unmark or use phase separation. |
| **Exam use** | EXAM 2 Q3 marks `a` as `*`; pairing \(a\) with \(bb\) in ratio algorithms. |
| **Common mistakes** | Too few marker types; cannot distinguish phases. |

---

## P4 — Match / compare distant cells

| Field | Content |
|-------|---------|
| **Name** | Carry symbol in state, compare elsewhere |
| **Description** | Remember one symbol in **state**, scan, compare, return. |
| **Exam use** | Substrings, equality of blocks; palindrome-style checks (if course uses them). |
| **Common mistakes** | Off-by-one; tape shifts invalidate indices. |

---

## P6 — Unary counter / pairing

| Field | Content |
|-------|---------|
| **Name** | Erase pairs / tally |
| **Description** | Match one `a` with one `b` (or two `b`s) by shuttling; repeat. |
| **Exam use** | \(a^n b^n\), \(a^n b^{2n}\), \(a^k b^k a^k\) inner blocks. |
| **Common mistakes** | Wrong restart position; accepting wrong \(k\). |

---

## P8 — Zig-zag between zones

| Field | Content |
|-------|---------|
| **Name** | Alternate regions (e.g. around `#` or block boundaries) |
| **Description** | One step in block A, then B, repeat. |
| **Exam use** | \(a^k b^k a^k\): match first \(a\)-block to first \(b\)-block, then second \(a\)-block. |
| **Common mistakes** | Wrong turn after delimiter; head stuck in wrong zone. |

---

## P10 — Triple block: \(a^k b^k a^k\)

| Field | Content |
|-------|---------|
| **Name** | Three-segment balanced language |
| **Description** | Input is \(a\cdots a\, b\cdots b\, a\cdots a\) with **same** \(k\) for all three. Typical idea: verify \(a^*b^*\) shape, then match first \(a\)-run length to \(b\)-run, then match remaining \(a\)-run to same count (marking/crossing). |
| **Exam use** | **EXAM 1 Q1** (10 pts). |
| **Variants** | Wrong order \(a^k a^k b^k\); extra symbols → reject. |
| **Common mistakes** | Only checking \(a^*b^*a^*\) without **equal counts**; forgetting empty string \(k=0\). |

---

## P11 — Fixed ratio: \(a^k b^{mk}\) (e.g. \(m=2\) or \(2k+1\) length)

| Field | Content |
|-------|---------|
| **Name** | One \(a\) paired with \(m\) \(b\)s |
| **Description** | For each `a` (or each marked `a`), consume exactly \(m\) `b`s using states or marks; EXAM 1 Q3 style: erase `a`, go to end, walk back consuming two `b`s per round. |
| **Exam use** | **EXAM 1 Q3** (\(b^{2k}\)); **EXAM 3 Q1** (\(b^{2k+1}\) — one extra \(b\) or different pairing). |
| **Common mistakes** | Off-by-one on \(2k\) vs \(2k+1\); accepting \(aabb\) when language is \(a^1 b^2\) only once. |

---

## P12 — Time complexity of a sweep-style TM

| Field | Content |
|-------|---------|
| **Name** | Outer loop × inner scan |
| **Description** | Each “round” touches \(O(n)\) cells; \(r\) rounds → often \(O(r \cdot n)\); if \(r=\Theta(n)\) → \(O(n^2)\). |
| **Exam use** | **EXAM 1 Q3**, **EXAM 2 Q3** — estimate \(O(f(n))\). |
| **Common mistakes** | Declaring \(O(n)\) when each pass is linear but there are linear many passes. |

---

## P13 — Numeric comparison on tallies (“more \(a\) than \(b\)”)

| Field | Content |
|-------|---------|
| **Name** | Compare two counts |
| **Description** | Mark pairs \((a,b)\) or shuttle to compare running difference; accept if unmatched \(a\) remains and format valid; or reject if \(b\) excess. |
| **Exam use** | **EXAM 2 Q1**. |
| **Common mistakes** | Accepting strings with extra symbols; confusing “strictly more \(a\)” with “≥”. |

---

## P14 — Majority / threshold (“≥ half are \(a\)”)

| Field | Content |
|-------|---------|
| **Name** | Delete / mark until balance condition |
| **Description** | Exam 2 Q3: mark `a`, return, delete a non-`a`, repeat — implements pairing against a quota. |
| **Exam use** | **EXAM 2 Q3** runtime + idea. |
| **Common mistakes** | Losing count of marked vs unmarked; wrong interpretation of “half”. |

---

## Pattern → exercise types

| Pattern | Good for |
|---------|----------|
| P10, P11 | Strategy ordering, invariant MCQs, “what phase next?” |
| P6, P8 | Long traces, next-transition mid-pairing |
| P12 | Separate Big-O MCQ (not tape UI) |
| P13, P14 | Strategy + tape-result on **small** implemented machines |

---

## Content authoring checklist

1. Tag with **pattern IDs** and **exam mirror** (e.g. `exam:1-q1`) in `exercise-bank.md`.
2. State **tape alphabet** if not only \(\{a,b\}\).
3. For **design** questions, use `strategy` mode or paper rubric; full δ only when `machine_ref` exists in app.
4. **Empty string**: always decide accept/reject explicitly for languages with \(k \ge 0\).
