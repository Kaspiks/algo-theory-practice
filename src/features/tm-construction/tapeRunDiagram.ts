import type { Edge } from '@xyflow/react';

import {
  formatEdgeRulesLabel,
  formatRuleLabel,
  normalizeEdgeData,
  type TmEdgeData,
} from '@/features/tm-construction/flowTypes';
import type { TransitionFired } from '@/types/tm';

export function findConstructionEdgeIdForFired(
  edges: Edge<TmEdgeData>[],
  fired: TransitionFired
): string | null {
  for (const e of edges) {
    if (e.source !== fired.from) continue;
    const { rules } = normalizeEdgeData(e.data as TmEdgeData);
    if (rules.some((r) => r.read === fired.read)) return e.id;
  }
  return null;
}

export function formatConstructionEdgeLabelWithActiveRead(
  data: TmEdgeData | undefined,
  activeRead: string | undefined
): string {
  const { rules } = normalizeEdgeData(data);
  if (rules.length === 0) return '(no rules)';
  if (activeRead === undefined) return formatEdgeRulesLabel(data);
  return rules
    .map((r) => {
      const line = formatRuleLabel(r);
      return r.read === activeRead ? `▸ ${line}` : `  ${line}`;
    })
    .join('\n');
}
