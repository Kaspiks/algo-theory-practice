import type { TuringMachineDefinition } from '@/types/tm';

const BLANK = '⊔';

/** Accepts {0,1}* containing substring 001 (scan left-to-right once). */
export const contains001Machine: TuringMachineDefinition = {
  id: 'contains_001_tm',
  name: 'Contains 001',
  states: ['q0', 'q_saw0', 'q_saw00', 'q_accept', 'q_reject'],
  inputAlphabet: ['0', '1'],
  tapeAlphabet: ['0', '1', BLANK],
  start: 'q0',
  accept: 'q_accept',
  reject: 'q_reject',
  blank: BLANK,
  policies: { leftEnd: 'reject', undefinedTransition: 'reject' },
  maxSteps: 300,
  blankDisplay: 'cup',
  transitions: {
    q0: {
      '0': { next: 'q_saw0', write: '0', move: 'R' },
      '1': { next: 'q0', write: '1', move: 'R' },
      [BLANK]: { next: 'q_reject', write: BLANK, move: 'S' },
    },
    q_saw0: {
      '0': { next: 'q_saw00', write: '0', move: 'R' },
      '1': { next: 'q0', write: '1', move: 'R' },
      [BLANK]: { next: 'q_reject', write: BLANK, move: 'S' },
    },
    q_saw00: {
      '1': { next: 'q_accept', write: '1', move: 'S' },
      '0': { next: 'q_saw00', write: '0', move: 'R' },
      [BLANK]: { next: 'q_reject', write: BLANK, move: 'S' },
    },
    q_accept: {},
    q_reject: {},
  },
};
