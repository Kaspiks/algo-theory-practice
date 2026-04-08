import type { HeadMove } from '@/types/tm';
import type { TMConfiguration, TransitionFired, TuringMachineDefinition } from '@/types/tm';

export type GuidedPhase = 'build' | 'run';

export type GuidedStepType = 'add_state' | 'add_transition' | 'explain' | 'execute';

/** Unified timeline step: construction then execution on one machine. */
export interface GuidedPlaybackStep {
  phase: GuidedPhase;
  type: GuidedStepType;
  explanation: string;
  /** How many entries from `solutionSteps` have been applied (0 = empty diagram). */
  constructionAppliedCount: number;
  machine: TuringMachineDefinition;
  /** Execution snapshot; during build phases use initial blank-tape configuration. */
  config: TMConfiguration;
  /** Set after a real δ step in the run phase. */
  lastFired?: TransitionFired;
  implicitReject?: { from: string; read: string };
  /** Run-phase step index (0 = initial config); undefined in pure build frames. */
  runStepIndex?: number;
}

export type GuidedPlaybackSpeed = 'verySlow' | 'slow' | 'normal' | 'fast';

/** Wall-clock delay between unified timeline steps while Play is on. */
export const GUIDED_PLAYBACK_STEP_MS: Record<GuidedPlaybackSpeed, number> = {
  verySlow: 1500,
  slow: 800,
  normal: 400,
  fast: 150,
};

export const GUIDED_PLAYBACK_SPEED_ORDER: GuidedPlaybackSpeed[] = [
  'verySlow',
  'slow',
  'normal',
  'fast',
];

export const GUIDED_PLAYBACK_SPEED_LABEL: Record<GuidedPlaybackSpeed, string> = {
  verySlow: 'Very slow',
  slow: 'Slow',
  normal: 'Normal',
  fast: 'Fast',
};

/** Optional serializable transition for UI / debugging. */
export interface GuidedTransitionRef {
  from: string;
  to: string;
  read: string;
  write: string;
  move: HeadMove;
}
