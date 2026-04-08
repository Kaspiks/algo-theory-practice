import { createContext, useContext } from 'react';

export type TmConstructionEdgeContextValue = {
  /** When true, transition label chips can be dragged to adjust {@link TmEdgeData.labelOffset}. */
  labelsDraggable: boolean;
  onLabelOffsetCommit: (edgeId: string, offset: { x: number; y: number }) => void;
  /** Selecting an edge by interacting with its label (RF does not hit-test HTML labels). */
  onEdgeSelectByLabel: (edgeId: string) => void;
  /** Build mode: highlight the selected edge’s label chip (avoids fighting RF’s `selected` sync). */
  selectedEdgeId: string | null;
};

export const TmConstructionEdgeContext = createContext<TmConstructionEdgeContextValue | null>(
  null
);

export function useTmConstructionEdgeContext(): TmConstructionEdgeContextValue | null {
  return useContext(TmConstructionEdgeContext);
}
