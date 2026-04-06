import { initialConfiguration, runUntilHalt } from '@/lib/tm/engine';
import type { ExecutionStep, HaltStatus, TuringMachineDefinition } from '@/types/tm';
import type {
  ConstructionExpectation,
  ConstructionTestCase,
} from '@/content/tmConstruction/challenges';

export type ConstructionActualOutcome = 'accept' | 'reject' | 'loop';

export interface ConstructionSingleResult {
  input: string;
  headIndex: number;
  expect: ConstructionExpectation;
  actual: ConstructionActualOutcome;
  passed: boolean;
  lastStatus: HaltStatus;
  trace: ExecutionStep[];
}

function actualFromStatus(status: HaltStatus): ConstructionActualOutcome {
  if (status === 'accepted') return 'accept';
  if (status === 'rejected') return 'reject';
  return 'loop';
}

/**
 * Behavioral grading: no diagram comparison.
 * - Accept cases must halt in the accept state.
 * - Reject cases pass if the machine never accepts (explicit reject or step-limit / loop).
 */
export function constructionOutcomeMatchesExpectation(
  expect: ConstructionExpectation,
  actual: ConstructionActualOutcome
): boolean {
  if (expect === 'accept') return actual === 'accept';
  return actual !== 'accept';
}

function casePasses(
  expect: ConstructionExpectation,
  actual: ConstructionActualOutcome
): boolean {
  return constructionOutcomeMatchesExpectation(expect, actual);
}

/**
 * Run all behavioral tests. Validation is by halting outcome, not diagram equality.
 */
export function runConstructionTestSuite(
  machine: TuringMachineDefinition,
  acceptCases: ConstructionTestCase[],
  rejectCases: ConstructionTestCase[],
  maxSteps: number
): ConstructionSingleResult[] {
  const rows: ConstructionSingleResult[] = [];

  const runOne = (tc: ConstructionTestCase): ConstructionSingleResult => {
    try {
      const config = initialConfiguration(
        machine,
        tc.input,
        tc.headIndex ?? 0
      );
      const trace = runUntilHalt(machine, config, maxSteps);
      const last = trace[trace.length - 1]!;
      const actual = actualFromStatus(last.status);
      return {
        input: tc.input,
        headIndex: tc.headIndex ?? 0,
        expect: tc.expect,
        actual,
        passed: casePasses(tc.expect, actual),
        lastStatus: last.status,
        trace,
      };
    } catch {
      return {
        input: tc.input,
        headIndex: tc.headIndex ?? 0,
        expect: tc.expect,
        actual: 'reject',
        passed: false,
        lastStatus: 'rejected',
        trace: [],
      };
    }
  };

  for (const tc of acceptCases) {
    rows.push(runOne({ ...tc, expect: 'accept' }));
  }
  for (const tc of rejectCases) {
    rows.push(runOne({ ...tc, expect: 'reject' }));
  }

  return rows;
}

export function allConstructionTestsPassed(results: ConstructionSingleResult[]): boolean {
  return results.every((r) => r.passed);
}
