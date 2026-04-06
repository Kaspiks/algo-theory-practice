# Skills Map — Turing Machines (Exam Pass-Oriented)

> **Primary source:** `materials/exam/exam.md` — TM questions reward **correct constructions**, **correct traces**, and **runtime reasoning**.  
> **Secondary:** `materials/homework/` (not in repo yet — add alignment rows when available).  
> **Reference:** `materials/reference/Sipser.pdf` — use for standard examples (\(a^n b^n\), markers, simulations) when file is present.

Skills are ordered for **exam success**: what you must do **in the room** under time pressure.

---

## Tier 0 — Vocabulary and model (must be automatic)

| ID | Skill | Exam relevance |
|----|--------|----------------|
| S0.1 | Name TM components | Needed to write “diagram or command list”. |
| S0.2 | \(\Sigma\) vs \(\Gamma\) | Extra markers (\(X\), `*`) appear in exam algorithms. |
| S0.3 | Tape + head | EXAM algorithms assume one tape, input initially on tape. |
| S0.4 | Configuration | Tracing and “next step” questions. |

---

## Tier 1 — Reading a machine (fast accuracy)

| ID | Skill | Exam relevance |
|----|--------|----------------|
| S1.1 | Read state diagram | Exam asks for diagram **or** transition list. |
| S1.2 | Parse \(\delta(q,a)=(q',b,D)\) | No arithmetic errors on write/move. |
| S1.3 | Undefined transition | Must match course convention (usually reject/halt). |

---

## Tier 2 — One-step and short traces (high frequency)

| ID | Skill | Exam relevance |
|----|--------|----------------|
| S2.1 | **One step** from configuration | Tape-result and next-transition drills = exam micro-skills. |
| S2.2 | Trace until halt | Proof of understanding for constructed machines. |
| S2.3 | Halting vs looping | Sanity-check your construction. |
| S2.4 | Accept/reject for given \(w\) | Quick membership tests on your TM. |

---

## Tier 3 — Pattern recognition (exam TM problems are pattern-based)

| ID | Skill | Maps to exam |
|----|--------|--------------|
| S3.1 | Scan right (P1) | EXAM 1 Q3 step 2 “to first blank”. |
| S3.2 | Return left (P2) | “Return to start” between rounds. |
| S3.3 | Mark / stamp (P3) | EXAM 2 Q3 `*` on `a`. |
| S3.4 | Match / compare (P4, P6, P8) | \(a^k b^k a^k\), \(a^k b^{2k}\). |
| S3.5 | Ratio / triple block (P10, P11) | EXAM 1 Q1, EXAM 3 Q1. |
| S3.6 | Majority / comparison (P13, P14) | EXAM 2 Q1, Q3. |

*Catalog:* `tm-patterns.md`.

---

## Tier 4 — Design and write-up (10-point TM questions)

| ID | Skill | Exam relevance |
|----|--------|----------------|
| S4.1 | State idea in **plain language** before states | Graders give partial credit for correct phases. |
| S4.2 | Decompose into **phases** | EXAM-style: “repeat: … until …”. |
| S4.3 | **Correctness sketch** | Invariants: what a mark means; why only \(L\) is accepted. |
| S4.4 | **Edge cases** | \(k=0\), wrong symbol, order violations (\(ba\), extra blocks). |
| S4.5 | Relate implementation to **given pseudo-algorithm** | EXAM 1 Q3: your analysis must match the stated loop. |

---

## Tier 5 — Runtime for TM sweeps (exam-specific)

| ID | Skill | Exam relevance |
|----|--------|----------------|
| S5.T1 | Count **passes** over tape | Each pass often \(O(n)\). |
| S5.T2 | Multiply passes × cost per pass | Typical answer \(O(n^2)\) for nested linear scans. |
| S5.T3 | Recognize when a single scan suffices | Rare for counting languages; don’t guess \(O(n)\) without justification. |

*Note:* Big-O MCQs (EXAM 3 Q3) mix TM and pure math — only S5.T* is TM-app scope.

---

## Tier 6 — Course context (lower priority in TM app)

Decidable / recognizable, reductions, NP certificates — **EXAM 1–3** include these but they are **separate** from the TM tracer app. Link only for “full course” study packs.

---

## Mapping skills → app + exam

| Exam task | Skills | Suggested app mode |
|-----------|--------|-------------------|
| Describe TM for language | S4.x, S3.x | `strategy` + paper; optional trace on authored machine |
| Trace given TM | S2.1–S2.2 | `next_transition`, `tracing` |
| One-step / config | S2.1 | `next_transition`, `tape_result` |
| Runtime of sweep TM | S5.T1–T3 | MCQ / study note (outside engine if needed) |

---

## Homework alignment (placeholder)

When homework PDFs exist in `materials/homework/`:

- Add table: **HW problem** → skill IDs → pattern IDs.
- Prefer **same wording** as assignments for transfer.

Until then, **`materials/exam/exam.md`** is the **authoritative** mirror for TM difficulty and style.
