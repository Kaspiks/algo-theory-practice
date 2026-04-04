# Notation Guide — Turing Machines (Course-Aligned)

> **Source status:** `materials/` was unavailable at generation time. This guide matches **common Sipser-based** courses and the filenames in `prompts/tm_curriculum_agent_input.md` (ThAlgo TM lectures). **Override any conflicting detail** with the actual slides/PDF once added.

---

## 1. Machine tuple (formal definition)

A **one-tape deterministic Turing machine** is often specified as:

\[
M = (Q, \Sigma, \Gamma, \delta, q_0, q_{\text{accept}}, q_{\text{reject}})
\]

| Symbol | Typical meaning |
|--------|------------------|
| \(Q\) | Finite set of **states** |
| \(\Sigma\) | **Input alphabet** (does not contain the blank) |
| \(\Gamma\) | **Tape alphabet** (\(\Sigma \subset \Gamma\)); includes **blank** |
| \(\delta\) | Transition function: \(Q \times \Gamma \to Q \times \Gamma \times \{L, R\}\) (sometimes \(\{L,R,S\}\) if **stay** is allowed) |
| \(q_0\) | **Start** state |
| \(q_{\text{accept}}\) | **Accept** state |
| \(q_{\text{reject}}\) | **Reject** state |

**Course variations to verify from materials:**

- Some definitions use a **single halt** state and label accept/reject by **halting in a designated subset** or by **no transition = reject**.
- Some use **accept-only** + implicit reject on undefined \(\delta\).

**App default (configurable per exercise pack):**

- Explicit **accept** and **reject** states in diagrams.
- **Undefined transition** → move to **reject** (or “halt reject”) in the engine unless an exercise states otherwise.

---

## 2. Blank symbol

Common notations:

| Notation | Usage |
|----------|--------|
| `⊔` | Sipser blank (Unicode U+2294) |
| `B` | Blank letter |
| `_` | Implementation-friendly blank in UI |

**App:** Store blank as a dedicated internal symbol (e.g. `BLANK`); render as `⊔` or `_` per skin. Never treat it as an input symbol unless the course explicitly does.

---

## 3. State diagrams

- **Nodes** = states; **directed edges** = transitions.
- **Start:** arrow from nowhere to \(q_0\).
- **Accept:** double circle or label `accept` / `q_accept`.
- **Reject:** double circle or `reject`, or omitted if **implicit** via undefined moves.

**Edge labels (most common in courses):**

- **`a → b, R`** means: if head reads **a**, write **b**, move **right**.
- **`a → R`** or **`a; R`** (no write shown): often means **write back a** (read-only on that symbol); **confirm on slides**.
- **`R` only on edge:** shorthand for “any symbol” or “same symbol”; **must be disambiguated per exercise** — avoid ambiguous shorthand in auto-graded content unless explained.

**Recommendation for app content:** Always use explicit **read / write / move** triples in the underlying data, even if the diagram uses shorthand.

---

## 4. Transition function (tabular form)

Rows: states. Columns: tape symbols. Cell: \((q', b, D)\).

Example pattern:

| δ | 0 | 1 | ⊔ |
|---|---|---|---|
| \(q_0\) | \((q_1, X, R)\) | … | … |

**Undefined cell** = no transition on that (state, symbol) pair.

---

## 5. Moves

| Move | Meaning |
|------|---------|
| **R** | Head moves one cell right; if entering new area, cell is blank. |
| **L** | Head moves one cell left; **behavior at left end** is model-dependent (Sipser: cannot move left from leftmost; some courses use “sticky” left end). |
| **S** (if used) | Stay |

**App:** Pick one **left-end policy** document it in exercise preambles: e.g. “no move left from cell 0” = reject or stay.

---

## 6. Configurations (optional formalism)

A configuration is often written **\(u q v\)**:

- Tape contents (finite non-blank segment context),
- State \(q\),
- Head on **first symbol of \(v\)** (Sipser convention).

**Step:** \(u q a v \vdash u' q' v'\) according to \(\delta(q,a)\).

For the **UI**, show tape as a linear array with head index; configurations are for **explanations** and advanced exercises.

---

## 7. Markers and tape alphabet

Courses extend \(\Gamma\) with **markers** such as:

`X`, `Y`, `#`, `⊢`, `⊣`, `•`, or dotted variants.

**Rules for content authors:**

- Every marker used in a machine must appear in the **tape alphabet** list for that exercise.
- Distinguish **input symbols** from **tape-only** symbols in specs.

---

## 8. Language vs machine behavior

| Term | Typical meaning |
|------|------------------|
| **Recognizer** | Accepts strings in \(L\); may loop on strings not in \(L\). |
| **Decider** | Halts on every input; accepts iff string in \(L\). |

**Exam problems** may ask for a **decider** or simply “construct a TM that recognizes \(L\)” — wording matters; the app should tag exercises with **halting requirement** when relevant.

---

## 9. Filename cross-reference (lectures)

When materials exist, map notation to:

- `ThAlgo-01_Intro_TM` — definition, examples, first diagrams.
- `ThAlgo-02_TM` — constructions, variants, possibly multitape (equivalence proof; app stays single-tape for v1).

Update this document with **exact** slide conventions (e.g. reject style, stay vs no-stay).
