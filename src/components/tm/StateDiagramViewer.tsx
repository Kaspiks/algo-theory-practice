import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import {
  computeDiagramViewBox,
  resolveDiagramNodes,
  type DiagramNodeBox,
} from '@/lib/tm/diagramLayout';
import { edgeGraphicMatchesFired } from '@/lib/tm/stepAnimation';
import type { StateId, TransitionFired, TuringMachineDefinition } from '@/types/tm';

/** Optional manual positions (centers); auto layout is used when omitted. */
export interface DiagramLayout {
  positions: Record<StateId, { x: number; y: number }>;
}

function edgeLabels(machine: TuringMachineDefinition): {
  from: StateId;
  to: StateId;
  label: string;
}[] {
  const edges: { from: StateId; to: StateId; parts: string[] }[] = [];
  const map = new Map<string, { from: StateId; to: StateId; parts: string[] }>();

  for (const [from, row] of Object.entries(machine.transitions)) {
    if (!row) continue;
    for (const [read, rule] of Object.entries(row)) {
      if (!rule) continue;
      const key = `${from}->${rule.next}`;
      const label = `${read}→${rule.write},${rule.move}`;
      let e = map.get(key);
      if (!e) {
        e = { from, to: rule.next, parts: [] };
        map.set(key, e);
        edges.push(e);
      }
      e.parts.push(label);
    }
  }

  return edges.map((e) => ({
    from: e.from,
    to: e.to,
    label: e.parts.join(' | '),
  }));
}

function anchorsForward(
  a: DiagramNodeBox,
  b: DiagramNodeBox
): { ex: number; ey: number; ix: number; iy: number } {
  const forward = b.cx >= a.cx;
  if (forward) {
    return {
      ex: a.cx + a.w / 2,
      ey: a.cy,
      ix: b.cx - b.w / 2,
      iy: b.cy,
    };
  }
  return {
    ex: a.cx - a.w / 2,
    ey: a.cy,
    ix: b.cx + b.w / 2,
    iy: b.cy,
  };
}

function cubicEdgePath(
  ex: number,
  ey: number,
  ix: number,
  iy: number,
  ySkew: number
): string {
  const span = Math.abs(ix - ex);
  const t = Math.min(140, Math.max(56, span * 0.42));
  const sign = ix >= ex ? 1 : -1;
  return `M ${ex} ${ey} C ${ex + sign * t} ${ey + ySkew} ${ix - sign * t} ${iy + ySkew} ${ix} ${iy}`;
}

