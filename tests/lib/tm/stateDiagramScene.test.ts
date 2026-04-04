import { describe, expect, it } from 'vitest';
import { resolveDiagramNodes } from '@/lib/tm/diagramLayout';
import {
  chipExtraHeightForSize,
  collectDiagramEdgeLabels,
  computeStateDiagramScene,
} from '@/lib/tm/stateDiagramScene';
import {
  labelAxisRect,
  nodeObstacles,
  rectHitsAnyObstacle,
} from '@/lib/tm/diagramEdgeGeometry';
import { contains001Machine } from '@/content/machines/contains001';
import { scanBinaryMachine } from '@/content/machines/scanBinary';

const presetEmbedded = {
  padding: 80,
  outerRing: 5,
  edgeLabelMaxChars: 48,
  edgeCharWidth: 6.35,
} as const;

describe('stateDiagramScene', () => {
  it('collects one row per unique from→to edge', () => {
    const edges = collectDiagramEdgeLabels(scanBinaryMachine);
    const keys = new Set(edges.map((e) => `${e.from}->${e.to}`));
    expect(keys.size).toBe(edges.length);
  });

  it('chip extra height matches viewer chips', () => {
    expect(chipExtraHeightForSize('embedded')).toBe(3);
    expect(chipExtraHeightForSize('expanded')).toBe(4);
  });

  it('label bounding boxes avoid node obstacles (contains001 embedded)', () => {
    const machine = contains001Machine;
    const nodes = resolveDiagramNodes(machine, 'embedded', null);
    const scene = computeStateDiagramScene(machine, nodes, 'embedded', presetEmbedded);
    const clearance = 14;
    const terminalPad = presetEmbedded.outerRing + 10;
    const obstacles = nodeObstacles(
      nodes,
      machine,
      clearance,
      terminalPad
    );
    const chipH = chipExtraHeightForSize('embedded');
    for (const eg of scene.edgeLayouts) {
      const lhGeom = eg.lh + chipH;
      const r = labelAxisRect(eg.lx, eg.ly, eg.lw, lhGeom);
      expect(rectHitsAnyObstacle(r, obstacles)).toBe(false);
    }
    expect(scene.vw).toBeGreaterThan(100);
    expect(scene.vh).toBeGreaterThan(80);
  });

  it('expanded scene is at least as wide as node-only padding box would suggest', () => {
    const machine = scanBinaryMachine;
    const nodes = resolveDiagramNodes(machine, 'expanded', null);
    const scene = computeStateDiagramScene(machine, nodes, 'expanded', {
      padding: 104,
      outerRing: 7,
      edgeLabelMaxChars: 64,
      edgeCharWidth: 8.35,
    });
    expect(scene.vw).toBeGreaterThanOrEqual(200);
    expect(scene.edgeLayouts.length).toBeGreaterThan(0);
  });
});
