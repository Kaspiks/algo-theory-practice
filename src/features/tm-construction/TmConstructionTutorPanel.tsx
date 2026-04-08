import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Background,
  Controls,
  ReactFlow,
  type Edge,
  type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import type { TmConstructionChallenge } from '@/content/tmConstruction/challenges';
import {
  formatEdgeRulesLabel,
  TM_LABEL_SPOTLIGHT_AUTO_NUDGE,
  type TmEdgeData,
  type TmStateNodeData,
} from '@/features/tm-construction/flowTypes';
import { mergeEdgeLabelOffsetsFromUserEdges } from '@/features/tm-construction/mergeEdgeLabelOffsets';
import { sortEdgesWithSpotlightLast } from '@/features/tm-construction/sortEdgesForLabelLayering';
import { TmStateNode } from '@/features/tm-construction/TmStateNode';
import { TmTransitionEdge } from '@/features/tm-construction/TmTransitionEdge';
import {
  graphAfterSolutionSteps,
  tutorExplanationAtStep,
  tutorHighlightForAppliedCount,
} from '@/features/tm-construction/applySolutionSteps';
import {
  findConstructionEdgeIdForFired,
  formatConstructionEdgeLabelWithActiveRead,
} from '@/features/tm-construction/tapeRunDiagram';
import { FullscreenGuidedPlayback } from '@/features/tm-construction/FullscreenGuidedPlayback';
import { TutorTapeDemo, type TutorTapeRunSyncPayload } from '@/features/tm-construction/TutorTapeDemo';
import {
  formatImplicitFormalLine,
  formatRunFormalLine,
  implicitRejectProse,
  initialRunProse,
  runTransitionProse,
  stepLimitProse,
} from '@/lib/tm/tapeRunPresentation';
import {
  TUTOR_SPEED_DELAY_MS,
  type TutorPlaybackSpeed,
} from '@/types/tmConstructionSolution';

const NODE_TYPES = { tmState: TmStateNode };
const EDGE_TYPES = { tmTransition: TmTransitionEdge };

export interface TmConstructionTutorPanelProps {
  challenge: TmConstructionChallenge;
  /** Edges from the build canvas: per-edge `labelOffset` is merged by id for readability. */
  userLabelEdges?: Edge<TmEdgeData>[];
}

