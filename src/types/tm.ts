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
