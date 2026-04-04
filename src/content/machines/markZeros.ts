import type { TuringMachineDefinition } from '@/types/tm';

const BLANK = '⊔';

/** Replaces every 0 with X while scanning right; leaves 1 unchanged; accepts at blank. */
export const markZerosMachine: TuringMachineDefinition = {
  id: 'mark_zeros_x_tm',
  name: 'Mark 0 as X',
  states: ['q0', 'q_accept', 'q_reject'],
  inputAlphabet: ['0', '1'],
  tapeAlphabet: ['0', '1', 'X', BLANK],
  start: 'q0',
  accept: 'q_accept',
  reject: 'q_reject',
  blank: BLANK,
  policies: { leftEnd: 'reject', undefinedTransition: 'reject' },
  maxSteps: 200,
  blankDisplay: 'cup',
  transitions: {
    q0: {
      '0': { next: 'q0', write: 'X', move: 'R' },
      '1': { next: 'q0', write: '1', move: 'R' },
      [BLANK]: { next: 'q_accept', write: BLANK, move: 'S' },
    },
    q_accept: {},
    q_reject: {},
  },
};
