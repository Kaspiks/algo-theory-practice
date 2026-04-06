# Hints and Feedback — Reusable Library

> **Source status:** Generic pedagogy + **exam-style** mistakes derived from `materials/exam/exam.md` TM tasks. Localize to instructor style when slides/homework are available.

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

## 7. Exam-style mistakes (from exam TM problems)

Map these to **feedback** and **hints** in `exercise-bank.md` and pack copy.

| ID | Mistake | Typical wrong outcome | Hint / feedback angle |
|----|---------|----------------------|------------------------|
| EX.1 | Treat \(a^k b^k a^k\) as “three blocks exist” only | Accepts `aabaaa` | “Equal **k** for all three blocks—pair counts, not just shape.” |
| EX.2 | Pair one `a` with one `b` when language needs \(b^{2k}\) | Accepts `abb` for \(a^1b^2\) once but wrong generalization | “Each `a` must account for **two** `b`s (or match the exam’s stated loop exactly).” |
| EX.3 | Off-by-one: \(2k\) vs \(2k+1\) | Wrong answer for EXAM 3 Q1 | “Count whether the **last** sweep needs an extra `b`.” |
| EX.4 | “More `a` than `b`” but reject when counts tie | Rejects `ab` incorrectly or accepts `ba` | “Tie goes to **not** ‘strictly more `a`’ unless the language says otherwise.” |
| EX.5 | Move **L** vs **R** after erase in sweep algorithm | Trace diverges from EXAM 1 Q3 spec | “Re-read the bullet: after erase, which direction hits the blank first?” |
| EX.6 | Forget to **write back** on read-only leg | Tape corrupted, wrong next δ | “If the step says ‘check symbol’, does it also say erase?” |
| EX.7 | Mark `a` as `*` but forget `*` in tape alphabet | Undefined transition / crash | “`*` is a **tape symbol**—δ must handle it in later states.” |
| EX.8 | Majority algorithm: delete wrong symbol class | Imbalance reversed | “Each round marks an `a`, then removes one **non-`a`** when returning.” |
| EX.9 | Runtime \(O(n)\) for linear rounds × linear scans | Underestimate EXAM 1 Q3 / 2 Q3 | “How many **outer** iterations? Each touches how many cells?” |
| EX.10 | Empty string edge case for \(k \ge 0\) | Rejects `⊔` or accepts illegal ε shape | “Is ε in the language? Where does the machine halt on blank-only tape?” |

**Reusable feedback lines**

- “That construction accepts **w = …** which violates the **ratio** in the definition.”
- “Your next configuration skips the **return-to-start** phase the exam algorithm requires.”
- “**Head direction** after this write does not match the stated procedure.”

---

## 8. Mapping hints to skills

| Hint cluster | Skills |
|--------------|--------|
| NT.* | S1.2, S2.1 |
| TR.* | S2.2, S2.4 |
| MT.* | S1.3, S4.2 |
| ST.* | S4.1, S3.x |
| TRA.* | S2.2 |
| EX.* | S3.x, S4.x, S5.T* |

---

## 9. Explain-after-solution structure (recommended)

Each explanation block:

1. **One-sentence idea** (what the machine does).
2. **Phase list** (P7) if construction.
3. **Trace anchor**: reference the **first** step where the answer differs from distractors.
4. **Pattern callout**: e.g. “Uses **P8 zig-zag**.”

This keeps `content_agent` outputs uniform.
