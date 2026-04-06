# Exercise Specification — TM Study App

> **Source status:** Shaped by `prompts/tm_curriculum_agent_input.md`, **`materials/exam/exam.md`**, and the app architect rule. **Refine** with `materials/homework/` when present. **Exercise payloads** for import: `exercise-bank.md`.

**Global constraints for v1 content:**

- **One-tape deterministic TM** only.
- Prebuilt machines in **declarative data** (diagram + transition table); not a free-form TM editor in the first version.
- Every exercise declares: **blank display**, **left-end policy**, **undefined-transition policy**, **accept/reject states**.

---

## Shared exercise fields (authoring schema)

All exercise types should support:

| Field | Purpose |
|-------|---------|
| `id` | Stable string |
| `title` | Short label |
| `tags` | e.g. `["scan", "P1", "trace"]` — see `tm-patterns.md` |
| `difficulty` | `1` (intro) … `4` (exam-hard) |
| `skills` | IDs from `skills-map.md` |
| `setup` | Input string, initial head index (default 0), optional tape alphabet note |
| `machine_ref` | Pointer to machine definition |
| `modes_enabled` | Subset of modes below |
| `hints[]` | Ordered hint IDs or inline text (see `hints-and-feedback.md`) |
| `explanation` | Post-answer walkthrough |
| `solution` | Canonical answer(s) for autograder |

---

## Mode 1 — Next transition (`next_transition`)

