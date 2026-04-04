import type { MvpExercise } from '@/types/mvp';
import type { TransitionMcqOption } from '@/types/tm';

const BLANK = '⊔';

function opts(items: TransitionMcqOption[], correctId: string): TransitionMcqOption[] {
  if (!items.some((o) => o.id === correctId)) {
    throw new Error(`correctOptionId ${correctId} not in options`);
  }
  return items;
}

/** Initial-step MCQs; labels follow `δ = (state, write "sym", M)` style. */
const exercisesUnsorted: MvpExercise[] = [
  {
    id: 'basics-only-ones-accept',
    title: 'Accept only 1s',
    description:
      'Language: strings of 0 and 1 that use **only** the symbol 1 (including the empty string). After each correct step the tape and state update. Reject if a 0 is ever read.',
    category: 'tm_basics',
    difficulty: 1,
    mode: 'next_transition',
    machineId: 'only_ones_tm',
    setup: { input: '111' },
    tags: ['P1', 'S1.2'],
    hints: [{ hintId: 'NT.1' }, { hintId: 'BASICS.1' }],
    explanation:
      'While the head sees 1, stay in q0 and move right without changing the symbol. The first blank means the entire input was ones, so the machine accepts. A 0 sends the machine to q_reject immediately.',
    canonicalFirstAnswer: { nextState: 'q0', write: '1', move: 'R' },
    options: opts(
      [
        {
          id: 'opt-correct',
          label: 'δ = (q0, write "1", R)',
          answer: { nextState: 'q0', write: '1', move: 'R' },
        },
        {
          id: 'w1',
          label: 'δ = (q0, write "1", S)',
          answer: { nextState: 'q0', write: '1', move: 'S' },
        },
        {
          id: 'w2',
          label: `δ = (q_accept, write ${JSON.stringify(BLANK)}, S)`,
          answer: { nextState: 'q_accept', write: BLANK, move: 'S' },
        },
        {
          id: 'w3',
          label: 'δ = (q_reject, write "0", S)',
          answer: { nextState: 'q_reject', write: '0', move: 'S' },
        },
      ],
      'opt-correct'
    ),
    correctOptionId: 'opt-correct',
  },
  {
    id: 'reject-bad-symbol-not-only-ones',
    title: 'Reject on a bad symbol (0 among 1s)',
    description:
      'Same “only 1s” machine, but input **101**. As soon as the head reads a symbol not allowed in the language, the machine should reject.',
    category: 'reject_bad_symbol',
    difficulty: 1,
    mode: 'next_transition',
    machineId: 'only_ones_tm',
    setup: { input: '101' },
    tags: ['P1', 'S1.3'],
    hints: [{ hintId: 'NT.1' }, { hintId: 'REJECT.1' }],
    explanation:
      'The first move still sees 1, so we scan right. When the head later reads 0, δ sends the machine to q_reject with a stay move—no further scanning is needed.',
    canonicalFirstAnswer: { nextState: 'q0', write: '1', move: 'R' },
    options: opts(
      [
        {
          id: 'opt-correct',
          label: 'δ = (q0, write "1", R)',
          answer: { nextState: 'q0', write: '1', move: 'R' },
        },
        {
          id: 'w1',
          label: 'δ = (q_reject, write "1", S)',
          answer: { nextState: 'q_reject', write: '1', move: 'S' },
        },
        {
          id: 'w2',
          label: `δ = (q_accept, write ${JSON.stringify(BLANK)}, S)`,
          answer: { nextState: 'q_accept', write: BLANK, move: 'S' },
        },
        {
          id: 'w3',
          label: 'δ = (q0, write "0", R)',
          answer: { nextState: 'q0', write: '0', move: 'R' },
        },
      ],
      'opt-correct'
    ),
    correctOptionId: 'opt-correct',
  },
  {
    id: 'scan-right-until-blank',
    title: 'Scan right until blank',
    description:
      'Classic “sweep to the end” routine over {0,1}: keep moving right while reading 0 or 1 unchanged, then accept on the blank (P1).',
    category: 'scan_right',
    difficulty: 1,
    mode: 'next_transition',
    machineId: 'mvp_scan_binary',
    setup: { input: '001' },
    tags: ['P1', 'S3.1'],
    hints: [{ hintId: 'NT.1' }, { hintId: 'SCAN.1' }],
    explanation:
      'In q0, every 0 and 1 is copied back unchanged and the head moves right. When the first blank after the input appears, move to q_accept.',
    canonicalFirstAnswer: { nextState: 'q0', write: '0', move: 'R' },
    options: opts(
      [
        {
          id: 'opt-correct',
          label: 'δ = (q0, write "0", R)',
          answer: { nextState: 'q0', write: '0', move: 'R' },
        },
        {
          id: 'w1',
          label: 'δ = (q0, write "0", S)',
          answer: { nextState: 'q0', write: '0', move: 'S' },
        },
        {
          id: 'w2',
          label: `δ = (q_accept, write ${JSON.stringify(BLANK)}, S)`,
          answer: { nextState: 'q_accept', write: BLANK, move: 'S' },
        },
        {
          id: 'w3',
          label: 'δ = (q0, write "1", R)',
          answer: { nextState: 'q0', write: '1', move: 'R' },
        },
      ],
      'opt-correct'
    ),
    correctOptionId: 'opt-correct',
  },
  {
    id: 'ends-in-one',
    title: 'Strings ending in 1',
    description:
      'Language: non-empty binary strings whose **last** symbol is 1. The machine first scans to the blank, steps left once, then checks that symbol.',
    category: 'tm_basics',
    difficulty: 2,
    mode: 'next_transition',
    machineId: 'ends_in_one_tm',
    setup: { input: '101' },
    tags: ['P1', 'P2', 'S3.1', 'S3.2'],
    hints: [{ hintId: 'NT.1' }, { hintId: 'ENDS.1' }],
    explanation:
      'q_start handles the first symbol and rejects immediately on empty input. q_scan walks to the blank; q_check reads the last input symbol—1 yields accept, 0 yields reject.',
    canonicalFirstAnswer: { nextState: 'q_scan', write: '1', move: 'R' },
    options: opts(
      [
        {
          id: 'opt-correct',
          label: 'δ = (q_scan, write "1", R)',
          answer: { nextState: 'q_scan', write: '1', move: 'R' },
        },
        {
          id: 'w1',
          label: 'δ = (q_scan, write "1", S)',
          answer: { nextState: 'q_scan', write: '1', move: 'S' },
        },
        {
          id: 'w2',
          label: `δ = (q_reject, write ${JSON.stringify(BLANK)}, S)`,
          answer: { nextState: 'q_reject', write: BLANK, move: 'S' },
        },
        {
          id: 'w3',
          label: 'δ = (q_scan, write "0", R)',
          answer: { nextState: 'q_scan', write: '0', move: 'R' },
        },
      ],
      'opt-correct'
    ),
    correctOptionId: 'opt-correct',
  },
  {
    id: 'contains-001',
    title: 'Strings containing 001',
    description:
      'Language: binary strings that contain **001** as a contiguous substring. Think of it as a sliding “have I seen 00 and am I looking for 1?” pattern.',
    category: 'tm_basics',
    difficulty: 2,
    mode: 'next_transition',
    machineId: 'contains_001_tm',
    setup: { input: '1001' },
    tags: ['P4', 'S3.4'],
    hints: [{ hintId: 'NT.1' }, { hintId: 'SUBSTR.1' }],
    explanation:
      'q0 means no partial match. q_saw0 remembers a trailing 0; q_saw00 remembers 00; reading 1 in q_saw00 completes 001 and accepts. Extra 0s in q_saw00 stay in q_saw00.',
    canonicalFirstAnswer: { nextState: 'q0', write: '1', move: 'R' },
    options: opts(
      [
        {
          id: 'opt-correct',
          label: 'δ = (q0, write "1", R)',
          answer: { nextState: 'q0', write: '1', move: 'R' },
        },
        {
          id: 'w1',
          label: 'δ = (q_saw0, write "1", R)',
          answer: { nextState: 'q_saw0', write: '1', move: 'R' },
        },
        {
          id: 'w2',
          label: 'δ = (q_saw00, write "1", S)',
          answer: { nextState: 'q_saw00', write: '1', move: 'S' },
        },
        {
          id: 'w3',
          label: 'δ = (q0, write "0", R)',
          answer: { nextState: 'q0', write: '0', move: 'R' },
        },
      ],
      'opt-correct'
    ),
    correctOptionId: 'opt-correct',
  },
  {
    id: 'return-left-to-hash',
    title: 'Return left to the beginning',
    description:
      'Tape shape **`#w`** with `w ∈ {0,1}*`. Scan `w` until the blank, then move left until the head reads **`#`** again and accept (sentinel / P2).',
    category: 'return_left',
    difficulty: 2,
    mode: 'next_transition',
    machineId: 'return_left_sentinel_tm',
    setup: { input: '#110' },
    tags: ['P2', 'S3.2'],
    hints: [{ hintId: 'NT.1' }, { hintId: 'RETURN.1' }],
    explanation:
      'Cross the sentinel once moving right, sweep the block, overshoot into the blank, then walk left on 0/1 until `#` is under the head and halt accept.',
    canonicalFirstAnswer: { nextState: 'q_scan', write: '#', move: 'R' },
    options: opts(
      [
        {
          id: 'opt-correct',
          label: 'δ = (q_scan, write "#", R)',
          answer: { nextState: 'q_scan', write: '#', move: 'R' },
        },
        {
          id: 'w1',
          label: 'δ = (q_scan, write "#", S)',
          answer: { nextState: 'q_scan', write: '#', move: 'S' },
        },
        {
          id: 'w2',
          label: 'δ = (q_back, write "#", S)',
          answer: { nextState: 'q_back', write: '#', move: 'S' },
        },
        {
          id: 'w3',
          label: 'δ = (q_reject, write "0", S)',
          answer: { nextState: 'q_reject', write: '0', move: 'S' },
        },
      ],
      'opt-correct'
    ),
    correctOptionId: 'opt-correct',
  },
  {
    id: 'mark-processed-with-x',
    title: 'Mark processed symbols with X',
    description:
      'While scanning right, rewrite every **0** as **X** and leave **1** unchanged. Accept when the head reaches the blank (P3).',
    category: 'marking',
    difficulty: 2,
    mode: 'next_transition',
    machineId: 'mark_zeros_x_tm',
    setup: { input: '010' },
    tags: ['P3', 'S3.3'],
    hints: [{ hintId: 'NT.1' }, { hintId: 'MARK.1' }],
    explanation:
      'Marking records progress: 0 becomes X so you can tell which symbols were already processed in more elaborate machines; here it is the whole algorithm.',
    canonicalFirstAnswer: { nextState: 'q0', write: 'X', move: 'R' },
    options: opts(
      [
        {
          id: 'opt-correct',
          label: 'δ = (q0, write "X", R)',
          answer: { nextState: 'q0', write: 'X', move: 'R' },
        },
        {
          id: 'w1',
          label: 'δ = (q0, write "0", R)',
          answer: { nextState: 'q0', write: '0', move: 'R' },
        },
        {
          id: 'w2',
          label: 'δ = (q0, write "0", S)',
          answer: { nextState: 'q0', write: '0', move: 'S' },
        },
        {
          id: 'w3',
          label: `δ = (q_accept, write ${JSON.stringify(BLANK)}, S)`,
          answer: { nextState: 'q_accept', write: BLANK, move: 'S' },
        },
      ],
      'opt-correct'
    ),
    correctOptionId: 'opt-correct',
  },
  {
    id: 'homework-style-trace-001',
    title: 'Homework-style: trace a 001 recognizer',
    description:
      'Longer input **`01001`** on the “contains 001” machine—typical exam/homework style multi-step trace. Stay systematic: one δ application per answer.',
    category: 'homework_style',
    difficulty: 3,
    mode: 'next_transition',
    machineId: 'contains_001_tm',
    setup: { input: '01001' },
    tags: ['HW', 'S2.2'],
    hints: [{ hintId: 'NT.3' }, { hintId: 'SUBSTR.1' }],
    explanation:
      'First symbol 0 moves you to q_saw0. Later, after 00 you wait for 1; in this string the substring 001 appears starting at the third position.',
    canonicalFirstAnswer: { nextState: 'q_saw0', write: '0', move: 'R' },
    options: opts(
      [
        {
          id: 'opt-correct',
          label: 'δ = (q_saw0, write "0", R)',
          answer: { nextState: 'q_saw0', write: '0', move: 'R' },
        },
        {
          id: 'w1',
          label: 'δ = (q0, write "0", R)',
          answer: { nextState: 'q0', write: '0', move: 'R' },
        },
        {
          id: 'w2',
          label: 'δ = (q0, write "1", R)',
          answer: { nextState: 'q0', write: '1', move: 'R' },
        },
        {
          id: 'w3',
          label: 'δ = (q_saw00, write "0", R)',
          answer: { nextState: 'q_saw00', write: '0', move: 'R' },
        },
      ],
      'opt-correct'
    ),
    correctOptionId: 'opt-correct',
  },
  {
    id: 'tracing-ends-in-one',
    title: 'Tracing: does it end in 1?',
    description:
      'Input **110**. Category “tracing” here means: **step through** the whole run in next-transition mode until the machine halts.',
    category: 'tracing',
    difficulty: 2,
    mode: 'next_transition',
    machineId: 'ends_in_one_tm',
    setup: { input: '110' },
    tags: ['tracing', 'S2.2'],
    hints: [{ hintId: 'NT.3' }, { hintId: 'ENDS.1' }],
    explanation:
      'Scan to the end, step left onto the last 0, and q_check rejects—so “110” does not end in 1.',
    canonicalFirstAnswer: { nextState: 'q_scan', write: '1', move: 'R' },
    options: opts(
      [
        {
          id: 'opt-correct',
          label: 'δ = (q_scan, write "1", R)',
          answer: { nextState: 'q_scan', write: '1', move: 'R' },
        },
        {
          id: 'w1',
          label: `δ = (q_accept, write "1", S)`,
          answer: { nextState: 'q_accept', write: '1', move: 'S' },
        },
        {
          id: 'w2',
          label: 'δ = (q_scan, write "0", R)',
          answer: { nextState: 'q_scan', write: '0', move: 'R' },
        },
        {
          id: 'w3',
          label: `δ = (q_reject, write ${JSON.stringify(BLANK)}, S)`,
          answer: { nextState: 'q_reject', write: BLANK, move: 'S' },
        },
      ],
      'opt-correct'
    ),
    correctOptionId: 'opt-correct',
  },
];

function byDifficultyThenId(a: MvpExercise, b: MvpExercise): number {
  if (a.difficulty !== b.difficulty) return a.difficulty - b.difficulty;
  return a.id.localeCompare(b.id);
}

export const exercisePack: MvpExercise[] = [...exercisesUnsorted].sort(
  byDifficultyThenId
);
