import { describe, expect, it } from 'vitest';
import { buildNextTransitionMcq, gradeNextTransition } from '@/lib/grading/nextTransition';
import { initialConfiguration, peekNextAnswer, step } from '@/lib/tm/engine';
import { scanBinaryMachine } from '@/content/machines/scanBinary';
import type { TuringMachineDefinition } from '@/types/tm';

const BLANK = '⊔';

describe('gradeNextTransition', () => {
  it('matches step() for scan binary', () => {
    const c = initialConfiguration(scanBinaryMachine, '10', 0);
    const expected = peekNextAnswer(scanBinaryMachine, c);
    expect(expected).not.toBeNull();
    const g = gradeNextTransition(scanBinaryMachine, c, expected!);
    expect(g.correct).toBe(true);
    const bad = { ...expected!, move: 'L' as const };
    expect(gradeNextTransition(scanBinaryMachine, c, bad).correct).toBe(false);
  });

  it('grades implicit reject answer consistently with step', () => {
    const machine: TuringMachineDefinition = {
      id: 'implicit_test',
      states: ['q0', 'q_accept', 'q_reject'],
      inputAlphabet: ['a'],
      tapeAlphabet: ['a', BLANK],
      start: 'q0',
      accept: 'q_accept',
      reject: 'q_reject',
      blank: BLANK,
      policies: { leftEnd: 'reject', undefinedTransition: 'reject' },
      transitions: {
        q0: {
          a: { next: 'q0', write: 'a', move: 'R' },
        },
        q_accept: {},
        q_reject: {},
      },
    };
    const c = initialConfiguration(machine, 'a', 0);
    const r1 = step(machine, c);
    const c1 = r1.next;
    const expected = peekNextAnswer(machine, c1);
    expect(expected).toEqual({
      nextState: 'q_reject',
      write: BLANK,
      move: 'S',
    });
    expect(
      gradeNextTransition(machine, c1, expected!).correct
    ).toBe(true);
    const r2 = step(machine, c1);
    expect(r2.status).toBe('rejected');
    expect(r2.next.state).toBe('q_reject');
  });
});

describe('buildNextTransitionMcq', () => {
  it('does not duplicate distractor answers', () => {
    const c = initialConfiguration(scanBinaryMachine, '1', 0);
    const built = buildNextTransitionMcq(scanBinaryMachine, c, {
      wrongCount: 10,
      rng: () => 0.5,
    });
    expect(built).not.toBeNull();
    const keys = new Set(
      built!.options.map(
        (o) => `${o.answer.nextState}|${o.answer.write}|${o.answer.move}`
      )
    );
    expect(keys.size).toBe(built!.options.length);
  });
});
