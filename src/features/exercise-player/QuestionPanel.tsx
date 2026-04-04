import type { TransitionMcqOption } from '@/types/tm';

export interface QuestionPanelProps {
  title: string;
  description?: string;
  options: TransitionMcqOption[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onSubmit: () => void;
  submitDisabled: boolean;
  halted: boolean;
  /** Disable inputs while a step animation is playing. */
  interactionLocked?: boolean;
}

export function QuestionPanel({
  title,
  description,
  options,
  selectedId,
  onSelect,
  onSubmit,
  submitDisabled,
  halted,
  interactionLocked = false,
}: QuestionPanelProps) {
  if (halted) {
    return (
      <div className="rounded-lg border border-slate-700 bg-slate-900/80 p-4">
        <h2 className="text-lg font-semibold text-slate-100">{title}</h2>
        <p className="mt-2 text-slate-400">
          The machine has halted. Use reset to practice again from the initial
          tape.
        </p>
      </div>
    );
  }

  const locked = interactionLocked;

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900/80 p-4">
      <h2 className="text-lg font-semibold text-slate-100">{title}</h2>
      {description ? (
        <p className="mt-1 text-sm text-slate-400">{description}</p>
      ) : null}
      {locked ? (
        <p className="mt-2 text-xs text-amber-200/90" role="status">
          Step animation playing…
        </p>
      ) : null}
      <fieldset className="mt-4 space-y-2" disabled={locked}>
        <legend className="text-sm font-medium text-slate-300">
          Which transition happens next?
        </legend>
        <p className="text-xs text-slate-500">
          Each option is one step: next state, symbol written on the current cell,
          then head move (L / R / S).
        </p>
        {options.map((o) => (
          <label
            key={o.id}
            className={`flex cursor-pointer items-start gap-3 rounded-md border px-3 py-2 text-sm ${
              selectedId === o.id
                ? 'border-amber-500/60 bg-amber-500/10'
                : 'border-slate-600 hover:border-slate-500'
            }`}
          >
            <input
              type="radio"
              name="next-transition"
              className="mt-1"
              checked={selectedId === o.id}
              onChange={() => onSelect(o.id)}
              disabled={locked}
            />
            <span className="font-mono text-slate-200">{o.label}</span>
          </label>
        ))}
      </fieldset>
      <button
        type="button"
        className="mt-4 rounded-md bg-amber-500 px-4 py-2 text-sm font-medium text-slate-950 disabled:opacity-40"
        disabled={locked || submitDisabled || !selectedId}
        onClick={onSubmit}
      >
        Check answer
      </button>
    </div>
  );
}
