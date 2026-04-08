import { memo, useCallback, useRef, useState } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  type Edge,
  type EdgeProps,
  getSmoothStepPath,
  useReactFlow,
} from '@xyflow/react';

import type { TmEdgeData } from '@/features/tm-construction/flowTypes';
import { useTmConstructionEdgeContext } from '@/features/tm-construction/tmConstructionEdgeContext';

const DRAG_THRESHOLD_FLOW = 3;

type TmEdge = Edge<TmEdgeData, 'tmTransition'>;

function flowDist(a: { x: number; y: number }, b: { x: number; y: number }) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

export const TmTransitionEdge = memo(function TmTransitionEdge(props: EdgeProps<TmEdge>) {
  const {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style,
    markerEnd,
    markerStart,
    data,
    label,
    labelStyle,
    labelBgStyle,
    labelBgPadding,
    pathOptions,
    interactionWidth,
  } = props;

  const d = (data ?? {}) as TmEdgeData;
  const { screenToFlowPosition } = useReactFlow();
  const ctx = useTmConstructionEdgeContext();

  const [dragPreview, setDragPreview] = useState<{ x: number; y: number } | null>(null);
  const latestPreviewRef = useRef<{ x: number; y: number } | null>(null);
  const dragStartFlow = useRef<{ x: number; y: number } | null>(null);
  const originUser = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const movedRef = useRef(false);
  const ctxRef = useRef(ctx);
  ctxRef.current = ctx;
  const idRef = useRef(id);
  idRef.current = id;

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    ...(pathOptions ?? {}),
  });

  const userOx = d.labelOffset?.x ?? 0;
  const userOy = d.labelOffset?.y ?? 0;
  const nudgeX = d.tmLabelPlaybackNudge?.x ?? 0;
  const nudgeY = d.tmLabelPlaybackNudge?.y ?? 0;

  const ox = (dragPreview?.x ?? userOx) + nudgeX;
  const oy = (dragPreview?.y ?? userOy) + nudgeY;

  const spotlight = Boolean(d.tmLabelSpotlight);
  const selectedChip = Boolean(ctx?.selectedEdgeId === id);
  const labelsDraggable = Boolean(ctx?.labelsDraggable);

  /** High value so the active chip stays above all other EdgeLabelRenderer siblings in dense graphs. */
  const zIndex = spotlight ? 999_999 : selectedChip ? 8000 : 20;
  const scale = spotlight ? 1.08 : 1;

  const fillColor =
    typeof labelStyle?.fill === 'string' ? labelStyle.fill : '#e2e8f0';
  const fontSize = typeof labelStyle?.fontSize === 'number' ? labelStyle.fontSize : 11;
  const fontWeight =
    typeof labelStyle?.fontWeight === 'number' || typeof labelStyle?.fontWeight === 'string'
      ? labelStyle.fontWeight
      : 500;
  const lineHeight =
    typeof labelStyle?.lineHeight === 'number' ? labelStyle.lineHeight : 1.35;

  const bgFill =
    typeof labelBgStyle?.fill === 'string' ? labelBgStyle.fill : '#1e293b';
  const bgOpacity =
    typeof labelBgStyle?.fillOpacity === 'number' ? labelBgStyle.fillOpacity : 0.92;

  const [padY, padX] = labelBgPadding ?? [8, 10];

  const cleanupWindowListeners = useRef<(() => void) | null>(null);

  const onWindowPointerMove = useCallback(
    (ev: PointerEvent) => {
      const c = ctxRef.current;
      if (!c || !dragStartFlow.current) return;
      const cur = screenToFlowPosition({ x: ev.clientX, y: ev.clientY });
      if (!movedRef.current && flowDist(cur, dragStartFlow.current) > DRAG_THRESHOLD_FLOW) {
        movedRef.current = true;
      }
      const next = {
        x: originUser.current.x + (cur.x - dragStartFlow.current.x),
        y: originUser.current.y + (cur.y - dragStartFlow.current.y),
      };
      latestPreviewRef.current = next;
      setDragPreview(next);
    },
    [screenToFlowPosition]
  );

  const onWindowPointerUp = useCallback(() => {
    const c = ctxRef.current;
    if (c && dragStartFlow.current) {
      if (movedRef.current && latestPreviewRef.current) {
        c.onLabelOffsetCommit(idRef.current, latestPreviewRef.current);
      } else if (!movedRef.current) {
        c.onEdgeSelectByLabel(idRef.current);
      }
    }
    dragStartFlow.current = null;
    movedRef.current = false;
    latestPreviewRef.current = null;
    setDragPreview(null);
    cleanupWindowListeners.current?.();
    cleanupWindowListeners.current = null;
  }, []);

  const onLabelPointerDown = useCallback(
    (ev: React.PointerEvent) => {
      if (!labelsDraggable || !ctx) return;
      ev.stopPropagation();
      const start = screenToFlowPosition({ x: ev.clientX, y: ev.clientY });
      dragStartFlow.current = start;
      originUser.current = { x: userOx, y: userOy };
      movedRef.current = false;
      const initial = { x: userOx, y: userOy };
      latestPreviewRef.current = initial;
      setDragPreview(initial);
      window.addEventListener('pointermove', onWindowPointerMove);
      window.addEventListener('pointerup', onWindowPointerUp);
      window.addEventListener('pointercancel', onWindowPointerUp);
      cleanupWindowListeners.current = () => {
        window.removeEventListener('pointermove', onWindowPointerMove);
        window.removeEventListener('pointerup', onWindowPointerUp);
        window.removeEventListener('pointercancel', onWindowPointerUp);
      };
    },
    [
      labelsDraggable,
      ctx,
      screenToFlowPosition,
      userOx,
      userOy,
      onWindowPointerMove,
      onWindowPointerUp,
    ]
  );

  const chipClass = [
    'rounded-md border text-left font-sans transition-[box-shadow,transform] duration-200',
    spotlight ? 'tm-transition-edge-label-spotlight border-sky-400/70' : 'border-transparent',
    selectedChip ? 'ring-2 ring-amber-400/60 ring-offset-2 ring-offset-slate-950' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        markerStart={markerStart}
        style={style}
        interactionWidth={interactionWidth}
      />
      <EdgeLabelRenderer>
        <div
          className={labelsDraggable ? 'cursor-move' : spotlight ? 'cursor-default' : undefined}
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px) translate(${ox}px,${oy}px) scale(${scale})`,
            zIndex,
            fontSize,
            fontWeight,
            lineHeight,
            color: fillColor,
            whiteSpace: 'pre-line',
            pointerEvents: labelsDraggable || spotlight ? 'all' : 'none',
          }}
        >
          <div
            role="presentation"
            className={`nopan nodrag ${chipClass}`}
            style={{
              padding: `${padY}px ${padX}px`,
              background: bgFill,
              opacity: bgOpacity,
              maxWidth: 280,
            }}
            onPointerDown={onLabelPointerDown}
          >
            {label}
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
});
