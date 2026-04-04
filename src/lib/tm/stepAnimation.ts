import type {
  TapeModel,
  TMConfiguration,
  TransitionFired,
  TuringMachineDefinition,
} from '@/types/tm';
import { ensureHeadInBounds } from '@/lib/tm/tape';

export type AnimationSpeed = 'slow' | 'normal' | 'fast';

/** Ordered phases for one TM step (UI layer only). */
export type StepAnimPhase =
  | 'edge'
  | 'write'
  | 'head_from'
  | 'head_to'
  | 'state';

export const STEP_ANIMATION_DURATIONS_MS: Record<
  AnimationSpeed,
  Record<StepAnimPhase, number>
> = {
  slow: {
    edge: 720,
    write: 760,
    head_from: 320,
    head_to: 360,
    state: 520,
  },
  normal: {
    edge: 480,
    write: 500,
    head_from: 220,
    head_to: 260,
    state: 360,
  },
  fast: {
    edge: 280,
    write: 300,
    head_from: 140,
    head_to: 160,
    state: 220,
  },
};

/** Pause between phases so each stage reads clearly (ms). */
export const PHASE_GAP_MS: Record<AnimationSpeed, number> = {
  slow: 160,
  normal: 120,
  fast: 70,
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
  const d = STEP_ANIMATION_DURATIONS_MS[speed];
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
