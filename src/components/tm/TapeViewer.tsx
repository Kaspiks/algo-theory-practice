import type { TapeModel, TuringMachineDefinition } from '@/types/tm';

function displaySymbol(
  symbol: string,
  machine: TuringMachineDefinition
): string {
  if (symbol !== machine.blank) return symbol;
  switch (machine.blankDisplay) {
    case 'underscore':
      return '_';
    case 'B':
      return 'B';
    case 'cup':
    default:
      return '⊔';
  }
}

export type TapeCellEmphasis = 'none' | 'write' | 'head_move';

export interface TapeViewerProps {
  machine: TuringMachineDefinition;
  tape: TapeModel;
  /** Head highlight index (defaults to tape.headIndex). */
  visualHeadIndex?: number;
  /** Softer ring on previous head cell during head-move animation. */
  ghostHeadIndex?: number | null;
  /** Emphasis on the cell at visualHeadIndex. */
  cellEmphasis?: TapeCellEmphasis;
}

export function TapeViewer({
  machine,
  tape,
  visualHeadIndex: visualHeadProp,
  ghostHeadIndex = null,
  cellEmphasis = 'none',
}: TapeViewerProps) {
  const visualHead = visualHeadProp ?? tape.headIndex;

  return (
    <div
      className="flex flex-wrap items-center gap-1 rounded-lg border border-slate-700 bg-slate-900/80 p-4"
      role="group"
      aria-label="Tape"
    >
      {tape.cells.map((cell, i) => {
        const isHead = i === visualHead;
        const isGhost = ghostHeadIndex != null && i === ghostHeadIndex && !isHead;
        const emphasis =
          isHead && cellEmphasis === 'write'
            ? 'ring-2 ring-sky-400/90 ring-offset-2 ring-offset-slate-900'
            : isHead && cellEmphasis === 'head_move'
              ? 'ring-2 ring-amber-300/90 ring-offset-2 ring-offset-slate-900'
              : '';
        const writePulse =
          isHead && cellEmphasis === 'write' ? 'tm-tape-write-pulse' : '';
        const headMovePulse =
          isHead && cellEmphasis === 'head_move'
            ? 'tm-tape-head-move-pulse'
            : '';

        return (
          <div
            key={`cell-${i}`}
            className={`flex min-w-[2.5rem] flex-col items-center rounded border px-2 py-1 font-mono text-lg transition-[transform,box-shadow,background-color,border-color] duration-300 ease-out ${
              isHead
                ? `border-amber-400 bg-amber-500/25 text-amber-50 ${emphasis} ${writePulse} ${headMovePulse}`
                : isGhost
                  ? 'border-amber-500/35 bg-amber-500/10 text-slate-300'
                  : 'border-slate-600 bg-slate-800 text-slate-200'
            }`}
            aria-current={isHead ? 'true' : undefined}
          >
            <span className="text-xs text-slate-500">{i}</span>
            <span
              className={
                isHead && cellEmphasis === 'write'
                  ? 'inline-block scale-105 transition-transform duration-300 ease-out'
                  : 'inline-block transition-opacity duration-200'
              }
            >
              {displaySymbol(cell, machine)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
