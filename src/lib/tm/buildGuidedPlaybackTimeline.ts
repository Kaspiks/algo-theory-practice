import type { TmSolutionStep } from '@/types/tmConstructionSolution';
import type { GuidedPlaybackStep } from '@/types/guidedPlayback';
import type { TuringMachineDefinition } from '@/types/tm';
import { initialConfiguration, step } from '@/lib/tm/engine';
import { readSymbol } from '@/lib/tm/tape';
import {
  implicitRejectProse,
  initialRunProse,
  runTransitionProse,
} from '@/lib/tm/tapeRunPresentation';

function blankIntroConfig(machine: TuringMachineDefinition) {
  return initialConfiguration(machine, '', 0);
}

/**
 * Builds a single linear timeline: intro → each construction step → execution trace
 * (initial config, then each TM step until halt or maxRunSteps).
 */
export function buildGuidedPlaybackTimeline(
  solutionSteps: TmSolutionStep[],
  machine: TuringMachineDefinition,
  runInput: string,
  maxRunSteps: number
): GuidedPlaybackStep[] {
  const out: GuidedPlaybackStep[] = [];
  const n = solutionSteps.length;
  const runDisplay = runInput === '' ? 'ε' : runInput;

  out.push({
    phase: 'build',
    type: 'explain',
    explanation: `Lecture playback: first we construct the machine step by step (${n} steps), then we execute it on input “${runDisplay}”. Use the controls to step or play.`,
    constructionAppliedCount: 0,
    machine,
    config: blankIntroConfig(machine),
    runStepIndex: undefined,
  });

  for (let i = 0; i < n; i++) {
    const sol = solutionSteps[i]!;
    const t: GuidedPlaybackStep['type'] =
      sol.type === 'explain'
        ? 'explain'
        : sol.type === 'add_state'
          ? 'add_state'
          : 'add_transition';
    out.push({
      phase: 'build',
      type: t,
      explanation: sol.explanation,
      constructionAppliedCount: i + 1,
      machine,
      config: blankIntroConfig(machine),
      runStepIndex: undefined,
    });
  }

  let cfg = initialConfiguration(machine, runInput, 0);
  let runIdx = 0;
  out.push({
    phase: 'run',
    type: 'execute',
    explanation: `Construction complete. Execution on “${runDisplay}”. ${initialRunProse(machine)}`,
    constructionAppliedCount: n,
    machine,
    config: cfg,
    lastFired: undefined,
    implicitReject: undefined,
    runStepIndex: runIdx,
  });
  runIdx++;

  let executed = 0;
  while (executed < maxRunSteps) {
    if (cfg.state === machine.accept || cfg.state === machine.reject) {
      break;
    }
    const read = readSymbol(machine, cfg.tape);
    const r = step(machine, cfg);
    const implicit = !r.fired && r.next.state === machine.reject;

    if (implicit) {
      const fromState = cfg.state;
      cfg = r.next;
      out.push({
        phase: 'run',
        type: 'execute',
        explanation: implicitRejectProse(machine, fromState, read),
        constructionAppliedCount: n,
        machine,
        config: cfg,
        implicitReject: { from: fromState, read },
        runStepIndex: runIdx,
      });
      break;
    }

    if (!r.fired) {
      break;
    }

    cfg = r.next;
    executed++;
    out.push({
      phase: 'run',
      type: 'execute',
      explanation: runTransitionProse(machine, r.fired),
      constructionAppliedCount: n,
      machine,
      config: cfg,
      lastFired: r.fired,
      runStepIndex: runIdx,
    });
    runIdx++;

    if (cfg.state === machine.accept || cfg.state === machine.reject) {
      break;
    }
  }

  return out;
}
