import { create } from 'zustand';

type GamesState = {
    stale: boolean;
    invalidate: () => void;
    markFresh: () => void;
};

export const useGamesStore = create<GamesState>((set) => ({
    stale: false,
    invalidate: () => set({ stale: true }),
    markFresh: () => set({ stale: false }),
}));
