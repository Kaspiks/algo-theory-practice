import { useState } from 'react';
import type { Edge, Node } from '@xyflow/react';
import { generateTMFromDescription, type GeminiTMResponse } from '@/lib/ai/geminiService';
import { geminiToFlow } from '@/features/tm-construction/geminiToFlow';
import type { TmEdgeData, TmStateNodeData } from '@/features/tm-construction/flowTypes';

interface GeminiGeneratorPanelProps {
  onLoad: (
    nodes: Node<TmStateNodeData>[],
    edges: Edge<TmEdgeData>[],
    machine: GeminiTMResponse
  ) => void;
}

export function GeminiGeneratorPanel({ onLoad }: GeminiGeneratorPanelProps) {
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    const trimmed = description.trim();
    if (!trimmed) return;
    setLoading(true);
    setError(null);

    const result = await generateTMFromDescription(trimmed);

    if (!result.ok) {
      setError(result.error);
      setLoading(false);
      return;
    }

    const { nodes, edges } = geminiToFlow(result.machine);
    onLoad(nodes, edges, result.machine);
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      void handleGenerate();
    }
  };

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-slate-400">Generate with AI</p>
        <span className="text-[10px] text-slate-600">✨ Powered by Gemini</span>
      </div>
      <textarea
        className="mt-2 w-full resize-none rounded-md border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:border-slate-400 focus:outline-none"
        rows={3}
        placeholder={"Describe a Turing Machine in plain English, e.g. \u201CA TM that accepts strings with equal numbers of a\u2019s and b\u2019s\u201D"}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={loading}
      />
      <div className="mt-2 flex items-center gap-3">
        <button
          type="button"
          className="flex items-center gap-2 rounded-md bg-slate-700 px-4 py-1.5 text-sm font-medium text-slate-100 hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => void handleGenerate()}
          disabled={loading || !description.trim()}
        >
          {loading ? (
            <>
              <svg
                className="h-4 w-4 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Generating…
            </>
          ) : (
            'Generate'
          )}
        </button>
        <p className="text-[11px] text-slate-600">Ctrl+Enter to generate</p>
      </div>

      {error ? (
        <div
          className="mt-3 rounded-md border border-rose-700/50 bg-rose-950/30 px-3 py-2 text-xs text-rose-200"
          role="alert"
        >
          {error}
        </div>
      ) : null}
    </div>
  );
}
