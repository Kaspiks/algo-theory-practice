# TypeScript Data Model

Shared types live under `src/types/`. The **engine** and **grading** modules depend on these types; **content** should only construct objects that satisfy them (validated manually or via a small validator script).

---

## 1. Turing machine domain

### 1.1 Core identifiers

Use plain `string` for state and symbol ids in v1. Content authors pick stable ids (`"q0"`, `"q_accept"`).

```ts
// src/types/tm.ts

/** Tape cell value as stored in content (blank is a dedicated token, not input). */
export type TapeSymbol = string;

export type StateId = string;

export type HeadMove = 'L' | 'R' | 'S';

/** One transition: read implicit as map key at use site */
export interface TransitionRule {
  next: StateId;
  write: TapeSymbol;
  move: HeadMove;
}

/**
 * Sparse δ: missing (state, symbol) entry → engine applies undefinedTransition policy.
 * Keys: state id → (tape symbol → rule)
 */
export type TransitionTable = Record<
  StateId,
  Partial<Record<TapeSymbol, TransitionRule>>
>;

export type LeftEndPolicy = 'reject' | 'stay';

/**
 * When δ is undefined: immediately reject, or treat as error for content validation.
 * Curriculum default: implicit reject.
 */
export type UndefinedTransitionPolicy = 'reject';

export interface MachinePolicies {
  leftEnd: LeftEndPolicy;
  undefinedTransition: UndefinedTransitionPolicy;
}

/** How blank is shown in UI copy for this machine/pack */
export type BlankDisplay = 'cup' | 'underscore' | 'B';

export interface TuringMachineDefinition {
  id: string;
  /** For labels in diagrams */
  name?: string;
  states: StateId[];
  inputAlphabet: TapeSymbol[];
  tapeAlphabet: TapeSymbol[];
  transitions: TransitionTable;
  start: StateId;
  accept: StateId;
  reject: StateId;
  /** Included in tapeAlphabet; engine treats this token as blank */
  blank: TapeSymbol;
  policies: MachinePolicies;
  /** Safety cap for runUntil / simulations */
  maxSteps?: number;
  blankDisplay?: BlankDisplay;
}
```

### 1.2 Configuration and execution

```ts
export interface TapeModel {
  /** Cells indexed 0..length-1; headIndex must be valid */
  cells: TapeSymbol[];
  headIndex: number;
}

export interface TMConfiguration {
  state: StateId;
  tape: TapeModel;
}

export type HaltStatus = 'running' | 'accepted' | 'rejected' | 'max_steps_exceeded';

export interface TransitionFired {
  from: StateId;
  read: TapeSymbol;
  to: StateId;
  write: TapeSymbol;
  move: HeadMove;
}

export interface ExecutionStep {
  /** 0 = initial configuration before first step, or 0 after first step — pick one convention in engine and stick to it */
  stepIndex: number;
  config: TMConfiguration;
  /** Present for stepIndex > 0 when a transition was applied */
  lastTransition?: TransitionFired;
  status: HaltStatus;
}
```

**Convention (recommended):** `ExecutionStep.stepIndex === 0` is the **initial** configuration; applying one step yields `stepIndex === 1` with `lastTransition` set. Engine API should document this.

### 1.3 Multiple-choice transition option (grading + UI)

```ts
/** Canonical answer for next-transition questions */
export interface TransitionAnswer {
  nextState: StateId;
  write: TapeSymbol;
  move: HeadMove;
}

export interface TransitionMcqOption {
  id: string;
  label: string;
  /** If omitted, derive label from answer in UI */
  answer: TransitionAnswer;
}

/**
 * Author-facing option for tape-result MCQ (one step → full configuration).
 * Projected to {@link TMConfiguration} for grading via tapeResultOptionToConfiguration.
 */
export interface TapeResultOption {
  id: string;
  nextState: StateId;
  tapeCells: TapeSymbol[];
  headPosition: number;
  label?: string;
  explanation?: string;
}

/** UI/runtime row after projection */
export interface TapeResultMcqOption {
  id: string;
  label: string;
  resultingConfig: TMConfiguration;
}
```

---

## 2. Exercise domain (MVP pack)

Implemented types live in **`src/types/mvp.ts`** (exercises) and **`src/types/tm.ts`** (machine + `TapeResultOption`). The **prompt configuration** before any step is always derived at runtime: `initialConfiguration(machine, setup.input, setup.headIndex ?? 0)` — it is a `TmConfigurationSnapshot` / `TMConfiguration`, not duplicated per exercise row.

### 2.1 Shared fields and mode tag

```ts
// src/types/mvp.ts

export type QuestionMode =
  | 'next_transition'
  | 'tape_result'
  | 'missing_transition'
  | 'strategy'
  | 'tracing';

export type ExerciseCategory =
  | 'tm_basics'
  | 'tracing'
  | 'scan_right'
  | 'reject_bad_symbol'
  | 'return_left'
  | 'marking'
  | 'homework_style';

export type ExerciseDifficulty = 1 | 2 | 3 | 4;

export interface ExerciseHintRef {
  hintId: string;
}

export interface ExerciseBase {
  id: string;
  title: string;
  description?: string;
  category: ExerciseCategory;
  difficulty: ExerciseDifficulty;
  machineId: string;
  setup: ExerciseSetup;
  hints: ExerciseHintRef[];
  explanation: string;
  tags?: string[];
}

export interface ExerciseSetup {
  input: string;
  headIndex?: number;
}
```

### 2.2 Discriminated union (`MvpExercise`)

