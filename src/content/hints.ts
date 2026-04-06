/** Curriculum-aligned hint ids → text (see curriculum/hints-and-feedback.md). */
export const HINT_TEXT: Record<string, string> = {
  'NT.1': 'What symbol is under the head right now?',
  'NT.2': 'From this state, which transitions are defined for that symbol?',
  'NT.3':
    'Apply one step in order: write under the head, move, then update the state.',
  'NT.4': 'Check that both the current state and the symbol read match the transition you chose.',
  'BASICS.1':
    'For “only 1s”, while you read 1 you should stay in the scanning state and move right.',
  'REJECT.1':
    'A “bad” symbol is one that cannot appear in any string of the language—what happens when δ sees it?',
  'SCAN.1':
    'You are sweeping to find the first blank after the input block—do you change 0 or 1 on the way?',
  'ENDS.1':
    'To know the last symbol, first reach the blank past the end, then move one step left.',
  'SUBSTR.1':
    'Track how much of the pattern 0–0–1 you have matched so far as you scan once left-to-right.',
  'RETURN.1':
    'After the rightward scan hits the blank, each move left should stay on 0/1 until you see the sentinel.',
  'MARK.1':
    'Marking usually means replacing a symbol with a tape letter that is not in the original input.',
  'TR.1':
    'Simulate without skipping steps until you reach the halt condition in the prompt.',
  'TR.3':
    'Run the machine until it halts, then decide accept vs reject from the halt state.',
  'TR.4':
    'After one step: state, head index, and every tape cell must match δ exactly.',
  'TRA.2':
    'Trace one δ at a time; the scan-right routine does not change 0 or 1 until the blank.',
  'EX.7':
    'Marking introduces a new tape symbol; the first nontrivial step rewrites one cell.',
  'ST.2':
    'Match the high-level phases of the algorithm to the language’s defining equalities.',
  'ST.4':
    'If the language is not regular, finite state alone cannot decide membership.',
  'EX.1':
    'For block languages, check how many separate count comparisons you need.',
  'EX.2':
    'Each outer sweep often deletes a fixed pattern from each block.',
  'EX.3':
    'Compare exponent constraints: 2k vs 2k+1 changes parity of the b-block.',
  'EX.4':
    'Strict inequality vs “at least half” differ on ties and exact halves.',
  'EX.9':
    'Total time is roughly (number of rounds) × (work per round).',
  'EX.10':
    'k ≥ 0 allows k = 0: each block can be empty.',
  'MT.2':
    'Marked cells are already processed; δ usually skips them without changing the phase.',
  'LANG.PE.1':
    'Locate the part after “|” — it names the **property** of w (here: last symbol).',
  'LANG.EX.1':
    'Test candidates by checking the **definition** one string at a time, not by pattern guessing.',
  'LANG.STR.1':
    'For “ends with 1”, ε has no last symbol; any non-empty string ending in 0 is out.',
  'LANG.PE.2':
    'a^k b^k ties **one** exponent to **two** blocks in fixed order.',
  'LANG.STR.2':
    'Interleaving (aba) or wrong counts (aab) break the template.',
  'LANG.PE.3':
    'w^R reverses symbols; compare w to w^R, not to a second copy of w.',
  'LANG.STR.3':
    'Reverse the string mentally: if the result differs, it is not a palindrome.',
  'LANG.PE.4':
    'b^{2k} means **twice** as many b’s as a’s in the block picture.',
  'LANG.STR.4':
    'Count a’s and b’s separately; check j = 2i with a’s before b’s.',
  'LANG.PE.5':
    'The **same** k labels all three blocks: a-run, b-run, second a-run.',
  'LANG.STR.5':
    'Missing the third block or unequal k’s across blocks puts the string outside L.',
  'LANG.PE.6':
    'x^R is mirror, not copy: right side must spell the left backwards.',
  'LANG.STR.6':
    'Split on the single #; compare left string to reverse of right string.',
  'LANG.PE.7':
    'Strict “more a than b” rejects ties (#a = #b).',
  'LANG.STR.7':
    'Count symbols globally; order of a and b does not matter for this L.',
  'LANG.PE.8':
    '0^{n^2} is “n squared many zeros”; length must be 0,1,4,9,…',
  'LANG.STR.8':
    'Reject any 1 or wrong length of zeros; count only 0’s for length.',
  'LANG.EXAM3.1':
    'Compare to a^k b^{2k}: the odd exponent 2k+1 adds **one** extra b in the right block for each k.',
  'LANG.EXAM2.HALF':
    '“At least half are a” means #a ≥ #b, so **ties** are allowed (unlike strict “more a than b”).',
  'LANG.SIPSER.WW':
    'ww means the **same** block twice; length is even and the first |w|/2 symbols copy the second half.',
  'LANG.HW.001':
    'Substring 001 means three **consecutive** cells read 0,0,1 — a small DFA memory suffices.',
  'LANG.CONTRAST.BKA':
    'b^k a^k fixes b’s **before** a’s; do not swap with a^k b^k mentally.',
};
