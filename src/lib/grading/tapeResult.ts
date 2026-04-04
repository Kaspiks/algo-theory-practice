import { peekNextAnswer, step } from '@/lib/tm/engine';
import { tapeAfterWriteOnly } from '@/lib/tm/stepAnimation';
import { ensureHeadInBounds } from '@/lib/tm/tape';
import type {
  TapeResultMcqOption,
  TapeResultOption,
  TMConfiguration,
  TransitionFired,
  TuringMachineDefinition,
} from '@/types/tm';
import {
  projectTapeResultOptionsToMcq,
  tapeResultOptionToConfiguration,
} from '@/types/tm';

function displayBlank(machine: TuringMachineDefinition, s: string): string {
  if (s !== machine.blank) return s;
  switch (machine.blankDisplay) {
    case 'underscore':
      return '_';
    case 'B':
      return 'B';
    case 'cup':
    default:
      return '⊔';
  }
}

export function cloneTape(t: TMConfiguration['tape']): TMConfiguration['tape'] {
  return { cells: [...t.cells], headIndex: t.headIndex };
}

export function cloneConfiguration(c: TMConfiguration): TMConfiguration {
  return { state: c.state, tape: cloneTape(c.tape) };
}

/** Stable key for comparing full configurations (tape + head + state). */
export function tapeConfigurationKey(
  machine: TuringMachineDefinition,
  c: TMConfiguration
): string {
  const t = ensureHeadInBounds(c.tape, machine.blank);
  return JSON.stringify({ s: c.state, h: t.headIndex, cells: t.cells });
}

/**
 * True iff same state, head index, and tape symbols (after head bounds normalization).
 */
export function configurationsEqual(
  machine: TuringMachineDefinition,
  a: TMConfiguration,
  b: TMConfiguration
): boolean {
  if (a.state !== b.state) return false;
  const ta = ensureHeadInBounds(a.tape, machine.blank);
  const tb = ensureHeadInBounds(b.tape, machine.blank);
  if (ta.headIndex !== tb.headIndex) return false;
  if (ta.cells.length !== tb.cells.length) return false;
  return ta.cells.every((sym, i) => sym === tb.cells[i]);
}

function shuffle<T>(arr: T[], rng: () => number = Math.random): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

export interface BuiltTapeResultMcq {
  options: TapeResultMcqOption[];
  correctOptionId: string;
  expected: TMConfiguration;
  fired: TransitionFired;
}

/**
 * Build MCQ options: correct next configuration plus plausible wrong tapes/heads/states.
 */
export function buildTapeResultMcq(
  machine: TuringMachineDefinition,
  config: TMConfiguration,
  opts?: { rng?: () => number }
): BuiltTapeResultMcq | null {
  if (peekNextAnswer(machine, config) === null) return null;

  const result = step(machine, config);
  const { next, fired } = result;
  if (!fired) return null;

  const rng = opts?.rng ?? Math.random;
  const correctId = 'tr-correct';
  const seen = new Set<string>();
  const bucket: TapeResultMcqOption[] = [];

  const tryAdd = (o: TapeResultMcqOption): boolean => {
    const k = tapeConfigurationKey(machine, o.resultingConfig);
    if (seen.has(k)) return false;
    seen.add(k);
    bucket.push(o);
    return true;
  };

  tryAdd({
    id: correctId,
    label: 'Correct one-step result',
    resultingConfig: cloneConfiguration(next),
  });

  const tb = ensureHeadInBounds(config.tape, machine.blank);
  const hi = tb.headIndex;
  const read = fired.read;

  for (const s of machine.states) {
    if (s === next.state) continue;
    if (
      tryAdd({
        id: `tr-ws-${s}`,
        label: `Wrong next state (${s})`,
        resultingConfig: {
          state: s,
          tape: cloneTape(next.tape),
        },
      }) &&
      bucket.length >= 5
    ) {
      break;
    }
  }

  const afterWrite = tapeAfterWriteOnly(machine, config, fired);
  tryAdd({
    id: 'tr-head-after-write-only',
    label: 'Tape updated but head not moved',
    resultingConfig: {
      state: next.state,
      tape: ensureHeadInBounds(afterWrite, machine.blank),
    },
  });

  const wrongWriteTape = cloneTape(next.tape);
  if (hi >= 0 && hi < wrongWriteTape.cells.length) {
    wrongWriteTape.cells[hi] = read;
    tryAdd({
      id: 'tr-wrong-symbol-written',
      label: 'Wrong symbol on tape (re-read instead of write)',
      resultingConfig: {
        state: next.state,
        tape: ensureHeadInBounds(wrongWriteTape, machine.blank),
      },
    });
  }

  if (fired.move === 'R') {
    if (hi > 0) {
      tryAdd({
        id: 'tr-move-L-instead-of-R',
        label: 'Moved left instead of right',
        resultingConfig: {
          state: next.state,
          tape: ensureHeadInBounds(
            { cells: [...next.tape.cells], headIndex: hi - 1 },
            machine.blank
          ),
        },
      });
    }
    if (next.tape.headIndex + 1 < next.tape.cells.length) {
      tryAdd({
        id: 'tr-extra-R',
        label: 'Head moved one cell too far right',
        resultingConfig: {
          state: next.state,
          tape: ensureHeadInBounds(
            {
              cells: [...next.tape.cells],
              headIndex: next.tape.headIndex + 1,
            },
            machine.blank
          ),
        },
      });
    }
  }

  if (fired.move === 'L' && hi > 0) {
    tryAdd({
      id: 'tr-stay-instead-of-L',
      label: 'Head stayed instead of moving left',
      resultingConfig: {
        state: next.state,
        tape: ensureHeadInBounds(
          { cells: [...next.tape.cells], headIndex: hi },
          machine.blank
        ),
      },
    });
  }

  if (fired.move === 'S' && hi + 1 < next.tape.cells.length) {
    tryAdd({
      id: 'tr-R-instead-of-S',
      label: 'Head moved right though rule was stay',
      resultingConfig: {
        state: next.state,
        tape: ensureHeadInBounds(
          { cells: [...next.tape.cells], headIndex: hi + 1 },
          machine.blank
        ),
      },
    });
  }

  const options = shuffle(bucket, rng);
  return { options, correctOptionId: correctId, expected: cloneConfiguration(next), fired };
}

