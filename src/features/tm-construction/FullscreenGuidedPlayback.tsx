import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Background,
  Controls,
  ReactFlow,
  type Edge,
  type Node,
  type ReactFlowInstance,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { TapeViewer } from '@/components/tm/TapeViewer';
import type { TmConstructionChallenge } from '@/content/tmConstruction/challenges';
import {
  type TmEdgeData,
  type TmStateNodeData,
} from '@/features/tm-construction/flowTypes';
import { TmStateNode } from '@/features/tm-construction/TmStateNode';
import { TmTransitionEdge } from '@/features/tm-construction/TmTransitionEdge';
import { nodesAndEdgesForGuidedStep } from '@/features/tm-construction/guidedPlaybackDiagram';
import { buildGuidedPlaybackTimeline } from '@/lib/tm/buildGuidedPlaybackTimeline';
import { buildMachineFromConstruction } from '@/lib/tm/constructionMachine';
import { tapeSymbolDisplay } from '@/lib/tm/tapeRunPresentation';
import { readSymbol } from '@/lib/tm/tape';
import {
  GUIDED_PLAYBACK_SPEED_LABEL,
  GUIDED_PLAYBACK_SPEED_ORDER,
  GUIDED_PLAYBACK_STEP_MS,
  type GuidedPlaybackSpeed,
} from '@/types/guidedPlayback';

const NODE_TYPES = { tmState: TmStateNode };
const EDGE_TYPES = { tmTransition: TmTransitionEdge };

function pickDefaultRunInput(challenge: TmConstructionChallenge): string {
  const opts = challenge.tutorDemoInputs ?? [];
  if (opts.includes('aabb')) return 'aabb';
  const nonEmpty = opts.find((s) => s.length > 0);
  return nonEmpty ?? '';
}

export interface FullscreenGuidedPlaybackProps {
  open: boolean;
  onClose: () => void;
  challenge: TmConstructionChallenge;
  /** Example string for phase 2; defaults to a preferred demo input from the challenge. */
  runInput?: string;
  /** Persist timeline position when closing (controlled). */
  stepIndex: number;
  onStepIndexChange: (i: number) => void;
  /** Optional build-canvas edges: `labelOffset` is merged by edge id for tutor/fullscreen readability. */
  userEdgesForLabelOffsets?: Edge<TmEdgeData>[];
}

