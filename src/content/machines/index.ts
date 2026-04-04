import { onlyOnesMachine } from '@/content/machines/onlyOnes';
import { endsInOneMachine } from '@/content/machines/endsInOne';
import { contains001Machine } from '@/content/machines/contains001';
import { returnLeftSentinelMachine } from '@/content/machines/returnLeftSentinel';
import { markZerosMachine } from '@/content/machines/markZeros';
import { scanBinaryMachine } from '@/content/machines/scanBinary';
import type { TuringMachineDefinition } from '@/types/tm';

const all = [
  scanBinaryMachine,
  onlyOnesMachine,
  endsInOneMachine,
  contains001Machine,
  returnLeftSentinelMachine,
  markZerosMachine,
] as const;

export const machineById = new Map<string, TuringMachineDefinition>(
  all.map((m) => [m.id, m])
);

export function getMachineById(id: string): TuringMachineDefinition | undefined {
  return machineById.get(id);
}

export {
  scanBinaryMachine,
  onlyOnesMachine,
  endsInOneMachine,
  contains001Machine,
  returnLeftSentinelMachine,
  markZerosMachine,
};
