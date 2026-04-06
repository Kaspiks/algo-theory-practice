import { describe, expect, it } from 'vitest';
import { exercisePack } from '@/content/exercises/pack';
import { getMachineById } from '@/content/machines/index';
import {
  buildTapeResultMcq,
  buildTapeResultMcqFromAuthor,
  configurationsEqual,
} from '@/lib/grading/tapeResult';
import {
  answersEqual,
  initialConfiguration,
  peekNextAnswer,
  step,
} from '@/lib/tm/engine';

describe('exercise pack authoring', () => {
  it('is sorted by difficulty then id', () => {
    for (let i = 1; i < exercisePack.length; i++) {
      const a = exercisePack[i - 1]!;
      const b = exercisePack[i]!;
      expect(
        a.difficulty < b.difficulty ||
          (a.difficulty === b.difficulty && a.id.localeCompare(b.id) <= 0)
      ).toBe(true);
    }
  });

  for (const ex of exercisePack) {
    it(`first-step answer matches engine: ${ex.id}`, () => {
      if (
        ex.mode === 'strategy' ||
        ex.mode === 'missing_transition' ||
        ex.mode === 'language_decode'
      ) {
        return;
      }
      const machine = getMachineById(ex.machineId);
      expect(machine).toBeDefined();
      const c0 = initialConfiguration(
        machine!,
        ex.setup.input,
        ex.setup.headIndex ?? 0
      );
      const expected = peekNextAnswer(machine!, c0);
      expect(expected).not.toBeNull();

      if (ex.mode === 'tape_result') {
        const authoredMcq =
          ex.options?.length && ex.correctOptionId
            ? buildTapeResultMcqFromAuthor(machine!, c0, {
                options: ex.options,
                correctOptionId: ex.correctOptionId,
              })
            : null;
        const built =
          authoredMcq ?? buildTapeResultMcq(machine!, c0);
        expect(built, `tape-result MCQ for ${ex.id}`).not.toBeNull();
        const correctOpt = built!.options.find(
          (o) => o.id === built!.correctOptionId
        );
        expect(correctOpt).toBeDefined();
        const { next } = step(machine!, c0);
        expect(
          configurationsEqual(
            machine!,
            correctOpt!.resultingConfig,
            next
          )
        ).toBe(true);
        return;
      }

      if (ex.mode === 'next_transition' || ex.mode === 'tracing') {
        if (ex.options?.length && ex.correctOptionId) {
          const opt = ex.options.find((o) => o.id === ex.correctOptionId);
          expect(opt, `correctOptionId ${ex.correctOptionId}`).toBeDefined();
          expect(answersEqual(opt!.answer, expected!)).toBe(true);
        }

        if (ex.canonicalFirstAnswer) {
          expect(
            answersEqual(ex.canonicalFirstAnswer, expected!)
          ).toBe(true);
        }
      }
    });
  }
});
