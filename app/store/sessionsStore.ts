import { create } from 'zustand';

type SessionsState = {
    stale: boolean;
    invalidate: () => void;
    markFresh: () => void;
};

export const useSessionsStore = create<SessionsState>((set) => ({
    stale: false,
    invalidate: () => set({ stale: true }),
    markFresh: () => set({ stale: false }),
}));
