import { exercisePack } from '@/content/exercises/pack';
import { getMachineById } from '@/content/machines/index';
import type { MvpExercise } from '@/types/mvp';
import type { TuringMachineDefinition } from '@/types/tm';

export { exercisePack } from '@/content/exercises/pack';
export {
  getMachineById,
  machineById,
  scanBinaryMachine,
  onlyOnesMachine,
  endsInOneMachine,
  contains001Machine,
  returnLeftSentinelMachine,
  markZerosMachine,
} from '@/content/machines/index';

export function listExercises(): MvpExercise[] {
  return exercisePack;
}

export function getExerciseById(id: string): MvpExercise | undefined {
  return exercisePack.find((e) => e.id === id);
}

export function getMachine(id: string): TuringMachineDefinition | undefined {
  return getMachineById(id);
}

/** First item in the sorted pack (easiest). */
export function defaultExercise(): MvpExercise {
  return exercisePack[0];
}
