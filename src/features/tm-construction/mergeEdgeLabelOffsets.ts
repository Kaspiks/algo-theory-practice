import type { Edge } from '@xyflow/react';

import type { TmEdgeData } from '@/features/tm-construction/flowTypes';

/**
 * Copies `labelOffset` from user edges onto template edges when ids match (same source→target
 * canonical id as in the editor).
 */
export function mergeEdgeLabelOffsetsFromUserEdges<E extends Edge<TmEdgeData>>(
  templateEdges: E[],
  userEdges: Edge<TmEdgeData>[]
): E[] {
  const offsetById = new Map<string, { x: number; y: number }>();
  for (const e of userEdges) {
    const d = e.data as TmEdgeData | undefined;
    const o = d?.labelOffset;
    if (
      o &&
      typeof o.x === 'number' &&
      typeof o.y === 'number' &&
      Number.isFinite(o.x) &&
      Number.isFinite(o.y)
    ) {
      offsetById.set(e.id, { x: o.x, y: o.y });
    }
  }
  if (offsetById.size === 0) return templateEdges;
  return templateEdges.map((e) => {
    const o = offsetById.get(e.id);
    if (!o) return e;
    const prev = (e.data ?? {}) as TmEdgeData;
    return {
      ...e,
      data: {
        ...prev,
        labelOffset: o,
      },
    };
  });
}
