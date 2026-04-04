import { describe, expect, it } from 'vitest';
import { scanBinaryMachine } from '@/content/machines/scanBinary';
import {
  buildTapeResultMcq,
  buildTapeResultMcqForState,
  buildTapeResultMcqFromAuthor,
  configurationsEqual,
  findMatchingTapeResultOptionId,
  gradeTapeResult,
} from '@/lib/grading/tapeResult';
import { initialConfiguration, step } from '@/lib/tm/engine';

describe('tapeResult grading', () => {
  it('grades correct configuration', () => {
    const m = scanBinaryMachine;
    const c0 = initialConfiguration(m, '0', 0);
    const { next, fired } = step(m, c0);
    expect(fired).toBeDefined();
    const g = gradeTapeResult(m, c0, next);
    expect(g.correct).toBe(true);
    expect(g.fired).toEqual(fired);
  });

  it('rejects wrong head index', () => {
    const m = scanBinaryMachine;
    const c0 = initialConfiguration(m, '0', 0);
    const { next } = step(m, c0);
    const wrong = {
      state: next.state,
      tape: { ...next.tape, headIndex: 0 },
    };
    expect(gradeTapeResult(m, c0, wrong).correct).toBe(false);
  });
});

describe('buildTapeResultMcq', () => {
  it('includes engine next as correct option', () => {
    const m = scanBinaryMachine;
    const c0 = initialConfiguration(m, '01', 0);
    const built = buildTapeResultMcq(m, c0, { rng: () => 0.99 });
    expect(built).not.toBeNull();
    const correct = built!.options.find((o) => o.id === built!.correctOptionId);
    expect(correct).toBeDefined();
    expect(configurationsEqual(m, correct!.resultingConfig, step(m, c0).next)).toBe(
      true
    );
  });
});

describe('findMatchingTapeResultOptionId', () => {
  it('returns id of option equal to next configuration', () => {
    const m = scanBinaryMachine;
    const c0 = initialConfiguration(m, '010', 0);
    const built = buildTapeResultMcq(m, c0, { rng: () => 0 });
    expect(built).not.toBeNull();
    const { next } = step(m, c0);
    const id = findMatchingTapeResultOptionId(m, built!.options, next);
    expect(id).toBe(built!.correctOptionId);
  });
});

describe('buildTapeResultMcqForState', () => {
  it('builds dynamic MCQ after step 0 and marks engine-next row', () => {
    const m = scanBinaryMachine;
    let c = initialConfiguration(m, '010', 0);
    c = step(m, c).next;
    const built = buildTapeResultMcqForState(m, c, 1, null);
    expect(built).not.toBeNull();
    const { next } = step(m, c);
    expect(findMatchingTapeResultOptionId(m, built!.options, next)).toBe(
      built!.correctOptionId
    );
  });
});

describe('buildTapeResultMcqFromAuthor', () => {
  it('accepts authored options when correctOptionId matches step()', () => {
    const m = scanBinaryMachine;
    const c0 = initialConfiguration(m, '010', 0);
    const { next } = step(m, c0);
    const built = buildTapeResultMcqFromAuthor(m, c0, {
      correctOptionId: 'ok',
      options: [
        {
          id: 'ok',
          nextState: next.state,
          tapeCells: [...next.tape.cells],
          headPosition: next.tape.headIndex,
        },
        {
          id: 'bad',
          nextState: m.reject,
          tapeCells: [...next.tape.cells],
          headPosition: next.tape.headIndex,
        },
      ],
    });
    expect(built).not.toBeNull();
    expect(built!.correctOptionId).toBe('ok');
  });

  it('returns null when correct option does not match step()', () => {
    const m = scanBinaryMachine;
    const c0 = initialConfiguration(m, '010', 0);
    const built = buildTapeResultMcqFromAuthor(m, c0, {
      correctOptionId: 'wrong-marked',
      options: [
        {
          id: 'wrong-marked',
          nextState: m.accept,
          tapeCells: ['0', '1', '0'],
          headPosition: 1,
        },
      ],
    });
    expect(built).toBeNull();
  });

  it('returns null when two options describe the same configuration', () => {
    const m = scanBinaryMachine;
    const c0 = initialConfiguration(m, '010', 0);
    const { next } = step(m, c0);
    const built = buildTapeResultMcqFromAuthor(m, c0, {
      correctOptionId: 'a',
      options: [
        {
          id: 'a',
          nextState: next.state,
          tapeCells: [...next.tape.cells],
          headPosition: next.tape.headIndex,
        },
        {
          id: 'b',
          nextState: next.state,
          tapeCells: [...next.tape.cells],
          headPosition: next.tape.headIndex,
          label: 'duplicate row',
        },
      ],
    });
    expect(built).toBeNull();
  });
});