/**
 * Tape-result MCQ from authored {@link TapeResultOption}s (step 0). Option order is preserved.
 * Returns `null` if the marked correct option does not match `step()` from `config`.
 */
export function buildTapeResultMcqFromAuthor(
  machine: TuringMachineDefinition,
  config: TMConfiguration,
  authored: { options: TapeResultOption[]; correctOptionId: string }
): BuiltTapeResultMcq | null {
  if (peekNextAnswer(machine, config) === null) return null;
  const { next, fired } = step(machine, config);
  if (!fired) return null;

  if (!authored.options.some((o) => o.id === authored.correctOptionId)) {
    return null;
  }

  const seenAuthored = new Set<string>();
  for (const o of authored.options) {
    const k = tapeConfigurationKey(
      machine,
      tapeResultOptionToConfiguration(o)
    );
    if (seenAuthored.has(k)) return null;
    seenAuthored.add(k);
  }

  const options = projectTapeResultOptionsToMcq(authored.options);
  const correctOpt = options.find((o) => o.id === authored.correctOptionId);
  if (
    !correctOpt ||
    !configurationsEqual(machine, correctOpt.resultingConfig, next)
  ) {
    return null;
  }

  return {
    options,
    correctOptionId: authored.correctOptionId,
    expected: cloneConfiguration(next),
    fired,
  };
}

/**
 * MCQ for the current tape-result step (matches player UI: authored at step 0 when valid, else dynamic).
 */
export function buildTapeResultMcqForState(
  machine: TuringMachineDefinition,
  config: TMConfiguration,
  stepCount: number,
  authored: { options: TapeResultOption[]; correctOptionId: string } | null
): BuiltTapeResultMcq | null {
  if (peekNextAnswer(machine, config) === null) return null;
  if (
    stepCount === 0 &&
    authored?.options?.length &&
    authored.correctOptionId
  ) {
    const fromAuthor = buildTapeResultMcqFromAuthor(machine, config, authored);
    if (fromAuthor) return fromAuthor;
  }
  return buildTapeResultMcq(machine, config);
}

/**
 * Find the option whose full configuration equals the engine’s `next` (state, tape, head).
 */
export function findMatchingTapeResultOptionId(
  machine: TuringMachineDefinition,
  options: TapeResultMcqOption[],
  nextConfig: TMConfiguration
): string | null {
  const matches = options.filter((o) =>
    configurationsEqual(machine, o.resultingConfig, nextConfig)
  );
  if (matches.length === 0) return null;
  if (matches.length > 1) {
    console.warn(
      '[tape-result] Multiple MCQ options match the engine next configuration; highlighting the first.'
    );
  }
  return matches[0]!.id;
}

export function gradeTapeResult(
  machine: TuringMachineDefinition,
  config: TMConfiguration,
  chosen: TMConfiguration | undefined
): {
  correct: boolean;
  expected: TMConfiguration;
  fired: TransitionFired | undefined;
} {
  const { next, fired } = step(machine, config);
  if (!chosen || !fired) {
    return { correct: false, expected: next, fired };
  }
  return {
    correct: configurationsEqual(machine, chosen, next),
    expected: next,
    fired,
  };
}

export function summarizeFiredTransition(
  machine: TuringMachineDefinition,
  fired: TransitionFired
): string {
  const r = displayBlank(machine, fired.read);
  const w = displayBlank(machine, fired.write);
  return `The machine reads ${JSON.stringify(r)}, writes ${JSON.stringify(w)}, moves ${fired.move}, and enters ${fired.to}.`;
}

export function buildTapeResultWrongMessage(
  machine: TuringMachineDefinition,
  fired: TransitionFired,
  chosen: TMConfiguration | undefined
): string {
  const core = summarizeFiredTransition(machine, fired);
  if (!chosen) {
    return `Not quite. ${core}`;
  }
  return `Not quite. ${core} Your choice does not match that outcome (check state, tape contents, and head index).`;
}
