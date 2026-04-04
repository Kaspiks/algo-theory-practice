import type { TuringMachineDefinition } from '@/types/tm';

const BLANK = '⊔';

/** Accepts {1}* (including empty): only 1s on the tape before the blank. */
export const onlyOnesMachine: TuringMachineDefinition = {
  id: 'only_ones_tm',
  name: 'Only 1s',
  states: ['q0', 'q_accept', 'q_reject'],
  inputAlphabet: ['0', '1'],
  tapeAlphabet: ['0', '1', BLANK],
  start: 'q0',
  accept: 'q_accept',
  reject: 'q_reject',
  blank: BLANK,
  policies: { leftEnd: 'reject', undefinedTransition: 'reject' },
  maxSteps: 200,
  blankDisplay: 'cup',
  transitions: {
    q0: {
      '1': { next: 'q0', write: '1', move: 'R' },
      '0': { next: 'q_reject', write: '0', move: 'S' },
      [BLANK]: { next: 'q_accept', write: BLANK, move: 'S' },
    },
    q_accept: {},
    q_reject: {},
  },
};
