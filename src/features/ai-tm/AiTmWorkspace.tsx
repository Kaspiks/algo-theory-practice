import { useCallback, useMemo, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  type Edge,
  type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { GeminiGeneratorPanel } from '@/features/tm-construction/GeminiGeneratorPanel';
import { TmStateNode } from '@/features/tm-construction/TmStateNode';
import { TmTransitionEdge } from '@/features/tm-construction/TmTransitionEdge';
import { TmConstructionEdgeContext } from '@/features/tm-construction/tmConstructionEdgeContext';
import {
  formatEdgeRulesLabel,
  type TmEdgeData,
  type TmStateNodeData,
} from '@/features/tm-construction/flowTypes';
import { geminiToConstructionInput } from '@/features/tm-construction/geminiToFlow';
import { buildMachineFromConstruction } from '@/lib/tm/constructionMachine';
import { initialConfiguration, runUntilHalt } from '@/lib/tm/engine';
import type { GeminiTMResponse } from '@/lib/ai/geminiService';
import type { HaltStatus, TuringMachineDefinition } from '@/types/tm';

const NODE_TYPES = { tmState: TmStateNode };
const EDGE_TYPES = { tmTransition: TmTransitionEdge };

// Static edge context — canvas is view-only, no drag/select needed
const STATIC_EDGE_CONTEXT = {
  labelsDraggable: false,
  onLabelOffsetCommit: () => {},
  onEdgeSelectByLabel: () => {},
  selectedEdgeId: null,
};

// ─── Test section types ────────────────────────────────────────────────────────

type TestExpect = 'accept' | 'reject';
type TestActual = 'accept' | 'reject' | 'loop';

interface TestRow {
  id: string;
  input: string;
  expect: TestExpect;
  result?: {
    actual: TestActual;
    passed: boolean;
    lastStatus: HaltStatus;
  };
}

let _id = 0;
function newId() {
  return `tr_${_id++}`;
}

function runRow(row: TestRow, machine: TuringMachineDefinition): TestRow {
  try {
    const config = initialConfiguration(machine, row.input, 0);
    const trace = runUntilHalt(machine, config, machine.maxSteps ?? 1000);
    const last = trace[trace.length - 1]!;
    const actual: TestActual =
      last.status === 'accepted' ? 'accept' : last.status === 'rejected' ? 'reject' : 'loop';
    const passed = row.expect === 'accept' ? actual === 'accept' : actual !== 'accept';
    return { ...row, result: { actual, passed, lastStatus: last.status } };
  } catch {
    return {
      ...row,
      result: { actual: 'reject', passed: false, lastStatus: 'rejected' as HaltStatus },
    };
  }
}

// ─── Test row component ────────────────────────────────────────────────────────

interface TestRowItemProps {
  row: TestRow;
  machineReady: boolean;
  onPatch: (patch: Partial<Pick<TestRow, 'input' | 'expect'>>) => void;
  onRun: () => void;
  onRemove: () => void;
}

function TestRowItem({ row, machineReady, onPatch, onRun, onRemove }: TestRowItemProps) {
  const { result } = row;
  const statusColor = !result
    ? ''
    : result.passed
      ? 'border-emerald-700/60 bg-emerald-950/20'
      : 'border-rose-700/60 bg-rose-950/20';

  return (
    <div
      className={`flex flex-wrap items-center gap-2 rounded-md border border-slate-700 bg-slate-950/60 px-3 py-2 transition-colors ${statusColor}`}
    >
      <input
        className="w-36 rounded border border-slate-600 bg-slate-900 px-2 py-1 font-mono text-sm text-slate-100 placeholder:text-slate-600"
        placeholder="input string"
        value={row.input}
        onChange={(e) => onPatch({ input: e.target.value })}
      />
      <select
        className="rounded border border-slate-600 bg-slate-900 px-2 py-1 text-sm text-slate-200"
        value={row.expect}
        onChange={(e) => onPatch({ expect: e.target.value as TestExpect })}
      >
        <option value="accept">should accept</option>
        <option value="reject">should reject</option>
      </select>

      <button
        type="button"
        className="rounded-md bg-amber-500 px-3 py-1 text-xs font-medium text-slate-950 hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-40"
        disabled={!machineReady}
        onClick={onRun}
      >
        Run
      </button>

      {result ? (
        <span
          className={`text-xs font-medium ${result.passed ? 'text-emerald-400' : 'text-rose-400'}`}
        >
          {result.passed ? 'Pass' : 'Fail'} · got {result.actual}
        </span>
      ) : null}

      <button
        type="button"
        className="ml-auto rounded px-1.5 py-0.5 text-[11px] text-slate-500 hover:text-rose-400"
        onClick={onRemove}
        aria-label="Remove test case"
      >
        ✕
      </button>
    </div>
  );
}

// ─── Main workspace ────────────────────────────────────────────────────────────

export function AiTmWorkspace() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<TmStateNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge<TmEdgeData>>([]);
  const [machine, setMachine] = useState<TuringMachineDefinition | null>(null);
  const [buildErrors, setBuildErrors] = useState<string[]>([]);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [testRows, setTestRows] = useState<TestRow[]>([]);

  const handleLoad = useCallback(
    (
      newNodes: Node<TmStateNodeData>[],
      newEdges: Edge<TmEdgeData>[],
      geminiMachine: GeminiTMResponse
    ) => {
      setNodes(newNodes);
      setEdges(newEdges);
      setHasGenerated(true);
      setTestRows([]);

      const constructionInput = geminiToConstructionInput(geminiMachine);
      const built = buildMachineFromConstruction(constructionInput);
      if (built.ok) {
        setMachine(built.machine);
        setBuildErrors([]);
      } else {
        setMachine(null);
        setBuildErrors(built.errors);
      }
    },
    [setNodes, setEdges]
  );

  const displayEdges = useMemo(
    () =>
      edges.map((e) => ({
        ...e,
        type: 'tmTransition',
        label: formatEdgeRulesLabel(e.data as TmEdgeData | undefined),
        style: { stroke: '#64748b', strokeWidth: 2 },
        labelStyle: {
          fill: '#e2e8f0',
          fontSize: 11,
          fontWeight: 500,
          whiteSpace: 'pre-line',
          lineHeight: 1.35,
        },
        labelBgStyle: { fill: '#1e293b', fillOpacity: 0.92 },
        labelBgPadding: [8, 10] as [number, number],
      })),
    [edges]
  );

  const addTestRow = () =>
    setTestRows((rows) => [...rows, { id: newId(), input: '', expect: 'accept' }]);

  const patchRow = (id: string, patch: Partial<Pick<TestRow, 'input' | 'expect'>>) =>
    setTestRows((rows) =>
      rows.map((r) => (r.id === id ? { ...r, ...patch, result: undefined } : r))
    );

  const runOne = (id: string) => {
    if (!machine) return;
    setTestRows((rows) => rows.map((r) => (r.id === id ? runRow(r, machine) : r)));
  };

  const runAll = () => {
    if (!machine) return;
    setTestRows((rows) => rows.map((r) => runRow(r, machine)));
  };

  const removeRow = (id: string) =>
    setTestRows((rows) => rows.filter((r) => r.id !== id));

  const anyFailed = testRows.some((r) => r.result && !r.result.passed);
  const allPassed =
    testRows.length > 0 && testRows.every((r) => r.result?.passed === true);

  return (
    <div className="space-y-4">
      {/* ── Prompt ── */}
      <GeminiGeneratorPanel onLoad={handleLoad} />

      {/* ── Build errors ── */}
      {buildErrors.length > 0 ? (
        <div
          className="rounded-lg border border-rose-700/50 bg-rose-950/30 p-3 text-sm text-rose-100"
          role="alert"
        >
          <p className="font-medium">Generated machine has structural errors</p>
          <ul className="mt-1 list-inside list-disc text-rose-200/90">
            {buildErrors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* ── Canvas ── */}
      {hasGenerated ? (
        <div className="h-[480px] rounded-lg border border-slate-700 bg-slate-950">
          <TmConstructionEdgeContext.Provider value={STATIC_EDGE_CONTEXT}>
            <ReactFlow
              nodes={nodes}
              edges={displayEdges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              nodeTypes={NODE_TYPES}
              edgeTypes={EDGE_TYPES}
              fitView
              nodesDraggable
              nodesConnectable={false}
              elementsSelectable={false}
              deleteKeyCode={null}
              className="bg-slate-950"
              proOptions={{ hideAttribution: true }}
            >
              <Background gap={16} color="#334155" />
              <Controls className="!border-slate-600 !bg-slate-900 [&_button]:!border-slate-600 [&_button]:!bg-slate-800 [&_button]:!fill-slate-200" />
            </ReactFlow>
          </TmConstructionEdgeContext.Provider>
        </div>
      ) : (
        <div className="flex h-[480px] items-center justify-center rounded-lg border border-dashed border-slate-700 bg-slate-950/40">
          <p className="text-sm text-slate-600">
            Describe a machine above and click Generate
          </p>
        </div>
      )}

      {/* ── Test section ── */}
      {hasGenerated ? (
        <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-medium text-slate-400">Test the machine</p>
              <p className="mt-0.5 text-[11px] text-slate-600">
                Type an input string, set your expectation, and run.
              </p>
            </div>
            {testRows.length > 1 ? (
              <button
                type="button"
                className="rounded-md bg-amber-500 px-4 py-1.5 text-xs font-medium text-slate-950 hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-40"
                disabled={!machine}
                onClick={runAll}
              >
                Run all
              </button>
            ) : null}
          </div>

          <div className="mt-3 space-y-2">
            {testRows.map((row) => (
              <TestRowItem
                key={row.id}
                row={row}
                machineReady={!!machine}
                onPatch={(patch) => patchRow(row.id, patch)}
                onRun={() => runOne(row.id)}
                onRemove={() => removeRow(row.id)}
              />
            ))}
          </div>

          <button
            type="button"
            className="mt-3 w-full rounded-md border border-dashed border-slate-600 px-3 py-2 text-xs text-slate-400 hover:border-slate-500 hover:text-slate-300"
            onClick={addTestRow}
          >
            + Add test case
          </button>

          {allPassed ? (
            <p className="mt-3 rounded-md border border-emerald-700/50 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-100">
              All tests passed.
            </p>
          ) : anyFailed ? (
            <p className="mt-3 rounded-md border border-rose-700/50 bg-rose-950/30 px-3 py-2 text-sm text-rose-200">
              Some tests failed — the machine may not match the description.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
