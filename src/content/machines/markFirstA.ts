import type { TuringMachineDefinition } from '@/types/tm';

const BLANK = '⊔';

/**
 * Skips leading `b`, then marks the first `a` as `X` and scans the rest unchanged.
 * Homework-style marking on {a,b} tape.
 */
export const markFirstAMachine: TuringMachineDefinition = {
  id: 'mark_first_a_tm',
  name: 'Mark first a',
  states: ['q0', 'q_after', 'q_accept', 'q_reject'],
  inputAlphabet: ['a', 'b'],
  tapeAlphabet: ['a', 'b', 'X', BLANK],
  start: 'q0',
  accept: 'q_accept',
  reject: 'q_reject',
  blank: BLANK,
  policies: { leftEnd: 'reject', undefinedTransition: 'reject' },
  maxSteps: 200,
  blankDisplay: 'cup',
  transitions: {
    q0: {
      a: { next: 'q_after', write: 'X', move: 'R' },
      b: { next: 'q0', write: 'b', move: 'R' },
      [BLANK]: { next: 'q_reject', write: BLANK, move: 'S' },
    },
    q_after: {
      a: { next: 'q_after', write: 'a', move: 'R' },
      b: { next: 'q_after', write: 'b', move: 'R' },
      X: { next: 'q_after', write: 'X', move: 'R' },
      [BLANK]: { next: 'q_accept', write: BLANK, move: 'S' },
    },
    q_accept: {},
    q_reject: {},
  },
};
