import type { HeadMove, TapeSymbol, TransitionMcqOption } from '@/types/tm';

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

/** App supports next-transition drills only; field documents intent per curriculum. */
export type QuestionMode = 'next_transition';

/**
 * Full exercise record for content packs (matches architecture + curriculum).
 * MCQ options, when present, apply to the **initial** step only; later steps use engine-built distractors.
 */
export interface MvpExercise {
  id: string;
  title: string;
  description?: string;
  category: ExerciseCategory;
  difficulty: ExerciseDifficulty;
  mode: QuestionMode;
  setup: {
    input: string;
    headIndex?: number;
  };
  hints: { hintId: string }[];
  explanation: string;
  machineId: string;
  /** Optional tags for analytics / future filters */
  tags?: string[];
  /** Authoritative multiple-choice for step 0 (optional). */
  options?: TransitionMcqOption[];
  /** Must match one option id when options are provided. */
  correctOptionId?: string;
  /**
   * Human-readable key for the first step (same as δ for current state/symbol).
   * For documentation; grading uses the engine.
   */
  canonicalFirstAnswer?: {
    nextState: string;
    write: TapeSymbol;
    move: HeadMove;
  };
}
