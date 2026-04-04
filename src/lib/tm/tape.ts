import type { TapeModel, TapeSymbol, TuringMachineDefinition } from '@/types/tm';

/** Ensure headIndex is within cells; extend with blanks to the right as needed. */
export function ensureHeadInBounds(
  tape: TapeModel,
  blank: TapeSymbol
): TapeModel {
  const cells = [...tape.cells];
  let { headIndex } = tape;
  while (headIndex >= cells.length) {
    cells.push(blank);
  }
  return { cells, headIndex };
}

export function readSymbol(machine: TuringMachineDefinition, tape: TapeModel): TapeSymbol {
  const t = ensureHeadInBounds(tape, machine.blank);
  return t.cells[t.headIndex] ?? machine.blank;
}

export function tapeFromInput(
  machine: TuringMachineDefinition,
  input: string
): TapeSymbol[] {
  const chars = [...input];
  for (const c of chars) {
    if (!machine.inputAlphabet.includes(c)) {
      throw new Error(`Input symbol "${c}" not in input alphabet`);
    }
  }
  return chars;
}
