import { describe, expect, it } from 'vitest';
import { constructionGraphSignature } from '@/features/tm-construction/constructionSignature';
import {
  TM_CONSTRUCTION_CHALLENGES,
  getConstructionChallenge,
} from '@/content/tmConstruction/challenges';
import {
  allConstructionTestsPassed,
  runConstructionTestSuite,
} from '@/lib/tm/runConstructionTests';
import type { TmEdgeData, TmStateNodeData } from '@/features/tm-construction/flowTypes';
import {
  referenceAkBkMachine,
  referenceEndsInOneMachine,
} from '../support/tmConstructionReferenceMachines';
import type { Edge, Node } from '@xyflow/react';

describe('TM construction challenges — content', () => {
  it('lists three exercises with positive and negative cases', () => {
    expect(TM_CONSTRUCTION_CHALLENGES.length).toBe(3);
    for (const c of TM_CONSTRUCTION_CHALLENGES) {
      expect(c.maxSteps).toBeGreaterThan(0);
      expect(c.acceptCases.length).toBeGreaterThan(0);
      expect(c.rejectCases.length).toBeGreaterThan(0);
      for (const sym of c.inputAlphabet) {
        expect(sym.length).toBe(1);
      }
    }
  });
});

describe('TM construction challenges — reference machines vs suites', () => {
  it('construct-ak-bk: reference TM passes all listed tests', () => {
    const c = getConstructionChallenge('construct-ak-bk')!;
    const m = referenceAkBkMachine();
    const rows = runConstructionTestSuite(
      m,
      c.acceptCases,
      c.rejectCases,
      c.maxSteps
    );
    expect(allConstructionTestsPassed(rows)).toBe(true);
  });

  it('construct-ends-in-one: reference TM passes all listed tests', () => {
    const c = getConstructionChallenge('construct-ends-in-one')!;
    const m = referenceEndsInOneMachine();
    const rows = runConstructionTestSuite(
      m,
      c.acceptCases,
      c.rejectCases,
      c.maxSteps
    );
    expect(allConstructionTestsPassed(rows)).toBe(true);
  });

  it('construct-more-a-than-b: a^k b^k TM does not satisfy #a>#b (suite not vacuous)', () => {
    const c = getConstructionChallenge('construct-more-a-than-b')!;
    const m = referenceAkBkMachine();
    const rows = runConstructionTestSuite(
      m,
      c.acceptCases,
      c.rejectCases,
      c.maxSteps
    );
    expect(rows.length).toBe(c.acceptCases.length + c.rejectCases.length);
    expect(allConstructionTestsPassed(rows)).toBe(false);
    const aab = rows.find((r) => r.input === 'aab');
    expect(aab?.expect).toBe('accept');
    expect(aab?.passed).toBe(false);
  });
});

describe('constructionGraphSignature', () => {
  it('is unchanged by node reordering (positions ignored)', () => {
    const n1: Node<TmStateNodeData> = {
      id: 'a',
      type: 'tmState',
      position: { x: 0, y: 0 },
      data: { label: 'a', kind: 'start' },
    };
    const n2: Node<TmStateNodeData> = {
      id: 'b',
      type: 'tmState',
      position: { x: 99, y: 99 },
      data: { label: 'b', kind: 'accept' },
    };
    const e: Edge<TmEdgeData> = {
      id: 'e1',
      source: 'a',
      target: 'b',
      data: { rules: [{ read: 'x', write: 'x', move: 'R' }] },
    };
    const s1 = constructionGraphSignature([n1, n2], [e]);
    const s2 = constructionGraphSignature([n2, n1], [e]);
    expect(s1).toBe(s2);
  });
});