function selfLoopPath(n: DiagramNodeBox): { d: string; lx: number; ly: number } {
  const { cx, cy, w, h } = n;
  const outX = cx + w / 2 + 4;
  const lift = Math.max(52, h * 0.85);
  const d = `M ${outX} ${cy} C ${outX + 52} ${cy - lift} ${outX + 52} ${cy + lift} ${outX} ${cy}`;
  return { d, lx: outX + 36, ly: cy - lift * 0.45 };
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
    labelYOffset: number;
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
    edgeCharWidth: 6.4,
    rectRx: 10,
    outerRing: 5,
    labelYOffset: 20,
  },
  expanded: {
    padding: 104,
    edgeStrokeNormal: 2.6,
    edgeStrokeHi: 4.5,
    markerW: 14,
    markerH: 14,
    edgeLabelMaxChars: 64,
    stateTextClass: 'text-lg font-semibold tracking-tight',
    edgeTextClass: 'text-[15px] font-medium',
    edgeCharWidth: 8,
    rectRx: 12,
    outerRing: 7,
    labelYOffset: 26,
  },
};

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

  const edges = useMemo(() => edgeLabels(machine), [machine]);
  const preset = SIZE_PRESETS[size];
  const stateForNodes = displayState ?? currentState;
  const edgeHighlightSource = transitionHighlight ?? lastTransition;

  const { x: vx, y: vy, w: vw, h: vh } = useMemo(
    () => computeDiagramViewBox(nodes, machine, preset.padding),
    [nodes, machine, preset.padding]
  );

  const svgInner = (
    <svg
      width="100%"
      height="100%"
      viewBox={`${vx} ${vy} ${vw} ${vh}`}
      className="text-slate-200"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Turing machine state diagram"
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
      {edges.map((e, i) => {
          const a = nodes[e.from];
          const b = nodes[e.to];
          if (!a || !b) return null;
          const key = `${e.from}|${e.to}|${e.label}`;
          const highlighted =
            edgeHighlightSource &&
            edgeGraphicMatchesFired(
              { from: e.from, to: e.to, label: e.label },
              edgeHighlightSource
            );
          const pulseEdge = Boolean(
            transitionHighlight &&
              edgeGraphicMatchesFired(
                { from: e.from, to: e.to, label: e.label },
                transitionHighlight
              )
          );
          const edgeAnimPulse = pulseEdge && pulseActiveTransitionEdge;
          const hovered = hoverEdge === key;
          const ySkew = ((i % 9) - 4) * 7;
          const strokeColor = highlighted
            ? pulseEdge
              ? '#fde047'
              : '#fbbf24'
            : hovered
              ? '#94a3b8'
              : '#5b6a7f';
          const strokeW = highlighted
            ? pulseEdge
              ? preset.edgeStrokeHi + 1.1
              : preset.edgeStrokeHi
            : hovered
              ? preset.edgeStrokeNormal + 0.6
              : preset.edgeStrokeNormal;
          const label =
            e.label.length > preset.edgeLabelMaxChars
              ? `${e.label.slice(0, preset.edgeLabelMaxChars - 1)}…`
              : e.label;
          const lw = Math.min(
            vw * 0.42,
            label.length * preset.edgeCharWidth + 14
          );
          const lh = size === 'expanded' ? 22 : 18;

          if (e.from === e.to) {
            const { d, lx, ly } = selfLoopPath(a);
            const op = highlighted || hovered ? 1 : 0.68;
            return (
              <g
                key={key}
                opacity={op}
                className="cursor-default"
                onMouseEnter={() => setHoverEdge(key)}
                onMouseLeave={() => setHoverEdge(null)}
              >
                <path
                  d={d}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={strokeW}
                  markerEnd={`url(#${markerId})`}
                  className={edgeAnimPulse ? 'tm-diagram-edge-pulse' : undefined}
                />
                <rect
                  x={lx - lw / 2}
                  y={ly - lh / 2 - 4}
                  width={lw}
                  height={lh}
                  rx={5}
                  fill="#020617"
                  fillOpacity={0.88}
                  stroke="#334155"
                  strokeWidth={0.8}
                />
                <text
                  x={lx}
                  y={ly}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className={`fill-slate-200 ${preset.edgeTextClass}`}
                >
                  {label}
                </text>
              </g>
            );
          }

          const { ex, ey, ix, iy } = anchorsForward(a, b);
          const d = cubicEdgePath(ex, ey, ix, iy, ySkew);
          const midX = (ex + ix) / 2;
          const midY = (ey + iy) / 2 - preset.labelYOffset - ySkew * 0.15;
          const op = highlighted || hovered ? 1 : 0.65;

          return (
            <g
              key={key}
              opacity={op}
              onMouseEnter={() => setHoverEdge(key)}
              onMouseLeave={() => setHoverEdge(null)}
              style={{ cursor: 'default' }}
            >
              <path
                d={d}
                fill="none"
                stroke={strokeColor}
                strokeWidth={strokeW}
                markerEnd={`url(#${markerId})`}
                className={edgeAnimPulse ? 'tm-diagram-edge-pulse' : undefined}
              />
              <rect
                x={midX - lw / 2}
                y={midY - lh / 2}
                width={lw}
                height={lh}
                rx={5}
                fill="#020617"
                fillOpacity={0.9}
                stroke={highlighted ? '#f59e0b' : '#334155'}
                strokeWidth={highlighted ? 1 : 0.75}
              />
              <text
                x={midX}
                y={midY}
                textAnchor="middle"
                dominantBaseline="middle"
                className={`fill-slate-100 ${preset.edgeTextClass}`}
              >
                {label}
              </text>
            </g>
          );
        })}
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

  const expandedViewBox = useMemo(() => {
    const p = SIZE_PRESETS.expanded;
    return computeDiagramViewBox(expandedNodes, machine, p.padding);
  }, [expandedNodes, machine]);

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
    const scaleW = boxW / expandedViewBox.w;
    const scaleH = boxH / expandedViewBox.h;
    const next = Math.min(scaleW, scaleH) * 0.92;
    setZoom(
      Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, Math.round(next * 100) / 100))
    );
  }, [expandedViewBox.h, expandedViewBox.w]);

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
