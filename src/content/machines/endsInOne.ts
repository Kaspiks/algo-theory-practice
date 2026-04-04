import type { TuringMachineDefinition } from '@/types/tm';

const BLANK = '⊔';

/**
 * Accepts strings over {0,1} whose last symbol is 1 (non-empty strings only).
 * Empty string is rejected.
 */
export const endsInOneMachine: TuringMachineDefinition = {
  id: 'ends_in_one_tm',
  name: 'Ends in 1',
  states: ['q_start', 'q_scan', 'q_check', 'q_accept', 'q_reject'],
  inputAlphabet: ['0', '1'],
  tapeAlphabet: ['0', '1', BLANK],
  start: 'q_start',
  accept: 'q_accept',
  reject: 'q_reject',
  blank: BLANK,
  policies: { leftEnd: 'reject', undefinedTransition: 'reject' },
  maxSteps: 200,
  blankDisplay: 'cup',
  transitions: {
    q_start: {
      [BLANK]: { next: 'q_reject', write: BLANK, move: 'S' },
      '0': { next: 'q_scan', write: '0', move: 'R' },
      '1': { next: 'q_scan', write: '1', move: 'R' },
    },
    q_scan: {
      '0': { next: 'q_scan', write: '0', move: 'R' },
      '1': { next: 'q_scan', write: '1', move: 'R' },
      [BLANK]: { next: 'q_check', write: BLANK, move: 'L' },
    },
    q_check: {
      '0': { next: 'q_reject', write: '0', move: 'S' },
      '1': { next: 'q_accept', write: '1', move: 'S' },
      [BLANK]: { next: 'q_reject', write: BLANK, move: 'S' },
    },
    q_accept: {},
    q_reject: {},
  },
};
