import { describe, expect, it } from 'vitest';
import { graphAfterSolutionSteps } from '@/features/tm-construction/applySolutionSteps';
import { findConstructionEdgeIdForFired } from '@/features/tm-construction/tapeRunDiagram';
import { CONSTRUCT_AKBK_SOLUTION_STEPS } from '@/content/tmConstruction/solutionSteps/constructAkBk';
import type { Edge } from '@xyflow/react';
import type { TmEdgeData } from '@/features/tm-construction/flowTypes';

describe('findConstructionEdgeIdForFired', () => {
  it('resolves the smoothstep edge for a (state, read) pair', () => {
    const { edges } = graphAfterSolutionSteps(
      CONSTRUCT_AKBK_SOLUTION_STEPS,
      CONSTRUCT_AKBK_SOLUTION_STEPS.length
    );
    const id = findConstructionEdgeIdForFired(edges as Edge<TmEdgeData>[], {
      from: 'qS',
      read: 'a',
      to: 'q1',
      write: 'X',
      move: 'R',
    });
    expect(id).toBe('e_qS_q1');
  });
});
