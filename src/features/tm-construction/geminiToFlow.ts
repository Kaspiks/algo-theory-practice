import ELK from 'elkjs/lib/elk.bundled.js';
import type { Edge, Node } from '@xyflow/react';
import type { GeminiTMResponse } from '@/lib/ai/geminiService';
import type { TmEdgeData, TmStateNodeData, TmTransitionRule } from '@/features/tm-construction/flowTypes';
import type { TmStateKind } from '@/features/tm-construction/flowTypes';
import type { ConstructionMachineInput } from '@/lib/tm/constructionMachine';

/** Gemini uses _ for blank; the canvas uses ⊔. */
function normSymbol(sym: string): string {
  return sym === '_' ? '⊔' : sym;
}

const NODE_WIDTH = 90;
const NODE_HEIGHT = 48;
const PARALLEL_EDGE_SPACING = 40;

const elk = new ELK();

/** Collision-safe key for a (from, to) pair. */
const pairKey = (from: string, to: string) => `${from}|||${to}`;

/**
 * Convert a Gemini TM response into the ConstructionMachineInput format so it
 * can be passed to buildMachineFromConstruction() for execution/testing.
 */
export function geminiToConstructionInput(machine: GeminiTMResponse): ConstructionMachineInput {
  return {
    id: 'ai_generated',
    name: 'AI Generated TM',
    stateIds: machine.states,
    start: machine.startState,
    accept: machine.acceptState,
    reject: machine.rejectState,
    inputAlphabet: machine.inputAlphabet,
    transitions: machine.transitions.map((t) => ({
      from: t.from,
      read: normSymbol(t.read),
      to: t.to,
      write: normSymbol(t.write),
      move: t.move,
    })),
    maxSteps: 1000,
  };
}

/**
 * Convert the structured Gemini TM response into ReactFlow nodes and edges.
 *
 * Layout strategy:
 * - ELK layered algorithm positions nodes left-to-right
 * - One edge per transition rule (instead of bundling all rules on one edge)
 * - Parallel edges between the same pair of states get staggered offsets so
 *   they fan out and each label is readable
 * - Self-loops stay bundled on one edge (offset is meaningless for them)
 */
export async function geminiToFlow(machine: GeminiTMResponse): Promise<{
  nodes: Node<TmStateNodeData>[];
  edges: Edge<TmEdgeData>[];
}> {
  // ── Phase 1: group all transition rules per (from, to) pair ───────────────
  const rulesPerPair = new Map<
    string,
    { from: string; to: string; rules: TmTransitionRule[] }
  >();
  for (const t of machine.transitions) {
    const key = pairKey(t.from, t.to);
    const rule: TmTransitionRule = {
      read: normSymbol(t.read),
      write: normSymbol(t.write),
      move: t.move,
    };
    const existing = rulesPerPair.get(key);
    if (existing) {
      existing.rules.push(rule);
    } else {
      rulesPerPair.set(key, { from: t.from, to: t.to, rules: [rule] });
    }
  }

  // ── Phase 2: emit one edge per rule with staggered offsets ────────────────
  // Self-loops stay as a single bundled edge (offset has no visible effect on
  // a loop, and having many overlapping self-loop arrows would be worse).
  const finalEdges: Edge<TmEdgeData>[] = [];
  for (const { from, to, rules } of rulesPerPair.values()) {
    if (from === to) {
      finalEdges.push({
        id: `e_${from}_${to}`,
        source: from,
        target: to,
        type: 'tmTransition',
        data: { rules },
      });
    } else {
      const n = rules.length;
      rules.forEach((rule, i) => {
        const offset = (i - (n - 1) / 2) * PARALLEL_EDGE_SPACING;
        finalEdges.push({
          id: `e_${from}_${to}_${i}`,
          source: from,
          target: to,
          type: 'tmTransition',
          data: { rules: [rule] },
          pathOptions: { offset },
        });
      });
    }
  }

  // ── ELK layout: one representative edge per unique (from, to) pair ─────────
  const seenElkPairs = new Set<string>();
  const elkEdges = finalEdges
    .filter((e) => {
      if (e.source === e.target) return false;
      const key = pairKey(e.source, e.target);
      if (seenElkPairs.has(key)) return false;
      seenElkPairs.add(key);
      return true;
    })
    .map((e) => ({ id: e.id, sources: [e.source], targets: [e.target] }));

  const elkGraph = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': 'RIGHT',
      'elk.spacing.nodeNode': '70',
      'elk.layered.spacing.nodeNodeBetweenLayers': '160',
      'elk.edgeRouting': 'SPLINES',
      'elk.layered.nodePlacement.strategy': 'BRANDES_KOEPF',
      'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
    },
    children: machine.states.map((id) => ({
      id,
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
    })),
    edges: elkEdges,
  };

  let positionMap = new Map<string, { x: number; y: number }>();
  try {
    const layout = await elk.layout(elkGraph);
    for (const child of layout.children ?? []) {
      if (child.x !== undefined && child.y !== undefined) {
        positionMap.set(child.id, { x: child.x, y: child.y });
      }
    }
  } catch {
    // ELK failed — fall back to a simple grid
    machine.states.forEach((id, i) => {
      positionMap.set(id, { x: 60 + (i % 4) * 180, y: 60 + Math.floor(i / 4) * 120 });
    });
  }

  // ── Build nodes with ELK positions ────────────────────────────────────────
  const nodes: Node<TmStateNodeData>[] = machine.states.map((stateId) => {
    let kind: TmStateKind = 'work';
    if (stateId === machine.startState) kind = 'start';
    else if (stateId === machine.acceptState) kind = 'accept';
    else if (stateId === machine.rejectState) kind = 'reject';

    return {
      id: stateId,
      type: 'tmState',
      position: positionMap.get(stateId) ?? { x: 100, y: 100 },
      data: { label: stateId, kind },
    };
  });

  return { nodes, edges: finalEdges };
}
