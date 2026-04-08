import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { TapeViewer } from '@/components/tm/TapeViewer';
import type { ConstructionMachineInput } from '@/lib/tm/constructionMachine';
import { buildMachineFromConstruction } from '@/lib/tm/constructionMachine';
import { initialConfiguration, step } from '@/lib/tm/engine';
import { readSymbol } from '@/lib/tm/tape';
import { tapeSymbolDisplay } from '@/lib/tm/tapeRunPresentation';
import type { TMConfiguration, TransitionFired, TuringMachineDefinition } from '@/types/tm';

export interface TutorTapeRunSyncPayload {
  machine: TuringMachineDefinition;
  config: TMConfiguration;
  stepIndex: number;
  playing: boolean;
  maxSteps: number;
  lastFired?: TransitionFired;
  implicitReject?: { from: string; read: string };
  recentFired: TransitionFired[];
}

export interface TutorTapeDemoProps {
  machineInput: ConstructionMachineInput;
  demoInputs: string[];
  enabled: boolean;
  maxSteps: number;
  onRunSync?: (payload: TutorTapeRunSyncPayload | null) => void;
}

interface RunBundle {
  config: TMConfiguration;
  stepIndex: number;
  lastFired?: TransitionFired;
  implicitReject?: { from: string; read: string };
  recentFired: TransitionFired[];
}

function makeInitialBundle(machine: TuringMachineDefinition, input: string): RunBundle {
  return {
    config: initialConfiguration(machine, input, 0),
    stepIndex: 0,
    lastFired: undefined,
    implicitReject: undefined,
    recentFired: [],
  };
}

function computeNextBundle(
  machine: TuringMachineDefinition,
  prev: RunBundle,
  maxSteps: number
): RunBundle {
  if (prev.config.state === machine.accept || prev.config.state === machine.reject) {
    return prev;
  }
  if (prev.stepIndex >= maxSteps) {
    return prev;
  }
  const read = readSymbol(machine, prev.config.tape);
  const r = step(machine, prev.config);
  const implicit = !r.fired && r.next.state === machine.reject;
  const fired = r.fired;
  const recent = fired ? [fired, ...prev.recentFired].slice(0, 6) : prev.recentFired;
  return {
    config: r.next,
    stepIndex: prev.stepIndex + 1,
    lastFired: fired,
    implicitReject: implicit ? { from: prev.config.state, read } : undefined,
    recentFired: recent,
  };
}

