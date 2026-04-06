import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { TmStateNodeData } from '@/features/tm-construction/flowTypes';

const handleClass =
  '!h-2.5 !w-2.5 !min-h-0 !min-w-0 !border !border-slate-500 !bg-slate-600';

export function TmStateNode({ data, selected }: NodeProps) {
  const d = data as TmStateNodeData;
  const ring = selected ? 'ring-2 ring-amber-400/80' : '';
  const kindBorder =
    d.kind === 'accept'
      ? 'border-emerald-500/80'
      : d.kind === 'reject'
        ? 'border-rose-500/80'
        : d.kind === 'start'
          ? 'border-sky-500/80'
          : 'border-slate-500';

  const badge =
    d.kind === 'start'
      ? 'Start'
      : d.kind === 'accept'
        ? 'Accept'
        : d.kind === 'reject'
          ? 'Reject'
          : 'State';

  return (
    <div
      className={`relative min-w-[5.5rem] rounded-lg border-2 bg-slate-900/95 px-2 py-2 text-center shadow-md ${kindBorder} ${ring}`}
    >
      {/* Top: incoming left, outgoing right */}
      <Handle
        type="target"
        position={Position.Top}
        id="t-top"
        className={handleClass}
        style={{ left: '28%' }}
      />
      <Handle
        type="source"
        position={Position.Top}
        id="s-top"
        className={handleClass}
        style={{ left: '72%' }}
      />
      {/* Right: outgoing top, incoming bottom */}
      <Handle
        type="source"
        position={Position.Right}
        id="s-right"
        className={handleClass}
        style={{ top: '28%' }}
      />
      <Handle
        type="target"
        position={Position.Right}
        id="t-right"
        className={handleClass}
        style={{ top: '72%' }}
      />
      {/* Bottom: outgoing left, incoming right */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="s-bottom"
        className={handleClass}
        style={{ left: '28%' }}
      />
      <Handle
        type="target"
        position={Position.Bottom}
        id="t-bottom"
        className={handleClass}
        style={{ left: '72%' }}
      />
      {/* Left: incoming top, outgoing bottom */}
      <Handle
        type="target"
        position={Position.Left}
        id="t-left"
        className={handleClass}
        style={{ top: '28%' }}
      />
      <Handle
        type="source"
        position={Position.Left}
        id="s-left"
        className={handleClass}
        style={{ top: '72%' }}
      />

      <div className="font-mono text-sm font-medium text-amber-100">{d.label}</div>
      <div className="mt-0.5 text-[10px] uppercase tracking-wide text-slate-500">
        {badge}
      </div>
    </div>
  );
}
