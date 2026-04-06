import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type Edge,
  type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import {
  DEFAULT_CONSTRUCTION_CHALLENGE_ID,
  TM_CONSTRUCTION_CHALLENGES,
  getConstructionChallenge,
} from '@/content/tmConstruction/challenges';
import { flowToConstructionInput } from '@/features/tm-construction/flowToConstructionInput';
import {
  formatEdgeRulesLabel,
  normalizeEdgeData,
  type TmEdgeData,
  type TmStateKind,
  type TmStateNodeData,
  type TmTransitionRule,
} from '@/features/tm-construction/flowTypes';
import { constructionGraphSignature } from '@/features/tm-construction/constructionSignature';
import { TmStateNode } from '@/features/tm-construction/TmStateNode';
import { buildMachineFromConstruction } from '@/lib/tm/constructionMachine';
import {
  allConstructionTestsPassed,
  runConstructionTestSuite,
  type ConstructionSingleResult,
} from '@/lib/tm/runConstructionTests';
import type { HeadMove } from '@/types/tm';

const NODE_TYPES = { tmState: TmStateNode };

function canonicalEdgeId(source: string, target: string): string {
  return `e_${source}_${target}`;
}

function initialNodes(): Node<TmStateNodeData>[] {
  return [
    {
      id: 'q0',
      type: 'tmState',
      position: { x: 40, y: 40 },
      data: { label: 'q0', kind: 'start' },
    },
    {
      id: 'q_accept',
      type: 'tmState',
      position: { x: 300, y: 40 },
      data: { label: 'q_accept', kind: 'accept' },
    },
    {
      id: 'q_reject',
      type: 'tmState',
      position: { x: 300, y: 180 },
      data: { label: 'q_reject', kind: 'reject' },
    },
  ];
}

function applyExclusiveKind(
  nodes: Node<TmStateNodeData>[],
  targetId: string,
  kind: TmStateKind
): Node<TmStateNodeData>[] {
  if (kind === 'work') {
    return nodes.map((n) =>
      n.id === targetId
        ? { ...n, data: { ...n.data, kind: 'work' } }
        : n
    );
  }
  return nodes.map((n) => {
    const d = n.data as TmStateNodeData;
    if (n.id === targetId) {
      return { ...n, data: { ...d, kind } };
    }
    if (d.kind === kind) {
      return { ...n, data: { ...d, kind: 'work' } };
    }
    return n;
  });
}

function newWorkStateId(nodes: Node<TmStateNodeData>[]): string {
  const used = new Set(nodes.map((n) => n.id));
  let n = 1;
  while (used.has(`q${n}`)) n++;
  return `q${n}`;
}

