import type { Edge } from '@xyflow/react';

import type { TmEdgeData } from '@/features/tm-construction/flowTypes';

/**
 * Puts edges whose label is spotlighted last so their {@link EdgeLabelRenderer} subtrees mount
 * after others (backup if z-index stacking is constrained by a parent context).
 */
export function sortEdgesWithSpotlightLast(
  edges: Edge<TmEdgeData>[]
): Edge<TmEdgeData>[] {
  return [...edges].sort((a, b) => {
    const sa = (a.data as TmEdgeData | undefined)?.tmLabelSpotlight ? 1 : 0;
    const sb = (b.data as TmEdgeData | undefined)?.tmLabelSpotlight ? 1 : 0;
    return sa - sb;
  });
}