export function FullscreenGuidedPlayback({
  open,
  onClose,
  challenge,
  runInput: runInputProp,
  stepIndex,
  onStepIndexChange,
  userEdgesForLabelOffsets,
}: FullscreenGuidedPlaybackProps) {
  const runInput = runInputProp ?? pickDefaultRunInput(challenge);
  const solutionSteps = challenge.solutionSteps ?? [];
  const machineInput = challenge.tutorTapeMachine;

  const built = useMemo(
    () => (machineInput ? buildMachineFromConstruction(machineInput) : null),
    [machineInput]
  );

  const timeline = useMemo(() => {
    if (!built?.ok || !solutionSteps.length) return [];
    return buildGuidedPlaybackTimeline(
      solutionSteps,
      built.machine,
      runInput,
      challenge.maxSteps
    );
  }, [built, solutionSteps, runInput, challenge.maxSteps]);

  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<GuidedPlaybackSpeed>('normal');
  const playingRef = useRef(false);
  playingRef.current = playing;
  const rfInstanceRef = useRef<ReactFlowInstance<
    Node<TmStateNodeData>,
    Edge<TmEdgeData>
  > | null>(null);

  const maxIdx = Math.max(0, timeline.length - 1);

  useEffect(() => {
    if (stepIndex > maxIdx) {
      onStepIndexChange(maxIdx);
    }
  }, [stepIndex, maxIdx, onStepIndexChange]);

  useEffect(() => {
    if (!open) {
      setPlaying(false);
      rfInstanceRef.current = null;
    }
  }, [open]);

  useEffect(() => {
    setPlaying(false);
  }, [runInput]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!playing || !open || timeline.length === 0) return;
    if (stepIndex >= maxIdx) {
      setPlaying(false);
      return;
    }
    const ms = GUIDED_PLAYBACK_STEP_MS[speed];
    const t = window.setTimeout(() => {
      if (!playingRef.current) return;
      onStepIndexChange(Math.min(maxIdx, stepIndex + 1));
    }, ms);
    return () => clearTimeout(t);
  }, [playing, open, stepIndex, maxIdx, speed, timeline.length, onStepIndexChange]);

  const onFlowInit = useCallback((inst: ReactFlowInstance<Node<TmStateNodeData>, Edge<TmEdgeData>>) => {
    rfInstanceRef.current = inst;
    requestAnimationFrame(() => {
      inst.fitView({ padding: 0.15, maxZoom: 1.35 });
    });
  }, []);

  const frame = timeline[stepIndex];

  useEffect(() => {
    if (!open || !frame || frame.phase !== 'build') return;
    const inst = rfInstanceRef.current;
    if (!inst?.viewportInitialized) return;
    const id = requestAnimationFrame(() => {
      inst.fitView({ padding: 0.15, maxZoom: 1.35 });
    });
    return () => cancelAnimationFrame(id);
  }, [open, frame?.phase, frame?.constructionAppliedCount]);
  const graph = useMemo(
    () =>
      frame
        ? nodesAndEdgesForGuidedStep(
            solutionSteps,
            frame,
            playing,
            userEdgesForLabelOffsets
          )
        : { nodes: [], edges: [] },
    [solutionSteps, frame, playing, userEdgesForLabelOffsets]
  );

  const stepBack = useCallback(() => {
    setPlaying(false);
    onStepIndexChange(Math.max(0, stepIndex - 1));
  }, [stepIndex, onStepIndexChange]);

  const stepFwd = useCallback(() => {
    setPlaying(false);
    onStepIndexChange(Math.min(maxIdx, stepIndex + 1));
  }, [stepIndex, maxIdx, onStepIndexChange]);

  const restart = useCallback(() => {
    setPlaying(false);
    onStepIndexChange(0);
  }, [onStepIndexChange]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  if (!machineInput || !built?.ok || timeline.length === 0) {
    return createPortal(
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/95 p-6 text-slate-200">
        <div className="max-w-md rounded-lg border border-slate-600 bg-slate-900 p-6 text-center">
          <p className="text-sm">
            Lecture mode needs a challenge with <span className="font-mono">solutionSteps</span>{' '}
            and <span className="font-mono">tutorTapeMachine</span>.
          </p>
          <button
            type="button"
            className="mt-4 rounded-md border border-slate-500 px-4 py-2 text-sm hover:bg-slate-800"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>,
      document.body
    );
  }

  const m = built.machine;
  const cfg = frame?.config;
  const sym = cfg ? readSymbol(m, cfg.tape) : m.blank;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex flex-col bg-slate-950 text-slate-100"
      role="dialog"
      aria-modal="true"
      aria-label="Fullscreen lecture playback"
    >
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-slate-800 px-4 py-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-violet-400">
            Lecture mode
          </p>
          <p className="text-sm text-slate-400">{challenge.title}</p>
        </div>
        <button
          type="button"
          className="rounded-md border border-slate-600 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800"
          onClick={onClose}
        >
          Exit fullscreen
        </button>
      </header>

      <section className="shrink-0 border-b border-slate-800/80 bg-slate-900/90 px-4 py-4 transition-opacity duration-300">
        <div className="mx-auto flex max-w-4xl flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span
              className={`rounded-full px-2.5 py-0.5 font-medium ${
                frame?.phase === 'build'
                  ? 'bg-violet-900/80 text-violet-200'
                  : 'bg-sky-900/80 text-sky-200'
              }`}
            >
              {frame?.phase === 'build' ? 'Phase 1 · Construction' : 'Phase 2 · Execution'}
            </span>
            <span className="text-slate-500">
              Step {stepIndex + 1} / {timeline.length}
              {frame?.runStepIndex != null ? (
                <span className="ml-2">· Run frame {frame.runStepIndex}</span>
              ) : null}
            </span>
          </div>
          <p className="text-base leading-relaxed text-slate-100 transition-opacity duration-200">
            {frame?.explanation ?? ''}
          </p>
        </div>
      </section>

      <div className="flex min-h-0 flex-1 flex-col">
        <ReactFlow
          nodes={graph.nodes}
          edges={graph.edges}
          nodeTypes={NODE_TYPES}
          edgeTypes={EDGE_TYPES}
          onInit={onFlowInit}
          className="h-full min-h-0 flex-1 bg-slate-950"
          proOptions={{ hideAttribution: true }}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          deleteKeyCode={null}
          panOnDrag={!playing}
          panOnScroll={!playing}
          zoomOnScroll={!playing}
          zoomOnPinch={!playing}
          zoomOnDoubleClick={false}
        >
          <Background gap={16} color="#334155" />
          <Controls className="!border-slate-600 !bg-slate-900 [&_button]:!border-slate-600 [&_button]:!bg-slate-800 [&_button]:!fill-slate-200" />
        </ReactFlow>
      </div>

      <footer className="shrink-0 border-t border-slate-800 bg-slate-900/95 px-4 py-4">
        <div className="mx-auto flex max-w-4xl flex-col gap-3">
          {cfg ? (
            <>
              <div className="transition-opacity duration-200">
                <TapeViewer machine={m} tape={cfg.tape} />
              </div>
              <p className="text-center text-xs text-slate-500">
                Reading{' '}
                <span className="font-mono text-slate-300">{tapeSymbolDisplay(m, sym)}</span>
                {' · '}
                State <span className="font-mono text-amber-200">{cfg.state}</span>
              </p>
            </>
          ) : null}

          <div className="flex flex-wrap items-center justify-center gap-2 border-t border-slate-800/80 pt-3">
            <button
              type="button"
              className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-40"
              disabled={playing || stepIndex >= maxIdx}
              onClick={() => setPlaying(true)}
            >
              Play
            </button>
            <button
              type="button"
              className="rounded-md border border-slate-600 px-3 py-1.5 text-sm hover:bg-slate-800 disabled:opacity-40"
              disabled={!playing}
              onClick={() => setPlaying(false)}
            >
              Pause
            </button>
            <button
              type="button"
              className="rounded-md border border-slate-600 px-3 py-1.5 text-sm hover:bg-slate-800"
              onClick={stepBack}
            >
              Step back
            </button>
            <button
              type="button"
              className="rounded-md border border-slate-600 px-3 py-1.5 text-sm hover:bg-slate-800 disabled:opacity-40"
              disabled={stepIndex >= maxIdx}
              onClick={stepFwd}
            >
              Step forward
            </button>
            <button
              type="button"
              className="rounded-md border border-slate-600 px-3 py-1.5 text-sm hover:bg-slate-800"
              onClick={restart}
            >
              Restart
            </button>
            <label className="flex items-center gap-2 text-xs text-slate-400">
              Speed
              <select
                className="rounded-md border border-slate-600 bg-slate-950 px-2 py-1 text-slate-100"
                value={speed}
                onChange={(e) => setSpeed(e.target.value as GuidedPlaybackSpeed)}
              >
                {GUIDED_PLAYBACK_SPEED_ORDER.map((k) => (
                  <option key={k} value={k}>
                    {GUIDED_PLAYBACK_SPEED_LABEL[k]} ({GUIDED_PLAYBACK_STEP_MS[k]}ms)
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </footer>
    </div>,
    document.body
  );
}
