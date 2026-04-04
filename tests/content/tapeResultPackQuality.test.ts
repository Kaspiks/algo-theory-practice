import { describe, expect, it } from 'vitest';
import { exercisePack } from '@/content/exercises/pack';
import { getMachineById } from '@/content/machines/index';
import {
  buildTapeResultMcq,
  buildTapeResultMcqFromAuthor,
  configurationsEqual,
  tapeConfigurationKey,
} from '@/lib/grading/tapeResult';
import { initialConfiguration, step } from '@/lib/tm/engine';

describe('tape-result pack quality', () => {
  const tapeExercises = exercisePack.filter((e) => e.mode === 'tape_result');

  it('has at least one tape-result item', () => {
    expect(tapeExercises.length).toBeGreaterThan(0);
  });

  for (const ex of tapeExercises) {
    it(`unique MCQ rows & single engine match: ${ex.id}`, () => {
      const machine = getMachineById(ex.machineId);
      expect(machine).toBeDefined();
      const c0 = initialConfiguration(
        machine!,
        ex.setup.input,
        ex.setup.headIndex ?? 0
      );
      const { next } = step(machine!, c0);

      const authored =
        ex.options?.length && ex.correctOptionId
          ? buildTapeResultMcqFromAuthor(machine!, c0, {
              options: ex.options,
              correctOptionId: ex.correctOptionId,
            })
          : null;
      const built = authored ?? buildTapeResultMcq(machine!, c0, { rng: () => 0 });
      expect(built).not.toBeNull();

      const keys = built!.options.map((o) =>
        tapeConfigurationKey(machine!, o.resultingConfig)
      );
      expect(new Set(keys).size).toBe(keys.length);

      const correctRow = built!.options.find(
        (o) => o.id === built!.correctOptionId
      );
      expect(correctRow).toBeDefined();
      expect(
        configurationsEqual(machine!, correctRow!.resultingConfig, next)
      ).toBe(true);

      let matchCount = 0;
      for (const o of built!.options) {
        if (configurationsEqual(machine!, o.resultingConfig, next)) {
          matchCount += 1;
        }
      }
      expect(matchCount).toBe(1);
    });
  }
});
