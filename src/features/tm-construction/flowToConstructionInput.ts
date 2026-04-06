import type { Edge, Node } from '@xyflow/react';
import type { ConstructionMachineInput } from '@/lib/tm/constructionMachine';
import {
  normalizeEdgeData,
  type TmEdgeData,
  type TmStateNodeData,
  type TmTransitionRule,
} from '@/features/tm-construction/flowTypes';
import type { HeadMove } from '@/types/tm';

/**
 * Merge all edges that share the same (source, target) so duplicate React Flow edges
 * (e.g. legacy ids) still contribute every rule to the TM without dropping any.
 */
function groupEdgesByEndpoints(
  edges: Edge<TmEdgeData>[]
): Map<string, Edge<TmEdgeData>[]> {
  const m = new Map<string, Edge<TmEdgeData>[]>();
  for (const e of edges) {
    const k = `${e.source}\0${e.target}`;
    const list = m.get(k) ?? [];
    list.push(e);
    m.set(k, list);
  }
  return m;
}

export function flowToConstructionInput(
  nodes: Node<TmStateNodeData>[],
  edges: Edge<TmEdgeData>[],
  meta: { challengeId: string; inputAlphabet: string[]; maxSteps: number }
):
  | { ok: true; input: ConstructionMachineInput }
  | { ok: false; errors: string[] } {
  const errors: string[] = [];

  const stateIds = nodes.map((n) => n.id);
  const uniq = new Set(stateIds);
  if (uniq.size !== stateIds.length) {
    errors.push('Duplicate state ids.');
  }

  for (const e of edges) {
    if (!uniq.has(e.source)) {
      errors.push(`Edge starts at unknown state "${e.source}".`);
    }
    if (!uniq.has(e.target)) {
      errors.push(`Edge ends at unknown state "${e.target}".`);
    }
  }

  const startNodes = nodes.filter((n) => n.data.kind === 'start');
  const acceptNodes = nodes.filter((n) => n.data.kind === 'accept');
  const rejectNodes = nodes.filter((n) => n.data.kind === 'reject');

  if (startNodes.length !== 1) {
    errors.push('Mark exactly one state as Start.');
  }
  if (acceptNodes.length !== 1) {
    errors.push('Mark exactly one state as Accept.');
  }
  if (rejectNodes.length !== 1) {
    errors.push('Mark exactly one state as Reject.');
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const start = startNodes[0]!.id;
  const accept = acceptNodes[0]!.id;
  const reject = rejectNodes[0]!.id;

  if (start === accept) errors.push('Start cannot be the same node as Accept.');
  if (start === reject) errors.push('Start cannot be the same node as Reject.');
  if (accept === reject) {
    errors.push('Accept and Reject cannot be the same state.');
  }

  const transitions: {
    from: string;
    read: string;
    write: string;
    to: string;
    move: HeadMove;
  }[] = [];

  const pairSeen = new Map<string, string>();

  const groups = groupEdgesByEndpoints(edges);

  for (const [, group] of groups) {
    const src = group[0]!.source;
    const tgt = group[0]!.target;
    const allRules: TmTransitionRule[] = [];
    for (const e of group) {
      allRules.push(...normalizeEdgeData(e.data as TmEdgeData).rules);
    }

    if (allRules.length === 0) {
      errors.push(
        `Connection ${src} → ${tgt} has no transition rules (remove the edge or add at least one rule).`
      );
      continue;
    }

    for (let ri = 0; ri < allRules.length; ri++) {
      const r = allRules[ri]!;
      const key = `${src}\0${r.read}`;
      const label =
        group.length > 1
          ? `${src}→${tgt} (merged ${group.length} edges, rule ${ri + 1})`
          : `${src}→${tgt} (${group[0]!.id}, rule ${ri + 1})`;
      if (pairSeen.has(key)) {
        errors.push(
          `Duplicate transition: state "${src}" has more than one transition reading "${r.read}" (${pairSeen.get(key)} and ${label}).`
        );
      } else {
        pairSeen.set(key, label);
      }
      transitions.push({
        from: src,
        read: r.read,
        write: r.write,
        to: tgt,
        move: r.move,
      });
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors: [...new Set(errors)] };
  }

  return {
    ok: true,
    input: {
      id: `user_tm_${meta.challengeId}`,
      stateIds,
      start,
      accept,
      reject,
      transitions,
      inputAlphabet: [...meta.inputAlphabet],
      maxSteps: meta.maxSteps,
    },
  };
}
