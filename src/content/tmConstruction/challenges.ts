/** Behavioral tests for TM construction mode (no diagram comparison). */

export type ConstructionExpectation = 'accept' | 'reject';

export interface ConstructionTestCase {
  input: string;
  headIndex?: number;
  expect: ConstructionExpectation;
}

export interface TmConstructionChallenge {
  id: string;
  title: string;
  description: string;
  inputAlphabet: string[];
  /** Max TM steps per test (loop detection). */
  maxSteps: number;
  acceptCases: ConstructionTestCase[];
  rejectCases: ConstructionTestCase[];
}

const BLANK_NOTE =
  'Use the blank ⊔ on transitions where the machine reads the empty cell after the input.';

export const TM_CONSTRUCTION_CHALLENGES: TmConstructionChallenge[] = [
  {
    id: 'construct-ak-bk',
    title: 'Build: { a^k b^k | k ≥ 0 }',
    description:
      `Decide strings with equal numbers of a then b in order (including ε). ${BLANK_NOTE}`,
    inputAlphabet: ['a', 'b'],
    maxSteps: 400,
    acceptCases: [
      { input: '', expect: 'accept' },
      { input: 'ab', expect: 'accept' },
      { input: 'aabb', expect: 'accept' },
      { input: 'aaabbb', expect: 'accept' },
    ],
    rejectCases: [
      { input: 'a', expect: 'reject' },
      { input: 'b', expect: 'reject' },
      { input: 'aab', expect: 'reject' },
      { input: 'abb', expect: 'reject' },
      { input: 'ba', expect: 'reject' },
      { input: 'abab', expect: 'reject' },
    ],
  },
  {
    id: 'construct-more-a-than-b',
    title: 'Build: strictly more a than b',
    description:
      'Accept iff #a(w) > #b(w) over {a,b}. Order does not matter. ' + BLANK_NOTE,
    inputAlphabet: ['a', 'b'],
    maxSteps: 500,
    acceptCases: [
      { input: 'a', expect: 'accept' },
      { input: 'aa', expect: 'accept' },
      { input: 'aba', expect: 'accept' },
      { input: 'aab', expect: 'accept' },
      { input: 'baa', expect: 'accept' },
    ],
    rejectCases: [
      { input: '', expect: 'reject' },
      { input: 'ab', expect: 'reject' },
      { input: 'b', expect: 'reject' },
      { input: 'abb', expect: 'reject' },
      { input: 'bab', expect: 'reject' },
    ],
  },
  {
    id: 'construct-ends-in-one',
    title: 'Build: non-empty binary strings ending in 1',
    description:
      'Alphabet {0,1}. Accept iff the string is non-empty and the last symbol is 1. ' +
      BLANK_NOTE,
    inputAlphabet: ['0', '1'],
    maxSteps: 200,
    acceptCases: [
      { input: '1', expect: 'accept' },
      { input: '01', expect: 'accept' },
      { input: '00111', expect: 'accept' },
    ],
    rejectCases: [
      { input: '', expect: 'reject' },
      { input: '0', expect: 'reject' },
      { input: '10', expect: 'reject' },
      { input: '110', expect: 'reject' },
    ],
  },
];

export function getConstructionChallenge(
  id: string
): TmConstructionChallenge | undefined {
  return TM_CONSTRUCTION_CHALLENGES.find((c) => c.id === id);
}

export const DEFAULT_CONSTRUCTION_CHALLENGE_ID = TM_CONSTRUCTION_CHALLENGES[0]!.id;
