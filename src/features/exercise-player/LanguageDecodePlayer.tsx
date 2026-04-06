import { useCallback, useEffect, useMemo, useState } from 'react';
import { HINT_TEXT } from '@/content/hints';
import { FeedbackPanel } from '@/features/exercise-player/FeedbackPanel';
import type { PlayerMode } from '@/features/exercise-player/MvpPlayer';
import type { LanguageDecodeExercise } from '@/types/mvp';

const STEP_TITLES = [
  'What does this language mean?',
  'Which strings belong to the language?',
  'Which strings do not belong?',
  'What must a TM check?',
  'Which TM strategy fits best?',
] as const;

type StepIndex = 0 | 1 | 2 | 3 | 4;

function setsEqual(selected: Set<string>, expected: readonly string[]): boolean {
  if (selected.size !== expected.length) return false;
  for (const id of expected) {
    if (!selected.has(id)) return false;
  }
  return true;
}

export interface LanguageDecodePlayerProps {
  exercise: LanguageDecodeExercise;
  playerMode?: PlayerMode;
}

export function LanguageDecodePlayer({
  exercise,
  playerMode = 'study',
}: LanguageDecodePlayerProps) {
  const [stepIndex, setStepIndex] = useState<StepIndex>(0);
  const [mcqId, setMcqId] = useState<string | null>(null);
  const [multiIds, setMultiIds] = useState<Set<string>>(() => new Set());
  const [feedback, setFeedback] = useState<{
    message: string | null;
    variant: 'neutral' | 'success' | 'error';
    showExplanation: boolean;
    explanation?: string;
  }>({ message: null, variant: 'neutral', showExplanation: false });
  const [stepPassed, setStepPassed] = useState<boolean[]>(() => [
    false,
    false,
    false,
    false,
    false,
  ]);
  const [hintsShown, setHintsShown] = useState(0);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    setStepIndex(0);
    setMcqId(null);
    setMultiIds(new Set());
    setFeedback({ message: null, variant: 'neutral', showExplanation: false });
    setStepPassed([false, false, false, false, false]);
    setHintsShown(0);
    setFinished(false);
  }, [exercise.id]);

  const stepField = useMemo(() => {
    switch (stepIndex) {
      case 0:
        return exercise.plainEnglish;
      case 1:
        return exercise.examplesInLanguage;
      case 2:
        return exercise.examplesNotInLanguage;
      case 3:
        return exercise.condition;
      case 4:
        return exercise.tmStrategy;
      default:
        return exercise.plainEnglish;
    }
  }, [exercise, stepIndex]);

  const isMulti = stepIndex === 1 || stepIndex === 2;

  const toggleMulti = useCallback((id: string) => {
    setMultiIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleCheck = useCallback(() => {
    if (finished) return;

    if (isMulti) {
      const multi = stepField as LanguageDecodeExercise['examplesInLanguage'];
      const ok = setsEqual(multiIds, multi.correctChoiceIds);
      if (ok) {
        setFeedback({
          message: 'Correct.',
          variant: 'success',
          showExplanation: true,
          explanation: multi.feedbackIfCorrect,
        });
        setStepPassed((p) => {
          const n = [...p];
          n[stepIndex] = true;
          return n;
        });
      } else {
        const need = multi.correctChoiceIds.length;
        setFeedback({
          message: `Not quite — select exactly ${need} string(s) that match this step.`,
          variant: 'error',
          showExplanation: true,
          explanation: multi.feedbackIfWrong,
        });
      }
      return;
    }

    const mcq = stepField as LanguageDecodeExercise['plainEnglish'];
    if (!mcqId) return;
    const ok = mcqId === mcq.correctOptionId;
    if (ok) {
      setFeedback({
        message: 'Correct.',
        variant: 'success',
        showExplanation: true,
        explanation: mcq.feedbackIfCorrect,
      });
      setStepPassed((p) => {
        const n = [...p];
        n[stepIndex] = true;
        return n;
      });
    } else {
      setFeedback({
        message: 'Not quite — try another option.',
        variant: 'error',
        showExplanation: true,
        explanation: mcq.feedbackIfWrong,
      });
    }
  }, [finished, isMulti, mcqId, multiIds, stepField, stepIndex]);

  const canContinue =
    stepPassed[stepIndex] && feedback.variant === 'success' && !finished;

  const handleContinue = useCallback(() => {
    if (!canContinue) return;
    if (stepIndex < 4) {
      setStepIndex((s) => (s + 1) as StepIndex);
      setMcqId(null);
      setMultiIds(new Set());
      setFeedback({ message: null, variant: 'neutral', showExplanation: false });
    } else {
      setFinished(true);
      setFeedback({
        message: 'Exercise complete.',
        variant: 'success',
        showExplanation: true,
        explanation: exercise.explanation,
      });
    }
  }, [canContinue, exercise.explanation, stepIndex]);

  const handleReset = useCallback(() => {
    setStepIndex(0);
    setMcqId(null);
    setMultiIds(new Set());
    setFeedback({ message: null, variant: 'neutral', showExplanation: false });
    setStepPassed([false, false, false, false, false]);
    setHintsShown(0);
    setFinished(false);
  }, []);

  const submitDisabled = isMulti
    ? multiIds.size === 0 || stepPassed[stepIndex]
    : mcqId === null || stepPassed[stepIndex];

  const nextHint = exercise.hints[hintsShown];

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-500">
        {exercise.category.replace(/_/g, ' ')} · difficulty {exercise.difficulty}{' '}
        · language decode · mode: {playerMode}
      </p>

      <div className="rounded-xl border border-amber-500/30 bg-slate-900/90 p-5 shadow-sm shadow-amber-950/20">
        <p className="text-xs font-medium uppercase tracking-wide text-amber-200/80">
          Formal language
        </p>
        <p className="mt-2 break-words font-mono text-lg text-amber-50 sm:text-xl whitespace-pre-wrap">
          {exercise.languageNotation}
        </p>
        {exercise.alphabetNote ? (
          <p className="mt-3 text-sm text-slate-400">{exercise.alphabetNote}</p>
        ) : null}
      </div>

      <nav aria-label="Progress" className="flex flex-wrap gap-2">
        {STEP_TITLES.map((title, i) => (
          <span
            key={title}
            className={`rounded-full px-3 py-1 text-xs ${
              i === stepIndex && !finished
                ? 'bg-amber-500/25 text-amber-100 ring-1 ring-amber-500/40'
                : stepPassed[i] || finished
                  ? 'bg-emerald-950/50 text-emerald-200'
                  : 'bg-slate-800 text-slate-500'
            }`}
          >
            {i + 1}. {title}
          </span>
        ))}
      </nav>

      {!finished || stepIndex < 4 ? (
        <div className="rounded-lg border border-slate-700 bg-slate-900/80 p-4">
          <h2 className="text-lg font-semibold text-slate-100">
            {STEP_TITLES[stepIndex]}
          </h2>
          {isMulti ? (
            <>
              <p className="mt-2 text-sm text-slate-400">
                {(stepField as LanguageDecodeExercise['examplesInLanguage']).prompt}
              </p>
              <p className="mt-2 text-xs text-slate-500">
                Select all that apply, then check your answer.
              </p>
              <fieldset className="mt-4 space-y-2" disabled={stepPassed[stepIndex]}>
                <legend className="sr-only">Multi-select choices</legend>
                {(stepField as LanguageDecodeExercise['examplesInLanguage']).choices.map(
                  (c) => (
                    <label
                      key={c.id}
                      className={`flex cursor-pointer items-start gap-3 rounded-md border px-3 py-2 text-sm ${
                        multiIds.has(c.id)
                          ? 'border-amber-500/60 bg-amber-500/10'
                          : 'border-slate-600 hover:border-slate-500'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="mt-1 shrink-0 rounded border-slate-600"
                        checked={multiIds.has(c.id)}
                        onChange={() => toggleMulti(c.id)}
                      />
                      <span className="font-mono text-slate-200">{c.label}</span>
                    </label>
                  )
                )}
              </fieldset>
            </>
          ) : (
            <>
              <p className="mt-2 text-sm text-slate-400">
                {(stepField as LanguageDecodeExercise['plainEnglish']).prompt}
              </p>
              <fieldset
                className="mt-4 space-y-2"
                disabled={stepPassed[stepIndex]}
              >
                <legend className="sr-only">Single choice</legend>
                {(stepField as LanguageDecodeExercise['plainEnglish']).options.map(
                  (o) => (
                    <label
                      key={o.id}
                      className={`flex cursor-pointer items-start gap-3 rounded-md border px-3 py-2 text-sm ${
                        mcqId === o.id
                          ? 'border-amber-500/60 bg-amber-500/10'
                          : 'border-slate-600 hover:border-slate-500'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`ld-mcq-step-${stepIndex}-${exercise.id}`}
                        className="mt-1 shrink-0"
                        checked={mcqId === o.id}
                        onChange={() => setMcqId(o.id)}
                      />
                      <span className="text-slate-200">{o.label}</span>
                    </label>
                  )
                )}
              </fieldset>
            </>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-md bg-amber-500 px-4 py-2 text-sm font-medium text-slate-950 disabled:opacity-40"
              disabled={submitDisabled}
              onClick={handleCheck}
            >
              Check answer
            </button>
            <button
              type="button"
              className="rounded-md border border-slate-600 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800 disabled:opacity-40"
              disabled={!canContinue}
              onClick={handleContinue}
            >
              {stepIndex < 4 ? 'Continue' : 'Finish'}
            </button>
          </div>
        </div>
      ) : null}

      {finished ? (
        <p
          className="rounded-md border border-emerald-700/40 bg-emerald-950/30 px-3 py-2 text-sm text-emerald-100"
          role="status"
        >
          All five parts completed. Use “Reset exercise” to run through the
          steps again.
        </p>
      ) : null}

      <FeedbackPanel
        message={feedback.message}
        variant={feedback.variant}
        showExplanation={feedback.showExplanation}
        explanation={feedback.explanation}
      />

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-md border border-slate-600 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800"
          onClick={handleReset}
        >
          Reset exercise
        </button>
        {nextHint ? (
          <button
            type="button"
            className="rounded-md border border-slate-600 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800"
            onClick={() => setHintsShown((n) => n + 1)}
          >
            Show hint {hintsShown + 1}
          </button>
        ) : null}
      </div>

      {hintsShown > 0 ? (
        <ul className="list-inside list-disc text-sm text-slate-400">
          {exercise.hints.slice(0, hintsShown).map((h, i) => (
            <li key={`${exercise.id}-${h.hintId}-${i}`}>
              {HINT_TEXT[h.hintId] ?? h.hintId}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
