import {
  computeDiagramViewBox,
  type DiagramNodeBox,
} from '@/lib/tm/diagramLayout';
import {
  cubicControlPoints,
  cubicPathD,
  labelAxisRect,
  nudgeSelfLoopLabel,
  nodeObstacles,
  placeCubicEdgeLabel,
  rectHitsAnyObstacle,
  selfLoopPathAndAnchor,
  separateEdgeLabelRects,
} from '@/lib/tm/diagramEdgeGeometry';
import type { StateId, TuringMachineDefinition } from '@/types/tm';

/** Subset of viewer size preset needed for layout (keep in sync with SIZE_PRESETS). */
export interface DiagramScenePreset {
  padding: number;
  outerRing: number;
  edgeLabelMaxChars: number;
  edgeCharWidth: number;
}

export interface DiagramEdgeLayoutRow {
  key: string;
  pathD: string;
  lx: number;
  ly: number;
  lw: number;
  lh: number;
  label: string;
  from: StateId;
  to: StateId;
  fullLabel: string;
  selfLoop: boolean;
}

export function chipExtraHeightForSize(size: 'embedded' | 'expanded'): number {
  return size === 'expanded' ? 4 : 3;
}

export function collectDiagramEdgeLabels(machine: TuringMachineDefinition): {
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

/**
 * Edge paths, label positions, and SVG viewBox — same numbers the viewer uses.
 * `lh` on each row is the text box height; the drawn chip is `lh + chipExtraH` tall.
 */
export function computeStateDiagramScene(
  machine: TuringMachineDefinition,
  nodes: Record<StateId, DiagramNodeBox>,
  size: 'embedded' | 'expanded',
  preset: DiagramScenePreset
): {
  vx: number;
  vy: number;
  vw: number;
  vh: number;
  edgeLayouts: DiagramEdgeLayoutRow[];
} {
  const base = computeDiagramViewBox(nodes, machine, preset.padding);
  const vwRef = base.w;
  const chipExtraH = chipExtraHeightForSize(size);
  const clearance = size === 'expanded' ? 17 : 14;
  const terminalPad = preset.outerRing + 10;
  const obstacles = nodeObstacles(nodes, machine, clearance, terminalPad);

  const edges = collectDiagramEdgeLabels(machine);
  const raw: DiagramEdgeLayoutRow[] = [];

  edges.forEach((e, i) => {
    const a = nodes[e.from];
    const b = nodes[e.to];
    if (!a || !b) return;
    const key = `${e.from}|${e.to}|${e.label}`;
    const label =
      e.label.length > preset.edgeLabelMaxChars
        ? `${e.label.slice(0, preset.edgeLabelMaxChars - 1)}…`
        : e.label;
    const lw = Math.min(
      vwRef * 0.42,
      label.length * preset.edgeCharWidth + (size === 'expanded' ? 18 : 16)
    );
    const lh = size === 'expanded' ? 26 : 19;
    const lhGeom = lh + chipExtraH;
    const ySkew = ((i % 9) - 4) * 7;

    if (e.from === e.to) {
      const sl = selfLoopPathAndAnchor(a);
      const placed = nudgeSelfLoopLabel(sl.lx, sl.ly, lw, lhGeom, obstacles);
      raw.push({
        key,
        pathD: sl.d,
        lx: placed.x,
        ly: placed.y,
        lw,
        lh,
        label,
        from: e.from,
        to: e.to,
        fullLabel: e.label,
        selfLoop: true,
      });
      return;
    }

    const { ex, ey, ix, iy } = anchorsForward(a, b);
    const { p0, p1, p2, p3 } = cubicControlPoints(ex, ey, ix, iy, ySkew);
    const pathD = cubicPathD(p0, p1, p2, p3);
    const { x: lx, y: ly } = placeCubicEdgeLabel(
      p0,
      p1,
      p2,
      p3,
      lw,
      lhGeom,
      obstacles
    );
    raw.push({
      key,
      pathD,
      lx,
      ly,
      lw,
      lh,
      label,
      from: e.from,
      to: e.to,
      fullLabel: e.label,
      selfLoop: false,
    });
  });

  const sep = separateEdgeLabelRects(
    raw.map((r) => ({
      lx: r.lx,
      ly: r.ly,
      lw: r.lw,
      lh: r.lh + chipExtraH,
    })),
    8
  );

  const adjusted = raw.map((r, idx) => {
    let lx = sep[idx]!.lx;
    let ly = sep[idx]!.ly;
    const lhGeom = r.lh + chipExtraH;
    let rect = labelAxisRect(lx, ly, r.lw, lhGeom);
    if (rectHitsAnyObstacle(rect, obstacles)) {
      let freed = false;
      for (const dy of [14, -14, 22, -22, 30, -30, 38, -38]) {
        rect = labelAxisRect(lx, ly + dy, r.lw, lhGeom);
        if (!rectHitsAnyObstacle(rect, obstacles)) {
          ly += dy;
          freed = true;
          break;
        }
      }
      if (!freed) {
        for (const dx of [12, -12, 20, -20, 28, -28]) {
          rect = labelAxisRect(lx + dx, ly, r.lw, lhGeom);
          if (!rectHitsAnyObstacle(rect, obstacles)) {
            lx += dx;
            break;
          }
        }
      }
    }
    return { ...r, lx, ly };
  });

  const labelPad = 21;
  let minL = base.x;
  let minT = base.y;
  let maxR = base.x + base.w;
  let maxB = base.y + base.h;
  for (const eg of adjusted) {
    const halfH = (eg.lh + chipExtraH) / 2;
    minL = Math.min(minL, eg.lx - eg.lw / 2 - labelPad);
    minT = Math.min(minT, eg.ly - halfH - labelPad);
    maxR = Math.max(maxR, eg.lx + eg.lw / 2 + labelPad);
    maxB = Math.max(maxB, eg.ly + halfH + labelPad);
  }

  return {
    vx: minL,
    vy: minT,
    vw: maxR - minL,
    vh: maxB - minT,
    edgeLayouts: adjusted,
  };
}
