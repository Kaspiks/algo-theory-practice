import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { resolveDiagramNodes } from '@/lib/tm/diagramLayout';
import {
  computeStateDiagramScene,
  type DiagramScenePreset,
} from '@/lib/tm/stateDiagramScene';
import {
  computeDiagramEdgeHighlight,
  isTransitionFocusDimmingActive,
  type DiagramEdgeHighlightState,
} from '@/lib/tm/stepAnimation';
import type { StateId, TransitionFired, TuringMachineDefinition } from '@/types/tm';

/** Optional manual positions (centers); auto layout is used when omitted. */
export interface DiagramLayout {
  positions: Record<StateId, { x: number; y: number }>;
}

export type DiagramSize = 'embedded' | 'expanded';

const SIZE_PRESETS: Record<
  DiagramSize,
  {
    padding: number;
    edgeStrokeNormal: number;
    edgeStrokeHi: number;
    markerW: number;
    markerH: number;
    edgeLabelMaxChars: number;
    stateTextClass: string;
    edgeTextClass: string;
    edgeCharWidth: number;
    rectRx: number;
    outerRing: number;
  }
> = {
  embedded: {
    padding: 80,
    edgeStrokeNormal: 1.85,
    edgeStrokeHi: 3.4,
    markerW: 11,
    markerH: 11,
    edgeLabelMaxChars: 48,
    stateTextClass: 'text-[14px] font-semibold tracking-tight',
    edgeTextClass: 'text-[12px] font-medium',
    edgeCharWidth: 6.35,
    rectRx: 10,
    outerRing: 5,
  },
  expanded: {
    padding: 104,
    edgeStrokeNormal: 2.6,
    edgeStrokeHi: 4.5,
    markerW: 14,
    markerH: 14,
    edgeLabelMaxChars: 64,
    stateTextClass: 'text-lg font-semibold tracking-tight',
    edgeTextClass: 'text-[16px] font-medium',
    edgeCharWidth: 8.35,
    rectRx: 12,
    outerRing: 7,
  },
};

/** Layout preset slice for `computeStateDiagramScene` (keeps Fit zoom in sync with the SVG). */
export function diagramScenePreset(size: DiagramSize): DiagramScenePreset {
  const p = SIZE_PRESETS[size];
  return {
    padding: p.padding,
    outerRing: p.outerRing,
    edgeLabelMaxChars: p.edgeLabelMaxChars,
    edgeCharWidth: p.edgeCharWidth,
  };
}

export interface StateDiagramViewerProps {
  machine: TuringMachineDefinition;
  currentState: StateId;
  /** When set, this state is drawn as active (e.g. mid-step animation). */
  displayState?: StateId;
  lastTransition?: TransitionFired;
  /** Strong edge highlight for in-flight step (takes precedence over lastTransition for matching). */
  transitionHighlight?: TransitionFired;
  /** Subtle pulse on the highlighted transition edge (step animation). */
  pulseActiveTransitionEdge?: boolean;
  /** Soft pulse on a state that is the transition target but not yet active. */
  destinationHintState?: StateId | null;
  /** Brief pulse on the active state when it first becomes current (step animation). */
  nextStateEntryPulse?: boolean;
  layout?: DiagramLayout;
  /** embedded = compact panel; expanded = large readable modal content */
  size?: DiagramSize;
  /** Unique prefix for SVG defs (marker id) when multiple SVGs mount */
  svgIdPrefix?: string;
  /** Hide outer card chrome (modal provides its own) */
  bare?: boolean;
}

