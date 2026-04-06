export interface StrategyQuestionPanelProps {
  title: string;
  description?: string;
  options: { id: string; label: string }[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onSubmit: () => void;
  submitDisabled: boolean;
  interactionLocked?: boolean;
}

export function StrategyQuestionPanel({
  title,
  description,
  options,
  selectedId,
  onSelect,
  onSubmit,
  submitDisabled,
  interactionLocked = false,
}: StrategyQuestionPanelProps) {
  const locked = interactionLocked;

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900/80 p-4">
      <h2 className="text-lg font-semibold text-slate-100">{title}</h2>
      {description ? (
        <p className="mt-1 text-sm text-slate-400">{description}</p>
      ) : null}
      {locked ? (
        <p className="mt-2 text-xs text-amber-200/90" role="status">
          Please wait…
        </p>
      ) : null}
      <fieldset className="mt-4 space-y-2" disabled={locked}>
        <legend className="text-sm font-medium text-slate-300">
          Choose the best answer
        </legend>
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
              name="strategy-mcq"
              className="mt-1 shrink-0"
              checked={selectedId === o.id}
              onChange={() => onSelect(o.id)}
              disabled={locked}
            />
            <span className="text-slate-200">{o.label}</span>
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
