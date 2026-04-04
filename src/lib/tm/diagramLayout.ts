import type { StateId, TuringMachineDefinition } from '@/types/tm';

/** Optional fixed centers from outside (overrides auto layout). */
export interface LegacyDiagramPositions {
  positions: Record<StateId, { x: number; y: number }>;
}

/** Center (cx, cy) and full width/height of the node shape. */
export interface DiagramNodeBox {
  cx: number;
  cy: number;
  w: number;
  h: number;
}

export interface AutoDiagramLayout {
  nodes: Record<StateId, DiagramNodeBox>;
}

/** Horizontal gap between layer midlines (edge of one column to next). */
const GAP_X = 112;
const GAP_Y = 48;
const MARGIN = 72;
/** Minimum horizontal space reserved per layer (even if nodes are smaller). */
const MIN_COL_WIDTH = 100;

function nodeBoxSize(
  label: string,
  size: 'embedded' | 'expanded'
): { w: number; h: number } {
  const charW = size === 'expanded' ? 10.2 : 8.2;
  const h = size === 'expanded' ? 48 : 38;
  const padX = size === 'expanded' ? 36 : 28;
  const minW = size === 'expanded' ? 96 : 72;
  const w = Math.max(minW, Math.ceil(label.length * charW) + padX);
  return { w, h };
}

function buildAdjacency(machine: TuringMachineDefinition): Map<StateId, Set<StateId>> {
  const m = new Map<StateId, Set<StateId>>();
  for (const s of machine.states) {
    m.set(s, new Set());
  }
  for (const [from, row] of Object.entries(machine.transitions)) {
    if (!row) continue;
    for (const rule of Object.values(row)) {
      if (!rule) continue;
      m.get(from)?.add(rule.next);
    }
  }
  return m;
}

/** Shortest path length from `machine.start` to each reachable state. */
function bfsDistanceFromStart(machine: TuringMachineDefinition): Map<StateId, number> {
  const adj = buildAdjacency(machine);
  const dist = new Map<StateId, number>();
  const q: StateId[] = [];
  if (machine.states.includes(machine.start)) {
    dist.set(machine.start, 0);
    q.push(machine.start);
  }
  let head = 0;
  while (head < q.length) {
    const u = q[head++]!;
    const d = dist.get(u)!;
    for (const v of adj.get(u) ?? []) {
      if (!dist.has(v)) {
        dist.set(v, d + 1);
        q.push(v);
      }
    }
  }
  return dist;
}

/**
 * Left → right Sugiyama-style columns:
 * - Column 0: start only
 * - Columns 1..k: each non-terminal state uses BFS distance from start as its column index
 *   (states at the same distance share a column, stacked vertically)
 * - Last column: accept and reject together (always rightmost)
 *
 * Unreachable non-terminals: column 1. Unreachable terminals: still in the terminal column.
 */
export function assignLayersForLayout(
  machine: TuringMachineDefinition
): Map<StateId, number> {
  const dist = bfsDistanceFromStart(machine);
  const { start, accept, reject, states } = machine;
  const terminalIds = new Set<StateId>(
    [accept, reject].filter((t) => states.includes(t))
  );
  const intermediates = states.filter((s) => s !== start && !terminalIds.has(s));

  const rawCol = new Map<StateId, number>();
  rawCol.set(start, 0);

  let maxInterCol = 0;
  for (const s of intermediates) {
    const d = dist.has(s) ? dist.get(s)! : 1;
    const col = Math.max(1, d);
    rawCol.set(s, col);
    maxInterCol = Math.max(maxInterCol, col);
  }

  const termCol = maxInterCol + 1;
  for (const t of terminalIds) {
    rawCol.set(t, termCol);
  }

  const sortedCols = [...new Set(rawCol.values())].sort((a, b) => a - b);
  const compress = new Map<number, number>();
  sortedCols.forEach((c, i) => compress.set(c, i));

  const out = new Map<StateId, number>();
  for (const s of states) {
    const r = rawCol.get(s);
    out.set(s, compress.get(r ?? 0) ?? 0);
  }
  return out;
}

/** Shift all node centers so the bounding box of node rects is centered at (0,0). */
function centerLayoutOnBBox(
  nodes: Record<StateId, DiagramNodeBox>,
  machine: TuringMachineDefinition
): void {
  let minL = Infinity;
  let maxR = -Infinity;
  let minT = Infinity;
  let maxB = -Infinity;
  for (const s of machine.states) {
    const n = nodes[s];
    if (!n) continue;
    minL = Math.min(minL, n.cx - n.w / 2);
    maxR = Math.max(maxR, n.cx + n.w / 2);
    minT = Math.min(minT, n.cy - n.h / 2);
    maxB = Math.max(maxB, n.cy + n.h / 2);
  }
  if (!Number.isFinite(minL)) return;
  const bx = (minL + maxR) / 2;
  const by = (minT + maxB) / 2;
  for (const s of machine.states) {
    const n = nodes[s];
    if (!n) continue;
    n.cx -= bx;
    n.cy -= by;
  }
}

