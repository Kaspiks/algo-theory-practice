import { useMemo, useState } from 'react';
import {
  defaultExercise,
  getExerciseById,
  getMachine,
  listExercises,
} from '@/content/index';
import { MvpPlayer } from '@/features/exercise-player/MvpPlayer';
import type { PlayerMode } from '@/features/exercise-player/MvpPlayer';
import type { ExerciseCategory } from '@/types/mvp';

const CATEGORY_ORDER: ExerciseCategory[] = [
  'tm_basics',
  'scan_right',
  'reject_bad_symbol',
  'return_left',
  'marking',
  'tracing',
  'homework_style',
];

const CATEGORY_LABEL: Record<ExerciseCategory, string> = {
  tm_basics: 'TM basics',
  scan_right: 'Scan right until blank',
  reject_bad_symbol: 'Reject on bad symbol',
  return_left: 'Return left',
  marking: 'Marking symbols',
  tracing: 'Tracing',
  homework_style: 'Homework-style',
};

export function App() {
  const all = listExercises();
  const [exerciseId, setExerciseId] = useState(() => defaultExercise().id);
  const [playerMode, setPlayerMode] = useState<PlayerMode>('study');

  const exercise = useMemo(
    () => getExerciseById(exerciseId) ?? defaultExercise(),
    [exerciseId]
  );

  const machine = useMemo(
    () => getMachine(exercise.machineId),
    [exercise.machineId]
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

  if (!machine) {
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
          Next-transition mode · exercise pack (difficulty 1 → 3)
        </p>
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
      </header>
      <main className="mx-auto max-w-5xl p-6">
        <MvpPlayer
          key={exercise.id}
          exercise={exercise}
          machine={machine}
          playerMode={playerMode}
        />
      </main>
    </div>
  );
}