export function StateDiagramViewer({
  machine,
  currentState,
  displayState,
  lastTransition,
  transitionHighlight,
  pulseActiveTransitionEdge = false,
  destinationHintState = null,
  nextStateEntryPulse = false,
  layout: layoutProp,
  size = 'embedded',
  svgIdPrefix,
  bare = false,
}: StateDiagramViewerProps) {
  const reactId = useId().replace(/:/g, '');
  const markerId = `${svgIdPrefix ?? reactId}-arrow`;
  const [hoverEdge, setHoverEdge] = useState<string | null>(null);

  const nodes = useMemo(
    () => resolveDiagramNodes(machine, size, layoutProp ?? null),
    [machine, size, layoutProp]
  );

  const preset = SIZE_PRESETS[size];
  const stateForNodes = displayState ?? currentState;
  const edgeHighlightSource = transitionHighlight ?? lastTransition;
  /** True only while a step animation is highlighting a concrete transition (not static `lastTransition`). */
  const animTransitionFocus = isTransitionFocusDimmingActive(transitionHighlight);

  const hitStrokeW = size === 'expanded' ? 22 : 18;
  /** Inactive edges during transition-focus: clearly secondary vs active. */
  const dimEdgePathOp = 0.28;
  /** Inactive labels during transition-focus: ~40% group opacity + muted chip/text. */
  const dimLabelGroupOp = 0.4;

  const { vx, vy, vw, vh, edgeLayouts } = useMemo(
    () =>
      computeStateDiagramScene(machine, nodes, size, diagramScenePreset(size)),
    [machine, nodes, size]
  );

  /** One highlight decision per edge key — edge paths and label chips must stay identical. */
  const edgeHighlightByKey = useMemo(() => {
    const m = new Map<string, DiagramEdgeHighlightState>();
    for (const eg of edgeLayouts) {
      m.set(
        eg.key,
        computeDiagramEdgeHighlight(
          { from: eg.from, to: eg.to, fullLabel: eg.fullLabel },
          {
            edgeHighlightSource,
            transitionHighlight,
            pulseActiveTransitionEdge,
          }
        )
      );
    }
    return m;
  }, [
    edgeLayouts,
    edgeHighlightSource,
    transitionHighlight,
    pulseActiveTransitionEdge,
  ]);

  const svgInner = (
    <svg
      width="100%"
      height="100%"
      viewBox={`${vx} ${vy} ${vw} ${vh}`}
      className="text-slate-200"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Turing machine state diagram"
      data-tm-transition-focus={animTransitionFocus ? 'true' : undefined}
    >
      <defs>
        <marker
          id={markerId}
          markerWidth={preset.markerW}
          markerHeight={preset.markerH}
          refX={preset.markerW * 0.78}
          refY={preset.markerH * 0.5}
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <path
            d={`M0,0 L${preset.markerW},${preset.markerH * 0.5} L0,${preset.markerH} Z`}
            fill="currentColor"
          />
        </marker>
      </defs>
      <rect
        className="tm-diagram-spotlight-underlay"
        x={vx}
        y={vy}
        width={vw}
        height={vh}
        fill="#020617"
        fillOpacity={0.2}
        pointerEvents="none"
        aria-hidden
        style={{ opacity: animTransitionFocus ? 1 : 0 }}
      />
      {edgeLayouts.map((eg) => {
        const { isActive, isAnimPulse } = edgeHighlightByKey.get(eg.key)!;
        const hovered = hoverEdge === eg.key;
        const strokeColor = isActive
          ? isAnimPulse
            ? '#fde047'
            : '#fbbf24'
          : hovered
            ? '#94a3b8'
            : animTransitionFocus
              ? '#4b5563'
              : '#5b6a7f';
        const strokeW = isActive
          ? isAnimPulse
            ? preset.edgeStrokeHi + 1.1
            : preset.edgeStrokeHi
          : hovered
            ? preset.edgeStrokeNormal + 0.6
            : preset.edgeStrokeNormal;
        const pathOp =
          isActive || hovered
            ? 1
            : animTransitionFocus
              ? dimEdgePathOp
              : 0.68;

        return (
          <g
            key={eg.key}
            data-tm-edge-key={eg.key}
            data-tm-edge-active={isActive ? 'true' : undefined}
            data-tm-anim-focus={animTransitionFocus ? 'true' : undefined}
            className="cursor-default"
            style={{ cursor: 'default' }}
            onMouseEnter={() => setHoverEdge(eg.key)}
            onMouseLeave={() => setHoverEdge(null)}
          >
            <path
              d={eg.pathD}
              fill="none"
              stroke="transparent"
              strokeWidth={hitStrokeW}
              strokeLinecap="round"
              strokeLinejoin="round"
              pointerEvents="stroke"
              style={{ opacity: pathOp }}
            />
            <path
              d={eg.pathD}
              fill="none"
              stroke={strokeColor}
              strokeWidth={strokeW}
              strokeLinecap="round"
              strokeLinejoin="round"
              markerEnd={`url(#${markerId})`}
              pointerEvents="none"
              className={isAnimPulse ? 'tm-diagram-edge-pulse' : undefined}
              style={{ opacity: pathOp }}
            />
          </g>
        );
      })}
      <g
        className="tm-diagram-nodes-spotlight"
        style={{ opacity: animTransitionFocus ? 0.88 : 1 }}
      >
        {machine.states.map((s) => {
          const n = nodes[s];
          if (!n) return null;
          const isAccept = s === machine.accept;
          const isReject = s === machine.reject;
          const isCurrent = s === stateForNodes;
          const showDestHint =
            destinationHintState != null &&
            s === destinationHintState &&
            s !== stateForNodes;
          const { cx, cy, w, h } = n;
          const x0 = cx - w / 2;
          const y0 = cy - h / 2;
          const nodeOpacity = isCurrent
            ? 1
            : isAccept || isReject
              ? 0.82
              : 0.52;
          const termOuterW = w + preset.outerRing * 2 + (isCurrent ? 4 : 0);
          const termOuterH = h + preset.outerRing * 2 + (isCurrent ? 4 : 0);
          return (
            <g
              key={s}
              style={{
                opacity: nodeOpacity,
                transition: 'opacity 0.25s ease, transform 0.28s ease',
                transform: isCurrent
                  ? `translate(${cx}px, ${cy}px) scale(1.08) translate(${-cx}px, ${-cy}px)`
                  : undefined,
              }}
            >
            {showDestHint ? (
              <rect
                x={x0 - 5}
                y={y0 - 5}
                width={w + 10}
                height={h + 10}
                rx={preset.rectRx + 5}
                fill="none"
                stroke="#38bdf8"
                strokeWidth={2}
                className="tm-node-destination-hint"
              />
            ) : null}
            {isAccept || isReject ? (
              <rect
                x={cx - termOuterW / 2}
                y={cy - termOuterH / 2}
                width={termOuterW}
                height={termOuterH}
                rx={preset.rectRx + 4}
                fill="none"
                stroke={isCurrent ? '#fcd34d' : '#94a3b8'}
                strokeWidth={isCurrent ? 3.2 : 2.2}
                className={
                  isCurrent && nextStateEntryPulse
                    ? 'tm-node-state-entry'
                    : undefined
                }
              />
            ) : null}
            <rect
              x={x0}
              y={y0}
              width={w}
              height={h}
              rx={preset.rectRx}
              fill={
                isCurrent
                  ? '#334155'
                  : isAccept
                    ? '#0f172a'
                    : isReject
                      ? '#0f172a'
                      : '#0c1222'
              }
              stroke={isCurrent ? '#fcd34d' : isAccept || isReject ? '#64748b' : '#475569'}
              strokeWidth={isCurrent ? 3.4 : 2.1}
              className={
                isCurrent && nextStateEntryPulse && !(isAccept || isReject)
                  ? 'tm-node-state-entry'
                  : undefined
              }
            />
            <text
              x={cx}
              y={cy}
              textAnchor="middle"
              dominantBaseline="middle"
              className={`fill-slate-50 ${preset.stateTextClass}`}
            >
              {s}
            </text>
          </g>
          );
        })}
      </g>
      {edgeLayouts.map((eg) => {
        const { isActive, isAnimPulse } = edgeHighlightByKey.get(eg.key)!;
        const hovered = hoverEdge === eg.key;
        const inSpotlight = isActive && animTransitionFocus;
        const labelOp =
          isActive || hovered
            ? 1
            : animTransitionFocus
              ? dimLabelGroupOp
              : 0.9;

        const chipFill = (() => {
          if (!isActive) return '#020617';
          if (animTransitionFocus) {
            return isAnimPulse ? '#c2410c' : '#b45309';
          }
          return isAnimPulse ? '#78350f' : '#451a03';
        })();

        /** Inactive: dark muted rims; active: bright amber/yellow (unchanged). */
        const chipStroke = (() => {
          if (!isActive) {
            if (animTransitionFocus) {
              return hovered ? '#334155' : '#0c1222';
            }
            return hovered ? '#64748b' : '#475569';
          }
          if (animTransitionFocus) {
            return isAnimPulse ? '#fef9c3' : '#fde047';
          }
          return isAnimPulse ? '#fde047' : '#fbbf24';
        })();

        const chipStrokeW = isActive
          ? animTransitionFocus
            ? isAnimPulse
              ? 2.85
              : 2.55
            : isAnimPulse
              ? 2.35
              : 2
          : animTransitionFocus
            ? 1.05
            : 1;

        const chipPadY = size === 'expanded' ? 2 : 1.5;
        const chipExtraH = size === 'expanded' ? 4 : 3;
        const chipRx = size === 'expanded' ? 6 : 5;

        const labelSpotlightClass = [
          isAnimPulse ? 'tm-diagram-edge-label-pulse' : '',
          inSpotlight && !isAnimPulse ? 'tm-diagram-edge-label-spotlight' : '',
        ]
          .join(' ')
          .trim();

        const labelTransform =
          inSpotlight
            ? `translate(${eg.lx}, ${eg.ly}) scale(1.08) translate(${-eg.lx}, ${-eg.ly})`
            : undefined;

        return (
          <g
            key={`${eg.key}-label`}
            data-tm-edge-key={eg.key}
            data-tm-edge-active={isActive ? 'true' : undefined}
            data-tm-anim-focus={animTransitionFocus ? 'true' : undefined}
            pointerEvents="none"
            className={labelSpotlightClass || undefined}
            style={{
              opacity: labelOp,
              transform: labelTransform,
            }}
          >
            <rect
              x={eg.lx - eg.lw / 2}
              y={eg.ly - eg.lh / 2 - chipPadY}
              width={eg.lw}
              height={eg.lh + chipExtraH}
              rx={chipRx}
              fill={chipFill}
              fillOpacity={
                isActive
                  ? 1
                  : animTransitionFocus && !hovered
                    ? 0.72
                    : 0.97
              }
              stroke={chipStroke}
              strokeWidth={chipStrokeW}
              strokeOpacity={
                isActive
                  ? 1
                  : animTransitionFocus && !hovered
                    ? 0.88
                    : 0.94
              }
            />
            <text
              x={eg.lx}
              y={eg.ly}
              textAnchor="middle"
              dominantBaseline="middle"
              className={
                isActive
                  ? animTransitionFocus
                    ? `fill-yellow-50 ${preset.edgeTextClass} font-bold`
                    : `fill-amber-50 ${preset.edgeTextClass} font-semibold`
                  : animTransitionFocus && !hovered
                    ? `fill-slate-500 ${preset.edgeTextClass}`
                    : `fill-slate-100 ${preset.edgeTextClass}`
              }
            >
              {eg.label}
            </text>
          </g>
        );
      })}
    </svg>
  );

  const footer = (
    <p className="mt-2 text-xs text-slate-500">
      Start: {machine.start} · Accept: {machine.accept} · Reject:{' '}
      {machine.reject}
    </p>
  );

  if (bare) {
    return svgInner;
  }

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900/80 p-4">
      <p className="mb-2 text-sm font-medium text-slate-400">State diagram</p>
      <div
        className={
          size === 'embedded'
            ? 'max-h-64 min-h-[180px] w-full'
            : 'min-h-[min(70vh,520px)] w-full'
        }
      >
        {svgInner}
      </div>
      {footer}
    </div>
  );
}

