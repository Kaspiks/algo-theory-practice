import type { Edge, Node } from '@xyflow/react';

import {
  graphAfterSolutionSteps,
  tutorHighlightForAppliedCount,
} from '@/features/tm-construction/applySolutionSteps';
import {
  findConstructionEdgeIdForFired,
  formatConstructionEdgeLabelWithActiveRead,
} from '@/features/tm-construction/tapeRunDiagram';
import {
  formatEdgeRulesLabel,
  TM_LABEL_SPOTLIGHT_AUTO_NUDGE,
  type TmEdgeData,
  type TmStateNodeData,
} from '@/features/tm-construction/flowTypes';
import { mergeEdgeLabelOffsetsFromUserEdges } from '@/features/tm-construction/mergeEdgeLabelOffsets';
import { sortEdgesWithSpotlightLast } from '@/features/tm-construction/sortEdgesForLabelLayering';
import type { GuidedPlaybackStep } from '@/types/guidedPlayback';
import type { TmSolutionStep } from '@/types/tmConstructionSolution';

export function nodesAndEdgesForGuidedStep(
  solutionSteps: TmSolutionStep[],
  step: GuidedPlaybackStep,
  playing: boolean,
  userEdgesForLabelOffsets?: Edge<TmEdgeData>[]
): { nodes: Node<TmStateNodeData>[]; edges: Edge<TmEdgeData>[] } {
  const raw = graphAfterSolutionSteps(
    solutionSteps,
    step.constructionAppliedCount
  );
  const mergedEdges = mergeEdgeLabelOffsetsFromUserEdges(
    raw.edges as Edge<TmEdgeData>[],
    userEdgesForLabelOffsets ?? []
  );
  const baseGraph = { ...raw, edges: mergedEdges };

  if (step.phase === 'run') {
    const m = step.machine;
    const cur = step.config.state;
    const acc = cur === m.accept;
    const rej = cur === m.reject;
    const running = !acc && !rej;
    const tapeHalted = acc || rej;

    const activeEdgeId = step.lastFired
      ? findConstructionEdgeIdForFired(
          baseGraph.edges as Edge<TmEdgeData>[],
          step.lastFired
        )
      : null;

    const pulse =
      playing &&
      !tapeHalted &&
      Boolean(activeEdgeId) &&
      Boolean(step.lastFired);
    const frozenEdge = Boolean(activeEdgeId && tapeHalted && step.lastFired);
    const hasActiveEdge = Boolean(activeEdgeId);

    const nodes: Node<TmStateNodeData>[] = baseGraph.nodes.map((n) => {
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

    const activeRead =
      activeEdgeId && step.lastFired ? step.lastFired.read : undefined;

    const edges: Edge<TmEdgeData>[] = baseGraph.edges.map((e) => {
      const isActive = Boolean(activeEdgeId && e.id === activeEdgeId);
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
    });

    return { nodes, edges: sortEdgesWithSpotlightLast(edges) };
  }

  const highlight = tutorHighlightForAppliedCount(
    solutionSteps,
    step.constructionAppliedCount
  );
  const hid = highlight.kind === 'state' ? highlight.stateId : undefined;
  const eHighlight =
    highlight.kind === 'edge' ? highlight.edgeId : undefined;

  const nodes: Node<TmStateNodeData>[] = baseGraph.nodes.map((n) => {
    const spotlight = Boolean(hid && n.id === hid);
    const dim =
      step.constructionAppliedCount > 0 &&
      (highlight.kind === 'explain' ||
        (highlight.kind === 'state' && !spotlight) ||
        highlight.kind === 'edge');
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

  const edges: Edge<TmEdgeData>[] = baseGraph.edges.map((e) => {
    const isNew = Boolean(eHighlight && e.id === eHighlight);
    const ed = e.data as TmEdgeData;
    const hasUserOffset = Boolean(ed.labelOffset);
    const dim =
      step.constructionAppliedCount > 0 &&
      highlight.kind !== 'none' &&
      !isNew &&
      highlight.kind !== 'explain';
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
        opacity: highlight.kind === 'explain' ? 0.45 : dim ? 0.4 : 1,
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
  });

  return { nodes, edges: sortEdgesWithSpotlightLast(edges) };
}
