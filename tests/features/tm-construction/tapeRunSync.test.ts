import { describe, expect, it } from 'vitest';
import type { Edge } from '@xyflow/react';
import { CONSTRUCT_AKBK_SOLUTION_STEPS } from '@/content/tmConstruction/solutionSteps/constructAkBk';
import { AKBK_REFERENCE_CONSTRUCTION_INPUT } from '@/content/tmConstruction/referenceMachines/akbk';
import { graphAfterSolutionSteps } from '@/features/tm-construction/applySolutionSteps';
import { findConstructionEdgeIdForFired } from '@/features/tm-construction/tapeRunDiagram';
import type { TmEdgeData } from '@/features/tm-construction/flowTypes';
import { buildMachineFromConstruction } from '@/lib/tm/constructionMachine';
import { initialConfiguration, step } from '@/lib/tm/engine';

/**
 * QA: every TM step on the reference aⁿbⁿ machine must map to a drawn edge on the
 * tutor solution diagram (so diagram highlighting can stay in sync with the tape).
 */
describe('tape run ↔ construction diagram sync (akbk)', () => {
  it('resolves an edge id for each transition in a short accepting run', () => {
    const built = buildMachineFromConstruction(AKBK_REFERENCE_CONSTRUCTION_INPUT);
    expect(built.ok).toBe(true);
    if (!built.ok) return;

    const { edges } = graphAfterSolutionSteps(
      CONSTRUCT_AKBK_SOLUTION_STEPS,
      CONSTRUCT_AKBK_SOLUTION_STEPS.length
    );
    const edgeList = edges as Edge<TmEdgeData>[];

    let config = initialConfiguration(built.machine, 'ab', 0);
    const max = 80;
    for (let i = 0; i < max; i++) {
      if (
        config.state === built.machine.accept ||
        config.state === built.machine.reject
      ) {
        break;
      }
      const r = step(built.machine, config);
      if (!r.fired) {
        expect(r.next.state).toBe(built.machine.reject);
        break;
      }
      const id = findConstructionEdgeIdForFired(edgeList, r.fired);
      expect(id, `missing edge for ${r.fired.from} reading ${r.fired.read}`).not.toBeNull();
      config = r.next;
    }

    expect(config.state).toBe(built.machine.accept);
  });

  it('returns null when no drawn edge matches (implicit reject / unknown pair)', () => {
    const { edges } = graphAfterSolutionSteps(
      CONSTRUCT_AKBK_SOLUTION_STEPS,
      CONSTRUCT_AKBK_SOLUTION_STEPS.length
    );
    const edgeList = edges as Edge<TmEdgeData>[];

    const id = findConstructionEdgeIdForFired(edgeList, {
      from: '__no_such_state__',
      read: 'a',
      to: 'q_reject',
      write: 'a',
      move: 'S',
    });
    expect(id).toBeNull();
  });
});
