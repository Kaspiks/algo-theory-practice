import { describe, expect, it } from 'vitest';
import {
  ANIMATION_SPEED_TIMING,
  computeDiagramEdgeHighlight,
  computePhaseSchedule,
  edgeGraphicMatchesFired,
  edgeLabelMatchesFired,
  getPhaseGapMs,
  isTransitionFocusDimmingActive,
  phaseDurationsForMove,
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

describe('isTransitionFocusDimmingActive', () => {
  it('is true only when an in-flight transition highlight is present', () => {
    expect(isTransitionFocusDimmingActive(undefined)).toBe(false);
    expect(isTransitionFocusDimmingActive(fired)).toBe(true);
  });
});

describe('computeDiagramEdgeHighlight', () => {
  const eg = {
    from: 'q0',
    to: 'q1',
    fullLabel: '0→1,R | 1→0,L',
  };

  it('marks active when edgeHighlightSource matches fullLabel', () => {
    const h = computeDiagramEdgeHighlight(eg, {
      edgeHighlightSource: fired,
      transitionHighlight: undefined,
      pulseActiveTransitionEdge: false,
    });
    expect(h.isActive).toBe(true);
    expect(h.isAnimPulse).toBe(false);
  });

  it('marks anim pulse only when pulse flag and transitionHighlight both match', () => {
    const h = computeDiagramEdgeHighlight(eg, {
      edgeHighlightSource: fired,
      transitionHighlight: fired,
      pulseActiveTransitionEdge: true,
    });
    expect(h.isActive).toBe(true);
    expect(h.isAnimPulse).toBe(true);
  });

  it('does not pulse when pulse flag is off', () => {
    const h = computeDiagramEdgeHighlight(eg, {
      edgeHighlightSource: fired,
      transitionHighlight: fired,
      pulseActiveTransitionEdge: false,
    });
    expect(h.isAnimPulse).toBe(false);
  });

  it('edge and label inputs share the same graphic match (fullLabel)', () => {
    const args = {
      edgeHighlightSource: fired,
      transitionHighlight: fired,
      pulseActiveTransitionEdge: true,
    };
    const a = computeDiagramEdgeHighlight(eg, args);
    const b = computeDiagramEdgeHighlight(
      { from: eg.from, to: eg.to, fullLabel: eg.fullLabel },
      args
    );
    expect(a).toEqual(b);
  });
});

describe('animation speed pacing', () => {
  it('verySlow step takes longer wall-clock than slow (L move)', () => {
    const dV = phaseDurationsForMove('verySlow', 'R');
    const dS = phaseDurationsForMove('slow', 'R');
    const tV = computePhaseSchedule(dV, getPhaseGapMs('verySlow')).totalMs;
    const tS = computePhaseSchedule(dS, getPhaseGapMs('slow')).totalMs;
    expect(tV).toBeGreaterThan(tS * 1.8);
  });

  it('exposes longer preview and autoplay gaps for verySlow', () => {
    expect(ANIMATION_SPEED_TIMING.verySlow.playbackPreviewMs).toBeGreaterThan(
      ANIMATION_SPEED_TIMING.slow.playbackPreviewMs
    );
    expect(
      ANIMATION_SPEED_TIMING.verySlow.autoplayBetweenStepsMs
    ).toBeGreaterThan(ANIMATION_SPEED_TIMING.slow.autoplayBetweenStepsMs);
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
