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
```

---

## 2. Exercise domain

### 2.1 Shared enumerations

```ts
// src/types/exercise.ts

export type QuestionMode =
  | 'next_transition'
  | 'tape_result'
  | 'missing_transition'
  | 'strategy'
  | 'tracing';

export type Difficulty = 1 | 2 | 3 | 4;

export interface HintRef {
  /** e.g. NT.1, TR.1 — resolved via content/hints.ts */
  hintId: string;
}

export interface ExerciseBase {
  id: string;
  title: string;
  description?: string;
  /** Pattern tags: P1, scan, … */
  tags: string[];
  /** Skill ids from curriculum: S2.1, etc. */
  skills: string[];
  difficulty: Difficulty;
  /** Ordered weakest → strongest */
  hints: HintRef[];
  /** Shown after submit (per study/quiz rules) */
  explanation: string;
  /** Optional: restrict which modes this item supports in a multi-mode pack */
  modesEnabled?: QuestionMode[];
}
```

### 2.2 Setup and machine reference

```ts
export interface ExerciseSetup {
  /** Raw input string; UI/engine maps chars to TapeSymbol (UTF-16 code units or single-char symbols) */
  input: string;
  headIndex?: number;
  /** Free text for author notes / student preamble */
  tapeAlphabetNote?: string;
}

export interface MachineRef {
  machineId: string;
}
```

### 2.3 Mode-specific exercise shapes

Use a **discriminated union** on `mode` so switches stay exhaustive.

```ts
export interface NextTransitionExercise extends ExerciseBase {
  mode: 'next_transition';
  machine: MachineRef;
  setup: ExerciseSetup;
  /** The configuration *before* the student picks the next transition */
  promptConfig: TMConfiguration;
  options: TransitionMcqOption[];
  correctOptionId: string;
}

export type TapeResultRunSpec =
  | { kind: 'steps'; steps: number }
  | { kind: 'halt'; maxSteps: number }
  | { kind: 'acceptance_only'; maxSteps: number };

export interface TapeSegmentAnswer {
  /** Inclusive window relative to tape indices after simulation */
  fromIndex: number;
  toIndex: number;
  cells: TapeSymbol[];
}

export interface TapeResultExercise extends ExerciseBase {
  mode: 'tape_result';
  machine: MachineRef;
  setup: ExerciseSetup;
  run: TapeResultRunSpec;
  /** What the student must supply */
  asks: Array<'halt_status' | 'tape_segment' | 'head_index'>;
  correct: {
    haltStatus?: Exclude<HaltStatus, 'running'> | 'accepted' | 'rejected';
    tapeSegment?: TapeSegmentAnswer;
    headIndex?: number;
  };
  grading?: {
    trimBlanks?: boolean;
    /** Treat these as equal to machine.blank when comparing */
    blankAliases?: TapeSymbol[];
  };
}

/** Missing cell in δ */
export interface MissingTransitionSlot {
  state: StateId;
  read: TapeSymbol;
}

export interface MissingTransitionExercise extends ExerciseBase {
  mode: 'missing_transition';
  /** Base machine possibly incomplete: transitions[slot] undefined */
  machinePartial: TuringMachineDefinition;
  slot: MissingTransitionSlot;
  options: TransitionMcqOption[];
  correctOptionId: string;
}

export interface StrategyExercise extends ExerciseBase {
  mode: 'strategy';
  /** Language / scenario text */
  scenario: string;
  /** Optional partial machine for context */
  machine?: MachineRef;
  options: Array<{ id: string; label: string }>;
  correctOptionId: string;
}

export type TracingVariant =
  | { kind: 'pick_next'; maxSteps: number }
  | { kind: 'fill_row'; rowIndex: number }
  | { kind: 'find_first_error' };

export interface TraceRow {
  config: TMConfiguration;
}

export interface TracingExercise extends ExerciseBase {
  mode: 'tracing';
  machine: MachineRef;
  setup: ExerciseSetup;
  variant: TracingVariant;
  /** Authoritative trace for grading (engine-generated offline or hand-checked) */
  solutionTrace: TraceRow[];
}

export type Exercise =
  | NextTransitionExercise
  | TapeResultExercise
  | MissingTransitionExercise
  | StrategyExercise
  | TracingExercise;
```

**Content note:** For `missing_transition`, authors may duplicate the full machine with one hole instead of a special file format; `machinePartial` must still parse as `TuringMachineDefinition` with `transitions[state][read]` absent.

### 2.4 Content registry

```ts
export interface MachineRegistry {
  get(id: string): TuringMachineDefinition | undefined;
}

export interface ExerciseRegistry {
  list(): Exercise[];
  get(id: string): Exercise | undefined;
  byTag?(tag: string): Exercise[];
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
