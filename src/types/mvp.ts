import type {
  HeadMove,
  TapeSymbol,
  TapeResultOption,
  TransitionFired,
  TransitionMcqOption,
} from '@/types/tm';

/** Curriculum-aligned categories for filtering and progression. */
export type ExerciseCategory =
  | 'tm_basics'
  | 'tracing'
  | 'scan_right'
  | 'reject_bad_symbol'
  | 'return_left'
  | 'marking'
  | 'homework_style';

export type ExerciseDifficulty = 1 | 2 | 3 | 4;

export type QuestionMode =
  | 'next_transition'
  | 'tape_result'
  | 'missing_transition'
  | 'strategy'
  | 'tracing';

export interface ExerciseSetup {
  input: string;
  headIndex?: number;
}

export interface ExerciseHintRef {
  hintId: string;
}

/**
 * Fields shared by every exercise in the MVP pack.
 * Mode-specific payloads live on discriminated variants.
 */
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

/** Choose the correct δ triple; optional authored MCQ for step 0. */
export interface NextTransitionExercise extends ExerciseBase {
  mode: 'next_transition';
  options?: TransitionMcqOption[];
  correctOptionId?: string;
  canonicalFirstAnswer?: {
    nextState: string;
    write: TapeSymbol;
    move: HeadMove;
  };
}

/**
 * Choose the full configuration after one step.
 * Omit `options` / `correctOptionId` to auto-generate choices from the engine.
 */
export interface TapeResultExercise extends ExerciseBase {
  mode: 'tape_result';
  options?: TapeResultOption[];
  correctOptionId?: string;
  /** Optional guided walkthrough metadata (hint ids keyed by step index). */
  walkthrough?: {
    stepHintIds?: Record<number, string>;
  };
}

/** Placeholder for future drills; not used in the current pack. */
export interface MissingTransitionExercise extends ExerciseBase {
  mode: 'missing_transition';
}

/** Placeholder for future drills; not used in the current pack. */
export interface StrategyExercise extends ExerciseBase {
  mode: 'strategy';
}

/**
 * Same MCQ shape as next-transition in v1; category may still be `tracing`.
 * Use when the exercise is framed as full-run tracing but the interaction is δ MCQ.
 */
export interface TracingExercise extends ExerciseBase {
  mode: 'tracing';
  options?: TransitionMcqOption[];
  correctOptionId?: string;
  canonicalFirstAnswer?: {
    nextState: string;
    write: TapeSymbol;
    move: HeadMove;
  };
}

export type MvpExercise =
  | NextTransitionExercise
  | TapeResultExercise
  | MissingTransitionExercise
  | StrategyExercise
  | TracingExercise;

/** Grading output for tape-result submits (UI / analytics). */
export interface TapeResultGradingPayload {
  correct: boolean;
  chosenOptionId?: string;
  fired?: TransitionFired;
}
