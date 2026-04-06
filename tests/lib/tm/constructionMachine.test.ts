import { describe, expect, it } from 'vitest';
import { buildMachineFromConstruction } from '@/lib/tm/constructionMachine';
import { initialConfiguration, runUntilHalt } from '@/lib/tm/engine';

const BLANK = '⊔';

describe('buildMachineFromConstruction', () => {
  it('rejects duplicate (state, read) transitions', () => {
    const r = buildMachineFromConstruction({
      id: 'dup',
      stateIds: ['q0', 'q1', 'q_accept', 'q_reject'],
      start: 'q0',
      accept: 'q_accept',
      reject: 'q_reject',
      inputAlphabet: ['a'],
      transitions: [
        { from: 'q0', read: 'a', to: 'q1', write: 'a', move: 'R' },
        { from: 'q0', read: 'a', to: 'q_accept', write: 'a', move: 'S' },
      ],
    });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errors.join(' ')).toMatch(/Duplicate transition/i);
  });

  it('builds a machine that runs in the engine', () => {
    const r = buildMachineFromConstruction({
      id: 'tiny',
      stateIds: ['q0', 'q_accept', 'q_reject'],
      start: 'q0',
      accept: 'q_accept',
      reject: 'q_reject',
      inputAlphabet: ['0', '1'],
      transitions: [
        { from: 'q0', read: '1', to: 'q_accept', write: '1', move: 'S' },
        { from: 'q0', read: '0', to: 'q_reject', write: '0', move: 'S' },
        { from: 'q0', read: BLANK, to: 'q_reject', write: BLANK, move: 'S' },
      ],
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const m = r.machine;
    const t1 = runUntilHalt(
      m,
      initialConfiguration(m, '1', 0),
      20
    );
    expect(t1[t1.length - 1]!.status).toBe('accepted');
    const t0 = runUntilHalt(
      m,
      initialConfiguration(m, '0', 0),
      20
    );
    expect(t0[t0.length - 1]!.status).toBe('rejected');
  });
});
