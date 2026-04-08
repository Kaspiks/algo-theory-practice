import type { HeadMove } from '@/types/tm';

/** Matches canvas state kinds in the construction editor. */
export type TmSolutionStateKind = 'work' | 'start' | 'accept' | 'reject';

/** One pedagogical step in tutor (solution playback) mode. */
export type TmSolutionStep =
  | {
      type: 'explain';
      explanation: string;
    }
  | {
      type: 'add_state';
      id: string;
      kind: TmSolutionStateKind;
      position: { x: number; y: number };
      explanation: string;
    }
  | {
      type: 'add_transition';
      from: string;
      to: string;
      read: string;
      write: string;
      move: HeadMove;
      explanation: string;
    };

export type TutorPlaybackSpeed = 'slow' | 'normal' | 'fast';

export const TUTOR_SPEED_DELAY_MS: Record<TutorPlaybackSpeed, number> = {
  slow: 2200,
  normal: 1300,
  fast: 550,
};
