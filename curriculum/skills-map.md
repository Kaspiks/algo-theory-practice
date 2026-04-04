# Skills Map — Turing Machines (Exam Prep)

> **Source status:** At generation time, `materials/` (lectures, homework, reference) was **not present** in this repository. This map follows `prompts/tm_curriculum_agent_input.md`, the TM curriculum agent rule, and **Sipser-style** single-tape deterministic TM conventions. **Reconcile every skill** against `materials/lectures/ThAlgo-01_*`, `ThAlgo-02_*`, and `materials/homework/hw1.pdf` when those files are available.

Skills are ordered from foundational to exam-level construction. The study app should support practice along this ladder.

---

## Tier 0 — Vocabulary and model

| ID | Skill | Success criteria |
|----|--------|------------------|
| S0.1 | Name the TM components | Student can list states, input alphabet, tape alphabet, transition function, start state, accept/reject (or halting) behavior. |
| S0.2 | Distinguish **Σ** vs **Γ** | Input symbols only on tape initially; tape may use extra symbols (markers, blanks). |
| S0.3 | Explain the tape and head | Infinite tape (typically blank elsewhere), head reads one cell per step, tape can grow only as head moves into new blank cells. |
| S0.4 | Configuration intuition | Can describe “current tape contents (with head position), current state” as a snapshot; optional: formal `u q v` notation (see `notation-guide.md`). |

---

## Tier 1 — Reading a machine

| ID | Skill | Success criteria |
|----|--------|------------------|
| S1.1 | Read a state diagram | Given a diagram, identify start, accept, reject (if shown), and interpret each edge label. |
| S1.2 | Parse a transition | Given `δ(q, a) = (q', b, D)`, state what is read, written, next state, and head direction `D ∈ {L, R}` (and `S` if course uses stay). |
| S1.3 | Handle **undefined** transitions | Know that missing transition = reject/halt (per course convention in `notation-guide.md`). |

---

## Tier 2 — Tracing (one step and full runs)

| ID | Skill | Success criteria |
|----|--------|------------------|
| S2.1 | Apply **one** step | From a configuration, produce the next state, tape symbol under head (after write), and head position. |
| S2.2 | Trace until halt | Follow transitions until accept, reject, or infinite loop; record each configuration if asked. |
| S2.3 | Predict **halting vs looping** on small inputs | For simple machines, tell whether a given input eventually halts. |
| S2.4 | Relate trace to **language** | Given a machine and input, answer accept/reject; given a machine, describe or test membership for short strings. |

---

## Tier 3 — Operational patterns (recognize in traces)

| ID | Skill | Success criteria |
|----|--------|------------------|
| S3.1 | **Scan right** | Find a symbol, find blank, find end of input block. |
| S3.2 | **Return left** | Return to left end or to a marked home position. |
| S3.3 | **Mark / stamp** | Replace a symbol with a marker, later restore or distinguish regions. |
| S3.4 | **Match / compare** | Pair symbols (e.g. first half vs second half, balanced brackets style). |
| S3.5 | **Copy / shift** | Duplicate or move a block with separators. |
| S3.6 | **Count / unary arithmetic** | Increment/decrement tallies separated by markers. |

*Detailed pattern catalog: `tm-patterns.md`.*

---

## Tier 4 — Design and explanation (exam-style)

| ID | Skill | Success criteria |
|----|--------|------------------|
| S4.1 | State the **idea** in plain language | “Scan to end, come back, mark first unmatched…” before formal states. |
| S4.2 | Decompose into **phases** | Break construction into finite phases (each implementable as state groups). |
| S4.3 | Argue **correctness** briefly | Invariants: what markers mean, what each phase guarantees, why the machine accepts exactly the target language. |
| S4.4 | Handle **edge cases** | Empty string, single symbol, all same symbols, no delimiter. |

---

## Tier 5 — Course context (light touch for TM app)

These matter for the **course** but are **lower priority** for the first TM-tracing app build (per curriculum input):

| ID | Skill | Note |
|----|--------|------|
| S5.1 | Church–Turing thesis (informal) | Framing only. |
| S5.2 | TM variants vs single-tape DTM | Equivalence ideas; app focuses on one model. |
| S5.3 | Decidable vs recognizable | Language-level; optional quiz copy. |

Lectures `ThAlgo-03`–`07` (diagonalization, reductions, PCP, recursion theorem, theories) support **later** content packs; they are not the primary focus of the initial TM gameplay loop.

---

## Mapping skills → app capabilities

| App capability | Primary skills |
|----------------|----------------|
| Tape + head visualization | S0.2–S0.4, S2.1 |
| “What happens next?” (transition MCQ) | S1.1–S1.3, S2.1 |
| Full trace / step-through | S2.2, S3.x |
| “Final tape / accept?” | S2.4 |
| Missing transition drill | S1.3, S4.2 |
| Strategy / phase ordering | S3.x, S4.1–S4.2 |

---

## Homework alignment placeholder

When `materials/homework/hw1.pdf` is available, add a subsection here:

- **HW1 problem types** → skill IDs
- **Required constructions** → link to `tm-patterns.md` pattern IDs

Until then, assume HW1-style tasks include: **trace given machine**, **design machine for a regular/context-free style language**, **simple non-trivial language** (e.g. patterns with counting or matching).
