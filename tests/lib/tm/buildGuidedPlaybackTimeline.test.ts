import { describe, expect, it } from 'vitest';
import { CONSTRUCT_AKBK_SOLUTION_STEPS } from '@/content/tmConstruction/solutionSteps/constructAkBk';
import { AKBK_REFERENCE_CONSTRUCTION_INPUT } from '@/content/tmConstruction/referenceMachines/akbk';
import { buildGuidedPlaybackTimeline } from '@/lib/tm/buildGuidedPlaybackTimeline';
import { buildMachineFromConstruction } from '@/lib/tm/constructionMachine';

describe('buildGuidedPlaybackTimeline', () => {
  it('builds intro, construction frames, then execution ending in accept for aabb', () => {
    const built = buildMachineFromConstruction(AKBK_REFERENCE_CONSTRUCTION_INPUT);
    expect(built.ok).toBe(true);
    if (!built.ok) return;

    const tl = buildGuidedPlaybackTimeline(
      CONSTRUCT_AKBK_SOLUTION_STEPS,
      built.machine,
      'aabb',
      500
    );

    expect(tl.length).toBeGreaterThan(CONSTRUCT_AKBK_SOLUTION_STEPS.length + 2);
    expect(tl[0]!.phase).toBe('build');
    expect(tl[0]!.constructionAppliedCount).toBe(0);

    const firstRun = tl.findIndex((s) => s.phase === 'run');
    expect(firstRun).toBeGreaterThan(0);
    expect(tl[firstRun]!.runStepIndex).toBe(0);

    const last = tl[tl.length - 1]!;
    expect(last.config.state).toBe(built.machine.accept);
  });
});
