import { describe, expect, it } from 'vitest';
import { languageDecodePack } from '@/content/exercises/languageDecodePack';
import type { LanguageDecodeExercise } from '@/types/mvp';

const EPS = '\u03b5'; // ε — avoid /\b/ after ε (not a JS “word” char without /u)

/** Strip parenthetical glosses and normalize ε labels to empty string. */
export function parseChoiceLabel(label: string): string {
  const t = label.trim();
  if (t === EPS || t.startsWith(`${EPS} `) || t.startsWith(`${EPS}(`)) {
    return '';
  }
  return t.replace(/\s+\([^)]*\)\s*$/, '').trim();
}

function rev(s: string): string {
  return [...s].reverse().join('');
}

function isAkBk(s: string): boolean {
  const m = s.match(/^(a*)(b*)$/);
  if (!m) return false;
  return m[1]!.length === m[2]!.length;
}

function isAkB2k(s: string): boolean {
  const m = s.match(/^(a*)(b*)$/);
  if (!m) return false;
  return m[2]!.length === 2 * m[1]!.length;
}

function isAkB2kPlus1(s: string): boolean {
  const m = s.match(/^(a*)(b*)$/);
  if (!m) return false;
  return m[2]!.length === 2 * m[1]!.length + 1;
}

function isAkBkAk(s: string): boolean {
  const m = s.match(/^(a*)(b*)(a*)$/);
  if (!m) return false;
  const a1 = m[1]!.length;
  const b = m[2]!.length;
  const a2 = m[3]!.length;
  return a1 === b && b === a2;
}

function isBkAk(s: string): boolean {
  const m = s.match(/^(b*)(a*)$/);
  if (!m) return false;
  return m[1]!.length === m[2]!.length;
}

function isXHashXrev(s: string): boolean {
  const parts = s.split('#');
  if (parts.length !== 2) return false;
  const [x, y] = parts;
  if (x === undefined || y === undefined) return false;
  if (!/^[ab]*$/.test(x) || !/^[ab]*$/.test(y)) return false;
  return y === rev(x);
}

function countSym(s: string, ch: string): number {
  return [...s].filter((c) => c === ch).length;
}

function strictMoreA(s: string): boolean {
  return countSym(s, 'a') > countSym(s, 'b');
}

function atLeastHalfA(s: string): boolean {
  const a = countSym(s, 'a');
  const b = countSym(s, 'b');
  return a >= b;
}

function isSquareLen(n: number): boolean {
  if (n < 0) return false;
  const r = Math.round(Math.sqrt(n));
  return r * r === n;
}

function zerosSquareLength(s: string): boolean {
  if (!/^0*$/.test(s)) return false;
  return isSquareLen(s.length);
}

function binaryEndsWithOne(s: string): boolean {
  return s.length > 0 && s[s.length - 1] === '1';
}

function isPalindromeAb(s: string): boolean {
  return s === rev(s);
}

function isWw(s: string): boolean {
  if (s.length % 2 !== 0) return false;
  const h = s.length / 2;
  return s.slice(0, h) === s.slice(h);
}

function contains001(s: string): boolean {
  return s.includes('001');
}

type InL = (w: string) => boolean;

const IN_L: Record<string, InL> = {
  'ld-binary-ends-in-one': binaryEndsWithOne,
  'ld-ak-bk': isAkBk,
  'ld-palindrome-wr': isPalindromeAb,
  'ld-ak-b2k': isAkB2k,
  'ld-akbkak': isAkBkAk,
  'ld-x-hash-xrev': isXHashXrev,
  'ld-more-a-than-b': strictMoreA,
  'ld-zero-n-squared': zerosSquareLength,
  'ld-exam3-ak-b2k-plus-1': isAkB2kPlus1,
  'ld-exam2-at-least-half-a': atLeastHalfA,
  'ld-sipser-ww': isWw,
  'ld-hw-binary-contains-001': contains001,
  'ld-course-bk-ak-vs-ak-bk': isBkAk,
};

function assertInExamples(
  ex: LanguageDecodeExercise,
  inL: InL,
  step: 'in' | 'out'
): void {
  const block =
    step === 'in' ? ex.examplesInLanguage : ex.examplesNotInLanguage;
  const expectIn = step === 'in';
  const byId = new Map(block.choices.map((c) => [c.id, parseChoiceLabel(c.label)]));

  for (const id of block.correctChoiceIds) {
    const w = byId.get(id);
    expect(w, `missing choice ${id}`).toBeDefined();
    expect(inL(w!), `${ex.id} ${step} correct ${id} "${w}"`).toBe(expectIn);
  }

  for (const c of block.choices) {
    const w = parseChoiceLabel(c.label);
    const marked = block.correctChoiceIds.includes(c.id);
    if (marked) continue;
    expect(inL(w), `${ex.id} ${step} distractor ${c.id} "${c.label}"`).toBe(
      !expectIn
    );
  }
}

describe('language decode: semantic membership vs authored keys', () => {
  for (const ex of languageDecodePack) {
    const inL = IN_L[ex.id];
    if (!inL) {
      throw new Error(`Add IN_L checker for ${ex.id}`);
    }

    it(`in-language step: ${ex.id}`, () => {
      assertInExamples(ex, inL, 'in');
    });

    it(`not-in-language step: ${ex.id}`, () => {
      assertInExamples(ex, inL, 'out');
    });
  }
});
