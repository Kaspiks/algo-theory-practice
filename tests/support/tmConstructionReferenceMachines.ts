/**
 * Reference TMs used to validate construction challenge test suites (Vitest only).
 */
import type { TuringMachineDefinition } from '@/types/tm';

const BLANK = '⊔';

/**
 * { a^k b^k | k ≥ 0 } — one round: mark leftmost a as X, scan over a’s to the first b,
 * verify the suffix has no a (rejects interleavings like abab), temp-mark that b as T,
 * scan tail, then turn T→Y and return to the matching X.
 */
export function referenceAkBkMachine(): TuringMachineDefinition {
  return {
    id: 'ref_ak_bk',
    name: 'Reference { a^k b^k }',
    states: [
      'q0',
      'q1',
      'q_scan_tail',
      'q_find_T',
      'q_after_Y',
      'q_left_to_X',
      'q_accept',
      'q_reject',
    ],
    inputAlphabet: ['a', 'b'],
    tapeAlphabet: ['a', 'b', 'X', 'Y', 'T', BLANK],
    transitions: {
      q0: {
        [BLANK]: { next: 'q_accept', write: BLANK, move: 'S' },
        X: { next: 'q0', write: 'X', move: 'R' },
        Y: { next: 'q0', write: 'Y', move: 'R' },
        a: { next: 'q1', write: 'X', move: 'R' },
        b: { next: 'q_reject', write: 'b', move: 'S' },
        T: { next: 'q_reject', write: 'T', move: 'S' },
      },
      q1: {
        a: { next: 'q1', write: 'a', move: 'R' },
        Y: { next: 'q1', write: 'Y', move: 'R' },
        b: { next: 'q_scan_tail', write: 'T', move: 'R' },
        [BLANK]: { next: 'q_reject', write: BLANK, move: 'S' },
        X: { next: 'q_reject', write: 'X', move: 'S' },
        T: { next: 'q_reject', write: 'T', move: 'S' },
      },
      q_scan_tail: {
        a: { next: 'q_reject', write: 'a', move: 'S' },
        b: { next: 'q_scan_tail', write: 'b', move: 'R' },
        X: { next: 'q_scan_tail', write: 'X', move: 'R' },
        Y: { next: 'q_scan_tail', write: 'Y', move: 'R' },
        T: { next: 'q_scan_tail', write: 'T', move: 'R' },
        [BLANK]: { next: 'q_find_T', write: BLANK, move: 'L' },
      },
      q_find_T: {
        T: { next: 'q_after_Y', write: 'Y', move: 'L' },
        a: { next: 'q_find_T', write: 'a', move: 'L' },
        b: { next: 'q_find_T', write: 'b', move: 'L' },
        X: { next: 'q_find_T', write: 'X', move: 'L' },
        Y: { next: 'q_find_T', write: 'Y', move: 'L' },
        [BLANK]: { next: 'q_reject', write: BLANK, move: 'S' },
      },
      q_after_Y: {
        a: { next: 'q_after_Y', write: 'a', move: 'L' },
        b: { next: 'q_after_Y', write: 'b', move: 'L' },
        Y: { next: 'q_after_Y', write: 'Y', move: 'L' },
        T: { next: 'q_after_Y', write: 'T', move: 'L' },
        X: { next: 'q_left_to_X', write: 'X', move: 'R' },
        [BLANK]: { next: 'q_reject', write: BLANK, move: 'S' },
      },
      q_left_to_X: {
        [BLANK]: { next: 'q_reject', write: BLANK, move: 'S' },
        a: { next: 'q0', write: 'a', move: 'S' },
        b: { next: 'q_reject', write: 'b', move: 'S' },
        X: { next: 'q0', write: 'X', move: 'R' },
        Y: { next: 'q0', write: 'Y', move: 'R' },
        T: { next: 'q_reject', write: 'T', move: 'S' },
      },
      q_accept: {},
      q_reject: {},
    },
    start: 'q0',
    accept: 'q_accept',
    reject: 'q_reject',
    blank: BLANK,
    policies: { leftEnd: 'reject', undefinedTransition: 'reject' },
    maxSteps: 500,
    blankDisplay: 'cup',
  };
}

/** Non-empty binary strings whose last symbol is 1 (two-phase: “saw 1”, “last was 0”). */
export function referenceEndsInOneMachine(): TuringMachineDefinition {
  return {
    id: 'ref_ends_1',
    name: 'Reference ends in 1',
    states: ['q0', 'q1', 'q_accept', 'q_reject'],
    inputAlphabet: ['0', '1'],
    tapeAlphabet: ['0', '1', BLANK],
    transitions: {
      q0: {
        '0': { next: 'q0', write: '0', move: 'R' },
        '1': { next: 'q1', write: '1', move: 'R' },
        [BLANK]: { next: 'q_reject', write: BLANK, move: 'S' },
      },
      q1: {
        '0': { next: 'q0', write: '0', move: 'R' },
        '1': { next: 'q1', write: '1', move: 'R' },
        [BLANK]: { next: 'q_accept', write: BLANK, move: 'S' },
      },
      q_accept: {},
      q_reject: {},
    },
    start: 'q0',
    accept: 'q_accept',
    reject: 'q_reject',
    blank: BLANK,
    policies: { leftEnd: 'reject', undefinedTransition: 'reject' },
    maxSteps: 200,
    blankDisplay: 'cup',
  };
}