const ZOOM_MIN = 0.6;
const ZOOM_MAX = 2.25;
const ZOOM_STEP = 0.15;

export interface StateDiagramExpandableProps {
  machine: TuringMachineDefinition;
  currentState: StateId;
  displayState?: StateId;
  lastTransition?: TransitionFired;
  transitionHighlight?: TransitionFired;
  pulseActiveTransitionEdge?: boolean;
  destinationHintState?: StateId | null;
  nextStateEntryPulse?: boolean;
  layout?: DiagramLayout;
}

export function StateDiagramExpandable({
  machine,
  currentState,
  displayState,
  lastTransition,
  transitionHighlight,
  pulseActiveTransitionEdge,
  destinationHintState,
  nextStateEntryPulse,
  layout,
}: StateDiagramExpandableProps) {
  const [open, setOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const modalCanvasRef = useRef<HTMLDivElement>(null);

  const expandedNodes = useMemo(
    () => resolveDiagramNodes(machine, 'expanded', layout ?? null),
    [machine, layout]
  );

  /** Full SVG extent including edge labels — must match modal `StateDiagramViewer` viewBox. */
  const expandedScene = useMemo(
    () =>
      computeStateDiagramScene(
        machine,
        expandedNodes,
        'expanded',
        diagramScenePreset('expanded')
      ),
    [expandedNodes, machine]
  );

  const resetZoom = useCallback(() => {
    setZoom(1);
  }, []);

  const fitZoomToScreen = useCallback(() => {
    const el = modalCanvasRef.current;
    if (!el) {
      setZoom(1);
      return;
    }
    const pad = 24;
    const cr = el.getBoundingClientRect();
    const boxW = Math.max(80, cr.width - pad);
    const boxH = Math.max(80, cr.height - pad);
    const scaleW = boxW / expandedScene.vw;
    const scaleH = boxH / expandedScene.vh;
    const next = Math.min(scaleW, scaleH) * 0.92;
    setZoom(
      Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, Math.round(next * 100) / 100))
    );
  }, [expandedScene.vh, expandedScene.vw]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => fitZoomToScreen(), 50);
    return () => window.clearTimeout(t);
  }, [open, machine.id, fitZoomToScreen]);

  const modal = open
    ? createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
          role="presentation"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/75 backdrop-blur-[1px]"
            aria-label="Close diagram"
            onClick={() => setOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="state-diagram-modal-title"
            className="relative z-[101] flex max-h-[92vh] w-full max-w-[min(96vw,1100px)] flex-col rounded-xl border border-slate-600 bg-slate-900 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700 px-4 py-3">
              <h2
                id="state-diagram-modal-title"
                className="text-lg font-semibold text-slate-100"
              >
                State diagram
              </h2>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-500">Zoom</span>
                <button
                  type="button"
                  className="rounded border border-slate-600 px-2 py-1 text-sm text-slate-200 hover:bg-slate-800"
                  onClick={() =>
                    setZoom((z) =>
                      Math.max(ZOOM_MIN, Math.round((z - ZOOM_STEP) * 100) / 100)
                    )
                  }
                  aria-label="Zoom out"
                >
                  −
                </button>
                <button
                  type="button"
                  className="min-w-[3.5rem] rounded border border-slate-600 px-2 py-1 text-center text-xs text-slate-300"
                  onClick={resetZoom}
                  title="Reset zoom to 100%"
                >
                  {Math.round(zoom * 100)}%
                </button>
                <button
                  type="button"
                  className="rounded border border-slate-600 px-2 py-1 text-sm text-slate-200 hover:bg-slate-800"
                  onClick={() =>
                    setZoom((z) =>
                      Math.min(ZOOM_MAX, Math.round((z + ZOOM_STEP) * 100) / 100)
                    )
                  }
                  aria-label="Zoom in"
                >
                  +
                </button>
                <button
                  type="button"
                  className="ml-1 rounded border border-slate-600 px-2 py-1 text-xs text-slate-300 hover:bg-slate-800"
                  onClick={fitZoomToScreen}
                  title="Scale diagram to fit the viewport"
                >
                  Fit
                </button>
                <button
                  type="button"
                  className="ml-2 rounded-md bg-slate-700 px-3 py-1.5 text-sm font-medium text-slate-100 hover:bg-slate-600"
                  onClick={() => setOpen(false)}
                >
                  Close
                </button>
              </div>
            </div>
            <div
              ref={modalCanvasRef}
              className="flex min-h-[min(75vh,640px)] flex-1 items-center justify-center overflow-auto p-4"
            >
              <div
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: 'center center',
                  width: '100%',
                  height: 'min(70vh, 600px)',
                  maxWidth: '100%',
                }}
              >
                <StateDiagramViewer
                  machine={machine}
                  currentState={currentState}
                  displayState={displayState}
                  lastTransition={lastTransition}
                  transitionHighlight={transitionHighlight}
                  pulseActiveTransitionEdge={pulseActiveTransitionEdge}
                  destinationHintState={destinationHintState}
                  nextStateEntryPulse={nextStateEntryPulse}
                  layout={layout}
                  size="expanded"
                  svgIdPrefix="modal-diagram"
                  bare
                />
              </div>
            </div>
            <div className="border-t border-slate-700 px-4 py-2 text-center text-xs text-slate-500">
              Start: {machine.start} · Accept: {machine.accept} · Reject:{' '}
              {machine.reject} · Press Escape or click outside to close
            </div>
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <>
      <div className="rounded-lg border border-slate-700 bg-slate-900/80 p-4">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium text-slate-400">State diagram</p>
          <button
            type="button"
            className="rounded-md border border-amber-500/50 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-200 hover:bg-amber-500/20"
            onClick={() => setOpen(true)}
          >
            Expand diagram
          </button>
        </div>
        <div className="max-h-64 min-h-[180px] w-full">
          <StateDiagramViewer
            machine={machine}
            currentState={currentState}
            displayState={displayState}
            lastTransition={lastTransition}
            transitionHighlight={transitionHighlight}
            pulseActiveTransitionEdge={pulseActiveTransitionEdge}
            destinationHintState={destinationHintState}
            nextStateEntryPulse={nextStateEntryPulse}
            layout={layout}
            size="embedded"
            svgIdPrefix="embedded-diagram"
            bare
          />
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Start: {machine.start} · Accept: {machine.accept} · Reject:{' '}
          {machine.reject}
        </p>
      </div>
      {modal}
    </>
  );
}
