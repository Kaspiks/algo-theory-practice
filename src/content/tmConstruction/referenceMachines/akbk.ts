import type { ConstructionMachineInput } from '@/lib/tm/constructionMachine';

/**
 * Decides { a^k b^k | k ≥ 0 }: repeatedly mark the leftmost `a` as `X`, scan to
 * the blank, mark the rightmost still-unmarked `b` as `Y`, return to the `X`
 * block and repeat. When the next symbol after the `X` prefix is `Y`, every `a`
 * was paired with a `b`. States `qS` / `q_empty` handle ε.
 */
export const AKBK_REFERENCE_CONSTRUCTION_INPUT: ConstructionMachineInput = {
  id: 'ref_akbk',
  stateIds: ['qS', 'q_empty', 'q0', 'q1', 'q2', 'q3', 'q_accept', 'q_reject'],
  start: 'qS',
  accept: 'q_accept',
  reject: 'q_reject',
  inputAlphabet: ['a', 'b'],
  maxSteps: 400,
  transitions: [
    { from: 'qS', read: '⊔', to: 'q_empty', write: '⊔', move: 'R' },
    { from: 'qS', read: 'a', to: 'q1', write: 'X', move: 'R' },
    { from: 'qS', read: 'b', to: 'q_reject', write: 'b', move: 'S' },
    { from: 'q_empty', read: '⊔', to: 'q_accept', write: '⊔', move: 'S' },
    { from: 'q_empty', read: 'a', to: 'q_reject', write: 'a', move: 'S' },
    { from: 'q_empty', read: 'b', to: 'q_reject', write: 'b', move: 'S' },
    { from: 'q0', read: 'a', to: 'q1', write: 'X', move: 'R' },
    { from: 'q0', read: 'Y', to: 'q_accept', write: 'Y', move: 'S' },
    { from: 'q0', read: 'X', to: 'q_reject', write: 'X', move: 'S' },
    { from: 'q0', read: 'b', to: 'q_reject', write: 'b', move: 'S' },
    { from: 'q0', read: '⊔', to: 'q_reject', write: '⊔', move: 'S' },
    { from: 'q1', read: 'a', to: 'q1', write: 'a', move: 'R' },
    { from: 'q1', read: 'b', to: 'q1', write: 'b', move: 'R' },
    { from: 'q1', read: 'Y', to: 'q1', write: 'Y', move: 'R' },
    { from: 'q1', read: '⊔', to: 'q2', write: '⊔', move: 'L' },
    { from: 'q1', read: 'X', to: 'q_reject', write: 'X', move: 'S' },
    { from: 'q2', read: 'Y', to: 'q2', write: 'Y', move: 'L' },
    { from: 'q2', read: 'b', to: 'q3', write: 'Y', move: 'L' },
    { from: 'q2', read: '⊔', to: 'q_reject', write: '⊔', move: 'S' },
    { from: 'q2', read: 'a', to: 'q_reject', write: 'a', move: 'S' },
    { from: 'q2', read: 'X', to: 'q_reject', write: 'X', move: 'S' },
    { from: 'q3', read: 'a', to: 'q3', write: 'a', move: 'L' },
    { from: 'q3', read: 'b', to: 'q3', write: 'b', move: 'L' },
    { from: 'q3', read: 'Y', to: 'q3', write: 'Y', move: 'L' },
    { from: 'q3', read: 'X', to: 'q0', write: 'X', move: 'R' },
    { from: 'q3', read: '⊔', to: 'q_reject', write: '⊔', move: 'S' },
  ],
};
