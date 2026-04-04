import { describe, expect, it } from 'vitest';
import {
  computePhaseSchedule,
  edgeGraphicMatchesFired,
  edgeLabelMatchesFired,
  stepPhaseUiLabel,
} from '@/lib/tm/stepAnimation';
import type { TransitionFired } from '@/types/tm';

const fired: TransitionFired = {
  from: 'q0',
  to: 'q1',
  read: '0',
  write: '1',
  move: 'R',
};

describe('edgeLabelMatchesFired', () => {
  it('matches a single transition label', () => {
    expect(edgeLabelMatchesFired('0→1,R', fired)).toBe(true);
  });

  it('matches the correct branch when labels are merged', () => {
    const label = '0→1,R | 1→0,L';
    expect(edgeLabelMatchesFired(label, fired)).toBe(true);
  });

  it('does not match a different read symbol', () => {
    expect(edgeLabelMatchesFired('1→0,L', fired)).toBe(false);
  });
});

describe('computePhaseSchedule', () => {
  it('inserts gaps between phases and sums total duration', () => {
    const d = {
      edge: 100,
      write: 200,
      head_from: 50,
      head_to: 50,
      state: 300,
    };
    const { phaseStarts, totalMs } = computePhaseSchedule(d, 25);
    expect(phaseStarts.edge).toBe(0);
    expect(phaseStarts.write).toBe(125);
    expect(phaseStarts.head_from).toBe(350);
    expect(phaseStarts.head_to).toBe(425);
    expect(phaseStarts.state).toBe(500);
    expect(totalMs).toBe(800);
  });
});

describe('stepPhaseUiLabel', () => {
  it('maps internal phases to learner-facing text', () => {
    expect(stepPhaseUiLabel('edge')).toBe('Taking transition');
    expect(stepPhaseUiLabel('write')).toBe('Writing symbol');
    expect(stepPhaseUiLabel('head_from')).toBe('Moving head');
    expect(stepPhaseUiLabel('state')).toBe('Entering next state');
  });
});

describe('edgeGraphicMatchesFired', () => {
  it('requires from, to, and label match', () => {
    expect(
      edgeGraphicMatchesFired(
        { from: 'q0', to: 'q1', label: '0→1,R' },
        fired
      )
    ).toBe(true);
    expect(
      edgeGraphicMatchesFired(
        { from: 'q0', to: 'q2', label: '0→1,R' },
        fired
      )
    ).toBe(false);
  });
});
