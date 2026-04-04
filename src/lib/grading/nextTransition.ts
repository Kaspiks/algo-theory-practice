import {
  answersEqual,
  peekNextAnswer,
} from '@/lib/tm/engine';
import type {
  TMConfiguration,
  TransitionAnswer,
  TransitionMcqOption,
  TuringMachineDefinition,
} from '@/types/tm';

export function formatTransitionLabel(a: TransitionAnswer): string {
  return `δ = (${a.nextState}, write ${JSON.stringify(a.write)}, ${a.move})`;
}

function answerKey(a: TransitionAnswer): string {
  return `${a.nextState}\0${a.write}\0${a.move}`;
}

/** Unique transition triples so MCQ distractors are not duplicated. */
function collectAllAnswers(machine: TuringMachineDefinition): TransitionAnswer[] {
  const seen = new Set<string>();
  const out: TransitionAnswer[] = [];
  for (const [, row] of Object.entries(machine.transitions)) {
    if (!row) continue;
    for (const rule of Object.values(row)) {
      if (!rule) continue;
      const a: TransitionAnswer = {
        nextState: rule.next,
        write: rule.write,
        move: rule.move,
      };
      const k = answerKey(a);
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(a);
    }
  }
  return out;
}

function shuffle<T>(arr: T[], rng: () => number = Math.random): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export interface BuiltMcq {
  options: TransitionMcqOption[];
  correctOptionId: string;
  expected: TransitionAnswer;
}

/**
 * Build multiple-choice options for the next transition from the current configuration.
 */
export function buildNextTransitionMcq(
  machine: TuringMachineDefinition,
  config: TMConfiguration,
  opts?: { wrongCount?: number; rng?: () => number }
): BuiltMcq | null {
  const expected = peekNextAnswer(machine, config);
  if (!expected) return null;

  const wrongCount = opts?.wrongCount ?? 3;
  const rng = opts?.rng ?? Math.random;

  const pool = collectAllAnswers(machine).filter((a) => !answersEqual(a, expected));
  const wrongPicked = shuffle(pool, rng).slice(0, wrongCount);

  const correctId = 'opt-correct';
  const correct: TransitionMcqOption = {
    id: correctId,
    label: formatTransitionLabel(expected),
    answer: expected,
  };

  const wrongOptions: TransitionMcqOption[] = wrongPicked.map((a, i) => ({
    id: `opt-wrong-${i}`,
    label: formatTransitionLabel(a),
    answer: a,
  }));

  const options = shuffle([correct, ...wrongOptions], rng);
  return { options, correctOptionId: correctId, expected };
}

export function gradeNextTransition(
  machine: TuringMachineDefinition,
  config: TMConfiguration,
  chosen: TransitionAnswer
): { correct: boolean; expected: TransitionAnswer | null } {
  const expected = peekNextAnswer(machine, config);
  if (!expected) {
    return { correct: false, expected: null };
  }
  return { correct: answersEqual(chosen, expected), expected };
}
