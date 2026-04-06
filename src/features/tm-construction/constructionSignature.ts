import type { Edge, Node } from '@xyflow/react';
import {
  normalizeEdgeData,
  type TmEdgeData,
  type TmStateNodeData,
} from '@/features/tm-construction/flowTypes';

/**
 * Stable fingerprint of the TM diagram (ignores node positions).
 * Used to detect when results are out of sync with the canvas.
 */
export function constructionGraphSignature(
  nodes: Node<TmStateNodeData>[],
  edges: Edge<TmEdgeData>[]
): string {
  const ns = [...nodes]
    .map((n) => ({ id: n.id, kind: n.data.kind, type: n.type ?? 'default' }))
    .sort((a, b) => a.id.localeCompare(b.id));
  const es = [...edges]
    .map((e) => {
      const d = normalizeEdgeData(e.data as TmEdgeData);
      return {
        id: e.id,
        source: e.source,
        target: e.target,
        rules: d.rules.map((r) => ({ read: r.read, write: r.write, move: r.move })),
      };
    })
    .sort((a, b) => a.id.localeCompare(b.id));
  return JSON.stringify({ ns, es });
}
