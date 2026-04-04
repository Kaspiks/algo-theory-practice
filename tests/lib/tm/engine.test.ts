import { describe, expect, it } from 'vitest';
import {
  initialConfiguration,
  peekNextAnswer,
  runUntilHalt,
  step,
} from '@/lib/tm/engine';
import { scanBinaryMachine } from '@/content/machines/scanBinary';
import type { TuringMachineDefinition } from '@/types/tm';

describe('TM engine — scan binary machine', () => {
  it('initializes tape from input', () => {
    const c = initialConfiguration(scanBinaryMachine, '110', 0);
    expect(c.state).toBe('q0');
    expect(c.tape.cells).toEqual(['1', '1', '0']);
    expect(c.tape.headIndex).toBe(0);
  });

  it('scans right over 1 preserving symbols', () => {
    let c = initialConfiguration(scanBinaryMachine, '110', 0);
    const r1 = step(scanBinaryMachine, c);
    expect(r1.fired?.move).toBe('R');
    expect(r1.next.tape.headIndex).toBe(1);
    c = r1.next;
    const r2 = step(scanBinaryMachine, c);
    expect(r2.next.tape.headIndex).toBe(2);
  });

  it('accepts on blank after input', () => {
    let c = initialConfiguration(scanBinaryMachine, '0', 0);
    const r1 = step(scanBinaryMachine, c);
    c = r1.next;
    const r2 = step(scanBinaryMachine, c);
    expect(r2.status).toBe('accepted');
    expect(r2.next.state).toBe('q_accept');
  });

  it('peekNextAnswer matches next step', () => {
    const c = initialConfiguration(scanBinaryMachine, '10', 0);
    const expected = peekNextAnswer(scanBinaryMachine, c);
    const r = step(scanBinaryMachine, c);
    expect(expected).not.toBeNull();
    expect(r.fired?.to).toBe(expected!.nextState);
    expect(r.fired?.write).toBe(expected!.write);
    expect(r.fired?.move).toBe(expected!.move);
  });

  it('runUntilHalt reaches accept', () => {
    const c0 = initialConfiguration(scanBinaryMachine, '110', 0);
    const trace = runUntilHalt(scanBinaryMachine, c0, 50);
    const last = trace[trace.length - 1];
    expect(last.status).toBe('accepted');
  });

  it('applies stay move without moving head', () => {
    let c = initialConfiguration(scanBinaryMachine, '0', 0);
    c = step(scanBinaryMachine, c).next;
    const r = step(scanBinaryMachine, c);
    expect(r.fired?.move).toBe('S');
    expect(r.next.tape.headIndex).toBe(c.tape.headIndex);
    expect(r.status).toBe('accepted');
  });

  it('extends tape with blank on move right past end', () => {
    const BLANK = '⊔';
    const machine: TuringMachineDefinition = {
      id: 'extend_r',
      states: ['q0', 'q_accept', 'q_reject'],
      inputAlphabet: ['0'],
      tapeAlphabet: ['0', BLANK],
      start: 'q0',
      accept: 'q_accept',
      reject: 'q_reject',
      blank: BLANK,
      policies: { leftEnd: 'reject', undefinedTransition: 'reject' },
      transitions: {
        q0: {
          '0': { next: 'q0', write: '0', move: 'R' },
          [BLANK]: { next: 'q_accept', write: BLANK, move: 'S' },
        },
        q_accept: {},
        q_reject: {},
      },
    };
    let c = initialConfiguration(machine, '0', 0);
    c = step(machine, c).next;
    expect(c.tape.cells).toEqual(['0', BLANK]);
    expect(c.tape.headIndex).toBe(1);
    expect(c.state).toBe('q0');
    const r2 = step(machine, c);
    expect(r2.status).toBe('accepted');
  });

  it('rejects when moving left from leftmost cell (policy reject)', () => {
    const BLANK = '⊔';
    const machine: TuringMachineDefinition = {
      id: 'left_reject',
      states: ['q0', 'q_accept', 'q_reject'],
      inputAlphabet: ['0'],
      tapeAlphabet: ['0', BLANK],
      start: 'q0',
      accept: 'q_accept',
      reject: 'q_reject',
      blank: BLANK,
      policies: { leftEnd: 'reject', undefinedTransition: 'reject' },
      transitions: {
        q0: {
          '0': { next: 'q0', write: '0', move: 'L' },
        },
        q_accept: {},
        q_reject: {},
      },
    };
    const c = initialConfiguration(machine, '0', 0);
    const r = step(machine, c);
    expect(r.status).toBe('rejected');
    expect(r.next.state).toBe('q_reject');
    expect(r.fired?.move).toBe('L');
  });

  it('rejects on undefined transition; peek gives synthetic reject triple', () => {
    const BLANK = '⊔';
    const machine: TuringMachineDefinition = {
      id: 'undef_tm',
      name: 'undef',
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
    let c = initialConfiguration(machine, 'a', 0);
    c = step(machine, c).next;
    const exp = peekNextAnswer(machine, c);
    expect(exp).toEqual({
      nextState: 'q_reject',
      write: BLANK,
      move: 'S',
    });
    const r = step(machine, c);
    expect(r.status).toBe('rejected');
    expect(r.next.state).toBe('q_reject');
  });
});