export function TmConstructionWorkspace() {
  const [challengeId, setChallengeId] = useState(DEFAULT_CONSTRUCTION_CHALLENGE_ID);
  const challenge = useMemo(
    () => getConstructionChallenge(challengeId)!,
    [challengeId]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes());
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge<TmEdgeData>>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [buildErrors, setBuildErrors] = useState<string[]>([]);
  const [results, setResults] = useState<ConstructionSingleResult[] | null>(null);
  const [signatureAtRun, setSignatureAtRun] = useState<string | null>(null);

  const graphSignature = useMemo(
    () => constructionGraphSignature(nodes, edges),
    [nodes, edges]
  );
  const resultsStale =
    results !== null && signatureAtRun !== null && graphSignature !== signatureAtRun;

  useEffect(() => {
    setNodes(initialNodes());
    setEdges([]);
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    setBuildErrors([]);
    setResults(null);
    setSignatureAtRun(null);
  }, [challengeId, setNodes, setEdges]);

  useEffect(() => {
    if (selectedEdgeId && !edges.some((e) => e.id === selectedEdgeId)) {
      setSelectedEdgeId(null);
    }
  }, [edges, selectedEdgeId]);

  const displayEdges: Edge<TmEdgeData>[] = useMemo(
    () =>
      edges.map((e) => ({
        ...e,
        type: e.type ?? 'smoothstep',
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

  const onConnect = useCallback(
    (params: Connection) => {
      const sym = challenge.inputAlphabet[0] ?? 'a';
      const newRule: TmTransitionRule = {
        read: sym,
        write: sym,
        move: 'R',
      };
      setEdges((eds) => {
        const src = params.source!;
        const tgt = params.target!;
        const existing = eds.find((ed) => ed.source === src && ed.target === tgt);
        if (existing) {
          const prev = normalizeEdgeData(existing.data as TmEdgeData);
          const canon = canonicalEdgeId(src, tgt);
          return eds.map((ed) =>
            ed.id === existing.id
              ? {
                  ...ed,
                  id: canon,
                  type: ed.type ?? 'smoothstep',
                  data: { rules: [...prev.rules, newRule] },
                }
              : ed
          );
        }
        const id = canonicalEdgeId(src, tgt);
        return addEdge(
          {
            ...params,
            id,
            type: 'smoothstep',
            data: { rules: [newRule] },
          },
          eds
        );
      });
    },
    [challenge.inputAlphabet, setEdges]
  );

  const selectedEdge = edges.find((e) => e.id === selectedEdgeId);
  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  const updateSelectedEdgeRules = (
    updater: (rules: TmTransitionRule[]) => TmTransitionRule[]
  ) => {
    if (!selectedEdgeId) return;
    setEdges((eds) => {
      const idx = eds.findIndex((e) => e.id === selectedEdgeId);
      if (idx < 0) return eds;
      const e = eds[idx]!;
      const nextRules = updater(normalizeEdgeData(e.data as TmEdgeData).rules);
      if (nextRules.length === 0) {
        return eds.filter((x) => x.id !== selectedEdgeId);
      }
      return eds.map((x) =>
        x.id === selectedEdgeId ? { ...x, data: { rules: nextRules } } : x
      );
    });
  };

  const patchRuleAt = (ruleIndex: number, patch: Partial<TmTransitionRule>) => {
    updateSelectedEdgeRules((rules) =>
      rules.map((r, i) => (i === ruleIndex ? { ...r, ...patch } : r))
    );
  };

  const addRuleToSelectedEdge = () => {
    const sym = challenge.inputAlphabet[0] ?? 'a';
    updateSelectedEdgeRules((rules) => [
      ...rules,
      { read: sym, write: sym, move: 'R' },
    ]);
  };

  const removeRuleAt = (ruleIndex: number) => {
    updateSelectedEdgeRules((rules) => rules.filter((_, i) => i !== ruleIndex));
  };

  const setNodeKind = (kind: TmStateKind) => {
    if (!selectedNodeId) return;
    setNodes((ns) => applyExclusiveKind(ns, selectedNodeId, kind));
  };

  const addWorkState = useCallback(() => {
    setNodes((nds) => {
      const id = newWorkStateId(nds);
      const workCount = nds.filter((n) => n.data.kind === 'work').length;
      const newNode: Node<TmStateNodeData> = {
        id,
        type: 'tmState',
        position: {
          x: 100 + workCount * 56,
          y: 100 + (workCount % 4) * 72,
        },
        data: { label: id, kind: 'work' },
      };
      return [...nds, newNode];
    });
  }, [setNodes]);

  const runValidation = useCallback(() => {
    const flow = flowToConstructionInput(nodes, edges, {
      challengeId: challenge.id,
      inputAlphabet: challenge.inputAlphabet,
      maxSteps: challenge.maxSteps,
    });
    if (!flow.ok) {
      setBuildErrors(flow.errors);
      setResults(null);
      setSignatureAtRun(null);
      return;
    }
    const built = buildMachineFromConstruction(flow.input);
    if (!built.ok) {
      setBuildErrors(built.errors);
      setResults(null);
      setSignatureAtRun(null);
      return;
    }
    setBuildErrors([]);
    if (import.meta.env.DEV) {
      console.debug('[TmConstruction] built definition', built.machine);
    }
    const suite = runConstructionTestSuite(
      built.machine,
      challenge.acceptCases,
      challenge.rejectCases,
      challenge.maxSteps
    );
    setResults(suite);
    setSignatureAtRun(constructionGraphSignature(nodes, edges));
  }, [challenge, edges, nodes]);

  const statusLine = useMemo(() => {
    if (!results) return null;
    const ok = allConstructionTestsPassed(results);
    return ok
      ? 'All behavioral tests passed.'
      : `${results.filter((r) => !r.passed).length} test(s) failed.`;
  }, [results]);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
        <label className="block text-xs font-medium text-slate-400">
          Construction challenge
        </label>
        <select
          className="mt-1 w-full max-w-xl rounded-md border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-slate-100"
          value={challengeId}
          onChange={(e) => setChallengeId(e.target.value)}
        >
          {TM_CONSTRUCTION_CHALLENGES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
        <p className="mt-2 text-sm text-slate-400">{challenge.description}</p>
        <p className="mt-1 text-xs text-slate-500">
          Input alphabet: {challenge.inputAlphabet.join(', ')} · Blank on tape: ⊔ · Draw
          states and transitions; labels use read → write, move (L / R / S).
        </p>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="min-h-[420px] flex-1 rounded-lg border border-slate-700 bg-slate-950">
          <ReactFlow
            nodes={nodes}
            edges={displayEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            defaultEdgeOptions={{ type: 'smoothstep' }}
            onNodeClick={(_, n) => {
              setSelectedNodeId(n.id);
              setSelectedEdgeId(null);
            }}
            onEdgeClick={(_, e) => {
              setSelectedEdgeId(e.id);
              setSelectedNodeId(null);
            }}
            onPaneClick={() => {
              setSelectedNodeId(null);
              setSelectedEdgeId(null);
            }}
            nodeTypes={NODE_TYPES}
            deleteKeyCode={['Backspace', 'Delete']}
            fitView
            className="bg-slate-950"
            proOptions={{ hideAttribution: true }}
          >
            <Background gap={16} color="#334155" />
            <Controls className="!border-slate-600 !bg-slate-900 [&_button]:!border-slate-600 [&_button]:!bg-slate-800 [&_button]:!fill-slate-200" />
          </ReactFlow>
        </div>

        <div className="w-full shrink-0 space-y-3 lg:w-72">
          <div className="rounded-lg border border-slate-700 bg-slate-900/80 p-3">
            <p className="text-xs font-medium text-slate-400">Canvas</p>
            <button
              type="button"
              className="mt-2 w-full rounded-md border border-slate-600 px-2 py-1.5 text-sm text-slate-200 hover:bg-slate-800"
              onClick={addWorkState}
            >
              Add state
            </button>
            <p className="mt-2 text-[11px] text-slate-500">
              Drag from any source handle (lighter ring) to a target handle on another
              state. Reconnecting the same pair adds another rule to that edge. Select
              an edge to edit its rules. Delete / Backspace removes the selection.
            </p>
          </div>

          {selectedNode ? (
            <div className="rounded-lg border border-slate-700 bg-slate-900/80 p-3">
              <p className="text-xs font-medium text-slate-400">State</p>
              <p className="mt-1 font-mono text-sm text-amber-100">{selectedNode.id}</p>
              <div className="mt-2 flex flex-col gap-1">
                <button
                  type="button"
                  className="rounded border border-slate-600 px-2 py-1 text-xs text-slate-200 hover:bg-slate-800"
                  onClick={() => setNodeKind('start')}
                >
                  Set as start
                </button>
                <button
                  type="button"
                  className="rounded border border-slate-600 px-2 py-1 text-xs text-slate-200 hover:bg-slate-800"
                  onClick={() => setNodeKind('accept')}
                >
                  Set as accept
                </button>
                <button
                  type="button"
                  className="rounded border border-slate-600 px-2 py-1 text-xs text-slate-200 hover:bg-slate-800"
                  onClick={() => setNodeKind('reject')}
                >
                  Set as reject
                </button>
                <button
                  type="button"
                  className="rounded border border-slate-600 px-2 py-1 text-xs text-slate-200 hover:bg-slate-800"
                  onClick={() => setNodeKind('work')}
                >
                  Clear to plain state
                </button>
              </div>
            </div>
          ) : null}

          {selectedEdge ? (
            <div className="rounded-lg border border-slate-700 bg-slate-900/80 p-3">
              <p className="text-xs font-medium text-slate-400">Transition rules</p>
              <p className="mt-1 text-[11px] text-slate-500">
                {selectedEdge.source} → {selectedEdge.target}
              </p>
              <div className="mt-2 space-y-3">
                {normalizeEdgeData(selectedEdge.data as TmEdgeData).rules.map(
                  (rule, ruleIndex) => (
                    <div
                      key={`${selectedEdge.id}-rule-${ruleIndex}`}
                      className="rounded border border-slate-600/80 bg-slate-950/60 p-2"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] font-medium text-slate-500">
                          Rule {ruleIndex + 1}
                        </span>
                        <button
                          type="button"
                          className="rounded px-1.5 py-0.5 text-[10px] text-rose-300 hover:bg-rose-950/50"
                          onClick={() => removeRuleAt(ruleIndex)}
                        >
                          Remove
                        </button>
                      </div>
                      <label className="mt-1 block text-[11px] text-slate-500">
                        Read (1 symbol)
                      </label>
                      <input
                        className="mt-0.5 w-full rounded border border-slate-600 bg-slate-950 px-2 py-1 font-mono text-sm text-slate-100"
                        maxLength={4}
                        value={rule.read}
                        onChange={(e) =>
                          patchRuleAt(ruleIndex, {
                            read: e.target.value.slice(-1) || e.target.value,
                          })
                        }
                      />
                      <label className="mt-2 block text-[11px] text-slate-500">
                        Write (1 symbol)
                      </label>
                      <input
                        className="mt-0.5 w-full rounded border border-slate-600 bg-slate-950 px-2 py-1 font-mono text-sm text-slate-100"
                        maxLength={4}
                        value={rule.write}
                        onChange={(e) =>
                          patchRuleAt(ruleIndex, {
                            write: e.target.value.slice(-1) || e.target.value,
                          })
                        }
                      />
                      <label className="mt-2 block text-[11px] text-slate-500">Move</label>
                      <select
                        className="mt-0.5 w-full rounded border border-slate-600 bg-slate-950 px-2 py-1 text-sm text-slate-100"
                        value={rule.move}
                        onChange={(e) =>
                          patchRuleAt(ruleIndex, {
                            move: e.target.value as HeadMove,
                          })
                        }
                      >
                        <option value="L">L</option>
                        <option value="R">R</option>
                        <option value="S">S</option>
                      </select>
                    </div>
                  )
                )}
              </div>
              <button
                type="button"
                className="mt-2 w-full rounded-md border border-slate-600 px-2 py-1.5 text-xs text-slate-200 hover:bg-slate-800"
                onClick={addRuleToSelectedEdge}
              >
                Add rule to this connection
              </button>
              <p className="mt-2 text-[10px] text-slate-500">
                Paste ⊔ for blank if needed. Two rules on the same edge cannot use the
                same read symbol from that source state.
              </p>
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="rounded-md bg-amber-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-amber-400"
          onClick={runValidation}
        >
          Run tests on my TM
        </button>
        <p className="w-full text-xs text-slate-500">
          Re-run after you change states or transitions. In dev builds, the built machine
          is logged to the browser console as{' '}
          <span className="font-mono">[TmConstruction] built definition</span>.
        </p>
      </div>

      {buildErrors.length > 0 ? (
        <div
          className="rounded-lg border border-rose-700/50 bg-rose-950/30 p-3 text-sm text-rose-100"
          role="alert"
        >
          <p className="font-medium">Cannot run tests yet</p>
          <ul className="mt-2 list-inside list-disc text-rose-200/90">
            {buildErrors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {resultsStale ? (
        <p
          className="rounded-md border border-sky-700/50 bg-sky-950/30 px-3 py-2 text-sm text-sky-100"
          role="status"
        >
          The diagram changed since these results were computed. Run tests again to update
          the table.
        </p>
      ) : null}

      {statusLine ? (
        <p
          className={`rounded-md px-3 py-2 text-sm ${
            allConstructionTestsPassed(results!)
              ? 'border border-emerald-700/50 bg-emerald-950/40 text-emerald-100'
              : 'border border-amber-700/50 bg-amber-950/30 text-amber-100'
          }`}
          role="status"
        >
          {statusLine}
        </p>
      ) : null}

      {results ? (
        <div className="overflow-x-auto rounded-lg border border-slate-700">
          <p className="border-b border-slate-700 bg-slate-900/90 px-3 py-2 text-xs text-slate-400">
            <span className="font-medium text-slate-300">How grading works:</span> accept
            rows must end in the accept state. Reject rows pass if the machine{' '}
            <span className="text-slate-200">never accepts</span> — including when it
            halts in reject or hits the step limit without accepting (shown as{' '}
            <span className="font-mono text-slate-300">loop</span>).
          </p>
          <table className="w-full min-w-[28rem] text-left text-sm text-slate-200">
            <thead className="border-b border-slate-700 bg-slate-900/90 text-xs uppercase text-slate-400">
              <tr>
                <th className="px-3 py-2">Input</th>
                <th className="px-3 py-2">Expected</th>
                <th className="px-3 py-2">Actual</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr
                  key={`${r.input}-${r.expect}`}
                  className={
                    r.passed
                      ? 'border-b border-slate-800 bg-slate-950/40'
                      : 'border-b border-slate-800 bg-rose-950/20'
                  }
                >
                  <td className="px-3 py-2 font-mono text-xs">
                    {r.input === '' ? 'ε' : r.input}
                  </td>
                  <td className="px-3 py-2">{r.expect}</td>
                  <td className="px-3 py-2">{r.actual}</td>
                  <td className="px-3 py-2">
                    {r.passed ? 'OK' : 'Fail'} · {r.lastStatus}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {results?.some((r) => !r.passed) ? (
        <details className="rounded-lg border border-slate-700 bg-slate-900/50 p-3 text-sm text-slate-300">
          <summary className="cursor-pointer text-slate-200">
            Show short traces for failed tests
          </summary>
          <div className="mt-3 space-y-4">
            {results
              .filter((r) => !r.passed)
              .map((r) => (
                <div key={`trace-${r.input}-${r.expect}`}>
                  <p className="font-mono text-xs text-amber-100">
                    {r.input === '' ? 'ε' : r.input} (expected {r.expect})
                  </p>
                  <ol className="mt-1 max-h-40 list-inside list-decimal overflow-y-auto text-xs text-slate-400">
                    {r.trace.slice(0, 20).map((step) => (
                      <li key={step.stepIndex}>
                        #{step.stepIndex} state={step.config.state} head=
                        {step.config.tape.headIndex} tape=
                        {step.config.tape.cells.join('').slice(0, 24)}
                        {step.config.tape.cells.length > 24 ? '…' : ''}
                      </li>
                    ))}
                    {r.trace.length > 20 ? (
                      <li className="list-none text-slate-500">
                        … {r.trace.length - 20} more step(s)
                      </li>
                    ) : null}
                  </ol>
                </div>
              ))}
          </div>
        </details>
      ) : null}
    </div>
  );
}
