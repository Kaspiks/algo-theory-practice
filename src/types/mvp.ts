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
  | 'homework_style'
  | 'substring'
  | 'exam_prep'
  | 'complexity_tm'
  | 'language_decode';

export type ExerciseDifficulty = 1 | 2 | 3 | 4;

export type QuestionMode =
  | 'next_transition'
  | 'tape_result'
  | 'missing_transition'
  | 'strategy'
  | 'tracing'
  | 'language_decode';

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

/** Conceptual / exam-style MCQ: no TM step is graded; machine is for context only. */
export interface StrategyExercise extends ExerciseBase {
  mode: 'strategy';
  textOptions: { id: string; label: string }[];
  textCorrectOptionId: string;
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

/** Single-select MCQ within a language-decode step. */
export interface LanguageDecodeMcqStep {
  prompt: string;
  options: { id: string; label: string }[];
  correctOptionId: string;
  feedbackIfCorrect: string;
  feedbackIfWrong: string;
}

/** Multi-select: learner must select exactly the ids in `correctChoiceIds`. */
export interface LanguageDecodeMultiStep {
  prompt: string;
  choices: { id: string; label: string }[];
  correctChoiceIds: string[];
  feedbackIfCorrect: string;
  feedbackIfWrong: string;
}

/**
 * Guided formal-language → examples → conditions → TM strategy.
 * `machineId` / `setup` are unused by the player (kept for pack uniformity).
 */
export interface LanguageDecodeExercise extends ExerciseBase {
  mode: 'language_decode';
  languageNotation: string;
  alphabetNote?: string;
  plainEnglish: LanguageDecodeMcqStep;
  examplesInLanguage: LanguageDecodeMultiStep;
  examplesNotInLanguage: LanguageDecodeMultiStep;
  condition: LanguageDecodeMcqStep;
  tmStrategy: LanguageDecodeMcqStep;
}

export type MvpExercise =
  | NextTransitionExercise
  | TapeResultExercise
  | MissingTransitionExercise
  | StrategyExercise
  | TracingExercise
  | LanguageDecodeExercise;

/** Grading output for tape-result submits (UI / analytics). */
export interface TapeResultGradingPayload {
  correct: boolean;
  chosenOptionId?: string;
  fired?: TransitionFired;
}
