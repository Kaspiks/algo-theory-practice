import { describe, expect, it } from 'vitest';
import {
  formatImplicitFormalLine,
  formatRunFormalLine,
  implicitRejectProse,
} from '@/lib/tm/tapeRunPresentation';
import { buildMachineFromConstruction } from '@/lib/tm/constructionMachine';
import { AKBK_REFERENCE_CONSTRUCTION_INPUT } from '@/content/tmConstruction/referenceMachines/akbk';

describe('tapeRunPresentation', () => {
  it('formats formal transition line with blank display', () => {
    const built = buildMachineFromConstruction(AKBK_REFERENCE_CONSTRUCTION_INPUT);
    expect(built.ok).toBe(true);
    if (!built.ok) return;
    const m = built.machine;
    const line = formatRunFormalLine(m, {
      from: 'qS',
      read: m.blank,
      to: 'q_empty',
      write: m.blank,
      move: 'R',
    });
    expect(line).toContain('qS');
    expect(line).toContain('⊔');
  });

  it('formats implicit reject line', () => {
    const built = buildMachineFromConstruction(AKBK_REFERENCE_CONSTRUCTION_INPUT);
    expect(built.ok).toBe(true);
    if (!built.ok) return;
    const m = built.machine;
    expect(formatImplicitFormalLine(m, 'q0', 'b')).toContain('(no transition)');
    expect(implicitRejectProse(m, 'q0', 'b')).toContain('No transition');
  });
});
