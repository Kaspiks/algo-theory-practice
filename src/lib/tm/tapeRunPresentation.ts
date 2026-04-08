import type { TransitionFired, TuringMachineDefinition } from '@/types/tm';

export function tapeSymbolDisplay(
  machine: TuringMachineDefinition,
  s: string
): string {
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

export function formatRunFormalLine(
  machine: TuringMachineDefinition,
  fired: TransitionFired
): string {
  const dr = tapeSymbolDisplay(machine, fired.read);
  const dw = tapeSymbolDisplay(machine, fired.write);
  return `${fired.from} reads '${dr}' → writes '${dw}', moves ${fired.move}, goes to ${fired.to}`;
}

/**
 * Short, transition-grounded copy for the example-run panel (not generic filler).
 */
export function runTransitionProse(
  machine: TuringMachineDefinition,
  fired: TransitionFired
): string {
  const dr = tapeSymbolDisplay(machine, fired.read);
  const dw = tapeSymbolDisplay(machine, fired.write);
  const moveWord =
    fired.move === 'L' ? 'left' : fired.move === 'R' ? 'right' : 'in place';
  let s = `In ${fired.from} the head reads '${dr}'.`;
  if (fired.write !== fired.read) {
    s += ` It writes '${dw}'`;
  } else {
    s += ` It leaves '${dw}' on the tape`;
  }
  s += ` and moves ${moveWord} to ${fired.to}.`;
  if (fired.to === machine.accept) {
    s += ' The machine halts in accept.';
  } else if (fired.to === machine.reject) {
    s += ' The machine halts in reject.';
  }
  return s;
}

export function implicitRejectProse(
  machine: TuringMachineDefinition,
  from: string,
  read: string
): string {
  const dr = tapeSymbolDisplay(machine, read);
  return `No transition is defined from ${from} on '${dr}'. By the machine’s policy, the configuration jumps to reject without writing or moving.`;
}

export function initialRunProse(machine: TuringMachineDefinition): string {
  return `Initial configuration: state ${machine.start}, head on the first cell. The diagram highlights the current state; press Step TM to follow the first transition on the graph.`;
}

export function haltedAcceptProse(machine: TuringMachineDefinition): string {
  return `The machine is halted in the accept state (${machine.accept}).`;
}

export function haltedRejectProse(machine: TuringMachineDefinition): string {
  return `The machine is halted in the reject state (${machine.reject}).`;
}

export function stepLimitProse(): string {
  return 'Stopped because the step limit for this demo was reached (computation may still be running in theory).';
}

export function formatImplicitFormalLine(
  machine: TuringMachineDefinition,
  from: string,
  read: string
): string {
  const dr = tapeSymbolDisplay(machine, read);
  return `${from} reads '${dr}' → (no transition) → ${machine.reject}`;
}
