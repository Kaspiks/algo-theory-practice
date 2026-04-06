import { languageDecodePack } from '@/content/exercises/languageDecodePack';
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
  {
    id: 'tape-result-authored-schema-demo',
    title: 'Tape result (authored options, schema demo)',
    description:
      'Same setup as “scan right” but each choice is a typed **`TapeResultOption`** in the pack; `correctOptionId` must match `step()`.',
    category: 'scan_right',
    difficulty: 1,
    mode: 'tape_result',
    machineId: 'mvp_scan_binary',
    setup: { input: '010', headIndex: 0 },
    correctOptionId: 'schema-correct',
    options: [
      {
        id: 'schema-correct',
        nextState: 'q0',
        tapeCells: ['0', '1', '0'],
        headPosition: 1,
        label: 'q0; head at index 1; tape 010',
      },
      {
        id: 'schema-stay-head',
        nextState: 'q0',
        tapeCells: ['0', '1', '0'],
        headPosition: 0,
        label: 'Head did not move right',
      },
      {
        id: 'schema-wrong-state',
        nextState: 'q_accept',
        tapeCells: ['0', '1', '0'],
        headPosition: 1,
        label: 'Jumped to accept too early',
      },
      {
        id: 'schema-wrong-cell',
        nextState: 'q0',
        tapeCells: ['1', '1', '0'],
        headPosition: 1,
        label: 'Wrong symbol written at head',
      },
    ],
    tags: ['tape-result', 'schema'],
    hints: [{ hintId: 'NT.1' }],
    explanation:
      'Demonstrates the discriminated `TapeResultExercise` shape: `options` + `correctOptionId`. The content test checks that the marked option equals `step()` from the initial configuration.',
  },
  {
    id: 'tape-result-scan-right',
    title: 'Tape result: scan right (one step)',
    description:
      'Input **010**, head on the first cell. After **one** step, which configuration matches the scan-to-blank machine?',
    category: 'scan_right',
    difficulty: 1,
    mode: 'tape_result',
    machineId: 'mvp_scan_binary',
    setup: { input: '010', headIndex: 0 },
    tags: ['tape-result', 'P1'],
    hints: [{ hintId: 'NT.1' }, { hintId: 'SCAN.1' }],
    explanation:
      'In q0 on symbol 0, the machine writes 0, moves right, and stays in q0. The tape is unchanged except at the head cell (still 0).',
  },
  {
    id: 'tape-result-mark-zero',
    title: 'Tape result: mark 0 as X',
    description:
      'Input **01**, head on the first cell. One step on the “mark 0 as X” machine.',
    category: 'marking',
    difficulty: 2,
    mode: 'tape_result',
    machineId: 'mark_zeros_x_tm',
    setup: { input: '01', headIndex: 0 },
    tags: ['tape-result', 'marking'],
    hints: [{ hintId: 'NT.1' }],
    explanation:
      'Reading 0 in q0, the machine writes X at the current cell, moves right, and stays in q0.',
  },
  {
    id: 'tape-result-contains-after-first-zero',
    title: 'Tape result: hunting 001 (after first 0)',
    description:
      'Input **001**, head on index **1** (second symbol). You are still in q0; pick the true configuration after one step.',
    category: 'homework_style',
    difficulty: 3,
    mode: 'tape_result',
    machineId: 'contains_001_tm',
    setup: { input: '001', headIndex: 1 },
    tags: ['tape-result', 'contains'],
    hints: [{ hintId: 'NT.1' }],
    explanation:
      'In q0 on 0, the machine enters q_saw0, writes 0, and moves right—first step toward recognizing substring 001.',
  },
  {
    id: 'bank-l1-scan-first-step-001',
    title: 'First step: scan right on binary',
    description:
      'Input **001**. Machine scans `{0,1}` unchanged until blank (P1). What is the **first** transition?',
    category: 'scan_right',
    difficulty: 1,
    mode: 'next_transition',
    machineId: 'mvp_scan_binary',
    setup: { input: '001' },
    tags: ['P1', 'S1.2', 'S2.1', 'bank', 'E-L1-01'],
    hints: [{ hintId: 'NT.1' }, { hintId: 'SCAN.1' }],
    explanation:
      'Under the head is `0`; in q0 you copy 0 and move right until the blank.',
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
          label: 'δ = (q0, write "0", L)',
          answer: { nextState: 'q0', write: '0', move: 'L' },
        },
      ],
      'opt-correct'
    ),
    correctOptionId: 'opt-correct',
  },
  {
    id: 'bank-l1-only-ones-blank-002',
    title: 'Accept path: hit blank after all 1s',
    description:
      'Input **11**. The head is already on the **blank** after both `1`s. What is the next δ?',
    category: 'tm_basics',
    difficulty: 1,
    mode: 'next_transition',
    machineId: 'only_ones_tm',
    setup: { input: '11', headIndex: 2 },
    tags: ['P1', 'P9', 'S2.1', 'bank', 'E-L1-02'],
    hints: [{ hintId: 'NT.2' }],
    explanation:
      'Blank after the input block means every cell was 1, so δ moves to accept with a stay on the blank.',
    canonicalFirstAnswer: { nextState: 'q_accept', write: BLANK, move: 'S' },
    options: opts(
      [
        {
          id: 'opt-correct',
          label: `δ = (q_accept, write ${JSON.stringify(BLANK)}, S)`,
          answer: { nextState: 'q_accept', write: BLANK, move: 'S' },
        },
        {
          id: 'w1',
          label: 'δ = (q0, write "1", R)',
          answer: { nextState: 'q0', write: '1', move: 'R' },
        },
        {
          id: 'w2',
          label: 'δ = (q_reject, write "0", S)',
          answer: { nextState: 'q_reject', write: '0', move: 'S' },
        },
        {
          id: 'w3',
          label: 'δ = (q0, write "1", S)',
          answer: { nextState: 'q0', write: '1', move: 'S' },
        },
      ],
      'opt-correct'
    ),
    correctOptionId: 'opt-correct',
  },
  {
    id: 'bank-l1-tape-result-scan-003',
    title: 'Tape after one step (scan)',
    description:
      '`mvp_scan_binary`, input **10**, **one** step from the start. Which configuration matches?',
    category: 'scan_right',
    difficulty: 1,
    mode: 'tape_result',
    machineId: 'mvp_scan_binary',
    setup: { input: '10', headIndex: 0 },
    tags: ['P1', 'S2.1', 'bank', 'E-L1-03'],
    hints: [{ hintId: 'TR.4' }],
    explanation:
      'In q0 on `1`, the machine writes 1 unchanged and moves right; the head sits on `0` at index 1.',
    correctOptionId: 'bank-tr-10',
    options: [
      {
        id: 'bank-tr-10',
        nextState: 'q0',
        tapeCells: ['1', '0'],
        headPosition: 1,
        label: 'q0; head at index 1; tape 10',
      },
      {
        id: 'w-head0',
        nextState: 'q0',
        tapeCells: ['1', '0'],
        headPosition: 0,
        label: 'Head did not move right',
      },
      {
        id: 'w-accept',
        nextState: 'q_accept',
        tapeCells: ['1', '0'],
        headPosition: 1,
        label: 'Jumped to accept too early',
      },
      {
        id: 'w-tape',
        nextState: 'q0',
        tapeCells: ['0', '0'],
        headPosition: 1,
        label: 'Wrong symbol under head after write',
      },
    ],
  },
  {
    id: 'bank-l1-contains001-reject-004',
    title: 'First step detecting substring machine',
    description:
      'Machine for “tape contains **001**”. Input **100**. What is the first δ?',
    category: 'substring',
    difficulty: 1,
    mode: 'next_transition',
    machineId: 'contains_001_tm',
    setup: { input: '100' },
    tags: ['P1', 'P4', 'S1.2', 'bank', 'E-L1-04'],
    hints: [{ hintId: 'NT.1' }],
    explanation:
      'The first symbol is `1` while still in q0 (no partial 0-prefix yet), so you stay in q0, copy 1, and move right.',
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
    id: 'bank-l2-markers-007',
    title: 'Tape symbol after mark step',
    description:
      'Machine marks the **first** `a` as `X` and moves right. Input **aab**. After the first nontrivial step?',
    category: 'marking',
    difficulty: 2,
    mode: 'tape_result',
    machineId: 'mark_first_a_tm',
    setup: { input: 'aab', headIndex: 0 },
    tags: ['P3', 'S2.1', 'S3.3', 'bank', 'E-L2-03'],
    hints: [{ hintId: 'TR.4' }, { hintId: 'EX.7' }],
    explanation:
      'From q0 on `a`, δ writes `X`, enters q_after, and moves right; the tape prefix becomes `Xab` with head on the first `a`.',
    correctOptionId: 'bank-mfa-correct',
    options: [
      {
        id: 'bank-mfa-correct',
        nextState: 'q_after',
        tapeCells: ['X', 'a', 'b'],
        headPosition: 1,
        label: 'q_after; head at index 1; tape Xab',
      },
      {
        id: 'w-state',
        nextState: 'q0',
        tapeCells: ['X', 'a', 'b'],
        headPosition: 1,
        label: 'Stayed in q0',
      },
      {
        id: 'w-head',
        nextState: 'q_after',
        tapeCells: ['X', 'a', 'b'],
        headPosition: 0,
        label: 'Head did not move right',
      },
      {
        id: 'w-tape',
        nextState: 'q_after',
        tapeCells: ['a', 'a', 'b'],
        headPosition: 1,
        label: 'Tape unchanged (no mark)',
      },
    ],
  },
  {
    id: 'bank-l2-trace-scan-binary-005',
    title: 'Trace: scan to blank',
    description:
      'Input **010** on the scan-to-blank machine. Step through in next-δ mode until halt (typical homework trace).',
    category: 'tracing',
    difficulty: 2,
    mode: 'tracing',
    machineId: 'mvp_scan_binary',
    setup: { input: '010' },
    tags: ['P1', 'S2.2', 'bank', 'E-L2-01'],
    hints: [{ hintId: 'TRA.2' }],
    explanation:
      'Only R-moves on 0/1 with copy; the first blank sends the machine to accept.',
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
    id: 'bank-l2-tape-result-halt-006',
    title: 'Halt: accept or reject?',
    description:
      'Run **only_ones_tm** mentally on input **1101**. When it halts, what is the outcome?',
    category: 'tm_basics',
    difficulty: 2,
    mode: 'strategy',
    machineId: 'only_ones_tm',
    setup: { input: '1101' },
    tags: ['P1', 'S2.4', 'bank', 'E-L2-02'],
    hints: [{ hintId: 'TR.3' }],
    explanation:
      'The first `0` triggers δ to q_reject with a stay move; the machine rejects without accepting.',
    textCorrectOptionId: 'st-reject',
    textOptions: [
      { id: 'st-reject', label: 'Reject' },
      { id: 'st-accept', label: 'Accept' },
      { id: 'st-loop', label: 'Runs forever (no halt)' },
      { id: 'st-unknown', label: 'Halts in a non-accept, non-reject state' },
    ],
  },
  {
    id: 'bank-l3-runtime-sweep-012',
    title: 'Runtime: nested linear scans',
    description:
      'A TM runs **k** outer rounds; each round scans all **n** cells once. What is a tight bound when k = Θ(n)?',
    category: 'complexity_tm',
    difficulty: 3,
    mode: 'strategy',
    machineId: 'mvp_scan_binary',
    setup: { input: '0' },
    tags: ['P12', 'S5.T2', 'bank', 'E-L3-05'],
    hints: [{ hintId: 'EX.9' }],
    explanation:
      'Multiply the number of outer rounds by the cost per round: Θ(n) × Θ(n) = Θ(n²).',
    textCorrectOptionId: 'st-n2',
    textOptions: [
      { id: 'st-n', label: 'O(n)' },
      { id: 'st-nlogn', label: 'O(n log n)' },
      { id: 'st-n2', label: 'O(n²)' },
      { id: 'st-n3', label: 'O(n³)' },
    ],
  },
  {
    id: 'bank-l3-strategy-akb2k-009',
    title: 'Strategy: relate EXAM 1 Q3 sweep to phases',
    description:
      'Algorithm sketch: erase `a`, go to blank, step left, check `b`, erase, step left, check `b`, erase, return to start. What does each **outer** iteration remove?',
    category: 'exam_prep',
    difficulty: 3,
    mode: 'strategy',
    machineId: 'mvp_scan_binary',
    setup: { input: '0' },
    tags: ['P11', 'P12', 'exam:1-q3', 'S4.2', 'S5.T1', 'bank', 'E-L3-02'],
    hints: [{ hintId: 'ST.2' }, { hintId: 'EX.2' }],
    explanation:
      'This matches a^k b^{2k}: each `a` is paired with **two** `b`s, so one `a` and two `b`s disappear per outer round.',
    textCorrectOptionId: 'st-a',
    textOptions: [
      {
        id: 'st-a',
        label: 'One `a` and two `b`s per round',
      },
      {
        id: 'st-b',
        label: 'Two `a`s and one `b` per round',
      },
      {
        id: 'st-c',
        label: 'Only checks symbol order; no symbols erased',
      },
      {
        id: 'st-d',
        label: 'Sorts the tape',
      },
    ],
  },
  {
    id: 'bank-l3-strategy-akb2k1-011',
    title: 'Contrast 2k vs 2k+1 (EXAM 3 Q1 style)',
    description:
      'Compared to a^k b^{2k}, what changes for a^k b^{2k+1}?',
    category: 'exam_prep',
    difficulty: 3,
    mode: 'strategy',
    machineId: 'mvp_scan_binary',
    setup: { input: '0' },
    tags: ['P11', 'exam:3-q1', 'S4.4', 'bank', 'E-L3-04'],
    hints: [{ hintId: 'EX.3' }],
    explanation:
      '2k+1 = 2k + 1: after pairing each `a` with two `b`s, one extra `b` remains in the right block.',
    textCorrectOptionId: 'st-a',
    textOptions: [
      {
        id: 'st-a',
        label: 'One extra `b` after the usual two-`b`s-per-`a` pairing',
      },
      {
        id: 'st-b',
        label: 'One fewer `b` than in the 2k case',
      },
      { id: 'st-c', label: 'No change in the block relationship' },
      { id: 'st-d', label: 'A new `c` block appears' },
    ],
  },
  {
    id: 'bank-l3-strategy-akbkak-008',
    title: 'Strategy: a^k b^k a^k (EXAM 1 Q1 style)',
    description:
      'Which **high-level plan** matches L = { a^k b^k a^k | k ≥ 0 }?',
    category: 'exam_prep',
    difficulty: 3,
    mode: 'strategy',
    machineId: 'mvp_scan_binary',
    setup: { input: '0' },
    tags: ['P10', 'P8', 'P6', 'exam:1-q1', 'S4.1', 'S4.2', 'S3.5', 'bank', 'E-L3-01'],
    hints: [{ hintId: 'ST.2' }, { hintId: 'EX.1' }],
    explanation:
      'Shape a*b*a* alone is not enough: you need **two** equalities—first a-block vs b-block, then b-block vs second a-block.',
    textCorrectOptionId: 'st-b',
    textOptions: [
      {
        id: 'st-a',
        label: 'Check membership in a*b*a* only (three blocks in order)',
      },
      {
        id: 'st-b',
        label:
          'Match the first a-run to the b-run by pairing, then match the remaining a’s to the same count',
      },
      {
        id: 'st-c',
        label: 'Count all a’s once, then all b’s once (single tally)',
      },
      { id: 'st-d', label: 'Sort the tape' },
    ],
  },
  {
    id: 'bank-l3-strategy-more-a-010',
    title: 'Strategy: strictly more a than b (EXAM 2 Q1 style)',
    description:
      'Which approach **cannot** work on a one-tape DTM for { w | #a(w) > #b(w) } over {a,b}?',
    category: 'exam_prep',
    difficulty: 3,
    mode: 'strategy',
    machineId: 'mvp_scan_binary',
    setup: { input: '0' },
    tags: ['P13', 'exam:2-q1', 'S4.1', 'bank', 'E-L3-03'],
    hints: [{ hintId: 'ST.4' }],
    explanation:
      'The language is not regular; finite control with **no** tape marking cannot remember unbounded counts.',
    textCorrectOptionId: 'st-b',
    textOptions: [
      {
        id: 'st-a',
        label: 'Pair each `a` with a `b` and erase until one symbol remains',
      },
      {
        id: 'st-b',
        label: 'Use finite states only, never writing markers on the tape',
      },
      {
        id: 'st-c',
        label: 'Mark matched pairs, then scan for a leftover `a`',
      },
      {
        id: 'st-d',
        label: 'Two sweeps with tallies encoded in tape symbols',
      },
    ],
  },
  {
    id: 'bank-l4-epsilon-akbkak-015',
    title: 'Empty string in a^k b^k a^k',
    description:
      'Is ε ∈ { a^k b^k a^k | k ≥ 0 }? How should a correct TM treat the blank tape?',
    category: 'exam_prep',
    difficulty: 4,
    mode: 'strategy',
    machineId: 'mvp_scan_binary',
    setup: { input: '0' },
    tags: ['P10', 'exam:1-q1', 'S4.4', 'bank', 'E-L4-03'],
    hints: [{ hintId: 'EX.10' }],
    explanation:
      'k ≥ 0 includes k = 0: zero a’s, zero b’s, zero a’s — the empty string is in the language.',
    textCorrectOptionId: 'st-accept',
    textOptions: [
      { id: 'st-reject', label: 'Reject immediately' },
      { id: 'st-accept', label: 'Accept (k = 0 case)' },
      { id: 'st-loop', label: 'Loop forever on blank' },
      { id: 'st-undefined', label: 'Undefined / machine may hang' },
    ],
  },
  {
    id: 'bank-l4-majority-half-016',
    title: 'Half vs strict majority (EXAM 2 contrast)',
    description:
      'Compare “more `a` than `b`” vs “at least half the symbols are `a`” on the string **`ab`**.',
    category: 'exam_prep',
    difficulty: 4,
    mode: 'strategy',
    machineId: 'mvp_scan_binary',
    setup: { input: '0' },
    tags: ['P13', 'P14', 'exam:2', 'S4.4', 'bank', 'E-L4-04'],
    hints: [{ hintId: 'EX.4' }],
    explanation:
      'For `ab`, #a = #b, so strict “more a than b” fails; “≥ half are a” holds (1 of 2).',
    textCorrectOptionId: 'st-a',
    textOptions: [
      {
        id: 'st-a',
        label:
          'Not in “more a than b”; **in** “at least half are a”',
      },
      {
        id: 'st-b',
        label: 'In both languages',
      },
      {
        id: 'st-c',
        label: 'In “more a than b” only',
      },
      {
        id: 'st-d',
        label: 'In neither language',
      },
    ],
  },
  {
    id: 'bank-l4-missing-delta-akbk-013',
    title: 'Complete δ for pairing phase (concept)',
    description:
      'Partial TM skeleton for a^n b^n style marking: in state **q_match** reading marked cell **`X`**, what is the usual missing δ?',
    category: 'exam_prep',
    difficulty: 4,
    mode: 'strategy',
    machineId: 'mvp_scan_binary',
    setup: { input: '0' },
    tags: ['P6', 'P8', 'S1.3', 'S4.2', 'bank', 'E-L4-01'],
    hints: [{ hintId: 'MT.2' }],
    explanation:
      'Marked positions are finished; the search phase typically moves right over `X` without changing the matching invariant.',
    textCorrectOptionId: 'st-r',
    textOptions: [
      { id: 'st-r', label: '(q_match, X) → move R, stay in q_match (skip marks)' },
      { id: 'st-s', label: '(q_match, X) → stay and halt accept' },
      { id: 'st-l', label: '(q_match, X) → move L and erase X' },
      { id: 'st-rej', label: '(q_match, X) → immediate reject' },
    ],
  },
  {
    id: 'bank-var-019-strategy-contains-001',
    title: 'Strategy: detect 001 without counting to three',
    description:
      'Which idea matches a **one-pass** left-to-right detector for substring **001**?',
    category: 'exam_prep',
    difficulty: 2,
    mode: 'strategy',
    machineId: 'contains_001_tm',
    setup: { input: '1001' },
    tags: ['P4', 'bank', 'var-019'],
    hints: [{ hintId: 'SUBSTR.1' }],
    explanation:
      'Use a small DFA-style memory of how much of the `001` prefix you have seen (states q0 / saw0 / saw00).',
    textCorrectOptionId: 'st-a',
    textOptions: [
      {
        id: 'st-a',
        label: 'Finite states remembering the longest suffix that is a prefix of 001',
      },
      {
        id: 'st-b',
        label: 'Count how many 0s have occurred so far with a unary tally',
      },
      {
        id: 'st-c',
        label: 'Sort the tape, then scan for 001',
      },
      {
        id: 'st-d',
        label: 'Copy the tape to a second track and BFS over splits',
      },
    ],
  },
  {
    id: 'bank-var-021-trace-contains-1001',
    title: 'Tracing: contains 001 on 1001',
    description:
      'Input **1001** contains **001** starting at the third symbol. First δ on the contains-001 machine?',
    category: 'tracing',
    difficulty: 3,
    mode: 'tracing',
    machineId: 'contains_001_tm',
    setup: { input: '1001' },
    tags: ['P4', 'bank', 'var-021'],
    hints: [{ hintId: 'SUBSTR.1' }],
    explanation:
      'First symbol is `1` in q0: stay in q0, write 1, move right.',
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
          label: 'δ = (q_accept, write "1", S)',
          answer: { nextState: 'q_accept', write: '1', move: 'S' },
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
    id: 'bank-var-022-strategy-wrong-order',
    title: 'Strategy: b^k a^k vs a^k b^k',
    description:
      'Why is { b^k a^k | k ≥ 0 } **not** the same language as { a^k b^k | k ≥ 0 }?',
    category: 'exam_prep',
    difficulty: 3,
    mode: 'strategy',
    machineId: 'mvp_scan_binary',
    setup: { input: '0' },
    tags: ['P6', 'bank', 'var-022'],
    hints: [{ hintId: 'ST.2' }],
    explanation:
      'Block order matters: the first language insists all b’s come before all a’s.',
    textCorrectOptionId: 'st-b',
    textOptions: [
      { id: 'st-a', label: 'They differ only when k = 0' },
      {
        id: 'st-b',
        label: 'They impose different orders on the two blocks',
      },
      { id: 'st-c', label: 'They are the same language' },
      { id: 'st-d', label: 'One is regular and the other is not' },
    ],
  },
  {
    id: 'bank-var-025-strategy-outer-iterations',
    title: 'Strategy: counting outer iterations (EXAM 1 Q3)',
    description:
      'In a “pair one `a` with two `b`s per sweep” style algorithm, what does the **number of successful outer rounds** bound?',
    category: 'exam_prep',
    difficulty: 4,
    mode: 'strategy',
    machineId: 'mvp_scan_binary',
    setup: { input: '0' },
    tags: ['P12', 'exam:1-q3', 'bank', 'var-025'],
    hints: [{ hintId: 'EX.2' }],
    explanation:
      'Each full round consumes one `a` from the left block and two `b`s from the right block, so the count of rounds is bounded by k in a^k b^{2k}.',
    textCorrectOptionId: 'st-a',
    textOptions: [
      { id: 'st-a', label: 'The exponent k in a^k b^{2k}' },
      { id: 'st-b', label: 'The tape length n only, with no link to k' },
      { id: 'st-c', label: 'The number of tape symbols in the alphabet' },
      { id: 'st-d', label: 'log n only' },
    ],
  },
  {
    id: 'bank-var-027-strategy-akbk-vs-akb2k',
    title: 'Strategy: a^k b^k vs a^k b^{2k}',
    description:
      'What extra work does a^k b^{2k} demand compared with a^k b^k?',
    category: 'exam_prep',
    difficulty: 3,
    mode: 'strategy',
    machineId: 'mvp_scan_binary',
    setup: { input: '0' },
    tags: ['P6', 'P11', 'bank', 'var-027'],
    hints: [{ hintId: 'EX.2' }],
    explanation:
      'Each `a` must meet **two** `b`s instead of one, so pairing passes or sweeps encode a 2-to-1 consumption rate.',
    textCorrectOptionId: 'st-a',
    textOptions: [
      {
        id: 'st-a',
        label: 'Pair every `a` with two `b`s (not one)',
      },
      { id: 'st-b', label: 'Only check that all `a`s come before all `b`s' },
      { id: 'st-c', label: 'No essential change—same high-level algorithm' },
      { id: 'st-d', label: 'Replace every `b` with `aa`' },
    ],
  },
  {
    id: 'bank-var-028-strategy-anbncn',
    title: 'False friend: a^n b^n c^n on one tape',
    description:
      'Why is { a^n b^n c^n | n ≥ 0 } **not** decided by the usual one-tape “mark and match” idea for a^n b^n alone?',
    category: 'exam_prep',
    difficulty: 4,
    mode: 'strategy',
    machineId: 'mvp_scan_binary',
    setup: { input: '0' },
    tags: ['P6', 'bank', 'var-028'],
    hints: [{ hintId: 'ST.2' }],
    explanation:
      'You need **two** independent count comparisons (a vs b and b vs c); one-tape pairing without extra structure cannot remember both unbounded tallies simultaneously in the same way as the two-block case.',
    textCorrectOptionId: 'st-a',
    textOptions: [
      {
        id: 'st-a',
        label:
          'Two separate equal-length constraints; finite control cannot handle the full triple equality with the same trick as a^n b^n alone',
      },
      {
        id: 'st-b',
        label: 'The language is regular, so no marking is needed',
      },
      {
        id: 'st-c',
        label: 'It is the same language as a^n b^n',
      },
      {
        id: 'st-d',
        label: 'A single left-to-right pass always suffices',
      },
    ],
  },
  {
    id: 'bank-var-029-strategy-wwR-phase',
    title: 'Sipser-style: ww^R phase order',
    description:
      'Which description best matches the standard one-tape approach for even-length palindromes ww^R?',
    category: 'exam_prep',
    difficulty: 3,
    mode: 'strategy',
    machineId: 'mvp_scan_binary',
    setup: { input: '0' },
    tags: ['P4', 'bank', 'var-029'],
    hints: [{ hintId: 'ST.2' }],
    explanation:
      'Repeatedly erase matching symbols from the two ends (or mark and meet in the middle).',
    textCorrectOptionId: 'st-a',
    textOptions: [
      {
        id: 'st-a',
        label: 'Repeatedly match and erase outer symbols until acceptance',
      },
      {
        id: 'st-b',
        label: 'Find the midpoint with a single sweep, then DFA-test each half',
      },
      {
        id: 'st-c',
        label: 'Copy w to the right of w^R, then run CFL CYK',
      },
      { id: 'st-d', label: 'Sort, then compare first and last blocks' },
    ],
  },
  ...languageDecodePack,
];

function byDifficultyThenId(a: MvpExercise, b: MvpExercise): number {
  if (a.difficulty !== b.difficulty) return a.difficulty - b.difficulty;
  return a.id.localeCompare(b.id);
}

export const exercisePack: MvpExercise[] = [...exercisesUnsorted].sort(
  byDifficultyThenId
);
