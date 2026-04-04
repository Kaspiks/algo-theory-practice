export type TapeSymbol = string;

export type StateId = string;

export type HeadMove = 'L' | 'R' | 'S';

export interface TransitionRule {
  next: StateId;
  write: TapeSymbol;
  move: HeadMove;
}

export type TransitionTable = Record<
  StateId,
  Partial<Record<TapeSymbol, TransitionRule>>
>;

export type LeftEndPolicy = 'reject' | 'stay';

export type UndefinedTransitionPolicy = 'reject';

export interface MachinePolicies {
  leftEnd: LeftEndPolicy;
  undefinedTransition: UndefinedTransitionPolicy;
}

export type BlankDisplay = 'cup' | 'underscore' | 'B';

export interface TuringMachineDefinition {
  id: string;
  name?: string;
  states: StateId[];
  inputAlphabet: TapeSymbol[];
  tapeAlphabet: TapeSymbol[];
  transitions: TransitionTable;
  start: StateId;
  accept: StateId;
  reject: StateId;
  blank: TapeSymbol;
  policies: MachinePolicies;
  maxSteps?: number;
  blankDisplay?: BlankDisplay;
}

export interface TapeModel {
  cells: TapeSymbol[];
  headIndex: number;
}

export interface TMConfiguration {
  state: StateId;
  tape: TapeModel;
}

/**
 * Snapshot of a TM configuration for prompts, diagrams, and grading.
 * Alias of {@link TMConfiguration}; use this name when emphasizing “current” or “result” views.
 */
export type TmConfigurationSnapshot = TMConfiguration;

/**
 * One authored multiple-choice option for tape-result mode (next state + tape + head).
 * `tapeCells` is the full cell sequence; `headPosition` must index into `tapeCells`
 * (engine-normalized tapes may extend with blanks — match `ensureHeadInBounds` when authoring).
 */
export interface TapeResultOption {
  id: string;
  nextState: StateId;
  tapeCells: TapeSymbol[];
  headPosition: number;
  /** Short legend / screen-reader text. */
  label?: string;
  /** Optional author note (not shown as main feedback unless wired in UI). */
  explanation?: string;
}

/** Runtime MCQ row for tape-result UI (projection of {@link TapeResultOption}). */
export interface TapeResultMcqOption {
  id: string;
  label: string;
  resultingConfig: TMConfiguration;
}

export function tapeResultOptionToConfiguration(
  o: TapeResultOption
): TMConfiguration {
  return {
    state: o.nextState,
    tape: { cells: [...o.tapeCells], headIndex: o.headPosition },
  };
}

export function configurationToTapeResultOption(
  id: string,
  c: TMConfiguration,
  meta?: { label?: string; explanation?: string }
): TapeResultOption {
  return {
    id,
    nextState: c.state,
    tapeCells: [...c.tape.cells],
    headPosition: c.tape.headIndex,
    label: meta?.label,
    explanation: meta?.explanation,
  };
}

export function projectTapeResultOptionsToMcq(
  options: TapeResultOption[]
): TapeResultMcqOption[] {
  return options.map((o) => ({
    id: o.id,
    label: o.label ?? o.id,
    resultingConfig: tapeResultOptionToConfiguration(o),
  }));
}

export type HaltStatus = 'running' | 'accepted' | 'rejected' | 'max_steps_exceeded';

export interface TransitionFired {
  from: StateId;
  read: TapeSymbol;
  to: StateId;
  write: TapeSymbol;
  move: HeadMove;
}

export interface ExecutionStep {
  stepIndex: number;
  config: TMConfiguration;
  lastTransition?: TransitionFired;
  status: HaltStatus;
}

export interface TransitionAnswer {
  nextState: StateId;
  write: TapeSymbol;
  move: HeadMove;
}

export interface TransitionMcqOption {
  id: string;
  label: string;
  answer: TransitionAnswer;
}
