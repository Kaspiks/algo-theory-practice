import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StateDiagramExpandable } from '@/components/tm/StateDiagramViewer';
import { TapeViewer } from '@/components/tm/TapeViewer';
import { HINT_TEXT } from '@/content/hints';
import { FeedbackPanel } from '@/features/exercise-player/FeedbackPanel';
import { QuestionPanel } from '@/features/exercise-player/QuestionPanel';
import {
  buildNextTransitionMcq,
  formatTransitionLabel,
  gradeNextTransition,
} from '@/lib/grading/nextTransition';
import { initialConfiguration, peekNextAnswer, step } from '@/lib/tm/engine';
import {
  computePhaseSchedule,
  PHASE_GAP_MS,
  phaseDurationsForMove,
  stepPhaseUiLabel,
  type StepAnimPhase,
  tapeAfterWriteOnly,
} from '@/lib/tm/stepAnimation';
import { readSymbol } from '@/lib/tm/tape';
import type { MvpExercise } from '@/types/mvp';
import type {
  HaltStatus,
  TMConfiguration,
  TransitionAnswer,
  TransitionFired,
  TuringMachineDefinition,
} from '@/types/tm';

function tapeCharLabel(m: TuringMachineDefinition, s: string): string {
  if (s !== m.blank) return s;
  switch (m.blankDisplay) {
    case 'underscore':
      return '_';
    case 'B':
      return 'B';
    case 'cup':
    default:
      return '⊔';
  }
}

export type PlayerMode = 'study' | 'quiz';

export interface MvpPlayerProps {
  exercise: MvpExercise;
  machine: TuringMachineDefinition;
  /** Study: step/play + animate on by default. Quiz: MCQ-focused, animate off by default. */
  playerMode?: PlayerMode;
}

interface StepAnimationState {
  before: TMConfiguration;
  after: TMConfiguration;
  fired: TransitionFired;
  status: HaltStatus;
  phase: StepAnimPhase;
}

