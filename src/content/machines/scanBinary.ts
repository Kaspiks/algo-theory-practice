import type { TuringMachineDefinition } from '@/types/tm';

const BLANK = '⊔';

export const scanBinaryMachine: TuringMachineDefinition = {
  id: 'mvp_scan_binary',
  name: 'Scan {0,1} until blank',
  states: ['q0', 'q_accept', 'q_reject'],
  inputAlphabet: ['0', '1'],
  tapeAlphabet: ['0', '1', BLANK],
  start: 'q0',
  accept: 'q_accept',
  reject: 'q_reject',
  blank: BLANK,
  policies: { leftEnd: 'reject', undefinedTransition: 'reject' },
  maxSteps: 100,
  blankDisplay: 'cup',
  transitions: {
    q0: {
      '0': { next: 'q0', write: '0', move: 'R' },
      '1': { next: 'q0', write: '1', move: 'R' },
      [BLANK]: { next: 'q_accept', write: BLANK, move: 'S' },
    },
    q_accept: {},
    q_reject: {},
  },
};
