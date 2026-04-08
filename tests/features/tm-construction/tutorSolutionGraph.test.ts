import { describe, expect, it } from 'vitest';
import { getConstructionChallenge } from '@/content/tmConstruction/challenges';
import { CONSTRUCT_AKBK_SOLUTION_STEPS } from '@/content/tmConstruction/solutionSteps/constructAkBk';
import { graphAfterSolutionSteps } from '@/features/tm-construction/applySolutionSteps';
import { flowToConstructionInput } from '@/features/tm-construction/flowToConstructionInput';
import { buildMachineFromConstruction } from '@/lib/tm/constructionMachine';
import {
  allConstructionTestsPassed,
  runConstructionTestSuite,
} from '@/lib/tm/runConstructionTests';

describe('tutor solution graph (construct-ak-bk)', () => {
  it('builds a TM that passes the same behavioral tests as the reference', () => {
    const steps = CONSTRUCT_AKBK_SOLUTION_STEPS;
    const { nodes, edges } = graphAfterSolutionSteps(steps, steps.length);
    const flow = flowToConstructionInput(nodes, edges, {
      challengeId: 'construct-ak-bk',
      inputAlphabet: ['a', 'b'],
      maxSteps: 400,
    });
    expect(flow.ok).toBe(true);
    if (!flow.ok) return;

    const built = buildMachineFromConstruction(flow.input);
    expect(built.ok).toBe(true);
    if (!built.ok) return;

    const ch = getConstructionChallenge('construct-ak-bk')!;
    const results = runConstructionTestSuite(
      built.machine,
      ch.acceptCases,
      ch.rejectCases,
      ch.maxSteps
    );
    expect(allConstructionTestsPassed(results)).toBe(true);
  });
});