function assertNoOverlaps(
  nodes: Record<StateId, DiagramNodeBox>,
  machine: TuringMachineDefinition
): void {
  if (!import.meta.env?.DEV) return;
  const list = machine.states
    .map((s) => ({ s, n: nodes[s] }))
    .filter((x): x is { s: StateId; n: DiagramNodeBox } => Boolean(x.n));
  const margin = 4;
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      const a = list[i]!.n;
      const b = list[j]!.n;
      const sepX =
        Math.abs(a.cx - b.cx) - (a.w + b.w) / 2 - margin;
      const sepY =
        Math.abs(a.cy - b.cy) - (a.h + b.h) / 2 - margin;
      if (sepX < 0 && sepY < 0) {
        // eslint-disable-next-line no-console
        console.warn(
          `[diagramLayout] Node overlap: ${list[i]!.s} vs ${list[j]!.s}`,
          list[i]!.n,
          list[j]!.n
        );
      }
    }
  }
}

export function computeAutoLayout(
  machine: TuringMachineDefinition,
  size: 'embedded' | 'expanded'
): AutoDiagramLayout {
  const layers = assignLayersForLayout(machine);
  const maxLayer = Math.max(0, ...layers.values());

  const byLayer = new Map<number, StateId[]>();
  for (let L = 0; L <= maxLayer; L++) {
    byLayer.set(L, []);
  }
  for (const s of machine.states) {
    const L = layers.get(s) ?? 0;
    byLayer.get(L)!.push(s);
  }
  for (const list of byLayer.values()) {
    list.sort((a, b) => a.localeCompare(b));
  }

  const colWidth: number[] = [];
  const colMaxH: number[] = [];
  for (let L = 0; L <= maxLayer; L++) {
    const ids = byLayer.get(L) ?? [];
    let mw = MIN_COL_WIDTH;
    let mh = 0;
    for (const s of ids) {
      const { w, h } = nodeBoxSize(s, size);
      mw = Math.max(mw, w);
      mh = Math.max(mh, h);
    }
    colWidth.push(mw);
    colMaxH.push(mh);
  }

  const colLeftX: number[] = [];
  let x = MARGIN;
  for (let L = 0; L <= maxLayer; L++) {
    const cw = colWidth[L] ?? MIN_COL_WIDTH;
    colLeftX.push(x);
    x += cw + GAP_X;
  }

  const nodes: Record<StateId, DiagramNodeBox> = {};

  for (let L = 0; L <= maxLayer; L++) {
    const ids = byLayer.get(L) ?? [];
    const n = ids.length;
    if (n === 0) continue;
    const left = colLeftX[L] ?? MARGIN;
    const cw = colWidth[L] ?? MIN_COL_WIDTH;
    const colCenterX = left + cw / 2;
    const maxH = colMaxH[L] ?? 38;
    const pitch = maxH + GAP_Y;
    const totalH = n > 1 ? (n - 1) * pitch : 0;
    const yStart = -totalH / 2;
    for (let i = 0; i < n; i++) {
      const s = ids[i]!;
      const { w, h } = nodeBoxSize(s, size);
      nodes[s] = { cx: colCenterX, cy: yStart + i * pitch, w, h };
    }
  }

  centerLayoutOnBBox(nodes, machine);
  assertNoOverlaps(nodes, machine);

  return { nodes };
}

export function computeDiagramViewBox(
  nodes: Record<StateId, DiagramNodeBox>,
  machine: TuringMachineDefinition,
  padding: number
): { x: number; y: number; w: number; h: number } {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const s of machine.states) {
    const n = nodes[s];
    if (!n) continue;
    const term = s === machine.accept || s === machine.reject;
    const pad = term ? 22 : 12;
    minX = Math.min(minX, n.cx - n.w / 2 - pad);
    maxX = Math.max(maxX, n.cx + n.w / 2 + pad);
    minY = Math.min(minY, n.cy - n.h / 2 - pad);
    maxY = Math.max(maxY, n.cy + n.h / 2 + pad);
  }
  if (!Number.isFinite(minX)) {
    return { x: 0, y: 0, w: 520, h: 320 };
  }
  return {
    x: minX - padding,
    y: minY - padding,
    w: maxX - minX + 2 * padding,
    h: maxY - minY + 2 * padding,
  };
}

export function resolveDiagramNodes(
  machine: TuringMachineDefinition,
  size: 'embedded' | 'expanded',
  layout?: LegacyDiagramPositions | null
): Record<StateId, DiagramNodeBox> {
  if (layout) {
    return boxesFromLegacyLayout(layout, machine, size).nodes;
  }
  return computeAutoLayout(machine, size).nodes;
}

/**
 * Legacy positions → boxes. Missing states get auto layout merged in so every
 * state has a unique position (avoids invisible / collapsed nodes).
 */
export function boxesFromLegacyLayout(
  layout: LegacyDiagramPositions,
  machine: TuringMachineDefinition,
  size: 'embedded' | 'expanded'
): AutoDiagramLayout {
  const auto = computeAutoLayout(machine, size);
  const nodes: Record<StateId, DiagramNodeBox> = {};
  for (const s of machine.states) {
    const p = layout.positions[s];
    if (p) {
      const { w, h } = nodeBoxSize(s, size);
      nodes[s] = { cx: p.x, cy: p.y, w, h };
    } else {
      nodes[s] = { ...auto.nodes[s]! };
    }
  }
  centerLayoutOnBBox(nodes, machine);
  assertNoOverlaps(nodes, machine);
  return { nodes };
}
