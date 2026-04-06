import type { HeadMove } from '@/types/tm';

export type TmStateKind = 'work' | 'start' | 'accept' | 'reject';

export interface TmStateNodeData extends Record<string, unknown> {
  label: string;
  kind: TmStateKind;
}

/** One row of read/write/move on a drawn edge (there may be several per edge). */
export interface TmTransitionRule {
  read: string;
  write: string;
  move: HeadMove;
}

export interface TmEdgeData extends Record<string, unknown> {
  /** Multiple rules on one drawn edge; optional if legacy read/write/move present. */
  rules?: TmTransitionRule[];
  /** Legacy single-rule shape (migrated by {@link normalizeEdgeData}). */
  read?: string;
  write?: string;
  move?: HeadMove;
}

/**
 * Normalize edge payload: `rules` wins; else migrate legacy read/write/move.
 * Empty `rules: []` stays empty (no invented placeholder rules).
 */
export function normalizeEdgeData(data: Partial<TmEdgeData> | undefined | null): {
  rules: TmTransitionRule[];
} {
  if (data && Array.isArray(data.rules)) {
    if (data.rules.length === 0) {
      return { rules: [] };
    }
    return {
      rules: data.rules.map((r) => ({
        read: String(r.read ?? ''),
        write: String(r.write ?? ''),
        move: (r.move ?? 'R') as HeadMove,
      })),
    };
  }
  if (
    data &&
    (data.read !== undefined || data.write !== undefined || data.move !== undefined)
  ) {
    return {
      rules: [
        {
          read: String(data.read ?? ''),
          write: String(data.write ?? ''),
          move: (data.move ?? 'R') as HeadMove,
        },
      ],
    };
  }
  return { rules: [] };
}

export function formatRuleLabel(rule: TmTransitionRule): string {
  const r = rule.read || '?';
  const w = rule.write || '?';
  const m = rule.move ?? '?';
  return `${r}→${w}, ${m}`;
}

/** Multi-line label for stacked rules on the canvas. */
export function formatEdgeRulesLabel(data: TmEdgeData | undefined | null): string {
  const n = normalizeEdgeData(data);
  if (n.rules.length === 0) return '(no rules)';
  return n.rules.map(formatRuleLabel).join('\n');
}

/** @deprecated Prefer {@link formatEdgeRulesLabel} or {@link formatRuleLabel}. */
export function formatTransitionLabel(data: TmEdgeData | undefined): string {
  return formatEdgeRulesLabel(data);
}
