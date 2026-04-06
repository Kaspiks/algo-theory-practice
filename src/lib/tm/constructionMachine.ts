import type { HeadMove, TuringMachineDefinition } from '@/types/tm';

const DEFAULT_BLANK = '⊔';

export interface ConstructionTransitionRow {
  from: string;
  read: string;
  to: string;
  write: string;
  move: HeadMove;
}

export interface ConstructionMachineInput {
  id: string;
  name?: string;
  stateIds: string[];
  start: string;
  accept: string;
  reject: string;
  transitions: ConstructionTransitionRow[];
  inputAlphabet: string[];
  blank?: string;
  maxSteps?: number;
}

/**
 * Build a {@link TuringMachineDefinition} from editor data.
 * Returns errors instead of throwing so the UI can show validation messages.
 */
export function buildMachineFromConstruction(
  input: ConstructionMachineInput
):
  | { ok: true; machine: TuringMachineDefinition }
  | { ok: false; errors: string[] } {
  const errors: string[] = [];
  const blank = input.blank ?? DEFAULT_BLANK;

  const stateSet = new Set(input.stateIds);
  if (stateSet.size === 0) {
    errors.push('Add at least one state.');
  }
  for (const s of [input.start, input.accept, input.reject]) {
    if (!stateSet.has(s)) {
      errors.push(`State "${s}" is not on the canvas (start / accept / reject).`);
    }
  }
  if (input.start === input.accept) {
    errors.push('Start state cannot be the same as the accept state.');
  }
  if (input.start === input.reject) {
    errors.push('Start state cannot be the same as the reject state.');
  }

  const pairSeen = new Set<string>();
  for (const row of input.transitions) {
    if (!stateSet.has(row.from)) {
      errors.push(`Transition from unknown state "${row.from}".`);
    }
    if (!stateSet.has(row.to)) {
      errors.push(`Transition to unknown state "${row.to}".`);
    }
    if (row.read.length !== 1) {
      errors.push(`Read symbol must be exactly one character (got "${row.read}").`);
    }
    if (row.write.length !== 1) {
      errors.push(`Write symbol must be exactly one character (got "${row.write}").`);
    }
    const key = `${row.from}\0${row.read}`;
    if (pairSeen.has(key)) {
      errors.push(
        `Duplicate transition: state "${row.from}" already has an edge for reading "${row.read}".`
      );
    }
    pairSeen.add(key);
  }

  for (const sym of input.inputAlphabet) {
    if (sym.length !== 1) {
      errors.push(`Input alphabet symbols must be single characters (got "${sym}").`);
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors: [...new Set(errors)] };
  }

  const tapeSyms = new Set<string>([...input.inputAlphabet, blank]);
  for (const row of input.transitions) {
    tapeSyms.add(row.read);
    tapeSyms.add(row.write);
  }

  const transitions: TuringMachineDefinition['transitions'] = {};
  for (const id of input.stateIds) {
    transitions[id] = {};
  }
  for (const row of input.transitions) {
    transitions[row.from]![row.read] = {
      next: row.to,
      write: row.write,
      move: row.move,
    };
  }

  const machine: TuringMachineDefinition = {
    id: input.id,
    name: input.name ?? 'User TM',
    states: [...input.stateIds],
    inputAlphabet: [...input.inputAlphabet],
    tapeAlphabet: [...tapeSyms],
    transitions,
    start: input.start,
    accept: input.accept,
    reject: input.reject,
    blank,
    policies: { leftEnd: 'reject', undefinedTransition: 'reject' },
    maxSteps: input.maxSteps ?? 500,
    blankDisplay: 'cup',
  };

  return { ok: true, machine };
}
