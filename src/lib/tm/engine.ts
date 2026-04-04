import type {
  ExecutionStep,
  HaltStatus,
  TMConfiguration,
  TransitionAnswer,
  TransitionFired,
  TuringMachineDefinition,
} from '@/types/tm';
import { ensureHeadInBounds, readSymbol, tapeFromInput } from '@/lib/tm/tape';

/**
 * stepIndex === 0 is the initial configuration (before any transition).
 * After one step(), stepIndex becomes 1 with lastTransition set.
 */
export function initialConfiguration(
  machine: TuringMachineDefinition,
  input: string,
  headIndex = 0
): TMConfiguration {
  const cells = tapeFromInput(machine, input);
  const tape = ensureHeadInBounds({ cells, headIndex }, machine.blank);
  return { state: machine.start, tape };
}

function haltStatusForState(
  machine: TuringMachineDefinition,
  state: string
): HaltStatus {
  if (state === machine.accept) return 'accepted';
  if (state === machine.reject) return 'rejected';
  return 'running';
}

export interface StepResult {
  next: TMConfiguration;
  fired?: TransitionFired;
  status: HaltStatus;
}

/**
 * Apply one transition from a non-halted configuration.
 * If already in accept/reject, returns the same configuration with matching status.
 */
export function step(
  machine: TuringMachineDefinition,
  config: TMConfiguration
): StepResult {
  const statusBefore = haltStatusForState(machine, config.state);
  if (statusBefore === 'accepted' || statusBefore === 'rejected') {
    return { next: config, status: statusBefore };
  }

  const tape0 = ensureHeadInBounds(config.tape, machine.blank);
  const read = readSymbol(machine, tape0);
  const rule = machine.transitions[config.state]?.[read];

  if (!rule) {
    const next: TMConfiguration = {
      state: machine.reject,
      tape: tape0,
    };
    return { next, status: 'rejected' };
  }

  const cells = [...tape0.cells];
  const head = tape0.headIndex;
  cells[head] = rule.write;

  let newHead = head;
  if (rule.move === 'R') {
    newHead = head + 1;
    if (newHead >= cells.length) {
      cells.push(machine.blank);
    }
  } else if (rule.move === 'L') {
    if (head === 0) {
      if (machine.policies.leftEnd === 'reject') {
        const next: TMConfiguration = {
          state: machine.reject,
          tape: { cells, headIndex: 0 },
        };
        return {
          next,
          status: 'rejected',
          fired: {
            from: config.state,
            read,
            to: machine.reject,
            write: rule.write,
            move: rule.move,
          },
        };
      }
      newHead = 0;
    } else {
      newHead = head - 1;
    }
  }

  const nextTape = ensureHeadInBounds(
    { cells, headIndex: newHead },
    machine.blank
  );
  const nextConfig: TMConfiguration = {
    state: rule.next,
    tape: nextTape,
  };

  const fired: TransitionFired = {
    from: config.state,
    read,
    to: rule.next,
    write: rule.write,
    move: rule.move,
  };

  const status = haltStatusForState(machine, rule.next);

  return { next: nextConfig, fired, status };
}

export function configurationToStep(
  stepIndex: number,
  config: TMConfiguration,
  lastTransition: TransitionFired | undefined,
  status: HaltStatus
): ExecutionStep {
  return { stepIndex, config, lastTransition, status };
}

export function buildInitialHistory(
  machine: TuringMachineDefinition,
  input: string,
  headIndex?: number
): ExecutionStep[] {
  const config = initialConfiguration(machine, input, headIndex);
  const status = haltStatusForState(machine, config.state);
  return [configurationToStep(0, config, undefined, status)];
}

/**
 * Expected transition answer for the next step, or null if already halted.
 */
export function peekNextAnswer(
  machine: TuringMachineDefinition,
  config: TMConfiguration
): TransitionAnswer | null {
  const status = haltStatusForState(machine, config.state);
  if (status === 'accepted' || status === 'rejected') return null;

  const tape0 = ensureHeadInBounds(config.tape, machine.blank);
  const read = readSymbol(machine, tape0);
  const rule = machine.transitions[config.state]?.[read];
  if (!rule) {
    return {
      nextState: machine.reject,
      write: read,
      move: 'S',
    };
  }
  return {
    nextState: rule.next,
    write: rule.write,
    move: rule.move,
  };
}

export function answersEqual(a: TransitionAnswer, b: TransitionAnswer): boolean {
  return (
    a.nextState === b.nextState &&
    a.write === b.write &&
    a.move === b.move
  );
}

export function runUntilHalt(
  machine: TuringMachineDefinition,
  config: TMConfiguration,
  maxSteps: number
): ExecutionStep[] {
  const out: ExecutionStep[] = [
    configurationToStep(
      0,
      config,
      undefined,
      haltStatusForState(machine, config.state)
    ),
  ];
  let current = config;
  let transitionsApplied = 0;

  while (transitionsApplied < maxSteps) {
    const { next, fired, status } = step(machine, current);
    transitionsApplied++;
    out.push(
      configurationToStep(transitionsApplied, next, fired, status)
    );
    if (status !== 'running') return out;
    current = next;
  }

  const last = out[out.length - 1];
  if (last.status === 'running') {
    out[out.length - 1] = { ...last, status: 'max_steps_exceeded' };
  }
  return out;
}
