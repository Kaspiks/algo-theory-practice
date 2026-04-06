import { describe, expect, it } from 'vitest';
import {
  constructionOutcomeMatchesExpectation,
  runConstructionTestSuite,
} from '@/lib/tm/runConstructionTests';
import type { TuringMachineDefinition } from '@/types/tm';

const BLANK = '⊔';

describe('constructionOutcomeMatchesExpectation', () => {
  it('accept cases require halting in accept', () => {
    expect(constructionOutcomeMatchesExpectation('accept', 'accept')).toBe(true);
    expect(constructionOutcomeMatchesExpectation('accept', 'reject')).toBe(false);
    expect(constructionOutcomeMatchesExpectation('accept', 'loop')).toBe(false);
  });

  it('reject cases pass when the machine never accepts (reject or loop)', () => {
    expect(constructionOutcomeMatchesExpectation('reject', 'reject')).toBe(true);
    expect(constructionOutcomeMatchesExpectation('reject', 'loop')).toBe(true);
    expect(constructionOutcomeMatchesExpectation('reject', 'accept')).toBe(false);
  });
});

/** Start on blank; stay on ⊔ forever — used to test step-limit vs reject expectations. */
function loopOnBlankMachine(): TuringMachineDefinition {
  return {
    id: 'loop_blank',
    name: 'loop on blank',
    states: ['q0', 'q_accept', 'q_reject'],
    inputAlphabet: ['0'],
    tapeAlphabet: ['0', BLANK],
    transitions: {
      q0: {
        [BLANK]: { next: 'q0', write: BLANK, move: 'S' },
        '0': { next: 'q_reject', write: '0', move: 'S' },
      },
      q_accept: {},
      q_reject: {},
    },
    start: 'q0',
    accept: 'q_accept',
    reject: 'q_reject',
    blank: BLANK,
    policies: { leftEnd: 'reject', undefinedTransition: 'reject' },
    maxSteps: 100,
    blankDisplay: 'cup',
  };
}

describe('runConstructionTestSuite', () => {
  it('treats step limit as loop; reject expectation still passes if machine never accepts', () => {
    const m = loopOnBlankMachine();
    const maxSteps = 30;
    const rows = runConstructionTestSuite(m, [], [{ input: '', expect: 'reject' }], maxSteps);
    expect(rows).toHaveLength(1);
    expect(rows[0]!.actual).toBe('loop');
    expect(rows[0]!.lastStatus).toBe('max_steps_exceeded');
    expect(rows[0]!.passed).toBe(true);
  });

  it('fails reject expectation when the machine accepts', () => {
    const m: TuringMachineDefinition = {
      id: 'accepts_zero',
      states: ['q0', 'q_accept', 'q_reject'],
      inputAlphabet: ['0'],
      tapeAlphabet: ['0', BLANK],
      transitions: {
        q0: {
          '0': { next: 'q_accept', write: '0', move: 'S' },
          [BLANK]: { next: 'q_reject', write: BLANK, move: 'S' },
        },
        q_accept: {},
        q_reject: {},
      },
      start: 'q0',
      accept: 'q_accept',
      reject: 'q_reject',
      blank: BLANK,
      policies: { leftEnd: 'reject', undefinedTransition: 'reject' },
      maxSteps: 50,
      blankDisplay: 'cup',
    };
    const rows = runConstructionTestSuite(m, [], [{ input: '0', expect: 'reject' }], 50);
    expect(rows[0]!.actual).toBe('accept');
    expect(rows[0]!.passed).toBe(false);
  });
});
