export interface FeedbackPanelProps {
  message: string | null;
  variant: 'neutral' | 'success' | 'error';
  showExplanation: boolean;
  explanation?: string;
}

export function FeedbackPanel({
  message,
  variant,
  showExplanation,
  explanation,
}: FeedbackPanelProps) {
  if (!message && !showExplanation) return null;

  const border =
    variant === 'success'
      ? 'border-emerald-600/60 bg-emerald-950/40'
      : variant === 'error'
        ? 'border-rose-600/60 bg-rose-950/40'
        : 'border-slate-600 bg-slate-900/80';

  return (
    <div
      className={`rounded-lg border p-4 ${border}`}
      role="status"
      aria-live="polite"
    >
      {message ? (
        <p
          className={
            variant === 'success'
              ? 'text-emerald-200'
              : variant === 'error'
                ? 'text-rose-200'
                : 'text-slate-200'
          }
        >
          {message}
        </p>
      ) : null}
      {showExplanation && explanation ? (
        <div className="mt-3 border-t border-slate-600/50 pt-3 text-sm text-slate-300">
          <p className="font-medium text-slate-400">Explanation</p>
          <p className="mt-1">{explanation}</p>
        </div>
      ) : null}
    </div>
  );
}
