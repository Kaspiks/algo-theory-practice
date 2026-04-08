import type { TmSolutionStep } from '@/types/tmConstructionSolution';
import { AKBK_REFERENCE_CONSTRUCTION_INPUT } from '@/content/tmConstruction/referenceMachines/akbk';

const P = {
  qS: { x: 48, y: 228 },
  q_empty: { x: 48, y: 72 },
  q0: { x: 228, y: 228 },
  q1: { x: 408, y: 96 },
  q2: { x: 588, y: 96 },
  q3: { x: 408, y: 300 },
  q_accept: { x: 768, y: 72 },
  q_reject: { x: 768, y: 300 },
} as const;

const EDGE_EXPLAIN: Record<string, string> = {
  'qS|⊔':
    'If the tape is blank here, the input may be ε. Move right once to confirm the rest of the tape is blank too.',
  'qS|a':
    'Otherwise the string is nonempty: mark the leftmost a as X (processed) and enter the right-scan phase.',
  'qS|b':
    'A string in aⁿbⁿ cannot start with b; halt in reject.',
  'q_empty|⊔':
    'Second blank confirms ε. Stay and move to accept.',
  'q_empty|a':
    'If we saw one blank then an a, the input was not empty; reject.',
  'q_empty|b':
    'Same for b after the first blank: reject.',
  'q0|a':
    'Another unprocessed a: mark it X and scan right again for a matching b at the end of the block.',
  'q0|Y':
    'The first tape symbol after the X-prefix is Y, so every a was converted to X and matched; accept.',
  'q0|X':
    'Should not read X here in a correct run; reject on malformed configuration.',
  'q0|b':
    'A bare b in the left segment means the input was not aⁿbⁿ; reject.',
  'q0|⊔':
    'Unexpected blank in q₀; reject.',
  'q1|a':
    'Still inside the middle segment: skip a without changing it.',
  'q1|b':
    'Skip unmarked b while moving toward the right end.',
  'q1|Y':
    'Skip previously matched b markers while scanning right.',
  'q1|⊔':
    'Reached the blank past the input: turn left to find the rightmost unmarked b.',
  'q1|X':
    'Seeing X during this scan means the layout is wrong; reject.',
  'q2|Y':
    'Skip marked b’s (Y) from the right until an unmarked b is found.',
  'q2|b':
    'Replace that rightmost unmarked b with Y (paired with the X we just placed) and move left.',
  'q2|⊔':
    'No b to pair with the current X; reject (too many a’s).',
  'q2|a':
    'Should not see a here while searching from the right; reject.',
  'q2|X':
    'Hit the X-block before finding b; reject.',
  'q3|a':
    'Walk left over unmarked a’s on the way back.',
  'q3|b':
    'Walk left over unmarked b’s as well.',
  'q3|Y':
    'Walk left over matched Y markers.',
  'q3|X':
    'Found the X for this round; move one step right to resume at the left end of the remaining input.',
  'q3|⊔':
    'Fell off the left pattern; reject.',
};

/** Full tutor walkthrough for the “construct-ak-bk” challenge (ordered aⁿbⁿ). */
export const CONSTRUCT_AKBK_SOLUTION_STEPS: TmSolutionStep[] = [
  {
    type: 'explain',
    explanation:
      'We build a one-tape DTM for { aⁿbⁿ | n ≥ 0 }. Idea (standard marking routine): repeatedly pair the leftmost remaining a with the rightmost remaining b by marking a→X and b→Y, then return to the left. Separate states handle ε.',
  },
  {
    type: 'add_state',
    id: 'qS',
    kind: 'start',
    position: P.qS,
    explanation: 'Start state: distinguish empty input from nonempty before the main loop.',
  },
  {
    type: 'add_state',
    id: 'q_accept',
    kind: 'accept',
    position: P.q_accept,
    explanation: 'Unique accept state (halt-accept).',
  },
  {
    type: 'add_state',
    id: 'q_reject',
    kind: 'reject',
    position: P.q_reject,
    explanation: 'Unique reject state (halt-reject).',
  },
  {
    type: 'add_state',
    id: 'q_empty',
    kind: 'work',
    position: P.q_empty,
    explanation:
      'Helper state: after seeing a blank in qS, we verify the string really was ε.',
  },
  {
    type: 'explain',
    explanation:
      'Add ε handling first: on blank, step right and check again; only ⊔⊔ pattern accepts.',
  },
  ...AKBK_REFERENCE_CONSTRUCTION_INPUT.transitions
    .filter((t) => ['qS', 'q_empty'].includes(t.from))
    .map((t) => {
      const key = `${t.from}|${t.read}`;
      return {
        type: 'add_transition' as const,
        from: t.from,
        to: t.to,
        read: t.read,
        write: t.write,
        move: t.move,
        explanation:
          EDGE_EXPLAIN[key] ??
          `Transition on ${t.read}: write ${t.write}, move ${t.move}, go to ${t.to}.`,
      };
    }),
  {
    type: 'add_state',
    id: 'q0',
    kind: 'work',
    position: P.q0,
    explanation:
      'q₀: outer loop. After each round-trip, we resume just right of the leftmost X block.',
  },
  {
    type: 'add_state',
    id: 'q1',
    kind: 'work',
    position: P.q1,
    explanation: 'q₁: scan right across the untouched middle of the tape until the trailing blank.',
  },
  {
    type: 'add_state',
    id: 'q2',
    kind: 'work',
    position: P.q2,
    explanation: 'q₂: from the blank, move left and mark the rightmost still-unmarked b as Y.',
  },
  {
    type: 'add_state',
    id: 'q3',
    kind: 'work',
    position: P.q3,
    explanation: 'q₃: return left to the X that started this round, then step right back to q₀.',
  },
  {
    type: 'explain',
    explanation:
      'Main loop: mark one a, sweep to the end, mark one b from the right, return to the X-block. When q₀ sees Y first, every a was paired — accept.',
  },
  ...AKBK_REFERENCE_CONSTRUCTION_INPUT.transitions
    .filter((t) => !['qS', 'q_empty'].includes(t.from))
    .map((t) => {
      const key = `${t.from}|${t.read}`;
      return {
        type: 'add_transition' as const,
        from: t.from,
        to: t.to,
        read: t.read,
        write: t.write,
        move: t.move,
        explanation:
          EDGE_EXPLAIN[key] ??
          `Transition on ${t.read}: write ${t.write}, move ${t.move}, go to ${t.to}.`,
      };
    }),
];
