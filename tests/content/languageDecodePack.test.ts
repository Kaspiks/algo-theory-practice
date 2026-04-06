import { describe, expect, it } from 'vitest';
import { languageDecodePack } from '@/content/exercises/languageDecodePack';

describe('languageDecodePack authoring', () => {
  for (const ex of languageDecodePack) {
    it(`option ids are consistent: ${ex.id}`, () => {
      const pe = ex.plainEnglish;
      expect(pe.options.some((o) => o.id === pe.correctOptionId)).toBe(true);

      const choiceIdsIn = new Set(ex.examplesInLanguage.choices.map((c) => c.id));
      for (const id of ex.examplesInLanguage.correctChoiceIds) {
        expect(choiceIdsIn.has(id), `in-language missing ${id}`).toBe(true);
      }

      const choiceIdsOut = new Set(ex.examplesNotInLanguage.choices.map((c) => c.id));
      for (const id of ex.examplesNotInLanguage.correctChoiceIds) {
        expect(choiceIdsOut.has(id), `not-in-language missing ${id}`).toBe(true);
      }

      expect(
        ex.condition.options.some((o) => o.id === ex.condition.correctOptionId)
      ).toBe(true);
      expect(
        ex.tmStrategy.options.some((o) => o.id === ex.tmStrategy.correctOptionId)
      ).toBe(true);
    });
  }
});
