import type { Edge, Node } from '@xyflow/react';
import type { TmSolutionStep } from '@/types/tmConstructionSolution';
import {
  normalizeEdgeData,
  type TmEdgeData,
  type TmStateNodeData,
} from '@/features/tm-construction/flowTypes';

export function canonicalConstructionEdgeId(source: string, target: string): string {
  return `e_${source}_${target}`;
}

export interface TutorGestureHighlight {
  kind: 'state' | 'edge' | 'explain' | 'none';
  stateId?: string;
  edgeId?: string;
}

/**
 * Apply the first `appliedCount` steps (including `explain` steps, which do not
 * change the graph).
 */
export function graphAfterSolutionSteps(
  steps: TmSolutionStep[],
  appliedCount: number
): { nodes: Node<TmStateNodeData>[]; edges: Edge<TmEdgeData>[] } {
  const nodes: Node<TmStateNodeData>[] = [];
  const edgeById = new Map<string, Edge<TmEdgeData>>();

  const n = Math.max(0, Math.min(appliedCount, steps.length));
  for (let i = 0; i < n; i++) {
    const s = steps[i]!;
    if (s.type === 'explain') continue;
    if (s.type === 'add_state') {
      nodes.push({
        id: s.id,
        type: 'tmState',
        position: { x: s.position.x, y: s.position.y },
        data: { label: s.id, kind: s.kind },
      });
    } else if (s.type === 'add_transition') {
      const id = canonicalConstructionEdgeId(s.from, s.to);
      const rule = { read: s.read, write: s.write, move: s.move };
      const existing = edgeById.get(id);
      if (existing) {
        const prev = normalizeEdgeData(existing.data as TmEdgeData);
        edgeById.set(id, {
          ...existing,
          data: { rules: [...prev.rules, rule] },
        });
      } else {
        edgeById.set(id, {
          id,
          source: s.from,
          target: s.to,
          type: 'smoothstep',
          data: { rules: [rule] },
        });
      }
    }
  }

  return { nodes, edges: [...edgeById.values()] };
}

/** Highlight target for the step at index `appliedCount - 1`. */
export function tutorHighlightForAppliedCount(
  steps: TmSolutionStep[],
  appliedCount: number
): TutorGestureHighlight {
  if (appliedCount <= 0) return { kind: 'none' };
  const s = steps[appliedCount - 1]!;
  if (s.type === 'explain') return { kind: 'explain' };
  if (s.type === 'add_state') return { kind: 'state', stateId: s.id };
  if (s.type === 'add_transition') {
    return {
      kind: 'edge',
      edgeId: canonicalConstructionEdgeId(s.from, s.to),
    };
  }
  return { kind: 'none' };
}

export function tutorExplanationAtStep(
  steps: TmSolutionStep[],
  appliedCount: number
): string {
  if (appliedCount <= 0) {
    return 'Press Step forward or Play to begin. The canvas will stay empty until the first step.';
  }
  const s = steps[appliedCount - 1]!;
  return s.explanation;
}
