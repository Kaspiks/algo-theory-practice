import type { TuringMachineDefinition } from '@/types/tm';

const BLANK = '⊔';

/**
 * Tape is `#w` with `w ∈ {0,1}*`. Scan to blank, return left until `#`, accept.
 * Demonstrates return-left / sentinel (P2).
 */
export const returnLeftSentinelMachine: TuringMachineDefinition = {
  id: 'return_left_sentinel_tm',
  name: 'Return to #',
  states: ['q_hash', 'q_scan', 'q_back', 'q_accept', 'q_reject'],
  inputAlphabet: ['#', '0', '1'],
  tapeAlphabet: ['#', '0', '1', BLANK],
  start: 'q_hash',
  accept: 'q_accept',
  reject: 'q_reject',
  blank: BLANK,
  policies: { leftEnd: 'reject', undefinedTransition: 'reject' },
  maxSteps: 200,
  blankDisplay: 'cup',
  transitions: {
    q_hash: {
      '#': { next: 'q_scan', write: '#', move: 'R' },
      [BLANK]: { next: 'q_reject', write: BLANK, move: 'S' },
      '0': { next: 'q_reject', write: '0', move: 'S' },
      '1': { next: 'q_reject', write: '1', move: 'S' },
    },
    q_scan: {
      '0': { next: 'q_scan', write: '0', move: 'R' },
      '1': { next: 'q_scan', write: '1', move: 'R' },
      [BLANK]: { next: 'q_back', write: BLANK, move: 'L' },
      '#': { next: 'q_reject', write: '#', move: 'S' },
    },
    q_back: {
      '0': { next: 'q_back', write: '0', move: 'L' },
      '1': { next: 'q_back', write: '1', move: 'L' },
      '#': { next: 'q_accept', write: '#', move: 'S' },
      [BLANK]: { next: 'q_reject', write: BLANK, move: 'S' },
    },
    q_accept: {},
    q_reject: {},
  },
};
