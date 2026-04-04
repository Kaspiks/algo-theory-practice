import { describe, expect, it } from 'vitest';
import { exercisePack } from '@/content/exercises/pack';
import { getMachineById } from '@/content/machines/index';
import {
  buildTapeResultMcqForState,
  findMatchingTapeResultOptionId,
} from '@/lib/grading/tapeResult';
import { initialConfiguration, peekNextAnswer, step } from '@/lib/tm/engine';
import type { TapeResultExercise } from '@/types/mvp';

/**
 * Ensures playback preview would highlight the same row as the MCQ's correctOptionId
 * (engine next config vs option resultingConfig) for every step until halt.
 */
describe('tape-result playback ↔ engine sync', () => {
  const tapeExercises = exercisePack.filter((e) => e.mode === 'tape_result');

  for (const ex of tapeExercises) {
    it(`preview match === correctOptionId for full run: ${ex.id}`, () => {
      const machine = getMachineById(ex.machineId);
      expect(machine).toBeDefined();

      let config = initialConfiguration(
        machine!,
        ex.setup.input,
        ex.setup.headIndex ?? 0
      );
      let stepCount = 0;
      const maxSteps = (machine!.maxSteps ?? 200) + 5;
      let steps = 0;

      while (peekNextAnswer(machine!, config) !== null && steps < maxSteps) {
        const tex = ex as TapeResultExercise;
        const authored =
          stepCount === 0 &&
          tex.options?.length &&
          tex.correctOptionId
            ? { options: tex.options, correctOptionId: tex.correctOptionId }
            : null;

        const built = buildTapeResultMcqForState(
          machine!,
          config,
          stepCount,
          authored
        );
        expect(
          built,
          `MCQ missing at step ${stepCount} for ${ex.id}`
        ).not.toBeNull();

        const r = step(machine!, config);
        expect(r.fired, `step ${stepCount} ${ex.id}`).toBeDefined();

        const matchId = findMatchingTapeResultOptionId(
          machine!,
          built!.options,
          r.next
        );
        expect(
          matchId,
          `no matching option at step ${stepCount} for ${ex.id}`
        ).not.toBeNull();
        expect(matchId).toBe(built!.correctOptionId);

        config = r.next;
        stepCount += 1;
        steps += 1;
      }
    });
  }
});
