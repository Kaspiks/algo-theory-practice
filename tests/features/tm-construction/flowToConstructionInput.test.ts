import { describe, expect, it } from 'vitest';
import { flowToConstructionInput } from '@/features/tm-construction/flowToConstructionInput';
import {
  normalizeEdgeData,
  type TmEdgeData,
  type TmStateNodeData,
} from '@/features/tm-construction/flowTypes';
import type { Edge, Node } from '@xyflow/react';

const baseNodes: Node<TmStateNodeData>[] = [
  { id: 'q0', type: 'tmState', position: { x: 0, y: 0 }, data: { label: 'q0', kind: 'start' } },
  {
    id: 'q_accept',
    type: 'tmState',
    position: { x: 1, y: 0 },
    data: { label: 'q_accept', kind: 'accept' },
  },
  {
    id: 'q_reject',
    type: 'tmState',
    position: { x: 2, y: 0 },
    data: { label: 'q_reject', kind: 'reject' },
  },
];

describe('normalizeEdgeData', () => {
  it('keeps rules: [] empty (no placeholder rule)', () => {
    expect(normalizeEdgeData({ rules: [] }).rules).toEqual([]);
  });

  it('returns empty rules for undefined data', () => {
    expect(normalizeEdgeData(undefined).rules).toEqual([]);
  });
});

describe('flowToConstructionInput', () => {
  it('rejects edges that reference missing states', () => {
    const badEdge: Edge<TmEdgeData> = {
      id: 'e1',
      source: 'ghost',
      target: 'q0',
      data: { rules: [{ read: 'a', write: 'a', move: 'R' }] },
    };
    const r = flowToConstructionInput(baseNodes, [badEdge], {
      challengeId: 'c',
      inputAlphabet: ['a'],
      maxSteps: 100,
    });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errors.some((e) => e.includes('ghost'))).toBe(true);
  });

  it('expands multiple rules on one edge into separate transitions', () => {
    const edge: Edge<TmEdgeData> = {
      id: 'e_q0_q_reject',
      source: 'q0',
      target: 'q_reject',
      data: {
        rules: [
          { read: 'b', write: 'b', move: 'S' },
          { read: '⊔', write: '⊔', move: 'S' },
        ],
      },
    };
    const r = flowToConstructionInput(baseNodes, [edge], {
      challengeId: 'c',
      inputAlphabet: ['a', 'b'],
      maxSteps: 100,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.input.transitions).toHaveLength(2);
    expect(r.input.transitions.map((t) => t.read).sort()).toEqual(['b', '⊔']);
  });

  it('rejects duplicate read from same state on one edge', () => {
    const edge: Edge<TmEdgeData> = {
      id: 'e_q0_q_reject',
      source: 'q0',
      target: 'q_reject',
      data: {
        rules: [
          { read: 'a', write: 'a', move: 'R' },
          { read: 'a', write: 'b', move: 'L' },
        ],
      },
    };
    const r = flowToConstructionInput(baseNodes, [edge], {
      challengeId: 'c',
      inputAlphabet: ['a'],
      maxSteps: 100,
    });
    expect(r.ok).toBe(false);
  });

  it('merges multiple edges for the same source→target (no rules lost)', () => {
    const e1: Edge<TmEdgeData> = {
      id: 'legacy_a',
      source: 'q0',
      target: 'q_reject',
      data: { rules: [{ read: 'b', write: 'b', move: 'S' }] },
    };
    const e2: Edge<TmEdgeData> = {
      id: 'legacy_b',
      source: 'q0',
      target: 'q_reject',
      data: { rules: [{ read: '⊔', write: '⊔', move: 'S' }] },
    };
    const r = flowToConstructionInput(baseNodes, [e1, e2], {
      challengeId: 'c',
      inputAlphabet: ['a', 'b'],
      maxSteps: 100,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.input.transitions).toHaveLength(2);
    const reads = r.input.transitions.map((t) => t.read).sort();
    expect(reads).toEqual(['b', '⊔']);
  });

  it('rejects rules: [] (no phantom transitions)', () => {
    const edge: Edge<TmEdgeData> = {
      id: 'e_empty',
      source: 'q0',
      target: 'q_reject',
      data: { rules: [] },
    };
    const r = flowToConstructionInput(baseNodes, [edge], {
      challengeId: 'c',
      inputAlphabet: ['a'],
      maxSteps: 100,
    });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errors.some((m) => m.includes('no transition rules'))).toBe(true);
  });

  it('migrates legacy single-rule edge data', () => {
    const edge = {
      id: 'e_legacy',
      source: 'q0',
      target: 'q_accept',
      data: { read: 'a', write: 'a', move: 'R' as const },
    } as Edge<TmEdgeData>;
    const r = flowToConstructionInput(baseNodes, [edge], {
      challengeId: 'c',
      inputAlphabet: ['a'],
      maxSteps: 100,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.input.transitions).toEqual([
      expect.objectContaining({ from: 'q0', to: 'q_accept', read: 'a' }),
    ]);
  });
});