export function TmConstructionTutorPanel({
  challenge,
  userLabelEdges = [],
}: TmConstructionTutorPanelProps) {
  const steps = challenge.solutionSteps ?? [];
  const maxApplied = steps.length;

  const [appliedCount, setAppliedCount] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<TutorPlaybackSpeed>('normal');
  const playingRef = useRef(playing);
  playingRef.current = playing;

  const [tapeRun, setTapeRun] = useState<TutorTapeRunSyncPayload | null>(null);
  const onTapeRunSync = useCallback((p: TutorTapeRunSyncPayload | null) => {
    setTapeRun(p);
  }, []);

  const [lectureOpen, setLectureOpen] = useState(false);
  const [lectureStepIndex, setLectureStepIndex] = useState(0);
  const [lectureRunInput, setLectureRunInput] = useState(() => {
    const opts = challenge.tutorDemoInputs ?? [];
    if (opts.includes('aabb')) return 'aabb';
    return opts.find((s) => s.length > 0) ?? '';
  });

  useEffect(() => {
    const opts = challenge.tutorDemoInputs ?? [];
    if (opts.includes('aabb')) setLectureRunInput('aabb');
    else setLectureRunInput(opts.find((s) => s.length > 0) ?? '');
    setLectureStepIndex(0);
  }, [challenge.id]);

  useEffect(() => {
    setLectureStepIndex(0);
  }, [lectureRunInput]);

  const tutorComplete = appliedCount >= maxApplied && maxApplied > 0;

  const constructionHighlight = useMemo(() => {
    if (tutorComplete && tapeRun) {
      return { kind: 'none' as const };
    }
    return tutorHighlightForAppliedCount(steps, appliedCount);
  }, [tutorComplete, tapeRun, steps, appliedCount]);

  const baseGraph = useMemo(() => {
    const g = graphAfterSolutionSteps(steps, appliedCount);
    return {
      nodes: g.nodes,
      edges: mergeEdgeLabelOffsetsFromUserEdges(
        g.edges as Edge<TmEdgeData>[],
        userLabelEdges
      ),
    };
  }, [steps, appliedCount, userLabelEdges]);

  const activeEdgeId = useMemo(() => {
    if (!tapeRun?.lastFired) return null;
    return findConstructionEdgeIdForFired(
      baseGraph.edges as Edge<TmEdgeData>[],
      tapeRun.lastFired
    );
  }, [tapeRun, baseGraph.edges]);

  const tapeHalted =
    tapeRun &&
    (tapeRun.config.state === tapeRun.machine.accept ||
      tapeRun.config.state === tapeRun.machine.reject);
  const tapeAtStepLimit =
    tapeRun && tapeRun.stepIndex >= tapeRun.maxSteps && !tapeHalted;
  const tapeRunActive = Boolean(tutorComplete && tapeRun);

  const nodes: Node<TmStateNodeData>[] = useMemo(() => {
    if (tapeRunActive && tapeRun) {
      const m = tapeRun.machine;
      const cur = tapeRun.config.state;
      const acc = cur === m.accept;
      const rej = cur === m.reject;
      const running = !acc && !rej;
      return baseGraph.nodes.map((n) => {
        const isCurrent = n.id === cur;
        return {
          ...n,
          data: {
            ...n.data,
            tutorSpotlight: false,
            tutorDim: false,
            runCurrent: running && isCurrent,
            runHaltAccept: acc && isCurrent,
            runHaltReject: rej && isCurrent,
            runDim: !isCurrent,
          },
        };
      });
    }

    const hid =
      constructionHighlight.kind === 'state' ? constructionHighlight.stateId : undefined;
    return baseGraph.nodes.map((n) => {
      const spotlight = Boolean(hid && n.id === hid);
      const dim =
        appliedCount > 0 &&
        (constructionHighlight.kind === 'explain' ||
          (constructionHighlight.kind === 'state' && !spotlight) ||
          constructionHighlight.kind === 'edge');
      return {
        ...n,
        data: {
          ...n.data,
          tutorSpotlight: spotlight,
          tutorDim: dim,
          runCurrent: false,
          runHaltAccept: false,
          runHaltReject: false,
          runDim: false,
        },
      };
    });
  }, [baseGraph.nodes, tapeRunActive, tapeRun, constructionHighlight, appliedCount]);

  const edges: Edge<TmEdgeData>[] = useMemo(() => {
    if (tapeRunActive && tapeRun) {
      const eid = activeEdgeId;
      const activeRead =
        eid && tapeRun.lastFired ? tapeRun.lastFired.read : undefined;
      const pulse =
        tapeRun.playing && !tapeHalted && Boolean(eid) && Boolean(tapeRun.lastFired);
      const frozenEdge = Boolean(eid && tapeHalted && tapeRun.lastFired);
      const hasActiveEdge = Boolean(eid);

      return sortEdgesWithSpotlightLast(
        baseGraph.edges.map((e) => {
          const isActive = Boolean(eid && e.id === eid);
          const ed = e.data as TmEdgeData;
          const hasUserOffset = Boolean(ed.labelOffset);
          const label =
            isActive && activeRead !== undefined
              ? formatConstructionEdgeLabelWithActiveRead(
                  e.data as TmEdgeData,
                  activeRead
                )
              : formatEdgeRulesLabel(e.data as TmEdgeData | undefined);
          const dimOthers = hasActiveEdge && !isActive;
          const uniformDim = !hasActiveEdge;
          return {
            ...e,
            type: 'tmTransition',
            data: {
              ...ed,
              tmLabelSpotlight: isActive,
              tmLabelPlaybackNudge:
                isActive && !hasUserOffset ? { ...TM_LABEL_SPOTLIGHT_AUTO_NUDGE } : undefined,
            },
            animated: Boolean(pulse && isActive),
            className: pulse && isActive ? 'tm-construction-run-edge-active' : undefined,
            label,
            style: {
              stroke: isActive ? '#38bdf8' : dimOthers ? '#475569' : '#64748b',
              strokeWidth: isActive ? (frozenEdge ? 2.75 : 3.25) : 2,
              opacity: isActive
                ? frozenEdge
                  ? 0.88
                  : 1
                : dimOthers
                  ? 0.42
                  : uniformDim
                    ? 0.58
                    : 0.92,
              transition: 'stroke 0.28s ease, stroke-width 0.28s ease, opacity 0.28s ease',
            },
            labelStyle: {
              fill: isActive ? '#e0f2fe' : '#e2e8f0',
              fontSize: 11,
              fontWeight: isActive ? 600 : 500,
              whiteSpace: 'pre-line',
              lineHeight: 1.35,
            },
            labelBgStyle: {
              fill: isActive ? '#0c4a6e' : '#1e293b',
              fillOpacity: isActive ? 0.95 : 0.92,
            },
            labelBgPadding: [8, 10] as [number, number],
          };
        })
      );
    }

    const eid =
      constructionHighlight.kind === 'edge' ? constructionHighlight.edgeId : undefined;
    return sortEdgesWithSpotlightLast(
      baseGraph.edges.map((e) => {
      const isNew = Boolean(eid && e.id === eid);
      const ed = e.data as TmEdgeData;
      const hasUserOffset = Boolean(ed.labelOffset);
      const dim =
        appliedCount > 0 &&
        constructionHighlight.kind !== 'none' &&
        !isNew &&
        constructionHighlight.kind !== 'explain';
      return {
        ...e,
        type: 'tmTransition',
        data: {
          ...ed,
          tmLabelSpotlight: isNew,
          tmLabelPlaybackNudge:
            isNew && !hasUserOffset ? { ...TM_LABEL_SPOTLIGHT_AUTO_NUDGE } : undefined,
        },
        animated: isNew,
        label: formatEdgeRulesLabel(e.data as TmEdgeData | undefined),
        style: {
          stroke: isNew ? '#38bdf8' : dim ? '#475569' : '#64748b',
          strokeWidth: isNew ? 3 : 2,
          opacity: constructionHighlight.kind === 'explain' ? 0.45 : dim ? 0.4 : 1,
          transition: 'stroke 0.35s ease, stroke-width 0.35s ease, opacity 0.35s ease',
        },
        labelStyle: {
          fill: '#e2e8f0',
          fontSize: 11,
          fontWeight: 500,
          whiteSpace: 'pre-line',
          lineHeight: 1.35,
        },
        labelBgStyle: { fill: '#1e293b', fillOpacity: 0.92 },
        labelBgPadding: [8, 10] as [number, number],
      };
    })
    );
  }, [
    baseGraph.edges,
    tapeRunActive,
    tapeRun,
    activeEdgeId,
    tapeHalted,
    constructionHighlight,
    appliedCount,
  ]);

  const explanation = useMemo(
    () => tutorExplanationAtStep(steps, appliedCount),
    [steps, appliedCount]
  );

  const stepLabel = `${appliedCount} / ${maxApplied}`;

  const exampleRunPanel = useMemo(() => {
    if (!tapeRunActive || !tapeRun) return null;

    const m = tapeRun.machine;
    const formalLines: string[] = [];
    const proseParts: string[] = [];

    if (tapeRun.stepIndex === 0) {
      proseParts.push(initialRunProse(m));
    }

    if (tapeRun.implicitReject) {
      const { from, read } = tapeRun.implicitReject;
      formalLines.push(formatImplicitFormalLine(m, from, read));
      proseParts.push(implicitRejectProse(m, from, read));
    } else if (tapeRun.lastFired) {
      formalLines.push(formatRunFormalLine(m, tapeRun.lastFired));
      proseParts.push(runTransitionProse(m, tapeRun.lastFired));
    }

    if (tapeAtStepLimit) {
      proseParts.push(stepLimitProse());
    }

    return (
      <div
        className="rounded-lg border border-sky-900/60 bg-slate-900/90 p-4"
        role="region"
        aria-label="Example run diagram sync"
      >
        <p className="text-xs font-medium uppercase tracking-wide text-sky-500/90">
          Example run · diagram &amp; narration
        </p>
        <p className="mt-2 text-[11px] text-slate-500">
          Step {tapeRun.stepIndex} of this run
          {tapeRun.playing ? (
            <span className="ml-2 text-sky-400/90">· playing</span>
          ) : null}
        </p>
        {formalLines.length > 0 ? (
          <pre className="mt-2 whitespace-pre-wrap rounded-md border border-slate-700/80 bg-slate-950/80 p-2 font-mono text-[11px] leading-relaxed text-sky-100/95">
            {formalLines.join('\n')}
          </pre>
        ) : null}
        <p className="mt-2 text-sm leading-relaxed text-slate-200">{proseParts.join(' ')}</p>
      </div>
    );
  }, [tapeRunActive, tapeRun, tapeAtStepLimit]);

  const stepForward = useCallback(() => {
    setAppliedCount((c) => Math.min(maxApplied, c + 1));
  }, [maxApplied]);

  const stepBack = useCallback(() => {
    setAppliedCount((c) => Math.max(0, c - 1));
  }, []);

  useEffect(() => {
    setAppliedCount(0);
    setPlaying(false);
    setTapeRun(null);
  }, [challenge.id]);

  useEffect(() => {
    if (!playing) return;
    if (appliedCount >= maxApplied) {
      setPlaying(false);
      return;
    }
    const delay = TUTOR_SPEED_DELAY_MS[speed];
    const t = window.setTimeout(() => {
      if (!playingRef.current) return;
      setAppliedCount((c) => Math.min(maxApplied, c + 1));
    }, delay);
    return () => clearTimeout(t);
  }, [playing, appliedCount, maxApplied, speed]);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-violet-800/60 bg-violet-950/25 p-4">
        <p className="text-sm font-medium text-violet-200">Tutor mode (solution playback)</p>
        <p className="mt-1 text-sm text-slate-400">
          Watch the reference machine appear step by step. Explanations follow Sipser-style marking
          intuition: pair the leftmost <span className="font-mono text-slate-200">a</span> with the
          rightmost <span className="font-mono text-slate-200">b</span> until the tape prefix is all
          markers.
        </p>
        {(challenge.solutionSteps?.length ?? 0) > 0 && challenge.tutorTapeMachine ? (
          <div className="mt-3 flex flex-wrap items-end gap-3 border-t border-violet-800/40 pt-3">
            <label className="block text-xs text-slate-400">
              Lecture execution input
              <select
                className="mt-1 block w-full min-w-[10rem] rounded-md border border-slate-600 bg-slate-950 px-2 py-1.5 font-mono text-sm text-slate-100"
                value={lectureRunInput}
                onChange={(e) => setLectureRunInput(e.target.value)}
              >
                {(challenge.tutorDemoInputs ?? ['']).map((s) => (
                  <option key={s === '' ? 'epsilon' : s} value={s}>
                    {s === '' ? 'ε (empty)' : s}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="rounded-md bg-fuchsia-600 px-4 py-2 text-sm font-medium text-white hover:bg-fuchsia-500"
              onClick={() => setLectureOpen(true)}
            >
              Lecture mode (fullscreen)
            </button>
          </div>
        ) : null}
      </div>

      <FullscreenGuidedPlayback
        open={lectureOpen}
        onClose={() => setLectureOpen(false)}
        challenge={challenge}
        runInput={lectureRunInput}
        stepIndex={lectureStepIndex}
        onStepIndexChange={setLectureStepIndex}
        userEdgesForLabelOffsets={userLabelEdges}
      />

      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="min-h-[420px] rounded-lg border border-slate-700 bg-slate-950">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={NODE_TYPES}
              edgeTypes={EDGE_TYPES}
              fitView
              fitViewOptions={{ padding: 0.2 }}
              className="bg-slate-950"
              proOptions={{ hideAttribution: true }}
              nodesDraggable={false}
              nodesConnectable={false}
              elementsSelectable={false}
              deleteKeyCode={null}
              panOnScroll
              zoomOnScroll
            >
              <Background gap={16} color="#334155" />
              <Controls className="!border-slate-600 !bg-slate-900 [&_button]:!border-slate-600 [&_button]:!bg-slate-800 [&_button]:!fill-slate-200" />
            </ReactFlow>
          </div>
          {exampleRunPanel}
        </div>

        <div className="w-full shrink-0 space-y-3 lg:w-80">
          <div
            className="rounded-lg border border-slate-700 bg-slate-900/90 p-4"
            role="region"
            aria-label="Step explanation"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              This step
            </p>
            <p className="mt-2 min-h-[4.5rem] text-sm leading-relaxed text-slate-100">
              {explanation}
            </p>
            <p className="mt-3 text-xs text-slate-500">Progress: {stepLabel}</p>
          </div>

          <div className="rounded-lg border border-slate-700 bg-slate-900/80 p-3">
            <p className="text-xs font-medium text-slate-400">Playback</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-40"
                disabled={playing || tutorComplete}
                onClick={() => setPlaying(true)}
              >
                Play
              </button>
              <button
                type="button"
                className="rounded-md border border-slate-600 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800 disabled:opacity-40"
                disabled={!playing}
                onClick={() => setPlaying(false)}
              >
                Pause
              </button>
              <button
                type="button"
                className="rounded-md border border-slate-600 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800"
                onClick={() => {
                  setPlaying(false);
                  stepBack();
                }}
              >
                Step back
              </button>
              <button
                type="button"
                className="rounded-md border border-slate-600 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800 disabled:opacity-40"
                disabled={tutorComplete}
                onClick={() => {
                  setPlaying(false);
                  stepForward();
                }}
              >
                Step forward
              </button>
              <button
                type="button"
                className="rounded-md border border-slate-600 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800"
                onClick={() => {
                  setPlaying(false);
                  setAppliedCount(0);
                }}
              >
                Reset
              </button>
            </div>
            <label className="mt-3 block text-xs text-slate-500">
              Speed
              <select
                className="mt-1 w-full rounded-md border border-slate-600 bg-slate-950 px-2 py-1.5 text-sm text-slate-100"
                value={speed}
                onChange={(e) => setSpeed(e.target.value as TutorPlaybackSpeed)}
              >
                <option value="slow">Slow</option>
                <option value="normal">Normal</option>
                <option value="fast">Fast</option>
              </select>
            </label>
          </div>

          {challenge.tutorTapeMachine ? (
            <TutorTapeDemo
              machineInput={challenge.tutorTapeMachine}
              demoInputs={challenge.tutorDemoInputs ?? ['']}
              enabled={tutorComplete}
              maxSteps={challenge.maxSteps}
              onRunSync={onTapeRunSync}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
