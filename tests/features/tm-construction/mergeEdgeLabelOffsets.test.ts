import type { Edge } from '@xyflow/react';
import { describe, expect, it } from 'vitest';

import { mergeEdgeLabelOffsetsFromUserEdges } from '@/features/tm-construction/mergeEdgeLabelOffsets';
import { sortEdgesWithSpotlightLast } from '@/features/tm-construction/sortEdgesForLabelLayering';
import type { TmEdgeData } from '@/features/tm-construction/flowTypes';

function e(
  id: string,
  source: string,
  target: string,
  data?: TmEdgeData
): Edge<TmEdgeData> {
  return {
    id,
    source,
    target,
    type: 'tmTransition',
    data: data ?? { rules: [{ read: 'a', write: 'a', move: 'R' }] },
  };
}

describe('mergeEdgeLabelOffsetsFromUserEdges', () => {
  it('copies labelOffset onto template edges with matching ids', () => {
    const user: Edge<TmEdgeData>[] = [
      e('e_q0_q1', 'q0', 'q1', {
        rules: [{ read: 'a', write: 'a', move: 'R' }],
        labelOffset: { x: 12, y: -30 },
      }),
    ];
    const template: Edge<TmEdgeData>[] = [
      e('e_q0_q1', 'q0', 'q1', { rules: [{ read: 'a', write: 'a', move: 'R' }] }),
    ];
    const out = mergeEdgeLabelOffsetsFromUserEdges(template, user);
    expect(out[0]!.data?.labelOffset).toEqual({ x: 12, y: -30 });
  });

  it('leaves template unchanged when user has no offsets', () => {
    const template: Edge<TmEdgeData>[] = [e('e_q0_q1', 'q0', 'q1')];
    const out = mergeEdgeLabelOffsetsFromUserEdges(template, []);
    expect(out).toEqual(template);
  });
});

describe('sortEdgesWithSpotlightLast', () => {
  it('places spotlight edges at the end of the array', () => {
    const a = e('a', 'q0', 'q1', { rules: [], tmLabelSpotlight: false } as TmEdgeData);
    const b = e('b', 'q1', 'q2', { rules: [], tmLabelSpotlight: true } as TmEdgeData);
    const c = e('c', 'q2', 'q0', { rules: [] });
    const out = sortEdgesWithSpotlightLast([b, c, a]);
    expect(out.map((x) => x.id)).toEqual(['c', 'a', 'b']);
  });
});
