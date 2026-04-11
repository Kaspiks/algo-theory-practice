import { useMemo, useState } from 'react';
import {
  defaultExercise,
  getExerciseById,
  getMachine,
  listExercises,
} from '@/content/index';
import { LanguageDecodePlayer } from '@/features/exercise-player/LanguageDecodePlayer';
import { MvpPlayer } from '@/features/exercise-player/MvpPlayer';
import type { PlayerMode } from '@/features/exercise-player/MvpPlayer';
import { TmConstructionWorkspace } from '@/features/tm-construction/TmConstructionWorkspace';
import { AiTmWorkspace } from '@/features/ai-tm/AiTmWorkspace';
import type { ExerciseCategory } from '@/types/mvp';

type AppView = 'pack' | 'construction' | 'ai';

const CATEGORY_ORDER: ExerciseCategory[] = [
  'tm_basics',
  'scan_right',
  'substring',
  'reject_bad_symbol',
  'return_left',
  'marking',
  'tracing',
  'homework_style',
  'exam_prep',
  'complexity_tm',
  'language_decode',
];

const CATEGORY_LABEL: Record<ExerciseCategory, string> = {
  tm_basics: 'TM basics',
  scan_right: 'Scan right until blank',
  substring: 'Substring / pattern',
  reject_bad_symbol: 'Reject on bad symbol',
  return_left: 'Return left',
  marking: 'Marking symbols',
  tracing: 'Tracing',
  homework_style: 'Homework-style',
  exam_prep: 'Exam prep (strategy)',
  complexity_tm: 'TM complexity',
  language_decode: 'Language decode',
};

export function App() {
  const all = listExercises();
  const [appView, setAppView] = useState<AppView>('pack');
  const [exerciseId, setExerciseId] = useState(() => defaultExercise().id);
  const [playerMode, setPlayerMode] = useState<PlayerMode>('study');

  const exercise = useMemo(
    () => getExerciseById(exerciseId) ?? defaultExercise(),
    [exerciseId]
  );

  const needsTmMachine = exercise.mode !== 'language_decode';

  const machine = useMemo(
    () => (needsTmMachine ? getMachine(exercise.machineId) : undefined),
    [needsTmMachine, exercise.machineId]
  );

  const byCategory = useMemo(() => {
    const m = new Map<ExerciseCategory, typeof all>();
    for (const c of CATEGORY_ORDER) {
      m.set(
        c,
        all.filter((e) => e.category === c)
      );
    }
    return m;
  }, [all]);

  if (appView === 'pack' && needsTmMachine && !machine) {
    return (
      <div className="min-h-screen bg-slate-950 p-8 text-rose-300">
        Missing machine for exercise (id: {exercise.machineId}).
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="border-b border-slate-800 px-6 py-4">
        <h1 className="text-xl font-semibold text-slate-50">
          Turing Machine practice
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Next-transition, tape-result, strategy & language-decode exercises ·
          pack sorted by difficulty
        </p>
        <fieldset className="mt-3 flex flex-wrap gap-4 text-sm text-slate-300">
          <legend className="sr-only">App area</legend>
          <label className="inline-flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              name="app-view"
              className="border-slate-600"
              checked={appView === 'pack'}
              onChange={() => setAppView('pack')}
            />
            Exercise pack
          </label>
          <label className="inline-flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              name="app-view"
              className="border-slate-600"
              checked={appView === 'construction'}
              onChange={() => setAppView('construction')}
            />
            TM construction (draw & test)
          </label>
          <label className="inline-flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              name="app-view"
              className="border-slate-600"
              checked={appView === 'ai'}
              onChange={() => setAppView('ai')}
            />
            AI generator ✨
          </label>
        </fieldset>
        {appView === 'pack' ? (
          <>
            <fieldset className="mt-3 flex flex-wrap gap-4 text-sm text-slate-300">
              <legend className="sr-only">Player mode</legend>
              <label className="inline-flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="player-mode"
                  className="border-slate-600"
                  checked={playerMode === 'study'}
                  onChange={() => setPlayerMode('study')}
                />
                Study (step / play · animate on by default)
              </label>
              <label className="inline-flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="player-mode"
                  className="border-slate-600"
                  checked={playerMode === 'quiz'}
                  onChange={() => setPlayerMode('quiz')}
                />
                Quiz (MCQ only · animate off by default)
              </label>
            </fieldset>
            <div className="mt-4 max-w-xl">
              <label className="block text-xs font-medium text-slate-400">
                Exercise
              </label>
              <select
                className="mt-1 w-full rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                value={exerciseId}
                onChange={(e) => setExerciseId(e.target.value)}
              >
                {CATEGORY_ORDER.map((cat) => {
                  const items = byCategory.get(cat) ?? [];
                  if (items.length === 0) return null;
                  return (
                    <optgroup key={cat} label={CATEGORY_LABEL[cat]}>
                      {items.map((ex) => (
                        <option key={ex.id} value={ex.id}>
                          [{ex.difficulty}] {ex.title}
                        </option>
                      ))}
                    </optgroup>
                  );
                })}
              </select>
            </div>
          </>
        ) : appView === 'construction' ? (
          <p className="mt-3 text-sm text-slate-400">
            Draw states and transitions, then run behavioral tests for the selected
            language.
          </p>
        ) : (
          <p className="mt-3 text-sm text-slate-400">
            Describe a Turing Machine in plain English — Gemini generates it, you test it.
          </p>
        )}
      </header>
      <main className="mx-auto max-w-5xl p-6">
        {appView === 'construction' ? (
          <TmConstructionWorkspace />
        ) : appView === 'ai' ? (
          <AiTmWorkspace />
        ) : exercise.mode === 'language_decode' ? (
          <LanguageDecodePlayer
            key={exercise.id}
            exercise={exercise}
            playerMode={playerMode}
          />
        ) : (
          <MvpPlayer
            key={exercise.id}
            exercise={exercise}
            machine={machine!}
            playerMode={playerMode}
          />
        )}
      </main>
    </div>
  );
}
