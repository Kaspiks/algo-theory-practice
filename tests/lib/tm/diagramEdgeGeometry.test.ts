import { describe, expect, it } from 'vitest';
import {
  cubicControlPoints,
  cubicPoint,
  labelAxisRect,
  MIDDLE_THIRD_T_CANDIDATES,
  placeCubicEdgeLabel,
  rectHitsAnyObstacle,
} from '@/lib/tm/diagramEdgeGeometry';

describe('diagramEdgeGeometry', () => {
  it('label t candidates stay in the middle third', () => {
    expect(MIDDLE_THIRD_T_CANDIDATES.length).toBeGreaterThan(0);
    for (const t of MIDDLE_THIRD_T_CANDIDATES) {
      expect(t).toBeGreaterThanOrEqual(1 / 3);
      expect(t).toBeLessThanOrEqual(2 / 3);
    }
  });
  it('cubic endpoints match anchors', () => {
    const p0 = { x: 0, y: 0 };
    const p3 = { x: 200, y: 0 };
    const { p0: a, p3: b, p1, p2 } = cubicControlPoints(
      p0.x,
      p0.y,
      p3.x,
      p3.y,
      12
    );
    expect(a.x).toBe(0);
    expect(a.y).toBe(0);
    expect(b.x).toBe(200);
    expect(b.y).toBe(0);
    expect(p1.y).toBe(12);
    expect(p2.y).toBe(12);
    const mid = cubicPoint(a, p1, p2, b, 0.5);
    expect(mid.x).toBeGreaterThan(20);
    expect(mid.x).toBeLessThan(180);
  });

  it('offsets label to avoid a blocking rectangle on the curve', () => {
    const p0 = { x: 0, y: 100 };
    const p1 = { x: 80, y: 40 };
    const p2 = { x: 220, y: 40 };
    const p3 = { x: 300, y: 100 };
    const obstacles = [{ left: 120, right: 200, top: 70, bottom: 110 }];
    const { x, y } = placeCubicEdgeLabel(p0, p1, p2, p3, 100, 22, obstacles);
    expect(rectHitsAnyObstacle(labelAxisRect(x, y, 100, 22), obstacles)).toBe(
      false
    );
  });
});
