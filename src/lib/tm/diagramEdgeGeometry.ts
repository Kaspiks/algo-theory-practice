import type { DiagramNodeBox } from '@/lib/tm/diagramLayout';
import type { StateId, TuringMachineDefinition } from '@/types/tm';

export interface Vec2 {
  x: number;
  y: number;
}

/** Axis-aligned rectangle (SVG coords, y increases downward). */
export interface AxisRect {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export function nodeObstacles(
  nodes: Record<StateId, DiagramNodeBox>,
  machine: TuringMachineDefinition,
  clearance: number,
  /** Extra pad for accept/reject outer ring (matches diagram viewer). */
  terminalRingPad: number
): AxisRect[] {
  const out: AxisRect[] = [];
  for (const s of machine.states) {
    const n = nodes[s];
    if (!n) continue;
    const isTerm = s === machine.accept || s === machine.reject;
    const pad = clearance + (isTerm ? terminalRingPad : 0);
    out.push({
      left: n.cx - n.w / 2 - pad,
      right: n.cx + n.w / 2 + pad,
      top: n.cy - n.h / 2 - pad,
      bottom: n.cy + n.h / 2 + pad,
    });
  }
  return out;
}

export function labelAxisRect(
  cx: number,
  cy: number,
  lw: number,
  lh: number
): AxisRect {
  return {
    left: cx - lw / 2,
    right: cx + lw / 2,
    top: cy - lh / 2,
    bottom: cy + lh / 2,
  };
}

export function rectHitsAnyObstacle(r: AxisRect, obstacles: AxisRect[]): boolean {
  for (const o of obstacles) {
    if (r.left < o.right && r.right > o.left && r.top < o.bottom && r.bottom > o.top) {
      return true;
    }
  }
  return false;
}

export function rectsOverlap(a: AxisRect, b: AxisRect): boolean {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

export function cubicPoint(
  p0: Vec2,
  p1: Vec2,
  p2: Vec2,
  p3: Vec2,
  t: number
): Vec2 {
  const u = 1 - t;
  const u2 = u * u;
  const u3 = u2 * u;
  const t2 = t * t;
  const t3 = t2 * t;
  return {
    x: u3 * p0.x + 3 * u2 * t * p1.x + 3 * u * t2 * p2.x + t3 * p3.x,
    y: u3 * p0.y + 3 * u2 * t * p1.y + 3 * u * t2 * p2.y + t3 * p3.y,
  };
}

/** Unit tangent at t (derivative of cubic Bézier). */
export function cubicUnitTangent(
  p0: Vec2,
  p1: Vec2,
  p2: Vec2,
  p3: Vec2,
  t: number
): Vec2 {
  const u = 1 - t;
  const dx =
    3 * u * u * (p1.x - p0.x) +
    6 * u * t * (p2.x - p1.x) +
    3 * t * t * (p3.x - p2.x);
  const dy =
    3 * u * u * (p1.y - p0.y) +
    6 * u * t * (p2.y - p1.y) +
    3 * t * t * (p3.y - p2.y);
  const len = Math.hypot(dx, dy) || 1;
  return { x: dx / len, y: dy / len };
}

export function cubicPathD(p0: Vec2, p1: Vec2, p2: Vec2, p3: Vec2): string {
  return `M ${p0.x} ${p0.y} C ${p1.x} ${p1.y} ${p2.x} ${p2.y} ${p3.x} ${p3.y}`;
}

export function cubicControlPoints(
  ex: number,
  ey: number,
  ix: number,
  iy: number,
  ySkew: number
): { p0: Vec2; p1: Vec2; p2: Vec2; p3: Vec2; handle: number } {
  const span = Math.abs(ix - ex);
  const handle = Math.min(140, Math.max(56, span * 0.42));
  const sign = ix >= ex ? 1 : -1;
  return {
    p0: { x: ex, y: ey },
    p1: { x: ex + sign * handle, y: ey + ySkew },
    p2: { x: ix - sign * handle, y: iy + ySkew },
    p3: { x: ix, y: iy },
    handle,
  };
}

const MID_THIRD_LO = 1 / 3;
const MID_THIRD_HI = 2 / 3;

/**
 * t values on the curve to try first: inside [1/3, 2/3], biased slightly toward the
 * source so labels sit away from the target arrowhead.
 */
export const MIDDLE_THIRD_T_CANDIDATES: readonly number[] = [
  0.48, 0.45, 0.5, 0.42, 0.52, 0.43, 0.47, 0.55, 0.4, 0.58,
].filter((t) => t >= MID_THIRD_LO && t <= MID_THIRD_HI);

/**
 * Pick label center near the middle third of the curve, offset along the normal away
 * from nodes. Nudges along −tangent to keep clearance from the arrowhead at p3.
 */
export function placeCubicEdgeLabel(
  p0: Vec2,
  p1: Vec2,
  p2: Vec2,
  p3: Vec2,
  lw: number,
  lh: number,
  obstacles: AxisRect[],
  /**
   * @deprecated Use default middle-third search. Kept for tests; if length 1, only that t is used.
   */
  tSampleOrLegacy?: number | readonly number[]
): { x: number; y: number } {
  const span = Math.hypot(p3.x - p0.x, p3.y - p0.y);
  const base = span < 90 ? 28 : span < 160 ? 24 : 20;
  const offsets = [base, base + 14, base + 28, base + 44, base + 60, base + 78];
  /** Pull anchor back toward p0 (away from marker at p3). */
  const headClears = [0, 10, 20, 32] as const;

  let tList: readonly number[];
  if (tSampleOrLegacy === undefined) {
    tList = MIDDLE_THIRD_T_CANDIDATES;
  } else if (typeof tSampleOrLegacy === 'number') {
    tList = [tSampleOrLegacy];
  } else {
    tList = tSampleOrLegacy.length > 0 ? tSampleOrLegacy : MIDDLE_THIRD_T_CANDIDATES;
  }

  for (const t of tList) {
    const pt = cubicPoint(p0, p1, p2, p3, t);
    const tan = cubicUnitTangent(p0, p1, p2, p3, t);
    let nx = -tan.y;
    let ny = tan.x;
    if (ny > 0) {
      nx = -nx;
      ny = -ny;
    }

    for (const headPull of headClears) {
      const bx = pt.x - tan.x * headPull;
      const by = pt.y - tan.y * headPull;
      for (const dir of [1, -1] as const) {
        const px = nx * dir;
        const py = ny * dir;
        for (const off of offsets) {
          const cx = bx + px * off;
          const cy = by + py * off;
          const r = labelAxisRect(cx, cy, lw, lh);
          if (!rectHitsAnyObstacle(r, obstacles)) {
            return { x: cx, y: cy };
          }
        }
      }
    }
  }

  const t0 = tList[0] ?? 0.48;
  const pt0 = cubicPoint(p0, p1, p2, p3, t0);
  const tan0 = cubicUnitTangent(p0, p1, p2, p3, t0);
  let nx0 = -tan0.y;
  let ny0 = tan0.x;
  if (ny0 > 0) {
    nx0 = -nx0;
    ny0 = -ny0;
  }
  const hp = headClears[headClears.length - 1]!;
  const bx = pt0.x - tan0.x * hp;
  const by = pt0.y - tan0.y * hp;
  return { x: bx + nx0 * (base + 88), y: by + ny0 * (base + 88) };
}

/** Self-loop path and default label anchor (right of node). */
export function selfLoopPathAndAnchor(n: DiagramNodeBox): {
  d: string;
  lx: number;
  ly: number;
  p0: Vec2;
  p3: Vec2;
} {
  const { cx, cy, w, h } = n;
  const outX = cx + w / 2 + 4;
  const lift = Math.max(52, h * 0.85);
  const d = `M ${outX} ${cy} C ${outX + 52} ${cy - lift} ${outX + 52} ${cy + lift} ${outX} ${cy}`;
  const lx0 = outX + 40;
  const ly0 = cy - lift * 0.45;
  return {
    d,
    lx: lx0,
    ly: ly0,
    p0: { x: outX, y: cy },
    p3: { x: outX, y: cy },
  };
}

export function nudgeSelfLoopLabel(
  lx: number,
  ly: number,
  lw: number,
  lh: number,
  obstacles: AxisRect[]
): { x: number; y: number } {
  const tries = [
    [0, 0],
    [28, 0],
    [44, 0],
    [28, -18],
    [28, 18],
    [52, -22],
    [52, 22],
    [0, -30],
    [0, 30],
    [60, 0],
  ] as const;
  for (const [dx, dy] of tries) {
    const cx = lx + dx;
    const cy = ly + dy;
    if (!rectHitsAnyObstacle(labelAxisRect(cx, cy, lw, lh), obstacles)) {
      return { x: cx, y: cy };
    }
  }
  return { x: lx + 48, y: ly };
}

/**
 * Push label centers apart so padded rects do not overlap (pairwise pass).
 */
export function separateEdgeLabelRects(
  items: { lx: number; ly: number; lw: number; lh: number }[],
  pad: number
): { lx: number; ly: number }[] {
  const out = items.map((it) => ({ lx: it.lx, ly: it.ly }));
  const nudge = 12;
  const nudgeX = 10;
  for (let iter = 0; iter < 8; iter++) {
    let moved = false;
    for (let i = 0; i < out.length; i++) {
      for (let j = i + 1; j < out.length; j++) {
        const a = labelAxisRect(
          out[i]!.lx,
          out[i]!.ly,
          items[i]!.lw + pad,
          items[i]!.lh + pad
        );
        const b = labelAxisRect(
          out[j]!.lx,
          out[j]!.ly,
          items[j]!.lw + pad,
          items[j]!.lh + pad
        );
        if (rectsOverlap(a, b)) {
          if (iter % 2 === 0) {
            out[j]!.ly += nudge;
          } else {
            out[j]!.lx += j % 2 === 0 ? nudgeX : -nudgeX;
          }
          moved = true;
        }
      }
    }
    if (!moved) break;
  }
  return out;
}