| Aspect | Specification |
|--------|----------------|
| **Purpose** | Train **S2.1**: one-step application of \(\delta\). |
| **Prompt** | Given current state, tape snapshot, head index, ask: **which transition fires** or **what is (q', write, move)**? |
| **Interaction** | Multiple choice: full triples or diagram edge selection. |
| **Difficulty** | Low–medium; harder if many symbols/states. |
| **Example** | “Head is on `1` in state `q2`. What is the next configuration?” Options: distinct valid-looking triples with one correct. |
| **Grading** | Exact match on \((q', b, D)\); if multiple valid (should not happen in DTM), reject question design. |
| **Prerequisites** | Student has read transition legend for the pack. |

---

## Mode 2 — Tape result (`tape_result`)

| Aspect | Specification |
|--------|----------------|
| **Purpose** | Train **S2.2**, **S2.4**: forward simulation outcome. |
| **Prompt** | After \(k\) steps, or at halt: **tape contents** (within a window), **accept/reject**, or **head position**. |
| **Variants** | (a) Fixed step count \(k\); (b) Run until halt (with step cap for UI); (c) “Does it accept **w**?” |
| **Difficulty** | Medium; increases with \(k\) and marker noise. |
| **Example** | Input `aab`, machine decides a simple language; question: final state + tape segment `[-2,5]`. |
| **Grading** | Normalize blank representation; compare accept/reject boolean; optional tape string compare after trim rules. |

---

## Mode 3 — Missing transition (`missing_transition`)

| Aspect | Specification |
|--------|----------------|
| **Purpose** | Train **S1.3**, **S4.2**: complete partial \(\delta\) so the machine meets a spec. |
| **Prompt** | Show almost-full table/diagram; one cell or edge missing; ask for the **missing** \((q', b, D)\) or “reject/no transition”. |
| **Difficulty** | Medium–high. |
| **Example** | “Add the transition from `(q3, X)` so the machine accepts palindromes over `{a,b}`.” |
| **Grading** | Any answer equivalent under stated policy; if course treats missing as reject, “explicit reject transition” vs “undefined” must match pack policy. |

---

## Mode 4 — Strategy / phase (`strategy`)

| Aspect | Specification |
|--------|----------------|
| **Purpose** | Train **S4.1**, **S4.2**, pattern recognition (**S3.x**). |
| **Prompt** | No or partial formal TM: given language description or trace outline, choose **correct high-level plan** or **order of phases**. |
| **Interaction** | Multiple choice or ordering drag (UI decision); MVP = MCQ. |
| **Difficulty** | Medium. |
| **Example** | Language: “equal number of `a`s and `b`s”. Options: different scan/match stories; correct one matches instructor method. |
| **Grading** | Keyed to intended pedagogy; explanations must justify why wrong options fail. |

---

## Mode 5 — Full trace (`tracing`)

| Aspect | Specification |
|--------|----------------|
| **Purpose** | Integrate **S2.2** + pattern recognition; exam rehearsal. |
| **Prompt** | Step-by-step: student advances machine (or fills configuration sequence). |
| **Variants** | (a) Student picks each next step; (b) Fill in **one missing row** in trace table; (c) “Find the **first** error” in a given trace. |
| **Difficulty** | Medium–high. |
| **Example** | Given input, complete 6-row trace table: `(state, tape, head index)`. |
| **Grading** | Row-by-row compare; allow equivalent blank rendering. |

---

## Difficulty rubric (authoring)

| Level | Label | Description |
|-------|--------|-------------|
| 1 | **easy** | ≤ 3 states, small alphabet, 1–2 patterns, traces ≤ 8 steps |
| 2 | **medium** | 4–6 states, one marker, homework-like |
| 3 | **hard** | Multi-marker / zig-zag, traces up to ~20 steps (with UI cap) |
| 4 | **exam** | EXAM 1–3 style: full language design, tricky invariants, or long strategy |

---

## Exam alignment (`materials/exam/exam.md`)

| Exam | TM-relevant item | Preferred modes |
|------|------------------|-----------------|
| 1 Q1 | \(a^k b^k a^k\) | `strategy`, then trace on implemented TM when available |
| 1 Q3 | \(a^{k}b^{2k}\) algorithm + **time** | `strategy` + `tracing`; runtime as separate MCQ |
| 2 Q1 | more `a` than `b` | `strategy`, `tape_result` on small \(M\) |
| 2 Q3 | ≥ half `a` (mark `*`) + **time** | `strategy` + `tracing`; runtime MCQ |
| 3 Q1 | \(a^k b^{2k+1}\) | `strategy`, `missing_transition` on partial \(M\) |

Authoring rule: **mirror exam language** in `title` / `description` where copyright permits (paraphrase if needed).

---

## Study vs quiz (behavioral spec)

| Behavior | Study mode | Quiz mode |
|----------|------------|-----------|
| Hints | Progressive, unlimited with cost optional | Limited or disabled |
| Show explanation | After each question | After section or at end |
| Retry | Same seed / new attempt configurable | Single attempt per item |
| Reveal answer | Allowed | Disallowed or penalized |

*(Exact rules are product policy; architect encodes in state.)*

---

## Exercise bank import

- Canonical **authoring list**: `curriculum/exercise-bank.md`.
- Each bank entry includes fields needed to create `MvpExercise` rows or future JSON; `machine_ref: TBD` means **content_agent** must add a machine under `src/content/machines/` before shipping.

---

## Homework alignment (to fill from PDF)

When `hw1.pdf` is available, append:

1. **Problem list** → map to `modes` + `difficulty`.
2. **Required solution format** (table, diagram, paragraph) → mirror in UI copy only where applicable.
3. **Grading-sensitive details** (e.g. must use explicit reject state).

---

## Out of scope for initial TM focus

- **PCP, reductions, logic** (lectures 05–07): separate content packs later.
- **Nondeterministic** TM as interactive traces (unless course requires): optional future type `ntm_trace`.

---

## Machine interchange (for engine agent)

Exercises should compile to:

- `states: string[]`
- `inputAlphabet: string[]`
- `tapeAlphabet: string[]` (includes blank token)
- `transitions: Record<state, Partial<Record<tapeSymbol, { write: TapeSymbol; move: L|R|S; next: State }>>>`
- `start`, `accept`, `reject` (or policy flags)
- Optional: `maxSteps` for safety

This is **implementation-facing** but defines what **content_agent** must supply.
