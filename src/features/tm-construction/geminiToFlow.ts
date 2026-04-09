import type { Edge, Node } from '@xyflow/react';
import type { GeminiTMResponse } from '@/lib/ai/geminiService';
import type { TmEdgeData, TmStateNodeData } from '@/features/tm-construction/flowTypes';
import type { TmStateKind } from '@/features/tm-construction/flowTypes';
import type { ConstructionMachineInput } from '@/lib/tm/constructionMachine';

/** Gemini uses _ for blank; the canvas uses ⊔. */
function normSymbol(sym: string): string {
  return sym === '_' ? '⊔' : sym;
}

/**
 * Compute simple left-to-right layout positions.
 * start (left) | work states (middle grid) | accept + reject (right)
 */
function layoutPositions(
  states: string[],
  startState: string,
  acceptState: string,
  rejectState: string
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();

  const workStates = states.filter(
    (s) => s !== startState && s !== acceptState && s !== rejectState
  );

  // How many columns of work states?
  const ROWS_PER_COL = 3;
  const numCols = Math.max(1, Math.ceil(workStates.length / ROWS_PER_COL));
  const midRightX = 220 + (numCols - 1) * 170;

  positions.set(startState, { x: 50, y: 210 });
  positions.set(acceptState, { x: midRightX + 190, y: 110 });
  positions.set(rejectState, { x: midRightX + 190, y: 320 });

  workStates.forEach((s, i) => {
    const col = Math.floor(i / ROWS_PER_COL);
    const row = i % ROWS_PER_COL;
    positions.set(s, {
      x: 220 + col * 170,
      y: 90 + row * 145,
    });
  });

  return positions;
}

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
 * Convert the structured Gemini TM response into ReactFlow nodes and edges
 * that are compatible with the existing TM Construction canvas.
 */
export function geminiToFlow(machine: GeminiTMResponse): {
  nodes: Node<TmStateNodeData>[];
  edges: Edge<TmEdgeData>[];
} {
  const positions = layoutPositions(
    machine.states,
    machine.startState,
    machine.acceptState,
    machine.rejectState
  );

  const nodes: Node<TmStateNodeData>[] = machine.states.map((stateId) => {
    let kind: TmStateKind = 'work';
    if (stateId === machine.startState) kind = 'start';
    else if (stateId === machine.acceptState) kind = 'accept';
    else if (stateId === machine.rejectState) kind = 'reject';

    return {
      id: stateId,
      type: 'tmState',
      position: positions.get(stateId) ?? { x: 100, y: 100 },
      data: { label: stateId, kind },
    };
  });

  // Group transitions by canonical edge id (one edge per source→target pair)
  const edgeMap = new Map<string, Edge<TmEdgeData>>();
  for (const t of machine.transitions) {
    const id = `e_${t.from}_${t.to}`;
    const rule = {
      read: normSymbol(t.read),
      write: normSymbol(t.write),
      move: t.move,
    };
    const existing = edgeMap.get(id);
    if (existing) {
      const data = existing.data as TmEdgeData;
      edgeMap.set(id, {
        ...existing,
        data: { ...data, rules: [...(data.rules ?? []), rule] },
      });
    } else {
      edgeMap.set(id, {
        id,
        source: t.from,
        target: t.to,
        type: 'tmTransition',
        data: { rules: [rule] },
      });
    }
  }

  return { nodes, edges: [...edgeMap.values()] };
}
