# Hints and Feedback — Reusable Library

> **Source status:** Generic pedagogy for TM practice. **Localize** wording to match instructor style when `materials/` slides/homework are available.

Hints are ordered **weak → strong**. Feedback should be **specific**, **non-accusatory**, and tied to **skills** (`skills-map.md`) and **patterns** (`tm-patterns.md`).

---

## 1. Next transition mode

| ID | Hint text | When to use |
|----|-----------|-------------|
| NT.1 | What symbol is under the head **right now**? | First nudge; checks read symbol. |
| NT.2 | From this state, which transitions are **defined** for that symbol? | Student picked wrong row/column. |
| NT.3 | Apply **one** step: write, then move, then update state—in that mental order. | Systematic procedure reminder. |
| NT.4 | Compare your option to \(\delta(q, a)\): does **\(q\)** and **\(a\)** match the configuration? | Wrong state or symbol. |
| NT.5 | After writing, the head moves **before** the next read—what cell will you read next? | Confusion about move timing. |

**Wrong-answer feedback templates**

- “This transition applies when reading **`x`**, but the head sees **`y`**.”
- “That move is valid in state **`q1`**, but the machine is in **`q2`**.”
- “Remember: **undefined** here means **reject** (for this exercise pack).”

---

## 2. Tape result mode

| ID | Hint text | When to use |
|----|-----------|-------------|
| TR.1 | Simulate **without skipping steps** until the halt condition in the prompt. | Rushed answer. |
| TR.2 | Track **only** the finite non-blank window; blanks extend infinitely. | Tape visualization confusion. |
| TR.3 | Did the machine **halt** in **accept** or **reject**, or is it still running? | Wrong halting classification. |
| TR.4 | Check **markers**: they are tape symbols, not “invisible”. | Marker forgotten in final tape. |

**Wrong-answer feedback templates**

- “Your tape matches a trace that **stops early**—continue until halt or step **k**.”
- “Accept/reject is determined by **halt state**, not by ‘running out of transitions’ unless that is reject in this pack.”

---

## 3. Missing transition mode

| ID | Hint text | When to use |
|----|-----------|-------------|
| MT.1 | What **job** is this state doing in the overall plan (scan, compare, return)? | Link to `strategy`. |
| MT.2 | For the missing cell, what **symbol** must be written so the next phase can recognize progress? | Marker choice. |
| MT.3 | Should the head move **toward** the next work region or **back** to an anchor? | Direction errors. |
| MT.4 | If no transition should fire, should this pack use **reject** or **explicit halt**? | Policy reminder. |

**Wrong-answer feedback templates**

- “This choice breaks the invariant: **`…`** would no longer be true after the step.”
- “A transition exists here so the machine does not **reject early** on valid inputs.”

---

## 4. Strategy / phase mode

| ID | Hint text | When to use |
|----|-----------|-------------|
| ST.1 | Name the **phases** in plain English before choosing states. | Decomposition. |
| ST.2 | Do you need to **scan** to a boundary, **match** symbols, or **count**? | Pattern ID recall (P1, P4, P6). |
| ST.3 | Which option would **fail** on the smallest string in the language? | Counterexample thinking. |
| ST.4 | Does the language need **memory** beyond finite state? Usually yes → markers or crossing. | Why TM not DFA. |

**Wrong-answer feedback templates**

- “This plan forgets to **return** to a known position between passes.”
- “This approach would accept **string X** which is **not** in the language.”

---

## 5. Tracing mode

| ID | Hint text | When to use |
|----|-----------|-------------|
| TRA.1 | Fill the **next** row from the **previous** row only—no lookahead. | Trace discipline. |
| TRA.2 | Copy the **entire** tape (in the window) each step; don’t edit from memory. | Consistency. |
| TRA.3 | If stuck, check whether \(\delta\) is **undefined** → what happens in this pack? | Stuck states. |

**Wrong-answer feedback templates**

- “Error at step **k**: the read symbol was **`a`**, not **`b`**.”
- “The write happens **before** the head moves; your tape at step **k** should show **`…`**.”

---

## 6. General encouragement (tone)

Use short, neutral phrases:

- “Good—your state update is consistent; recheck the **write** symbol.”
- “Almost: the **direction** of the head is the only mismatch.”

Avoid:

- “Obviously” / “You should know”
- Grading anxiety triggers

---

## 7. Mapping hints to skills

| Hint cluster | Skills |
|--------------|--------|
| NT.* | S1.2, S2.1 |
| TR.* | S2.2, S2.4 |
| MT.* | S1.3, S4.2 |
| ST.* | S4.1, S3.x |
| TRA.* | S2.2 |

---

## 8. Explain-after-solution structure (recommended)

Each explanation block:

1. **One-sentence idea** (what the machine does).
2. **Phase list** (P7) if construction.
3. **Trace anchor**: reference the **first** step where the answer differs from distractors.
4. **Pattern callout**: e.g. “Uses **P8 zig-zag**.”

This keeps `content_agent` outputs uniform.
