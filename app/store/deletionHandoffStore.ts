import { create } from 'zustand';
import type { DeletionStatus } from '../types/api';
import { isDeletionStatus } from '../utils/accountDeletion';

type State = {
  status: DeletionStatus | null;
  save: (status: DeletionStatus) => void;
  clear: () => void;
};

export const useDeletionHandoffStore = create<State>((set) => ({
  status: null,
  save: (status) => {
    if (!isDeletionStatus(status)) return;
    set({ status });
  },
  clear: () => set({ status: null }),
}));
