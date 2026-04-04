import type {
  TapeModel,
  TMConfiguration,
  TransitionFired,
  TuringMachineDefinition,
} from '@/types/tm';
import { ensureHeadInBounds } from '@/lib/tm/tape';

/** UI / tuning: ordered slow → fast for study playback. */
export type AnimationSpeed = 'verySlow' | 'slow' | 'normal' | 'fast';

/** Ordered phases for one TM step (UI layer only). */
export type StepAnimPhase =
  | 'edge'
  | 'write'
  | 'head_from'
  | 'head_to'
  | 'state';

export interface SpeedTimingConfig {
  /** Speed selector label */
  label: string;
  /** Short hint shown in UI (approximate wall-clock per step, L/R move) */
  approxStepLabel: string;
  stepPhaseDurations: Record<StepAnimPhase, number>;
  phaseGapMs: number;
  /** Tape-result Play: hold on correct option before engine animation (ms) */
  playbackPreviewMs: number;
  /** Delay after a step completes before autoplay starts the next (ms) */
  autoplayBetweenStepsMs: number;
}

/**
 * Central timing table — tune study pacing here only.
 * Phase gaps are applied between successive phases (see `computePhaseSchedule`).
 */
export const ANIMATION_SPEED_TIMING: Record<
  AnimationSpeed,
  SpeedTimingConfig
> = {
  verySlow: {
    label: 'Very slow',
    approxStepLabel: '~8–9s / step',
    stepPhaseDurations: {
      edge: 1800,
      write: 1900,
      head_from: 900,
      head_to: 1000,
      state: 1400,
    },
    phaseGapMs: 320,
    playbackPreviewMs: 2400,
    autoplayBetweenStepsMs: 750,
  },
  slow: {
    label: 'Slow',
    approxStepLabel: '~3.5s / step',
    stepPhaseDurations: {
      edge: 720,
      write: 760,
      head_from: 320,
      head_to: 360,
      state: 520,
    },
    phaseGapMs: 160,
    playbackPreviewMs: 700,
    autoplayBetweenStepsMs: 200,
  },
  normal: {
    label: 'Normal',
    approxStepLabel: '~2.5s / step',
    stepPhaseDurations: {
      edge: 480,
      write: 500,
      head_from: 220,
      head_to: 260,
      state: 360,
    },
    phaseGapMs: 120,
    playbackPreviewMs: 700,
    autoplayBetweenStepsMs: 200,
  },
  fast: {
    label: 'Fast',
    approxStepLabel: '~1.5s / step',
    stepPhaseDurations: {
      edge: 280,
      write: 300,
      head_from: 140,
      head_to: 160,
      state: 220,
    },
    phaseGapMs: 70,
    playbackPreviewMs: 700,
    autoplayBetweenStepsMs: 200,
  },
};

/** Select option order (slowest first). */
export const ANIMATION_SPEED_ORDER: AnimationSpeed[] = [
  'verySlow',
  'slow',
  'normal',
  'fast',
];

export function getPhaseGapMs(speed: AnimationSpeed): number {
  return ANIMATION_SPEED_TIMING[speed].phaseGapMs;
}

export function getPlaybackPreviewMs(speed: AnimationSpeed): number {
  return ANIMATION_SPEED_TIMING[speed].playbackPreviewMs;
}

export function getAutoplayBetweenStepsMs(speed: AnimationSpeed): number {
  return ANIMATION_SPEED_TIMING[speed].autoplayBetweenStepsMs;
}

/** @deprecated Use `ANIMATION_SPEED_TIMING[s].stepPhaseDurations` */
export const STEP_ANIMATION_DURATIONS_MS: Record<
  AnimationSpeed,
  Record<StepAnimPhase, number>
> = {
  verySlow: ANIMATION_SPEED_TIMING.verySlow.stepPhaseDurations,
  slow: ANIMATION_SPEED_TIMING.slow.stepPhaseDurations,
  normal: ANIMATION_SPEED_TIMING.normal.stepPhaseDurations,
  fast: ANIMATION_SPEED_TIMING.fast.stepPhaseDurations,
};

/** @deprecated Use `getPhaseGapMs` */
export const PHASE_GAP_MS: Record<AnimationSpeed, number> = {
  verySlow: ANIMATION_SPEED_TIMING.verySlow.phaseGapMs,
  slow: ANIMATION_SPEED_TIMING.slow.phaseGapMs,
  normal: ANIMATION_SPEED_TIMING.normal.phaseGapMs,
  fast: ANIMATION_SPEED_TIMING.fast.phaseGapMs,
};

const PHASE_ORDER: StepAnimPhase[] = [
  'edge',
  'write',
  'head_from',
  'head_to',
  'state',
];

/** Start time of each phase; total includes active time only (gaps sit after each phase except the last). */
export function computePhaseSchedule(
  durations: Record<StepAnimPhase, number>,
  gapMs: number
): { phaseStarts: Record<StepAnimPhase, number>; totalMs: number } {
  let t = 0;
  const phaseStarts = {} as Record<StepAnimPhase, number>;
  for (let i = 0; i < PHASE_ORDER.length; i++) {
    const p = PHASE_ORDER[i];
    phaseStarts[p] = t;
    t += durations[p];
    if (i < PHASE_ORDER.length - 1) {
      t += gapMs;
    }
  }
  return { phaseStarts, totalMs: t };
}

/** Learner-facing label for the current animation stage. */
export function stepPhaseUiLabel(phase: StepAnimPhase): string {
  switch (phase) {
    case 'edge':
      return 'Taking transition';
    case 'write':
      return 'Writing symbol';
    case 'head_from':
    case 'head_to':
      return 'Moving head';
    case 'state':
      return 'Entering next state';
    default:
      return '';
  }
}

export function phaseDurationsForMove(
  speed: AnimationSpeed,
  move: TransitionFired['move']
): Record<StepAnimPhase, number> {
  const d = ANIMATION_SPEED_TIMING[speed].stepPhaseDurations;
  if (move === 'S') {
    return {
      ...d,
      head_from: Math.round(d.head_from * 0.55),
      head_to: Math.round(d.head_to * 0.55),
    };
  }
  return d;
}

/** @deprecated Prefer computePhaseSchedule with gaps */
export function cumulativeDelaysMs(
  durations: Record<StepAnimPhase, number>
): Record<StepAnimPhase, number> {
  const { phaseStarts } = computePhaseSchedule(durations, 0);
  return phaseStarts;
}

/** Tape after write, before head move (same head index as `before`). */
export function tapeAfterWriteOnly(
  machine: TuringMachineDefinition,
  before: TMConfiguration,
  fired: TransitionFired
): TapeModel {
  const tape0 = ensureHeadInBounds(before.tape, machine.blank);
  const cells = [...tape0.cells];
  cells[tape0.headIndex] = fired.write;
  return { cells, headIndex: tape0.headIndex };
}

export function edgeLabelMatchesFired(
  edgeLabel: string,
  fired: TransitionFired
): boolean {
  const prefix = `${fired.read}→`;
  return edgeLabel.split(' | ').some((chunk) => chunk.startsWith(prefix));
}

export function edgeGraphicMatchesFired(
  e: { from: string; to: string; label: string },
  fired: TransitionFired
): boolean {
  return (
    fired.from === e.from &&
    fired.to === e.to &&
    edgeLabelMatchesFired(e.label, fired)
  );
}
