import { describe, expect, it } from 'vitest';
import {
  assignLayersForLayout,
  computeAutoLayout,
} from '@/lib/tm/diagramLayout';
import { contains001Machine } from '@/content/machines/contains001';
import { scanBinaryMachine } from '@/content/machines/scanBinary';

describe('assignLayersForLayout', () => {
  it('places start left, terminals right on scan binary', () => {
    const m = scanBinaryMachine;
    const L = assignLayersForLayout(m);
    expect(L.get(m.start)).toBe(0);
    expect(L.get(m.accept)).toBe(L.get(m.reject));
    expect(L.get(m.accept)! > L.get(m.start)!).toBe(true);
  });

  it('orders contains001 intermediates before shared terminal column', () => {
    const m = contains001Machine;
    const L = assignLayersForLayout(m);
    const tCol = L.get(m.accept)!;
    expect(L.get(m.reject)).toBe(tCol);
    expect(L.get('q_saw0')!).toBeLessThan(tCol);
    expect(L.get('q_saw00')!).toBeLessThan(tCol);
    expect(L.get(m.start)).toBe(0);
  });
});

describe('computeAutoLayout', () => {
  it('gives distinct centers for every state (contains001)', () => {
    const { nodes } = computeAutoLayout(contains001Machine, 'embedded');
    const centers = Object.values(nodes).map((n) => `${n.cx},${n.cy}`);
    expect(new Set(centers).size).toBe(centers.length);
  });

  it('separates q_accept and q_reject horizontally or vertically', () => {
    const { nodes } = computeAutoLayout(scanBinaryMachine, 'embedded');
    const a = nodes[scanBinaryMachine.accept]!;
    const r = nodes[scanBinaryMachine.reject]!;
    const hSep = Math.abs(a.cx - r.cx) - (a.w + r.w) / 2;
    const vSep = Math.abs(a.cy - r.cy) - (a.h + r.h) / 2;
    expect(hSep > 2 || vSep > 2).toBe(true);
  });
});
