import type { LanguageDecodeExercise } from '@/types/mvp';

const PLACEHOLDER_MACHINE = 'mvp_scan_binary' as const;
const PLACEHOLDER_SETUP = { input: '0' } as const;

/** Formal language → examples → conditions → TM strategy (guided MCQ / multi-select). */
export const languageDecodePack: LanguageDecodeExercise[] = [
  {
    id: 'ld-binary-ends-in-one',
    title: 'Decode: binary strings ending in 1',
    description:
      'Practice reading set notation for a simple regular property over {0,1}.',
    category: 'language_decode',
    difficulty: 1,
    mode: 'language_decode',
    machineId: PLACEHOLDER_MACHINE,
    setup: PLACEHOLDER_SETUP,
    tags: ['LD', 'regular', 'scan'],
    hints: [
      { hintId: 'LANG.PE.1' },
      { hintId: 'LANG.EX.1' },
      { hintId: 'LANG.STR.1' },
    ],
    explanation:
      '“Ends with 1” is a **suffix** property: only the last symbol matters once you know the string is non-empty in the usual exam reading; ε has no last symbol so it is excluded. A TM typically scans to the end, steps back one cell, and checks that symbol.',
    languageNotation:
      'L = { w ∈ {0,1}* | w is non-empty and the last symbol of w is 1 }',
    alphabetNote: 'Treat “last symbol” literally: the empty string ε has no last symbol.',
    plainEnglish: {
      prompt: 'Which plain-English reading matches L?',
      options: [
        {
          id: 'pe-a',
          label:
            'All binary strings whose **last** symbol is 1 (so ε is not included).',
        },
        {
          id: 'pe-b',
          label: 'All binary strings that **contain** at least one 1 anywhere.',
        },
        {
          id: 'pe-c',
          label: 'All binary strings where the **first** symbol is 1.',
        },
        {
          id: 'pe-d',
          label: 'All binary strings with the **same** number of 0s and 1s.',
        },
      ],
      correctOptionId: 'pe-a',
      feedbackIfCorrect:
        'Right: the predicate is about the **final** symbol, not “has a 1” or counting.',
      feedbackIfWrong:
        'Re-read the set builder: it constrains only the **last** character of w.',
    },
    examplesInLanguage: {
      prompt: 'Select **every** string that belongs to L.',
      choices: [
        { id: 'in-1', label: '1' },
        { id: 'in-2', label: '01' },
        { id: 'in-3', label: '00111' },
        { id: 'in-x1', label: 'ε (empty)' },
        { id: 'in-x2', label: '0' },
        { id: 'in-x3', label: '10' },
        { id: 'in-x4', label: '110' },
      ],
      correctChoiceIds: ['in-1', 'in-2', 'in-3'],
      feedbackIfCorrect:
        'Each selected string ends with 1; ε and strings ending in 0 are out.',
      feedbackIfWrong:
        'Include every string whose **last** symbol is 1; exclude ε and strings ending in 0.',
    },
    examplesNotInLanguage: {
      prompt: 'Select **every** string that does **not** belong to L.',
      choices: [
        { id: 'out-1', label: 'ε' },
        { id: 'out-2', label: '0' },
        { id: 'out-3', label: '10' },
        { id: 'out-4', label: '110' },
        { id: 'out-x1', label: '11' },
        { id: 'out-x2', label: '0101' },
      ],
      correctChoiceIds: ['out-1', 'out-2', 'out-3', 'out-4'],
      feedbackIfCorrect:
        'These either have no last symbol (ε) or end in 0; 11 and 0101 are in L.',
      feedbackIfWrong:
        'Select strings that are **not** in L: ε, then any non-empty string whose last symbol is 0.',
    },
    condition: {
      prompt: 'What must a decider (or TM) **check** for membership in L?',
      options: [
        { id: 'c-a', label: 'The first symbol is 1.' },
        { id: 'c-b', label: 'The last symbol is 1.' },
        { id: 'c-c', label: 'The number of 1s is even.' },
        { id: 'c-d', label: 'No 0 appears in w.' },
      ],
      correctOptionId: 'c-b',
      feedbackIfCorrect:
        'Exactly: reach the end of the input block, then read the symbol before the blank.',
      feedbackIfWrong:
        'The definition only constrains the **suffix** at the end of w.',
    },
    tmStrategy: {
      prompt: 'Which **high-level** one-tape strategy fits best?',
      options: [
        {
          id: 's-a',
          label:
            'Sweep right over 0/1 unchanged until the blank, move one step left, accept iff that symbol is 1.',
        },
        {
          id: 's-b',
          label: 'Mark each 0 as X while walking left from the start.',
        },
        {
          id: 's-c',
          label: 'Pair every 0 with a 1 and erase both until the tape is empty.',
        },
        {
          id: 's-d',
          label: 'Sort the tape, then scan for substring 01.',
        },
      ],
      correctOptionId: 's-a',
      feedbackIfCorrect:
        'Classic “find the last input symbol” pattern: overshoot to blank, step back.',
      feedbackIfWrong:
        'This language is a simple **end-of-input** check, not pairing or sorting.',
    },
  },
  {
    id: 'ld-ak-bk',
    title: 'Decode: a^k b^k',
    description:
      'The canonical “equal a-block and b-block” language (Sipser-style **a^n b^n**, `tm-patterns.md` **P6**); prerequisite for EXAM-style ratio and triple-block variants.',
    category: 'language_decode',
    difficulty: 2,
    mode: 'language_decode',
    machineId: PLACEHOLDER_MACHINE,
    setup: PLACEHOLDER_SETUP,
    tags: ['LD', 'P6', 'counting'],
    hints: [{ hintId: 'LANG.PE.2' }, { hintId: 'LANG.STR.2' }],
    explanation:
      'L = { a^k b^k | k ≥ 0 } means: zero or more a’s, then the **same** number of b’s, and nothing else. A standard TM marks one a and one b per round (or zig-zags) to enforce k_a = k_b with the correct order.',
    languageNotation: 'L = { a^k b^k | k ≥ 0 }',
    alphabetNote: 'Alphabet {a, b}; exponent k is the same on both sides.',
    plainEnglish: {
      prompt: 'What does this notation mean?',
      options: [
        {
          id: 'pe-a',
          label:
            'Some number k of a’s, then exactly k b’s, and the string ends there (k can be 0).',
        },
        {
          id: 'pe-b',
          label: 'The same number of a’s and b’s in **any** order.',
        },
        {
          id: 'pe-c',
          label: 'k a’s followed by k b’s, then **another** k a’s.',
        },
        { id: 'pe-d', label: 'Twice as many b’s as a’s.' },
      ],
      correctOptionId: 'pe-a',
      feedbackIfCorrect:
        'Yes: one exponent k ties the two blocks; order is **all a’s then all b’s**.',
      feedbackIfWrong:
        'The template a^k b^k fixes **order** (a-block then b-block) and **equal length** of those blocks.',
    },
    examplesInLanguage: {
      prompt: 'Select every string **in** L.',
      choices: [
        { id: 'in-1', label: 'ε' },
        { id: 'in-2', label: 'ab' },
        { id: 'in-3', label: 'aabb' },
        { id: 'in-4', label: 'aaabbb' },
        { id: 'in-x1', label: 'aab' },
        { id: 'in-x2', label: 'aba' },
        { id: 'in-x3', label: 'ba' },
      ],
      correctChoiceIds: ['in-1', 'in-2', 'in-3', 'in-4'],
      feedbackIfCorrect:
        'ε is k = 0; the others have matching a- and b-runs with no interleaving.',
      feedbackIfWrong:
        'aab has unequal counts; aba and ba break the “all a’s then all b’s” shape.',
    },
    examplesNotInLanguage: {
      prompt: 'Select every string **not** in L.',
      choices: [
        { id: 'out-1', label: 'aab' },
        { id: 'out-2', label: 'aba' },
        { id: 'out-3', label: 'abb' },
        { id: 'out-4', label: 'ba' },
        { id: 'out-x1', label: 'ab' },
        { id: 'out-x2', label: 'aabb' },
      ],
      correctChoiceIds: ['out-1', 'out-2', 'out-3', 'out-4'],
      feedbackIfCorrect:
        'These fail equal counts or correct order; ab and aabb are in L.',
      feedbackIfWrong:
        'Reject strings with wrong counts or an a after some b.',
    },
    condition: {
      prompt: 'What is the **membership condition**?',
      options: [
        {
          id: 'c-a',
          label:
            'The string is a^i b^j with i = j (same count) and symbols appear in that order only.',
        },
        { id: 'c-b', label: 'Total number of a’s equals total number of b’s in any order.' },
        { id: 'c-c', label: 'Every a is immediately followed by a b.' },
        { id: 'c-d', label: 'The string contains substring ab exactly once.' },
      ],
      correctOptionId: 'c-a',
      feedbackIfCorrect:
        'Two constraints: **order** (a-block then b-block) and **i = j**.',
      feedbackIfWrong:
        'Order matters: a^k b^k is not “shuffle” equality of counts.',
    },
    tmStrategy: {
      prompt: 'Which TM **idea** matches standard constructions?',
      options: [
        {
          id: 's-a',
          label:
            'Repeatedly mark one a and one b (e.g. zig-zag or sweep) until all matched, then verify no extras.',
        },
        { id: 's-b', label: 'Single left-to-right pass with 3 states only.' },
        {
          id: 's-c',
          label: 'Copy the a-block to the right of the b-block, then compare as strings.',
        },
        { id: 's-d', label: 'Guess k nondeterministically and erase k symbols.' },
      ],
      correctOptionId: 's-a',
      feedbackIfCorrect:
        'Mark-and-match (or equivalent pairing) is the textbook one-tape approach.',
      feedbackIfWrong:
        'The language is not regular; finite states alone cannot count unbounded k.',
    },
  },
  {
    id: 'ld-palindrome-wr',
    title: 'Decode: palindromes w = w^R',
    description:
      'Sipser-style palindrome language over {a,b}: the string reads the same forwards and backwards.',
    category: 'language_decode',
    difficulty: 2,
    mode: 'language_decode',
    machineId: PLACEHOLDER_MACHINE,
    setup: PLACEHOLDER_SETUP,
    tags: ['LD', 'palindrome', 'Sipser'],
    hints: [{ hintId: 'LANG.PE.3' }, { hintId: 'LANG.STR.3' }],
    explanation:
      'w^R is the reverse of w. Membership means symmetric letters around the center. A TM often uses two markers or compares outer symbols, erases, and repeats.',
    languageNotation: 'L = { w ∈ {a,b}* | w = w^R }',
    alphabetNote: 'ε is its own reverse, so ε ∈ L.',
    plainEnglish: {
      prompt: 'What is L in words?',
      options: [
        {
          id: 'pe-a',
          label: 'Strings that read the same forwards and backwards (palindromes).',
        },
        { id: 'pe-b', label: 'Strings where every a is adjacent to a b.' },
        { id: 'pe-c', label: 'Strings of the form ww (two identical halves).' },
        { id: 'pe-d', label: 'Strings with an equal number of a’s and b’s.' },
      ],
      correctOptionId: 'pe-a',
      feedbackIfCorrect:
        'Palindrome = equality of w and its reverse w^R, including ε.',
      feedbackIfWrong:
        'w^R denotes **reverse**; compare character-wise from both ends.',
    },
    examplesInLanguage: {
      prompt: 'Select every string **in** L.',
      choices: [
        { id: 'in-1', label: 'ε' },
        { id: 'in-2', label: 'aa' },
        { id: 'in-3', label: 'aba' },
        { id: 'in-4', label: 'abba' },
        { id: 'in-x1', label: 'ab' },
        { id: 'in-x2', label: 'aab' },
        { id: 'in-x3', label: 'abab' },
      ],
      correctChoiceIds: ['in-1', 'in-2', 'in-3', 'in-4'],
      feedbackIfCorrect:
        'Each string equals its reversal; ab, aab, abab are not palindromes.',
      feedbackIfWrong:
        'Test reversal explicitly: ab reversed is ba ≠ ab.',
    },
    examplesNotInLanguage: {
      prompt: 'Select every string **not** in L.',
      choices: [
        { id: 'out-1', label: 'ab' },
        { id: 'out-2', label: 'aab' },
        { id: 'out-3', label: 'abab' },
        { id: 'out-4', label: 'abb' },
        { id: 'out-x1', label: 'aba' },
        { id: 'out-x2', label: 'abba' },
      ],
      correctChoiceIds: ['out-1', 'out-2', 'out-3', 'out-4'],
      feedbackIfCorrect:
        'These break symmetry under reversal; aba and abba are palindromes.',
      feedbackIfWrong:
        'If w^R = w, the string is **in** L—leave those unselected here.',
    },
    condition: {
      prompt: 'What must a TM **verify**?',
      options: [
        { id: 'c-a', label: 'Symbol at position i matches symbol at position |w|−i−1 for all i.' },
        { id: 'c-b', label: 'The first half equals the second half as substrings.' },
        { id: 'c-c', label: 'The number of a’s is twice the number of b’s.' },
        { id: 'c-d', label: 'No two consecutive symbols are equal.' },
      ],
      correctOptionId: 'c-a',
      feedbackIfCorrect:
        'That is the mirror / reversal condition in index form.',
      feedbackIfWrong:
        'ww is a different language; palindrome is **reverse** equality, not two copies.',
    },
    tmStrategy: {
      prompt: 'Which high-level strategy is standard on **one tape**?',
      options: [
        {
          id: 's-a',
          label:
            'Repeatedly compare (and erase or mark) the leftmost and rightmost unprocessed symbols until the middle.',
        },
        { id: 's-b', label: 'Scan once left-to-right with 4 states.' },
        { id: 's-c', label: 'Sort symbols, then check odd length.' },
        { id: 's-d', label: 'Guess the center state with no head movement.' },
      ],
      correctOptionId: 's-a',
      feedbackIfCorrect:
        'Meet-in-the-middle / outer-pairing is the usual palindrome TM picture.',
      feedbackIfWrong:
        'Palindromes are not regular; a single DFA-style sweep is not enough.',
    },
  },
  {
    id: 'ld-ak-b2k',
    title: 'Decode: a^k b^{2k}',
    description:
      '**EXAM 1 Q3** language shape (`materials/exam/exam.md`); each a pairs with **two** b’s (`tm-patterns.md` **P11**).',
    category: 'language_decode',
    difficulty: 3,
    mode: 'language_decode',
    machineId: PLACEHOLDER_MACHINE,
    setup: PLACEHOLDER_SETUP,
    tags: ['LD', 'P11', 'exam'],
    hints: [{ hintId: 'LANG.PE.4' }, { hintId: 'LANG.STR.4' }],
    explanation:
      'Exponent 2k means the b-run is **twice** as long as the a-run. Many TMs delete one a and two b’s per outer round to maintain the ratio.',
    languageNotation: 'L = { a^k b^{2k} | k ≥ 0 }',
    alphabetNote: 'Only a’s then only b’s; count relationship is |b-run| = 2|a-run|.',
    plainEnglish: {
      prompt: 'Choose the correct reading.',
      options: [
        {
          id: 'pe-a',
          label:
            'k copies of a, then 2k copies of b (same k), and nothing else.',
        },
        { id: 'pe-b', label: 'k copies of a, then k copies of b.' },
        { id: 'pe-c', label: '2k copies of a, then k copies of b.' },
        { id: 'pe-d', label: 'Any string with twice as many b’s as a’s in any order.' },
      ],
      correctOptionId: 'pe-a',
      feedbackIfCorrect:
        'The exponents share k: b-length = 2 × a-length, with a’s first.',
      feedbackIfWrong:
        'b^{2k} is **two** b’s per a in the block picture, not “any order” counts.',
    },
    examplesInLanguage: {
      prompt: 'Select every string **in** L.',
      choices: [
        { id: 'in-1', label: 'ε' },
        { id: 'in-2', label: 'abb' },
        { id: 'in-3', label: 'aabbbb' },
        { id: 'in-x1', label: 'ab' },
        { id: 'in-x2', label: 'aabb' },
        { id: 'in-x3', label: 'aaabbb' },
      ],
      correctChoiceIds: ['in-1', 'in-2', 'in-3'],
      feedbackIfCorrect:
        'ε is k=0; abb is k=1 (two b’s); aabbbb is k=2 (four b’s).',
      feedbackIfWrong:
        'ab has only one b per a; aabb and aaabbb have wrong b-counts for their a-counts.',
    },
    examplesNotInLanguage: {
      prompt: 'Select every string **not** in L.',
      choices: [
        { id: 'out-1', label: 'ab' },
        { id: 'out-2', label: 'aabb' },
        { id: 'out-3', label: 'aaabbb' },
        { id: 'out-4', label: 'bbbaaa' },
        { id: 'out-x1', label: 'abb' },
        { id: 'out-x2', label: 'aabbbb' },
      ],
      correctChoiceIds: ['out-1', 'out-2', 'out-3', 'out-4'],
      feedbackIfCorrect:
        'Wrong ratio or wrong order; abb and aabbbb satisfy a^k b^{2k}.',
      feedbackIfWrong:
        'Keep strings that match k a’s and 2k b’s in order; drop the rest.',
    },
    condition: {
      prompt: 'What must the TM enforce?',
      options: [
        {
          id: 'c-a',
          label:
            'The input is a^i b^j with j = 2i (and i, j match one k in the definition).',
        },
        { id: 'c-b', label: 'Total length is a multiple of 3.' },
        { id: 'c-c', label: 'Every a has exactly one b immediately to its right.' },
        { id: 'c-d', label: 'The string has more b’s than a’s in any arrangement.' },
      ],
      correctOptionId: 'c-a',
      feedbackIfCorrect:
        'Structured blocks plus the **2-to-1** b-to-a relationship.',
      feedbackIfWrong:
        'The definition ties **block lengths**, not loose inequality.',
    },
    tmStrategy: {
      prompt: 'Which strategy aligns with typical solutions?',
      options: [
        {
          id: 's-a',
          label:
            'Outer rounds: erase one a and **two** b’s (or mark them) while preserving order, until all gone.',
        },
        { id: 's-b', label: 'Erase one a and one b per round only.' },
        { id: 's-c', label: 'Convert every a to bb in one sweep, then check a^k b^k.' },
        { id: 's-d', label: 'Reject if the string is not a palindrome.' },
      ],
      correctOptionId: 's-a',
      feedbackIfCorrect:
        'The ratio 2k b’s per k a’s shows up as **two b’s per a** in pairing algorithms.',
      feedbackIfWrong:
        'One b per a would test a^k b^k, not b^{2k}.',
    },
  },
  {
    id: 'ld-akbkak',
    title: 'Decode: a^k b^k a^k',
    description:
      '**EXAM 1 Q1** language (`materials/exam/exam.md`): triple-block, two equalities between blocks (`tm-patterns.md` **P10**).',
    category: 'language_decode',
    difficulty: 3,
    mode: 'language_decode',
    machineId: PLACEHOLDER_MACHINE,
    setup: PLACEHOLDER_SETUP,
    tags: ['LD', 'P10', 'exam'],
    hints: [{ hintId: 'LANG.PE.5' }, { hintId: 'LANG.STR.5' }],
    explanation:
      'The same k controls **all three** runs: first a-block, b-block, second a-block must all have length k. A TM usually matches first a’s to b’s, then b’s to second a’s (often with marks).',
    languageNotation: 'L = { a^k b^k a^k | k ≥ 0 }',
    alphabetNote: 'Three contiguous blocks in order: a, then b, then a.',
    plainEnglish: {
      prompt: 'Which description matches L?',
      options: [
        {
          id: 'pe-a',
          label:
            'Same k for three blocks: k a’s, then k b’s, then k a’s (k ≥ 0).',
        },
        {
          id: 'pe-b',
          label: 'Any string in a*b*a* (three blocks in order, lengths arbitrary).',
        },
        { id: 'pe-c', label: 'k a’s, then 2k b’s, then k a’s.' },
        { id: 'pe-d', label: 'Total number of a’s equals total number of b’s.' },
      ],
      correctOptionId: 'pe-a',
      feedbackIfCorrect:
        'One exponent ties **both** a-runs to the same b-run length.',
      feedbackIfWrong:
        'Shape a*b*a* alone does **not** force the two equalities k = k = k across blocks.',
    },
    examplesInLanguage: {
      prompt: 'Select every string **in** L.',
      choices: [
        { id: 'in-1', label: 'ε' },
        { id: 'in-2', label: 'aba' },
        { id: 'in-3', label: 'aabbaa' },
        { id: 'in-x1', label: 'aabb' },
        { id: 'in-x2', label: 'aaabbb' },
        { id: 'in-x3', label: 'ababa' },
      ],
      correctChoiceIds: ['in-1', 'in-2', 'in-3'],
      feedbackIfCorrect:
        'ε is k=0; aba is k=1; aabbaa is k=2 for each block.',
      feedbackIfWrong:
        'aabb lacks the third block; aaabbb has no trailing a’s; ababa interleaves.',
    },
    examplesNotInLanguage: {
      prompt: 'Select every string **not** in L.',
      choices: [
        { id: 'out-1', label: 'aabb' },
        { id: 'out-2', label: 'aaabbb' },
        { id: 'out-3', label: 'ababa' },
        { id: 'out-4', label: 'aaabbbbaa' },
        { id: 'out-x1', label: 'aba' },
        { id: 'out-x2', label: 'aabbaa' },
      ],
      correctChoiceIds: ['out-1', 'out-2', 'out-3', 'out-4'],
      feedbackIfCorrect:
        'These break the triple-block equal-length pattern.',
      feedbackIfWrong:
        'aba and aabbaa are in L; pick only strings that fail the pattern.',
    },
    condition: {
      prompt: 'What must a TM check (conceptually)?',
      options: [
        {
          id: 'c-a',
          label:
            'Two constraints: first a-run length = b-run length, and b-run length = second a-run length (same order).',
        },
        { id: 'c-b', label: 'Only that the string has the form a*b*.' },
        { id: 'c-c', label: 'That the string is a palindrome.' },
        { id: 'c-d', label: 'That #a = #b overall without block structure.' },
      ],
      correctOptionId: 'c-a',
      feedbackIfCorrect:
        'Two equalities of **block lengths**, not one global count.',
      feedbackIfWrong:
        'Order plus **two** length matches distinguish this from simpler languages.',
    },
    tmStrategy: {
      prompt: 'Pick the best **high-level** plan.',
      options: [
        {
          id: 's-a',
          label:
            'Match first a-block to b-block (pairing), then match remaining b’s to the final a-block—often multi-phase with marks.',
        },
        { id: 's-b', label: 'Single sweep: count a’s with a DFA, ignore b’s.' },
        { id: 's-c', label: 'Check only that #a = #b for the whole string.' },
        { id: 's-d', label: 'Guess k and verify with a counter in finite control only.' },
      ],
      correctOptionId: 's-a',
      feedbackIfCorrect:
        'Exam solutions usually **chain** two matching phases for the two equalities.',
      feedbackIfWrong:
        'Finite memory cannot store unbounded k without using the tape.',
    },
  },
  {
    id: 'ld-x-hash-xrev',
    title: 'Decode: x # x^R',
    description:
      'Separator # with left side equal to the **reverse** of the right side (Sipser / notation drills).',
    category: 'language_decode',
    difficulty: 3,
    mode: 'language_decode',
    machineId: PLACEHOLDER_MACHINE,
    setup: PLACEHOLDER_SETUP,
    tags: ['LD', 'separator', 'reverse'],
    hints: [{ hintId: 'LANG.PE.6' }, { hintId: 'LANG.STR.6' }],
    explanation:
      'If w = x and the right side must be x^R, the full string is x # x^R. The empty string on both sides gives #. TMs often walk from # outward or mark pairs.',
    languageNotation: 'L = { x # x^R | x ∈ {a,b}* }',
    alphabetNote: 'Tape alphabet includes a literal separator #.',
    plainEnglish: {
      prompt: 'What does L contain?',
      options: [
        {
          id: 'pe-a',
          label:
            'Strings with one #; left of # is some x, right of # is the reverse of x.',
        },
        { id: 'pe-b', label: 'Strings with one # where left and right halves are identical (x # x).' },
        { id: 'pe-c', label: 'All strings over {a,b,#} with exactly one #.' },
        { id: 'pe-d', label: 'Palindromes over {a,b} with no #.' },
      ],
      correctOptionId: 'pe-a',
      feedbackIfCorrect:
        'Right side is **mirror** of left, not copy; ε # ε is just #.',
      feedbackIfWrong:
        'x^R means reverse; do not confuse with xx or unrestricted # strings.',
    },
    examplesInLanguage: {
      prompt: 'Select every string **in** L.',
      choices: [
        { id: 'in-1', label: '#' },
        { id: 'in-2', label: 'a#a' },
        { id: 'in-3', label: 'ab#ba' },
        { id: 'in-4', label: 'aba#aba' },
        { id: 'in-5', label: 'aab#baa' },
        { id: 'in-x1', label: 'ab#ab' },
        { id: 'in-x2', label: 'a#aa' },
      ],
      correctChoiceIds: ['in-1', 'in-2', 'in-3', 'in-4', 'in-5'],
      feedbackIfCorrect:
        'Each right side is the reverse of the left; ab#ab and a#aa fail that test.',
      feedbackIfWrong:
        'Check reversal: (aab)^R = baa; (ab)^R = ba ≠ ab.',
    },
    examplesNotInLanguage: {
      prompt: 'Select every string **not** in L.',
      choices: [
        { id: 'out-1', label: 'ab#ab' },
        { id: 'out-2', label: 'a#aa' },
        { id: 'out-3', label: 'aa#ab' },
        { id: 'out-4', label: '##a' },
        { id: 'out-x1', label: '#' },
        { id: 'out-x2', label: 'ab#ba' },
      ],
      correctChoiceIds: ['out-1', 'out-2', 'out-3', 'out-4'],
      feedbackIfCorrect:
        'ab#ab and a#aa are not x#x^R; aa#ab fails reverse match; ##a misuses #.',
      feedbackIfWrong:
        'Reverse the left string: for ab#ba, (ab)^R = ba. Also ε#ε is #.',
    },
    condition: {
      prompt: 'What is the structural condition?',
      options: [
        {
          id: 'c-a',
          label:
            'Exactly one #; if x is left and y is right, y must equal x^R character-wise.',
        },
        { id: 'c-b', label: 'Left and right of # have the same length only.' },
        { id: 'c-c', label: 'The string is a palindrome including #.' },
        { id: 'c-d', label: 'Right side is a copy of the left (y = x).' },
      ],
      correctOptionId: 'c-a',
      feedbackIfCorrect:
        'Reverse equality is stricter than equal length alone.',
      feedbackIfWrong:
        'x # x is **not** the same as x # x^R unless x is a palindrome.',
    },
    tmStrategy: {
      prompt: 'Which construction idea fits best?',
      options: [
        {
          id: 's-a',
          label:
            'Work from # outward: compare symbols moving left from # on one side and right from # on the other (or mark pairs).',
        },
        { id: 's-b', label: 'Ignore # and test plain palindrome on {a,b}.' },
        { id: 's-c', label: 'Sort symbols left of #, then sort right of #.' },
        { id: 's-d', label: 'Count a’s on the left only.' },
      ],
      correctOptionId: 's-a',
      feedbackIfCorrect:
        'The # is the hinge for **mirrored** comparison.',
      feedbackIfWrong:
        'Plain palindrome does not encode “left vs reverse of right” around #.',
    },
  },
  {
    id: 'ld-more-a-than-b',
    title: 'Decode: strictly more a than b',
    description:
      '**EXAM 2 Q1** (`materials/exam/exam.md`); strict #a > #b — contrast with EXAM 2 Q3 “≥ half a” (`tm-patterns.md` **P13**).',
    category: 'language_decode',
    difficulty: 3,
    mode: 'language_decode',
    machineId: PLACEHOLDER_MACHINE,
    setup: PLACEHOLDER_SETUP,
    tags: ['LD', 'P13', 'counting'],
    hints: [{ hintId: 'LANG.PE.7' }, { hintId: 'LANG.STR.7' }],
    explanation:
      '#a(w) > #b(w) is a strict inequality on tallies. A TM can pair a’s with b’s (marks) and accept if an a remains unmatched; order is free.',
    languageNotation: 'L = { w ∈ {a,b}* | #a(w) > #b(w) }',
    alphabetNote: '#a(w) counts occurrences of the letter a in w.',
    plainEnglish: {
      prompt: 'Choose the correct meaning.',
      options: [
        {
          id: 'pe-a',
          label:
            'Every string where the number of a’s is **strictly greater** than the number of b’s (any order).',
        },
        { id: 'pe-b', label: 'Strings where every b is immediately preceded by an a.' },
        { id: 'pe-c', label: 'Strings of the form a^k b^k with k > 0.' },
        { id: 'pe-d', label: 'Strings with at least as many a’s as b’s (ties allowed).' },
      ],
      correctOptionId: 'pe-a',
      feedbackIfCorrect:
        'Strict inequality: ties (#a = #b) are **not** in L.',
      feedbackIfWrong:
        '“More than” excludes equal counts; order is unconstrained.',
    },
    examplesInLanguage: {
      prompt: 'Select every string **in** L.',
      choices: [
        { id: 'in-1', label: 'a' },
        { id: 'in-2', label: 'aa' },
        { id: 'in-3', label: 'aba' },
        { id: 'in-4', label: 'aab' },
        { id: 'in-x1', label: 'ab' },
        { id: 'in-x2', label: 'b' },
        { id: 'in-x3', label: 'abb' },
      ],
      correctChoiceIds: ['in-1', 'in-2', 'in-3', 'in-4'],
      feedbackIfCorrect:
        'aab has 2 a’s, 1 b; ab and abb tie or favor b; b has no excess a.',
      feedbackIfWrong:
        'ab has #a = #b; b has #a < #b; abb has more b than a.',
    },
    examplesNotInLanguage: {
      prompt: 'Select every string **not** in L.',
      choices: [
        { id: 'out-1', label: 'ε' },
        { id: 'out-2', label: 'ab' },
        { id: 'out-3', label: 'bb' },
        { id: 'out-4', label: 'abb' },
        { id: 'out-x1', label: 'aa' },
        { id: 'out-x2', label: 'aba' },
      ],
      correctChoiceIds: ['out-1', 'out-2', 'out-3', 'out-4'],
      feedbackIfCorrect:
        'ε and ab tie; bb and abb have too many b’s.',
      feedbackIfWrong:
        'aa and aba still have strictly more a’s than b’s.',
    },
    condition: {
      prompt: 'What must a decider verify?',
      options: [
        { id: 'c-a', label: 'After pairing each b with some a (conceptually), at least one a is left over.' },
        { id: 'c-b', label: 'The string is in a*b* with more a’s in the first block.' },
        { id: 'c-c', label: 'The first symbol is a.' },
        { id: 'c-d', label: 'The length of w is odd.' },
      ],
      correctOptionId: 'c-a',
      feedbackIfCorrect:
        'Global tally: strict dominance of a over b.',
      feedbackIfWrong:
        'Order is not fixed; only **counts** matter for this L.',
    },
    tmStrategy: {
      prompt: 'Pick a plausible one-tape approach.',
      options: [
        {
          id: 's-a',
          label:
            'Pair a’s and b’s with marks (or zig-zag), erase pairs, accept if an a remains when no unmatched b can pair.',
        },
        { id: 's-b', label: 'Use only finite states, never writing to the tape.' },
        { id: 's-c', label: 'Reject unless the string is a palindrome.' },
        { id: 's-d', label: 'Scan once and accept if the last symbol is a.' },
      ],
      correctOptionId: 's-a',
      feedbackIfCorrect:
        'The language is not regular; pairing / marking is the standard picture.',
      feedbackIfWrong:
        'Pure finite control cannot remember unbounded count differences.',
    },
  },
  {
    id: 'ld-zero-n-squared',
    title: 'Decode: 0^{n^2} (perfect-square length)',
    description:
      'Length must be a perfect square; only the symbol 0 appears. Harder TM / complexity intuition.',
    category: 'language_decode',
    difficulty: 4,
    mode: 'language_decode',
    machineId: PLACEHOLDER_MACHINE,
    setup: PLACEHOLDER_SETUP,
    tags: ['LD', 'complexity', 'length'],
    hints: [{ hintId: 'LANG.PE.8' }, { hintId: 'LANG.STR.8' }],
    explanation:
      '0^m means m zeros. Here m = n^2 for some n ≥ 0, so lengths 0,1,4,9,… TMs often simulate squaring with a second “ruler” of marks on the tape.',
    languageNotation: 'L = { 0^{n^2} | n ≥ 0 }',
    alphabetNote: 'Strings contain only 0; length |w| must be n² for some integer n ≥ 0.',
    plainEnglish: {
      prompt: 'What strings are in L?',
      options: [
        {
          id: 'pe-a',
          label:
            'Only strings of 0’s whose **length** is a perfect square (0, 1, 4, 9, …).',
        },
        { id: 'pe-b', label: 'All strings of 0’s of even length.' },
        { id: 'pe-c', label: 'Strings of 0’s whose length is a power of two.' },
        { id: 'pe-d', label: 'Strings with n zeros where n is prime.' },
      ],
      correctOptionId: 'pe-a',
      feedbackIfCorrect:
        'Exponent n^2 applies to **how many** zeros, not digit value.',
      feedbackIfWrong:
        '0^{n^2} is “n squared many zeros”, not parity or primes.',
    },
    examplesInLanguage: {
      prompt: 'Select every string **in** L.',
      choices: [
        { id: 'in-1', label: 'ε (length 0)' },
        { id: 'in-2', label: '0 (one zero)' },
        { id: 'in-3', label: '0000 (four zeros)' },
        {
          id: 'in-4',
          label: '000000000 (nine zeros)',
        },
        { id: 'in-x1', label: '00' },
        { id: 'in-x2', label: '000' },
        { id: 'in-x3', label: '00000' },
      ],
      correctChoiceIds: ['in-1', 'in-2', 'in-3', 'in-4'],
      feedbackIfCorrect:
        'Lengths 0,1,4,9 are squares; 2,3,5 are not.',
      feedbackIfWrong:
        'Count zeros only: 2,3,5 are not perfect squares.',
    },
    examplesNotInLanguage: {
      prompt: 'Select every string **not** in L.',
      choices: [
        { id: 'out-1', label: '00' },
        { id: 'out-2', label: '000' },
        { id: 'out-3', label: '00000' },
        { id: 'out-4', label: '010' },
        { id: 'out-x1', label: '0000' },
        { id: 'out-x2', label: 'ε' },
      ],
      correctChoiceIds: ['out-1', 'out-2', 'out-3', 'out-4'],
      feedbackIfCorrect:
        'Wrong length or wrong alphabet; 0000 and ε are in L.',
      feedbackIfWrong:
        '010 is not all zeros; ε is length 0 = 0².',
    },
    condition: {
      prompt: 'What defines membership?',
      options: [
        {
          id: 'c-a',
          label:
            'w ∈ 0* and |w| = n² for some integer n ≥ 0.',
        },
        { id: 'c-b', label: 'w has the same number of 0s as 1s.' },
        { id: 'c-c', label: '|w| is even.' },
        { id: 'c-d', label: 'w contains substring 00.' },
      ],
      correctOptionId: 'c-a',
      feedbackIfCorrect:
        'Two parts: alphabet {0} only, then **square length**.',
      feedbackIfWrong:
        'No 1s appear; the constraint is on **length**, not substrings alone.',
    },
    tmStrategy: {
      prompt: 'Which high-level idea matches exam constructions?',
      options: [
        {
          id: 's-a',
          label:
            'Use the tape to simulate growing a “square”: e.g. mark blocks whose size tracks n and n² until length matches or exceeds.',
        },
        { id: 's-b', label: 'Single pass: accept if the head sees an even number of cells.' },
        { id: 's-c', label: 'Pair zeros two-by-two only (decides even length).' },
        { id: 's-d', label: 'Guess n and verify in O(1) time with no tape use.' },
      ],
      correctOptionId: 's-a',
      feedbackIfCorrect:
        'Recognizing n² typically needs **iterated marking** or a squaring subroutine on one tape.',
      feedbackIfWrong:
        'Parity or pairing-by-two captures 2n, not n².',
    },
  },
  {
    id: 'ld-exam3-ak-b2k-plus-1',
    title: 'EXAM 3 Q1: decode a^k b^{2k+1}',
    description:
      'From course **EXAM 3**, TM problem: strings with k copies of `a` followed by 2k+1 copies of `b` (same k ≥ 0).',
    category: 'language_decode',
    difficulty: 3,
    mode: 'language_decode',
    machineId: PLACEHOLDER_MACHINE,
    setup: PLACEHOLDER_SETUP,
    tags: ['LD', 'exam:3-q1', 'P11', 'ratio'],
    hints: [{ hintId: 'LANG.PE.4' }, { hintId: 'LANG.EXAM3.1' }],
    explanation:
      'Compared with a^k b^{2k}, you still have only `a` then only `b`, but the b-block is **one symbol longer**: |b-run| = 2k+1. A TM often does the same “one a, two b’s” rounds as EXAM 1 Q3, then consumes one extra b (or adjusts the invariant). **Note:** k = 0 gives b^1 = `b` only — ε is **not** in this language.',
    languageNotation: 'L = { a^k b^{2k+1} | k ≥ 0 }',
    alphabetNote: 'One block of a’s, then one block of b’s; exponents share the same k.',
    plainEnglish: {
      prompt: 'Which reading matches the notation?',
      options: [
        {
          id: 'pe-a',
          label:
            'For some k ≥ 0: k a’s, then exactly 2k+1 b’s, and the string ends there.',
        },
        {
          id: 'pe-b',
          label: 'k a’s, then 2k b’s (even number of b’s for each k).',
        },
        {
          id: 'pe-c',
          label: 'Any string with more b’s than a’s in any order.',
        },
        { id: 'pe-d', label: 'k a’s, then k b’s, then k a’s again.' },
      ],
      correctOptionId: 'pe-a',
      feedbackIfCorrect:
        'The +1 in 2k+1 is the exam’s twist versus the pure 2k block.',
      feedbackIfWrong:
        'Match the template a^k b^{2k+1}: same k in both exponents.',
    },
    examplesInLanguage: {
      prompt: 'Select every string **in** L.',
      choices: [
        { id: 'in-1', label: 'b' },
        { id: 'in-2', label: 'abbb' },
        { id: 'in-3', label: 'aabbbbb' },
        { id: 'in-x1', label: 'ε' },
        { id: 'in-x2', label: 'ab' },
        { id: 'in-x3', label: 'abb' },
        { id: 'in-x4', label: 'aabbbb' },
      ],
      correctChoiceIds: ['in-1', 'in-2', 'in-3'],
      feedbackIfCorrect:
        'k=0 → one b; k=1 → abbb; k=2 → two a’s and five b’s.',
      feedbackIfWrong:
        'ε has no b for k=0; ab and abb have wrong b-counts for their a-counts; aabbbb has only four b’s (need five for k=2).',
    },
    examplesNotInLanguage: {
      prompt: 'Select every string **not** in L.',
      choices: [
        { id: 'out-1', label: 'ε' },
        { id: 'out-2', label: 'ab' },
        { id: 'out-3', label: 'abb' },
        { id: 'out-4', label: 'aabbbb' },
        { id: 'out-x1', label: 'b' },
        { id: 'out-x2', label: 'abbb' },
      ],
      correctChoiceIds: ['out-1', 'out-2', 'out-3', 'out-4'],
      feedbackIfCorrect:
        'These break the 2k+1 rule or the a-then-b block shape.',
      feedbackIfWrong:
        'b and abbb are in L for k=0 and k=1.',
    },
    condition: {
      prompt: 'What membership condition should a TM enforce (conceptually)?',
      options: [
        {
          id: 'c-a',
          label:
            'Input is a^i b^j with i, j ≥ 0, only a’s before b’s, and j = 2i + 1.',
        },
        { id: 'c-b', label: 'j = 2i (even b-block for the a-count).' },
        { id: 'c-c', label: '#b > #a but order is arbitrary.' },
        { id: 'c-d', label: 'The string is a palindrome.' },
      ],
      correctOptionId: 'c-a',
      feedbackIfCorrect:
        'Linear block shape plus the **odd** length 2i+1 on the right.',
      feedbackIfWrong:
        'The exam language is not “more b than a” in free order.',
    },
    tmStrategy: {
      prompt: 'Which plan matches EXAM-style ratio TMs?',
      options: [
        {
          id: 's-a',
          label:
            'Like a^k b^{2k}: repeatedly match one a with two b’s, then handle the **extra** b (or fold +1 into the invariant); return to start between rounds.',
        },
        {
          id: 's-b',
          label: 'Single sweep: count a’s with a DFA, ignore b’s.',
        },
        {
          id: 's-c',
          label: 'Check only that #a = #b.',
        },
        { id: 's-d', label: 'Sort the tape, then compare halves.' },
      ],
      correctOptionId: 's-a',
      feedbackIfCorrect:
        'Same family as EXAM 1 Q3’s algorithm sketch, adapted for 2k+1.',
      feedbackIfWrong:
        'You need a **global** count relation on blocks, not a regular-language scan.',
    },
  },
  {
    id: 'ld-exam2-at-least-half-a',
    title: 'EXAM 2 Q3: at least half the symbols are a',
    description:
      'From **EXAM 2** TM/runtime thread: language where `a` symbols are at least half of the string (ties allowed). Matches pattern **P14** in the curriculum map.',
    category: 'language_decode',
    difficulty: 3,
    mode: 'language_decode',
    machineId: PLACEHOLDER_MACHINE,
    setup: PLACEHOLDER_SETUP,
    tags: ['LD', 'exam:2-q3', 'P14', 'threshold'],
    hints: [{ hintId: 'LANG.EX.4' }, { hintId: 'LANG.EXAM2.HALF' }],
    explanation:
      'Let n = |w|. “At least half are a” means #a(w) ≥ #b(w) since only a and b appear. **Ties count** (e.g. `ab` has one of each). The exam’s mark-`*` / delete-non-`a` loop implements repeated pairing against a quota. Contrast **EXAM 2 Q1** strict “more a than b”, where `ab` would be **out**.',
    languageNotation: 'L = { w ∈ {a,b}* | #a(w) ≥ #b(w) }',
    alphabetNote: 'Counting symbols over {a,b}; #a + #b = |w|.',
    plainEnglish: {
      prompt: 'What does L mean in words?',
      options: [
        {
          id: 'pe-a',
          label:
            'Every string where the number of a’s is **greater than or equal to** the number of b’s.',
        },
        {
          id: 'pe-b',
          label: 'Every string where a’s **strictly outnumber** b’s (ties rejected).',
        },
        { id: 'pe-c', label: 'Strings in a*b* with at least one a.' },
        { id: 'pe-d', label: 'Strings whose **last** symbol is a.' },
      ],
      correctOptionId: 'pe-a',
      feedbackIfCorrect:
        '≥ allows #a = #b; that is exactly “at least half” when the alphabet is {a,b}.',
      feedbackIfWrong:
        'Re-read EXAM 2 Q3: threshold majority, not strict inequality.',
    },
    examplesInLanguage: {
      prompt: 'Select every string **in** L.',
      choices: [
        { id: 'in-1', label: 'ε' },
        { id: 'in-2', label: 'a' },
        { id: 'in-3', label: 'ab' },
        { id: 'in-4', label: 'aab' },
        { id: 'in-5', label: 'baa' },
        { id: 'in-x1', label: 'b' },
        { id: 'in-x2', label: 'abb' },
      ],
      correctChoiceIds: ['in-1', 'in-2', 'in-3', 'in-4', 'in-5'],
      feedbackIfCorrect:
        'ε: 0≥0; aab: 2≥1; baa: 2≥1; ab ties.',
      feedbackIfWrong:
        'b has 0 a’s, 1 b; abb has 1 a, 2 b’s — both fail #a ≥ #b.',
    },
    examplesNotInLanguage: {
      prompt: 'Select every string **not** in L.',
      choices: [
        { id: 'out-1', label: 'b' },
        { id: 'out-2', label: 'bb' },
        { id: 'out-3', label: 'abb' },
        { id: 'out-4', label: 'bab' },
        { id: 'out-x1', label: 'ab' },
        { id: 'out-x2', label: 'aab' },
      ],
      correctChoiceIds: ['out-1', 'out-2', 'out-3', 'out-4'],
      feedbackIfCorrect:
        'Each has strictly more b’s than a’s.',
      feedbackIfWrong:
        'ab ties; aab has two a’s and one b.',
    },
    condition: {
      prompt: 'What is the decision predicate?',
      options: [
        { id: 'c-a', label: '#a(w) ≥ #b(w).' },
        { id: 'c-b', label: '#a(w) > #b(w).' },
        { id: 'c-c', label: '|w| is even and the first half is all a’s.' },
        { id: 'c-d', label: 'w contains substring aa.' },
      ],
      correctOptionId: 'c-a',
      feedbackIfCorrect:
        'This is the algebraic form of “at least half a” over {a,b}.',
      feedbackIfWrong:
        'Strict > would exclude strings like `ab` that are in this L.',
    },
    tmStrategy: {
      prompt: 'Which idea matches the exam’s mark / delete description?',
      options: [
        {
          id: 's-a',
          label:
            'Repeated rounds: mark an `a` (e.g. as `*`), sweep back, delete a non-`a`, repeat — pairing each b against an a until the inequality is decided.',
        },
        { id: 's-b', label: 'Scan once; accept if the first symbol is a.' },
        { id: 's-c', label: 'Erase all b’s first, then count a’s modulo 2.' },
        { id: 's-d', label: 'Use finite states only; never write markers.' },
      ],
      correctOptionId: 's-a',
      feedbackIfCorrect:
        'This is the **P14** mark-and-sweep / quota picture from `tm-patterns.md`.',
      feedbackIfWrong:
        'The language is not regular; the exam expects tape marking and multiple passes.',
    },
  },
  {
    id: 'ld-sipser-ww',
    title: 'Sipser-style: the language { ww }',
    description:
      'Classic textbook language: concatenate the **same** string with itself. Often contrasted with palindromes and with { ww^R }.',
    category: 'language_decode',
    difficulty: 3,
    mode: 'language_decode',
    machineId: PLACEHOLDER_MACHINE,
    setup: PLACEHOLDER_SETUP,
    tags: ['LD', 'Sipser', 'ww', 'P4'],
    hints: [{ hintId: 'LANG.SIPSER.WW' }, { hintId: 'LANG.STR.3' }],
    explanation:
      'w ∈ {a,b}* means any length. **ε ∈ L** because εε = ε. Membership means |w| is even and the first half of the input (as a string) equals the second half. A TM typically finds the midpoint (e.g. mark a# in the middle in expanded alphabet) or compares symbols from the center outward with careful bookkeeping.',
    languageNotation: 'L = { ww | w ∈ {a,b}* }',
    alphabetNote: 'The same block w is written twice in a row; w may be ε.',
    plainEnglish: {
      prompt: 'Choose the correct interpretation.',
      options: [
        {
          id: 'pe-a',
          label:
            'Strings that can be split into **two equal-length halves** that are **identical** as strings (including ε = ε·ε).',
        },
        {
          id: 'pe-b',
          label: 'Strings that equal their reverse (palindromes).',
        },
        { id: 'pe-c', label: 'Strings of the form w followed by w^R.' },
        { id: 'pe-d', label: 'Strings with an even number of a’s only.' },
      ],
      correctOptionId: 'pe-a',
      feedbackIfCorrect:
        'ww means **copy**, not reverse; palindromes and ww^R are different languages.',
      feedbackIfWrong:
        'Read the notation literally: the **same** w twice.',
    },
    examplesInLanguage: {
      prompt: 'Select every string **in** L.',
      choices: [
        { id: 'in-1', label: 'ε' },
        { id: 'in-2', label: 'aa' },
        { id: 'in-3', label: 'abab' },
        { id: 'in-4', label: 'bbbb' },
        { id: 'in-x1', label: 'ab' },
        { id: 'in-x2', label: 'abba' },
        { id: 'in-x3', label: 'aaa' },
      ],
      correctChoiceIds: ['in-1', 'in-2', 'in-3', 'in-4'],
      feedbackIfCorrect:
        'ε is w=ε; aa is a·a; abab is ab·ab; bbbb is bb·bb.',
      feedbackIfWrong:
        'ab has odd length; abba halves ab vs ba; aaa has odd length.',
    },
    examplesNotInLanguage: {
      prompt: 'Select every string **not** in L.',
      choices: [
        { id: 'out-1', label: 'ab' },
        { id: 'out-2', label: 'aaa' },
        { id: 'out-3', label: 'abba' },
        { id: 'out-4', label: 'aabbaa' },
        { id: 'out-x1', label: 'aa' },
        { id: 'out-x2', label: 'abab' },
      ],
      correctChoiceIds: ['out-1', 'out-2', 'out-3', 'out-4'],
      feedbackIfCorrect:
        'Odd length cannot be ww; aabbaa splits as aab|baa.',
      feedbackIfWrong:
        'aa and abab are valid ww splittings.',
    },
    condition: {
      prompt: 'What must a decider check?',
      options: [
        {
          id: 'c-a',
          label:
            '|w| is even, and symbols w[0..n/2−1] equal w[n/2..n−1] where n = |w|.',
        },
        { id: 'c-b', label: 'w equals w^R.' },
        { id: 'c-c', label: '#a(w) = #b(w).' },
        { id: 'c-d', label: 'w starts with a.' },
      ],
      correctOptionId: 'c-a',
      feedbackIfCorrect:
        'Formal “first half equals second half” is the membership test.',
      feedbackIfWrong:
        'Palindrome is w = w^R, not two identical halves.',
    },
    tmStrategy: {
      prompt: 'Pick the most accurate high-level TM strategy.',
      options: [
        {
          id: 's-a',
          label:
            'Locate the midpoint of the input (e.g. mark or count on tape), then compare the two halves symbol by symbol (shuttle or erase matched pairs).',
        },
        { id: 's-b', label: 'Single left-to-right pass with 5 states.' },
        { id: 's-c', label: 'Check palindrome by comparing ends only.' },
        { id: 's-d', label: 'Guess w and verify without moving the head.' },
      ],
      correctOptionId: 's-a',
      feedbackIfCorrect:
        'Midpoint + compare is the standard Sipser-style picture for ww.',
      feedbackIfWrong:
        '{ ww } is not regular; comparing halves needs tape marking or crossing.',
    },
  },
  {
    id: 'ld-hw-binary-contains-001',
    title: 'Homework-style: binary strings containing 001',
    description:
      'Substring / sliding-window language over {0,1} — matches **P4** (match distant / carry state) in `tm-patterns.md` and homework-style traces in the exercise bank.',
    category: 'language_decode',
    difficulty: 2,
    mode: 'language_decode',
    machineId: PLACEHOLDER_MACHINE,
    setup: PLACEHOLDER_SETUP,
    tags: ['LD', 'P4', 'substring', 'HW'],
    hints: [{ hintId: 'LANG.HW.001' }, { hintId: 'SUBSTR.1' }],
    explanation:
      '“Contains 001” means **three consecutive** symbols read 0, 0, 1 somewhere. This language is **regular** (a small DFA tracks how much of the pattern 001 you have seen as a suffix). A TM can simulate that DFA in one pass — no unbounded counting of unrelated symbols.',
    languageNotation:
      'L = { w ∈ {0,1}* | w contains the substring 001 }',
    alphabetNote: 'Substring = contiguous block inside w.',
    plainEnglish: {
      prompt: 'What does this language contain?',
      options: [
        {
          id: 'pe-a',
          label:
            'All binary strings where **somewhere** the symbols 0, 0, 1 appear **next to each other** in that order.',
        },
        {
          id: 'pe-b',
          label: 'Strings with exactly three symbols, namely 001.',
        },
        {
          id: 'pe-c',
          label: 'Strings with at least three 0’s and at least one 1 total.',
        },
        { id: 'pe-d', label: 'Strings ending in 001 only.' },
      ],
      correctOptionId: 'pe-a',
      feedbackIfCorrect:
        'Any position of the triple counts; length can be large.',
      feedbackIfWrong:
        '“Contains” means **substring**, not “equals” or “ends with”.',
    },
    examplesInLanguage: {
      prompt: 'Select every string **in** L.',
      choices: [
        { id: 'in-1', label: '001' },
        { id: 'in-2', label: '1001' },
        { id: 'in-3', label: '1100101' },
        { id: 'in-x1', label: '0' },
        { id: 'in-x2', label: '010' },
        { id: 'in-x3', label: '101' },
      ],
      correctChoiceIds: ['in-1', 'in-2', 'in-3'],
      feedbackIfCorrect:
        'Each has a 0,0,1 run; 010 has 0,1,0 — no 001 chunk.',
      feedbackIfWrong:
        'Single 0 or 101 never form consecutive 0-0-1.',
    },
    examplesNotInLanguage: {
      prompt: 'Select every string **not** in L.',
      choices: [
        { id: 'out-1', label: 'ε' },
        { id: 'out-2', label: '010' },
        { id: 'out-3', label: '101' },
        { id: 'out-4', label: '0110' },
        { id: 'out-x1', label: '001' },
        { id: 'out-x2', label: '1001' },
      ],
      correctChoiceIds: ['out-1', 'out-2', 'out-3', 'out-4'],
      feedbackIfCorrect:
        'No substring 001: 0110 is 0,1,1,0 — never two 0’s then 1 adjacent.',
      feedbackIfWrong:
        '001 and 1001 clearly contain 001.',
    },
    condition: {
      prompt: 'What is the membership condition?',
      options: [
        {
          id: 'c-a',
          label:
            'There exist indices i such that w[i]=0, w[i+1]=0, w[i+2]=1.',
        },
        { id: 'c-b', label: 'The string has more 0’s than 1’s.' },
        { id: 'c-c', label: 'The string is in 0*1*.' },
        { id: 'c-d', label: 'The last two symbols are 0 and 1.' },
      ],
      correctOptionId: 'c-a',
      feedbackIfCorrect:
        'Pure local pattern check along the string.',
      feedbackIfWrong:
        'Global counts or block shape are the wrong test.',
    },
    tmStrategy: {
      prompt: 'Which TM-level approach fits best?',
      options: [
        {
          id: 's-a',
          label:
            'One left-to-right pass simulating a **finite automaton** (states = how much of the 001 prefix you have just seen).',
        },
        {
          id: 's-b',
          label: 'Mark-and-match every 0 with a 1 until counts balance.',
        },
        { id: 's-c', label: 'Sort the tape, then scan.' },
        { id: 's-d', label: 'Find the midpoint, compare halves.' },
      ],
      correctOptionId: 's-a',
      feedbackIfCorrect:
        'Substring languages of fixed pattern are regular — DFA simulation on one tape.',
      feedbackIfWrong:
        'No need for global pairing: the pattern has **fixed length**.',
    },
  },
  {
    id: 'ld-course-bk-ak-vs-ak-bk',
    title: 'Course contrast: b^k a^k vs a^k b^k',
    description:
      'Order of blocks matters: both languages pair counts, but **which symbol comes first** changes membership. Typical exam trick when reading set notation.',
    category: 'language_decode',
    difficulty: 2,
    mode: 'language_decode',
    machineId: PLACEHOLDER_MACHINE,
    setup: PLACEHOLDER_SETUP,
    tags: ['LD', 'P6', 'contrast', 'exam'],
    hints: [{ hintId: 'LANG.CONTRAST.BKA' }, { hintId: 'LANG.STR.2' }],
    explanation:
      'L₁ = { a^k b^k } has all a’s before all b’s. L₂ = { b^k a^k } has all b’s before all a’s. **Same k** in each definition, but `ab` ∈ L₁ while `ba` ∈ L₂. A TM for one order does not accept the other without a different phase structure.',
    languageNotation: 'L = { b^k a^k | k ≥ 0 }',
    alphabetNote: 'Contrast with { a^k b^k | k ≥ 0 } from homework / Sipser a^n b^n.',
    plainEnglish: {
      prompt: 'What does **this** L mean (not a^k b^k)?',
      options: [
        {
          id: 'pe-a',
          label:
            'Some k ≥ 0: first k symbols are b’s, then k symbols are a’s, and the string ends.',
        },
        {
          id: 'pe-b',
          label: 'Same as a^k b^k — order of blocks does not matter.',
        },
        { id: 'pe-c', label: 'k b’s scattered among k a’s in any order.' },
        { id: 'pe-d', label: 'Strings with more b’s than a’s.' },
      ],
      correctOptionId: 'pe-a',
      feedbackIfCorrect:
        'The template b^k a^k **fixes b’s on the left**.',
      feedbackIfWrong:
        'Set notation is sensitive to the order written in the exponent template.',
    },
    examplesInLanguage: {
      prompt: 'Select every string **in** L.',
      choices: [
        { id: 'in-1', label: 'ε' },
        { id: 'in-2', label: 'ba' },
        { id: 'in-3', label: 'bbaa' },
        { id: 'in-4', label: 'bbbaaa' },
        { id: 'in-x1', label: 'ab' },
        { id: 'in-x2', label: 'aabb' },
        { id: 'in-x3', label: 'bba' },
      ],
      correctChoiceIds: ['in-1', 'in-2', 'in-3', 'in-4'],
      feedbackIfCorrect:
        'ε is k=0; ba, bbaa, bbbaaa are b-block then matching a-block.',
      feedbackIfWrong:
        'ab and aabb are a^k b^k shapes; bba has unequal block lengths.',
    },
    examplesNotInLanguage: {
      prompt: 'Select every string **not** in L.',
      choices: [
        { id: 'out-1', label: 'ab' },
        { id: 'out-2', label: 'aabb' },
        { id: 'out-3', label: 'bba' },
        { id: 'out-4', label: 'abab' },
        { id: 'out-x1', label: 'ba' },
        { id: 'out-x2', label: 'bbaa' },
      ],
      correctChoiceIds: ['out-1', 'out-2', 'out-3', 'out-4'],
      feedbackIfCorrect:
        'ab/aabb start with a; bba wrong counts; abab interleaves.',
      feedbackIfWrong:
        'ba and bbaa match b^k a^k.',
    },
    condition: {
      prompt: 'What defines membership?',
      options: [
        {
          id: 'c-a',
          label:
            'w = b^i a^j for some i, j ≥ 0 with i = j (b-run then a-run, same length).',
        },
        { id: 'c-b', label: 'w = a^i b^j with i = j.' },
        { id: 'c-c', label: '#a(w) = #b(w) in any order.' },
        { id: 'c-d', label: 'w contains substring ba exactly once.' },
      ],
      correctOptionId: 'c-a',
      feedbackIfCorrect:
        'Both **order** (b before a) and **equal exponent** matter.',
      feedbackIfWrong:
        'Equal counts alone would include `ab`, which is not b^k a^k.',
    },
    tmStrategy: {
      prompt: 'Relative to a^k b^k TMs, what changes?',
      options: [
        {
          id: 's-a',
          label:
            'Same pairing/mark idea, but phases target the **b-block first** then the a-block (mirror the construction or swap roles in the invariant).',
        },
        { id: 's-b', label: 'No change — the same program accepts both languages.' },
        { id: 's-c', label: 'Only a DFA is needed because order does not matter.' },
        { id: 's-d', label: 'Sort symbols to b…a, then run the a^k b^k TM unchanged.' },
      ],
      correctOptionId: 's-a',
      feedbackIfCorrect:
        'Block **order** in the definition drives sweep direction and pairing endpoints.',
      feedbackIfWrong:
        'The languages are different; δ must respect which side is b’s vs a’s.',
    },
  },
];
