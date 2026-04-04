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
};
