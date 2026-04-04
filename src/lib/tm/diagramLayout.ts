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

const GAP_X = 56;
const GAP_Y = 28;
const MARGIN = 48;

function nodeBoxSize(
  label: string,
  size: 'embedded' | 'expanded'
): { w: number; h: number } {
  const charW = size === 'expanded' ? 10.2 : 8;
  const h = size === 'expanded' ? 44 : 34;
  const padX = size === 'expanded' ? 32 : 24;
  const minW = size === 'expanded' ? 80 : 64;
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

/**
 * Layer states left → right: start on the left, accept/reject on the right,
 * BFS distance for intermediates. Unreachable states sit in a middle band.
 */
function assignLayers(machine: TuringMachineDefinition): Map<StateId, number> {
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
    const d = dist.get(u) ?? 0;
    for (const v of adj.get(u) ?? []) {
      if (!dist.has(v) || dist.get(v)! > d + 1) {
        dist.set(v, d + 1);
        q.push(v);
      }
    }
  }

  let maxD = 0;
  for (const v of dist.values()) maxD = Math.max(maxD, v);

  for (const s of machine.states) {
    if (!dist.has(s)) {
      dist.set(s, Math.max(1, Math.ceil(maxD / 2)));
    }
  }

  maxD = 0;
  for (const v of dist.values()) maxD = Math.max(maxD, v);

  const rightCol = maxD + 1;
  if (machine.states.includes(machine.accept)) {
    dist.set(
      machine.accept,
      Math.max(dist.get(machine.accept) ?? 0, rightCol)
    );
  }
  if (machine.states.includes(machine.reject)) {
    dist.set(
      machine.reject,
      Math.max(dist.get(machine.reject) ?? 0, rightCol)
    );
  }

  let maxL = 0;
  for (const v of dist.values()) maxL = Math.max(maxL, v);

  const compress = new Map<number, number>();
  const sortedLayers = [...new Set(dist.values())].sort((a, b) => a - b);
  sortedLayers.forEach((L, i) => compress.set(L, i));

  const out = new Map<StateId, number>();
  for (const s of machine.states) {
    out.set(s, compress.get(dist.get(s) ?? 0) ?? 0);
  }
  return out;
}

export function computeAutoLayout(
  machine: TuringMachineDefinition,
  size: 'embedded' | 'expanded'
): AutoDiagramLayout {
  const layers = assignLayers(machine);
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
    const nodes = byLayer.get(L) ?? [];
    let mw = 0;
    let mh = 0;
    for (const s of nodes) {
      const { w, h } = nodeBoxSize(s, size);
      mw = Math.max(mw, w);
      mh = Math.max(mh, h);
    }
    colWidth.push(mw);
    colMaxH.push(mh);
  }

  const colCenterX: number[] = [];
  let x = MARGIN;
  for (let L = 0; L <= maxLayer; L++) {
    const cw = colWidth[L] ?? 80;
    colCenterX.push(x + cw / 2);
    x += cw + GAP_X;
  }

  const nodes: Record<StateId, DiagramNodeBox> = {};

  for (let L = 0; L <= maxLayer; L++) {
    const ids = byLayer.get(L) ?? [];
    const n = ids.length;
    if (n === 0) continue;
    const maxH = colMaxH[L] ?? 34;
    const pitch = maxH + GAP_Y;
    const totalH = (n - 1) * pitch;
    const yStart = -totalH / 2;
    for (let i = 0; i < n; i++) {
      const s = ids[i]!;
      const { w, h } = nodeBoxSize(s, size);
      const cx = colCenterX[L] ?? MARGIN;
      const cy = yStart + i * pitch;
      nodes[s] = { cx, cy, w, h };
    }
  }

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
    const pad = term ? 18 : 10;
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

/** Legacy circle-only positions → centered boxes (fallback). */
export function boxesFromLegacyLayout(
  layout: LegacyDiagramPositions,
  machine: TuringMachineDefinition,
  size: 'embedded' | 'expanded'
): AutoDiagramLayout {
  const nodes: Record<StateId, DiagramNodeBox> = {};
  for (const s of machine.states) {
    const p = layout.positions[s];
    if (!p) continue;
    const { w, h } = nodeBoxSize(s, size);
    nodes[s] = { cx: p.x, cy: p.y, w, h };
  }
  return { nodes };
}