export function MvpPlayer({
  exercise,
  machine,
  playerMode = 'study',
}: MvpPlayerProps) {
  if (import.meta.env.DEV && exercise.machineId !== machine.id) {
    console.warn('MvpPlayer: exercise.machineId does not match machine.id');
  }

  const [stepCount, setStepCount] = useState(0);
  const [config, setConfig] = useState<TMConfiguration>(() =>
    initialConfiguration(
      machine,
      exercise.setup.input,
      exercise.setup.headIndex ?? 0
    )
  );
  const [lastFired, setLastFired] = useState<TransitionFired | undefined>(
    undefined
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    message: string | null;
    variant: 'neutral' | 'success' | 'error';
    showExplanation: boolean;
  }>({ message: null, variant: 'neutral', showExplanation: false });
  const [hintsShown, setHintsShown] = useState(0);

  const [animateSteps, setAnimateSteps] = useState(playerMode === 'study');
  const [animSpeed, setAnimSpeed] = useState<'slow' | 'normal' | 'fast'>(
    'normal'
  );
  const [playing, setPlaying] = useState(false);
  const [stepAnim, setStepAnim] = useState<StepAnimationState | null>(null);

  const configRef = useRef(config);
  const machineRef = useRef(machine);
  const animTimersRef = useRef<number[]>([]);
  const playTimerRef = useRef<number | null>(null);
  const animGenRef = useRef(0);
  const playingRef = useRef(false);
  const runStepFromEngineRef = useRef<
    | ((
        result: ReturnType<typeof step>,
        opts?: { fromPlayback?: boolean; skipAnimation?: boolean }
      ) => void)
    | null
  >(null);

  useEffect(() => {
    configRef.current = config;
  }, [config]);
  useEffect(() => {
    machineRef.current = machine;
  }, [machine]);
  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

  useEffect(() => {
    setAnimateSteps(playerMode === 'study');
  }, [playerMode]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches) setAnimateSteps(false);
  }, []);

  const clearAnimTimers = useCallback(() => {
    animTimersRef.current.forEach((id) => window.clearTimeout(id));
    animTimersRef.current = [];
    animGenRef.current += 1;
  }, []);

  const clearPlayTimer = useCallback(() => {
    if (playTimerRef.current != null) {
      window.clearTimeout(playTimerRef.current);
      playTimerRef.current = null;
    }
  }, []);

  useEffect(
    () => () => {
      clearAnimTimers();
      clearPlayTimer();
    },
    [clearAnimTimers, clearPlayTimer]
  );

  const halted = useMemo(
    () => peekNextAnswer(machine, config) === null,
    [machine, config]
  );

  const isAnimating = stepAnim !== null;

  const staticFirstMcq = useMemo(() => {
    if (stepCount !== 0) return null;
    if (!exercise.options?.length) return null;
    const expected = peekNextAnswer(machine, config);
    if (!expected) return null;
    return {
      options: exercise.options,
      expected,
    };
  }, [stepCount, exercise.options, machine, config]);

  const mcq = useMemo(() => {
    if (halted) return null;
    if (staticFirstMcq) {
      return staticFirstMcq;
    }
    return buildNextTransitionMcq(machine, config);
  }, [machine, config, halted, staticFirstMcq]);

  const options = mcq?.options ?? [];
  const idToAnswer = useMemo(() => {
    const m = new Map<string, TransitionAnswer>();
    for (const o of options) {
      m.set(o.id, o.answer);
    }
    return m;
  }, [options]);

  const visual = useMemo(() => {
    if (!stepAnim) {
      return {
        tape: config.tape,
        visualHead: config.tape.headIndex,
        ghostHead: null as number | null,
        cellEmphasis: 'none' as const,
        diagramDisplayState: undefined as string | undefined,
        transitionHighlight: undefined as TransitionFired | undefined,
        diagramPulseEdge: false,
        diagramDestinationHint: null as string | null,
        diagramNextStateEntryPulse: false,
      };
    }
    const { before, after, fired, phase } = stepAnim;
    const tw = tapeAfterWriteOnly(machine, before, fired);
    const pulsePhases: StepAnimPhase[] = [
      'edge',
      'write',
      'head_from',
      'head_to',
    ];
    const diagramPulseEdge = pulsePhases.includes(phase);
    const diagramDestinationHint =
      diagramPulseEdge && fired.to !== before.state ? fired.to : null;
    const diagramNextStateEntryPulse = phase === 'state';

    switch (phase) {
      case 'edge':
        return {
          tape: before.tape,
          visualHead: before.tape.headIndex,
          ghostHead: null,
          cellEmphasis: 'none' as const,
          diagramDisplayState: before.state,
          transitionHighlight: fired,
          diagramPulseEdge,
          diagramDestinationHint,
          diagramNextStateEntryPulse,
        };
      case 'write':
        return {
          tape: tw,
          visualHead: before.tape.headIndex,
          ghostHead: null,
          cellEmphasis: 'write' as const,
          diagramDisplayState: before.state,
          transitionHighlight: fired,
          diagramPulseEdge,
          diagramDestinationHint,
          diagramNextStateEntryPulse,
        };
      case 'head_from':
        return {
          tape: after.tape,
          visualHead: before.tape.headIndex,
          ghostHead: null,
          cellEmphasis: 'head_move' as const,
          diagramDisplayState: before.state,
          transitionHighlight: fired,
          diagramPulseEdge,
          diagramDestinationHint,
          diagramNextStateEntryPulse,
        };
      case 'head_to':
        return {
          tape: after.tape,
          visualHead: after.tape.headIndex,
          ghostHead:
            before.tape.headIndex !== after.tape.headIndex
              ? before.tape.headIndex
              : null,
          cellEmphasis: 'head_move' as const,
          diagramDisplayState: before.state,
          transitionHighlight: fired,
          diagramPulseEdge,
          diagramDestinationHint,
          diagramNextStateEntryPulse,
        };
      case 'state':
        return {
          tape: after.tape,
          visualHead: after.tape.headIndex,
          ghostHead: null,
          cellEmphasis: 'none' as const,
          diagramDisplayState: after.state,
          transitionHighlight: undefined,
          diagramPulseEdge,
          diagramDestinationHint,
          diagramNextStateEntryPulse,
        };
      default:
        return {
          tape: config.tape,
          visualHead: config.tape.headIndex,
          ghostHead: null,
          cellEmphasis: 'none' as const,
          diagramDisplayState: undefined,
          transitionHighlight: undefined,
          diagramPulseEdge: false,
          diagramDestinationHint: null,
          diagramNextStateEntryPulse: false,
        };
    }
  }, [stepAnim, config.tape, machine]);

  const displayStateLine =
    visual.diagramDisplayState ?? config.state;
  const displayHeadIndex = visual.visualHead;
  const symbolUnderHead = readSymbol(machine, visual.tape);

  const applyStepResult = useCallback(
    (
      next: TMConfiguration,
      fired: TransitionFired | undefined,
      status: HaltStatus,
      feedbackOpts?: { variant?: 'success' | 'error'; message?: string }
    ) => {
      setConfig(next);
      setLastFired(fired);
      setStepCount((n) => n + 1);
      setSelectedId(null);
      const done = status === 'accepted' || status === 'rejected';
      const variant = feedbackOpts?.variant ?? 'success';
      const message =
        feedbackOpts?.message ??
        (done
          ? status === 'accepted'
            ? 'Correct. Machine accepted.'
            : 'Correct. Machine rejected.'
          : 'Correct. Stepping…');
      setFeedback({
        message,
        variant,
        showExplanation: done,
      });
    },
    []
  );

  const finishAnimatedStep = useCallback(
    (after: TMConfiguration, fired: TransitionFired, status: HaltStatus) => {
      setStepAnim(null);
      applyStepResult(after, fired, status);
    },
    [applyStepResult]
  );

  const schedulePlayNext = useCallback(() => {
    clearPlayTimer();
    playTimerRef.current = window.setTimeout(() => {
      playTimerRef.current = null;
      if (!playingRef.current) return;
      const m = machineRef.current;
      const c = configRef.current;
      if (peekNextAnswer(m, c) === null) {
        setPlaying(false);
        return;
      }
      const r = step(m, c);
      if (!r.fired) {
        setPlaying(false);
        return;
      }
      runStepFromEngineRef.current?.(r, { fromPlayback: true });
    }, 200);
  }, [clearPlayTimer]);

  const runStepFromEngine = useCallback(
    (
      result: ReturnType<typeof step>,
      opts?: { fromPlayback?: boolean; skipAnimation?: boolean }
    ) => {
      const { next, fired, status } = result;
      if (!fired) return;

      const instant = !animateSteps || opts?.skipAnimation;

      if (instant) {
        applyStepResult(next, fired, status);
        if (opts?.fromPlayback) {
          schedulePlayNext();
        }
        return;
      }

      clearAnimTimers();
      const myGen = animGenRef.current;
      const before = configRef.current;
      const d = phaseDurationsForMove(animSpeed, fired.move);
      const gap = PHASE_GAP_MS[animSpeed];
      const { phaseStarts, totalMs } = computePhaseSchedule(d, gap);

      const arm = (delay: number, fn: () => void) => {
        const id = window.setTimeout(() => {
          if (animGenRef.current !== myGen) return;
          fn();
        }, delay);
        animTimersRef.current.push(id);
      };

      setStepAnim({
        before,
        after: next,
        fired,
        status,
        phase: 'edge',
      });

      arm(phaseStarts.write, () =>
        setStepAnim((s) =>
          s && s.fired === fired && s.after === next
            ? { ...s, phase: 'write' }
            : s
        )
      );
      arm(phaseStarts.head_from, () =>
        setStepAnim((s) =>
          s && s.fired === fired && s.after === next
            ? { ...s, phase: 'head_from' }
            : s
        )
      );
      arm(phaseStarts.head_to, () =>
        setStepAnim((s) =>
          s && s.fired === fired && s.after === next
            ? { ...s, phase: 'head_to' }
            : s
        )
      );
      arm(phaseStarts.state, () =>
        setStepAnim((s) =>
          s && s.fired === fired && s.after === next
            ? { ...s, phase: 'state' }
            : s
        )
      );

      arm(totalMs, () => {
        if (animGenRef.current !== myGen) return;
        finishAnimatedStep(next, fired, status);
        if (opts?.fromPlayback && playingRef.current) {
          schedulePlayNext();
        }
      });
    },
    [
      animateSteps,
      animSpeed,
      applyStepResult,
      clearAnimTimers,
      finishAnimatedStep,
      schedulePlayNext,
    ]
  );

  runStepFromEngineRef.current = runStepFromEngine;

  const handleSubmit = () => {
    if (!selectedId || halted || !mcq || isAnimating) return;
    const chosen = idToAnswer.get(selectedId);
    if (!chosen) return;

    const { correct, expected } = gradeNextTransition(machine, config, chosen);
    if (correct) {
      const result = step(machine, config);
      if (!result.fired) return;
      if (!animateSteps) {
        applyStepResult(result.next, result.fired, result.status);
        return;
      }
      runStepFromEngine(result);
    } else {
      setFeedback({
        message:
          expected == null
            ? 'The machine has already halted.'
            : `Not quite. Expected: ${formatTransitionLabel(expected)}.`,
        variant: 'error',
        showExplanation: true,
      });
    }
  };

  const handleReset = () => {
    clearAnimTimers();
    clearPlayTimer();
    setPlaying(false);
    setStepAnim(null);
    setConfig(
      initialConfiguration(
        machine,
        exercise.setup.input,
        exercise.setup.headIndex ?? 0
      )
    );
    setStepCount(0);
    setLastFired(undefined);
    setSelectedId(null);
    setFeedback({ message: null, variant: 'neutral', showExplanation: false });
    setHintsShown(0);
  };

  const skipAnimation = () => {
    if (!stepAnim) return;
    clearAnimTimers();
    const { after, fired, status } = stepAnim;
    setStepAnim(null);
    applyStepResult(after, fired, status);
    if (playingRef.current) schedulePlayNext();
  };

  const handleOracleStep = () => {
    if (halted || isAnimating) return;
    clearPlayTimer();
    const r = step(machine, config);
    if (!r.fired) return;
    if (!animateSteps) {
      applyStepResult(r.next, r.fired, r.status, {
        variant: 'success',
        message:
          r.status === 'accepted' || r.status === 'rejected'
            ? r.status === 'accepted'
              ? 'Step: machine accepted.'
              : 'Step: machine rejected.'
            : 'Step applied.',
      });
      return;
    }
    runStepFromEngine(r, { fromPlayback: false });
  };

  const handlePlay = () => {
    if (halted || isAnimating) return;
    setPlaying(true);
    const r = step(machine, config);
    if (!r.fired) {
      setPlaying(false);
      return;
    }
    runStepFromEngineRef.current?.(r, { fromPlayback: true });
  };

  const handlePause = () => {
    setPlaying(false);
    clearPlayTimer();
  };

  const handleShowCorrectStep = () => {
    if (halted || isAnimating || playerMode !== 'study') return;
    const r = step(machine, config);
    if (!r.fired) return;
    setFeedback({
      message: 'Showing the correct transition.',
      variant: 'neutral',
      showExplanation: false,
    });
    if (!animateSteps) {
      applyStepResult(r.next, r.fired, r.status, {
        variant: 'success',
        message:
          r.status === 'accepted' || r.status === 'rejected'
            ? r.status === 'accepted'
              ? 'Machine accepted.'
              : 'Machine rejected.'
            : 'Correct step applied.',
      });
      return;
    }
    runStepFromEngine(r);
  };

  const nextHint = exercise.hints[hintsShown];

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-500">
        {exercise.category.replace(/_/g, ' ')} · difficulty {exercise.difficulty}{' '}
        · next-transition · steps: {stepCount}
        {halted ? ' · halted' : null}
        {isAnimating ? ' · animating' : null}
        {playing ? ' · playing' : null}
      </p>

      <div
        className="flex flex-wrap items-center gap-3 rounded-md border border-slate-800 bg-slate-900/50 px-3 py-2 text-sm text-slate-300"
        role="region"
        aria-label="Playback and animation"
      >
        <label className="inline-flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            className="rounded border-slate-600"
            checked={animateSteps}
            onChange={(e) => setAnimateSteps(e.target.checked)}
            disabled={isAnimating}
          />
          <span>Animate steps</span>
        </label>
        <label className="inline-flex items-center gap-1.5 text-slate-400">
          <span className="text-xs">Speed</span>
          <select
            className="rounded border border-slate-600 bg-slate-900 px-2 py-1 text-xs text-slate-200"
            value={animSpeed}
            onChange={(e) =>
              setAnimSpeed(e.target.value as 'slow' | 'normal' | 'fast')
            }
            disabled={isAnimating}
            aria-label="Animation speed"
          >
            <option value="slow">Slow</option>
            <option value="normal">Normal</option>
            <option value="fast">Fast</option>
          </select>
        </label>
        {playerMode === 'study' ? (
          <>
            <span className="hidden h-4 w-px bg-slate-700 sm:inline" aria-hidden />
            <button
              type="button"
              className="rounded-md border border-slate-600 px-2 py-1 text-xs text-slate-200 hover:bg-slate-800 disabled:opacity-40"
              disabled={halted || isAnimating}
              onClick={handleOracleStep}
            >
              Step
            </button>
            <button
              type="button"
              className="rounded-md border border-slate-600 px-2 py-1 text-xs text-slate-200 hover:bg-slate-800 disabled:opacity-40"
              disabled={halted || isAnimating || playing}
              onClick={handlePlay}
            >
              Play
            </button>
            <button
              type="button"
              className="rounded-md border border-slate-600 px-2 py-1 text-xs text-slate-200 hover:bg-slate-800 disabled:opacity-40"
              disabled={!playing}
              onClick={handlePause}
            >
              Pause
            </button>
          </>
        ) : null}
      </div>

      <div
        className="flex flex-wrap gap-x-6 gap-y-1 rounded-md border border-slate-800 bg-slate-900/50 px-3 py-2 text-sm text-slate-300"
        aria-live="polite"
        aria-label="Current configuration"
      >
        <span>
          <span className="text-slate-500">State </span>
          <span className="font-mono text-amber-200">{displayStateLine}</span>
        </span>
        <span>
          <span className="text-slate-500">Head </span>
          <span className="font-mono">{displayHeadIndex}</span>
        </span>
        <span>
          <span className="text-slate-500">Reading </span>
          <span className="font-mono">
            {tapeCharLabel(machine, symbolUnderHead)}
          </span>
        </span>
      </div>

      {isAnimating && stepAnim ? (
        <div
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-500/25 bg-slate-900/95 px-3 py-2.5 shadow-sm shadow-amber-900/10"
          role="status"
          aria-live="polite"
          aria-label="Step animation"
        >
          <p className="text-sm text-slate-300">
            <span className="text-slate-500">Now: </span>
            <span className="font-medium text-amber-100/95">
              {stepPhaseUiLabel(stepAnim.phase)}
            </span>
            {playing ? (
              <span className="ml-2 text-xs font-normal text-slate-500">
                (playback)
              </span>
            ) : null}
          </p>
          <button
            type="button"
            className="shrink-0 rounded-md border border-amber-600/55 bg-amber-500/15 px-3 py-1.5 text-xs font-medium text-amber-100 hover:bg-amber-500/25"
            onClick={skipAnimation}
          >
            Skip animation
          </button>
        </div>
      ) : null}

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="flex-1 space-y-4">
          <TapeViewer
            machine={machine}
            tape={visual.tape}
            visualHeadIndex={visual.visualHead}
            ghostHeadIndex={visual.ghostHead}
            cellEmphasis={visual.cellEmphasis}
          />
          <StateDiagramExpandable
            machine={machine}
            currentState={config.state}
            displayState={visual.diagramDisplayState}
            lastTransition={lastFired}
            transitionHighlight={visual.transitionHighlight}
            pulseActiveTransitionEdge={visual.diagramPulseEdge}
            destinationHintState={visual.diagramDestinationHint}
            nextStateEntryPulse={visual.diagramNextStateEntryPulse}
          />
        </div>
        <div className="flex-1 space-y-4">
          <QuestionPanel
            title={exercise.title}
            description={exercise.description}
            options={options}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onSubmit={handleSubmit}
            submitDisabled={halted}
            halted={halted}
            interactionLocked={isAnimating}
          />
          <FeedbackPanel
            message={feedback.message}
            variant={feedback.variant}
            showExplanation={feedback.showExplanation}
            explanation={exercise.explanation}
          />
          {feedback.variant === 'error' &&
          playerMode === 'study' &&
          !halted &&
          !isAnimating ? (
            <button
              type="button"
              className="rounded-md border border-sky-600/50 bg-sky-500/10 px-3 py-1.5 text-sm text-sky-200 hover:bg-sky-500/20"
              onClick={handleShowCorrectStep}
            >
              Show correct step
            </button>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-md border border-slate-600 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800"
              onClick={handleReset}
            >
              Reset exercise
            </button>
            {nextHint ? (
              <button
                type="button"
                className="rounded-md border border-slate-600 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800"
                disabled={isAnimating}
                onClick={() => setHintsShown((n) => n + 1)}
              >
                Show hint {hintsShown + 1}
              </button>
            ) : null}
          </div>
          {hintsShown > 0 ? (
            <ul className="list-inside list-disc text-sm text-slate-400">
              {exercise.hints.slice(0, hintsShown).map((h) => (
                <li key={h.hintId}>{HINT_TEXT[h.hintId] ?? h.hintId}</li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </div>
  );
}
