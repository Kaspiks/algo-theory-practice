import { describe, expect, it } from 'vitest';
import { buildMachineFromConstruction } from '@/lib/tm/constructionMachine';
import {
  allConstructionTestsPassed,
  runConstructionTestSuite,
} from '@/lib/tm/runConstructionTests';
import { getConstructionChallenge } from '@/content/tmConstruction/challenges';
import { AKBK_REFERENCE_CONSTRUCTION_INPUT } from '@/content/tmConstruction/referenceMachines/akbk';

describe('a^k b^k reference machine', () => {
  it('builds and passes construct-ak-bk challenge tests', () => {
    const built = buildMachineFromConstruction(AKBK_REFERENCE_CONSTRUCTION_INPUT);
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