export function TutorTapeDemo({
  machineInput,
  demoInputs,
  enabled,
  maxSteps,
  onRunSync,
}: TutorTapeDemoProps) {
  const built = useMemo(() => buildMachineFromConstruction(machineInput), [machineInput]);
  const machine = built.ok ? built.machine : null;

  const [input, setInput] = useState(() => demoInputs[0] ?? '');
  const [bundle, setBundle] = useState<RunBundle | null>(null);
  const [playing, setPlaying] = useState(false);
  const playingRef = useRef(false);
  playingRef.current = playing;

  useEffect(() => {
    if (!machine) {
      setBundle(null);
      return;
    }
    setBundle(makeInitialBundle(machine, input));
    setPlaying(false);
  }, [machine, input, machineInput.id, enabled]);

  useEffect(() => {
    if (!enabled) {
      onRunSync?.(null);
    }
  }, [enabled, onRunSync]);

  useEffect(() => {
    if (!enabled || !machine || !bundle) {
      return;
    }
    onRunSync?.({
      machine,
      config: bundle.config,
      stepIndex: bundle.stepIndex,
      playing,
      maxSteps,
      lastFired: bundle.lastFired,
      implicitReject: bundle.implicitReject,
      recentFired: bundle.recentFired,
    });
  }, [enabled, machine, bundle, playing, maxSteps, onRunSync]);

  const resetRun = useCallback(() => {
    if (!machine) return;
    setBundle(makeInitialBundle(machine, input));
    setPlaying(false);
  }, [machine, input]);

  const runStatus = useMemo(() => {
    if (!machine || !bundle) return null;
    if (bundle.config.state === machine.accept) return 'accepted' as const;
    if (bundle.config.state === machine.reject) return 'rejected' as const;
    if (bundle.stepIndex >= maxSteps) return 'step_limit' as const;
    return 'running' as const;
  }, [machine, bundle, maxSteps]);

  const stepOnce = useCallback(() => {
    if (!machine) return;
    setBundle((prev) =>
      prev ? computeNextBundle(machine, prev, maxSteps) : prev
    );
  }, [machine, maxSteps]);

  useEffect(() => {
    if (!playing || !machine) return;
    const id = window.setInterval(() => {
      if (!playingRef.current) return;
      setBundle((prev) => {
        if (!prev) return prev;
        if (prev.config.state === machine.accept || prev.config.state === machine.reject) {
          queueMicrotask(() => setPlaying(false));
          return prev;
        }
        if (prev.stepIndex >= maxSteps) {
          queueMicrotask(() => setPlaying(false));
          return prev;
        }
        return computeNextBundle(machine, prev, maxSteps);
      });
    }, 420);
    return () => clearInterval(id);
  }, [playing, machine, maxSteps]);

  useEffect(() => {
    if (!playing || !machine || !bundle) return;
    if (bundle.config.state === machine.accept || bundle.config.state === machine.reject) {
      setPlaying(false);
    }
    if (bundle.stepIndex >= maxSteps) {
      setPlaying(false);
    }
  }, [playing, machine, bundle, maxSteps]);

  if (!machine) {
    return (
      <div className="rounded-lg border border-rose-800/50 bg-rose-950/20 p-3 text-sm text-rose-200">
        Could not build machine for tape demo.
      </div>
    );
  }

  if (!bundle) {
    return null;
  }

  const symUnderHead = readSymbol(machine, bundle.config.tape);

  return (
    <div
      className={`rounded-lg border border-slate-700 bg-slate-900/80 p-3 ${!enabled ? 'opacity-45' : ''}`}
    >
      <p className="text-xs font-medium text-slate-400">Example run (tape)</p>
      {!enabled ? (
        <p className="mt-2 text-xs text-slate-500">
          Finish the tutor playback to try the built machine on sample inputs.
        </p>
      ) : null}
      <label className="mt-2 block text-[11px] text-slate-500">
        Input string
        <select
          className="mt-1 w-full rounded-md border border-slate-600 bg-slate-950 px-2 py-1.5 font-mono text-sm text-slate-100 disabled:opacity-50"
          disabled={!enabled}
          value={input}
          onChange={(e) => setInput(e.target.value)}
        >
          {demoInputs.map((s) => (
            <option key={s === '' ? 'epsilon' : s} value={s}>
              {s === '' ? 'ε (empty)' : s}
            </option>
          ))}
        </select>
      </label>
      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-md border border-slate-600 px-2 py-1 text-xs text-slate-200 hover:bg-slate-800 disabled:opacity-40"
          disabled={!enabled}
          onClick={resetRun}
        >
          Reset tape
        </button>
        <button
          type="button"
          className="rounded-md bg-sky-600 px-2 py-1 text-xs font-medium text-white hover:bg-sky-500 disabled:opacity-40"
          disabled={
            !enabled ||
            runStatus === 'accepted' ||
            runStatus === 'rejected' ||
            runStatus === 'step_limit'
          }
          onClick={stepOnce}
        >
          Step TM
        </button>
        <button
          type="button"
          className="rounded-md border border-slate-600 px-2 py-1 text-xs text-slate-200 hover:bg-slate-800 disabled:opacity-40"
          disabled={
            !enabled ||
            runStatus === 'accepted' ||
            runStatus === 'rejected' ||
            runStatus === 'step_limit'
          }
          onClick={() => setPlaying((p) => !p)}
        >
          {playing ? 'Pause run' : 'Play run'}
        </button>
      </div>
      <div className="mt-3 text-xs text-slate-400">
        Run step {bundle.stepIndex}
        {maxSteps > 0 ? (
          <span className="text-slate-500"> · limit {maxSteps}</span>
        ) : null}
        <span className="ml-1">
          · State <span className="font-mono text-amber-200">{bundle.config.state}</span>
        </span>
        {runStatus === 'accepted' ? (
          <span className="ml-2 text-emerald-400">· Halted accept</span>
        ) : null}
        {runStatus === 'rejected' ? (
          <span className="ml-2 text-rose-400">· Halted reject</span>
        ) : null}
        {runStatus === 'step_limit' ? (
          <span className="ml-2 text-amber-400">· Step limit</span>
        ) : null}
      </div>
      <div className="mt-2">
        <TapeViewer machine={machine} tape={bundle.config.tape} />
      </div>
      <p className="mt-2 text-[10px] text-slate-500">
        Reading:{' '}
        <span className="font-mono text-slate-300">
          {tapeSymbolDisplay(machine, symUnderHead)}
        </span>
      </p>
      {bundle.recentFired.length > 0 ? (
        <div className="mt-3 border-t border-slate-700/80 pt-2">
          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
            Recent transitions
          </p>
          <ol className="mt-1 max-h-24 list-inside list-decimal space-y-0.5 overflow-y-auto text-[10px] text-slate-400">
            {bundle.recentFired.map((f, i) => (
              <li key={`${f.from}-${f.read}-${f.to}-${i}`} className="font-mono">
                {f.from} —{tapeSymbolDisplay(machine, f.read)}→ {f.to}
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </div>
  );
}
