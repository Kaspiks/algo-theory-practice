import { TapeViewer } from '@/components/tm/TapeViewer';
import type { TapeResultMcqOption, TuringMachineDefinition } from '@/types/tm';

export interface TapeResultQuestionProps {
  machine: TuringMachineDefinition;
  title: string;
  description?: string;
  options: TapeResultMcqOption[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onSubmit: () => void;
  submitDisabled: boolean;
  halted: boolean;
  interactionLocked?: boolean;
  /** Playback: option id matching engine next config (not grading). */
  previewCorrectOptionId?: string | null;
  /** True while waiting after preview highlight, before animation starts. */
  playbackPreviewActive?: boolean;
}

export function TapeResultQuestion({
  machine,
  title,
  description,
  options,
  selectedId,
  onSelect,
  onSubmit,
  submitDisabled,
  halted,
  interactionLocked = false,
  previewCorrectOptionId = null,
  playbackPreviewActive = false,
}: TapeResultQuestionProps) {
  if (halted) {
    return (
      <div className="rounded-lg border border-slate-700 bg-slate-900/80 p-4">
        <h2 className="text-lg font-semibold text-slate-100">{title}</h2>
        <p className="mt-2 text-slate-400">
          The machine has halted. Use reset to try again from the initial
          configuration.
        </p>
      </div>
    );
  }

  const locked = interactionLocked;

  const showPlaybackAnswerCue =
    previewCorrectOptionId != null &&
    (playbackPreviewActive || locked);

  const dimIncorrectDuringPreview =
    playbackPreviewActive && previewCorrectOptionId != null;

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900/80 p-4">
      <h2 className="text-lg font-semibold text-slate-100">{title}</h2>
      {description ? (
        <p className="mt-1 text-sm text-slate-400">{description}</p>
      ) : null}
      <fieldset className="mt-4 space-y-3" disabled={locked}>
        <legend className="text-sm font-medium text-slate-300">
          After exactly one step, which configuration is correct?
        </legend>
        <p className="text-xs text-slate-500">
          Each option shows the next state, tape contents (after the write), and
          head position (after the move). The highlighted cell is where the head
          sits.
        </p>
        {playbackPreviewActive && previewCorrectOptionId ? (
          <p
            className="rounded-md border border-sky-500/30 bg-sky-500/[0.07] px-2 py-1.5 text-xs text-sky-100/90"
            role="status"
          >
            Watch the option below, then the tape animation.
          </p>
        ) : null}
        {locked && previewCorrectOptionId ? (
          <p className="text-xs text-sky-200/80" role="status">
            Animating that configuration…
          </p>
        ) : null}
        {locked && !previewCorrectOptionId ? (
          <p className="text-xs text-amber-200/90" role="status">
            Step animation playing…
          </p>
        ) : null}
        {showPlaybackAnswerCue ? (
          <p
            className="mb-0.5 text-sm font-medium text-slate-200"
            id="tape-result-playback-cue"
          >
            Correct next configuration:
          </p>
        ) : null}
        <div
          className="grid gap-3 sm:grid-cols-2"
          aria-labelledby={
            showPlaybackAnswerCue ? 'tape-result-playback-cue' : undefined
          }
        >
          {options.map((o) => {
            const sel = selectedId === o.id;
            const isPreview = previewCorrectOptionId === o.id;
            const dimmed =
              dimIncorrectDuringPreview && !isPreview && previewCorrectOptionId;

            const borderClass = sel
              ? 'border-amber-500/70 bg-amber-500/10'
              : 'border-slate-600 hover:border-slate-500';

            const previewRing = isPreview
              ? 'ring-2 ring-sky-400/75 ring-offset-2 ring-offset-slate-950'
              : '';

            const previewPulse =
              isPreview && previewCorrectOptionId
                ? 'tape-result-preview-pulse'
                : '';

            return (
              <label
                key={o.id}
                className={`flex cursor-pointer flex-col gap-2 rounded-lg border px-3 py-3 text-left transition-[opacity,box-shadow,border-color,background-color] duration-300 ${borderClass} ${previewRing} ${previewPulse} ${
                  dimmed ? 'opacity-[0.42]' : 'opacity-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="tape-result"
                    className="mt-0.5"
                    checked={sel}
                    disabled={locked}
                    onChange={() => onSelect(o.id)}
                    aria-describedby={`tape-result-${o.id}-state`}
                  />
                  <span
                    id={`tape-result-${o.id}-state`}
                    className="font-mono text-sm font-semibold text-amber-200"
                  >
                    State: {o.resultingConfig.state}
                  </span>
                </div>
                {o.label ? (
                  <p className="pl-6 text-xs leading-snug text-slate-500">
                    {o.label}
                  </p>
                ) : null}
                <div className="overflow-x-auto pl-6">
                  <TapeViewer
                    machine={machine}
                    tape={o.resultingConfig.tape}
                    variant="compact"
                  />
                </div>
                {!o.label ? (
                  <span className="sr-only">Tape option {o.id}</span>
                ) : null}
              </label>
            );
          })}
        </div>
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