```ts
export interface NextTransitionExercise extends ExerciseBase {
  mode: 'next_transition';
  options?: TransitionMcqOption[];
  correctOptionId?: string;
  canonicalFirstAnswer?: TransitionAnswer;
}

/**
 * One-step “what is the next full configuration?” MCQ.
 * - Omit options / correctOptionId → player uses buildTapeResultMcq (engine-generated distractors).
 * - Provide options + correctOptionId → player uses buildTapeResultMcqFromAuthor (order preserved; correct row must equal step()).
 */
export interface TapeResultExercise extends ExerciseBase {
  mode: 'tape_result';
  options?: TapeResultOption[];
  correctOptionId?: string;
  walkthrough?: { stepHintIds?: Record<number, string> };
}

/** Placeholders for future drills; unused in current pack. */
export interface MissingTransitionExercise extends ExerciseBase {
  mode: 'missing_transition';
}
export interface StrategyExercise extends ExerciseBase {
  mode: 'strategy';
}

/** Same optional MCQ as next-transition when tracing is framed as δ-choice. */
export interface TracingExercise extends ExerciseBase {
  mode: 'tracing';
  options?: TransitionMcqOption[];
  correctOptionId?: string;
  canonicalFirstAnswer?: TransitionAnswer;
}

export type MvpExercise =
  | NextTransitionExercise
  | TapeResultExercise
  | MissingTransitionExercise
  | StrategyExercise
  | TracingExercise;
```

### 2.3 Tape-result grading helpers

```ts
// src/lib/grading/tapeResult.ts — summaries

buildTapeResultMcq(machine, config)           // dynamic MCQ + internal correct id `tr-correct`
buildTapeResultMcqFromAuthor(machine, config, { options, correctOptionId }) // static pack rows; null if authoring wrong
gradeTapeResult(machine, config, chosenConfig)

// src/types/mvp.ts
export interface TapeResultGradingPayload {
  correct: boolean;
  chosenOptionId?: string;
  fired?: TransitionFired;
}
```

**Pack validation:** `tests/content/pack.test.ts` requires every `tape_result` item to yield a non-null MCQ (authored path preferred when `options` + `correctOptionId` are set) and the marked option’s `resultingConfig` must equal `step(machine, c0).next` under `configurationsEqual`.

### 2.4 Content registry

```ts
export interface MachineRegistry {
  get(id: string): TuringMachineDefinition | undefined;
}

export interface ExerciseRegistry {
  list(): MvpExercise[];
  get(id: string): MvpExercise | undefined;
  byTag?(tag: string): MvpExercise[];
}
```

---

## 3. Session / app state (player)

```ts
// src/types/session.ts

export type SessionMode = 'study' | 'quiz';

export interface ScoringPolicy {
  pointsCorrect: number;
  pointsPartial?: number;
  hintPenalty?: number;
  allowRetry: boolean;
  maxHints?: number;
}

export interface PlayerAttempt {
  exerciseId: string;
  mode: QuestionMode;
  submittedAt: number;
  isCorrect: boolean;
  /** Hint ids revealed before submit */
  hintsUsed: string[];
}

export interface ExercisePlayerState {
  sessionMode: SessionMode;
  exerciseId: string;
  /** Live simulation state for stepping UI */
  execution: {
    history: ExecutionStep[];
    currentIndex: number;
  };
  question: {
    selectedOptionId?: string;
    /** Freeform fields for tape result / trace if needed */
    freeform?: Record<string, unknown>;
    submitted: boolean;
    /** Last grading output */
    feedback?: FeedbackPayload;
  };
  hints: {
    revealedCount: number;
  };
}

export interface FeedbackPayload {
  correct: boolean;
  message: string;
  /** Skill/pattern tags for analytics */
  relatedSkills?: string[];
  showExplanation: boolean;
}

export interface SessionResults {
  startedAt: number;
  finishedAt: number;
  attempts: PlayerAttempt[];
  score: number;
}
```

---

## 4. Engine public API (signature sketch)

Not a type file, but shapes consumer expectations:

```ts
// src/lib/tm/engine.ts — exports
export function initialConfiguration(
  machine: TuringMachineDefinition,
  input: string,
  headIndex?: number
): TMConfiguration;

export function step(
  machine: TuringMachineDefinition,
  config: TMConfiguration
): { next: TMConfiguration; fired: TransitionFired; status: HaltStatus };

export function runSteps(
  machine: TuringMachineDefinition,
  config: TMConfiguration,
  n: number
): ExecutionStep[];

export function runUntilHalt(
  machine: TuringMachineDefinition,
  config: TMConfiguration
): ExecutionStep[];
```

---

## 5. Extensibility

| Future addition | Approach |
|-----------------|----------|
| NDTM | New `TuringMachineDefinition` variant or `branching` execution type; keep DTM types unchanged |
| Multitape | Separate types in `tm-multitape.ts` |
| Content packs / i18n | `packId` on exercises + localized strings map |
| Diagram layout | Optional `layout?: { statePositions: Record<StateId, { x: number; y: number }> }` on machine |

---

## 6. Curriculum mapping

| Curriculum artifact | Type / field |
|---------------------|--------------|
| `exercise-spec.md` machine interchange | `TuringMachineDefinition` |
| Policies (blank, left end, undefined δ) | `blank`, `policies`, `blankDisplay` |
| Modes | `QuestionMode` + exercise union |
| `hints-and-feedback.md` | `HintRef.hintId` → `content/hints.ts` |
| Skills / patterns | `ExerciseBase.skills`, `tags` |
