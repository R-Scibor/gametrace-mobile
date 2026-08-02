import { create } from 'zustand';

// Whether the signed-in account has any tracked history. Published by
// DashboardScreen only — it is the sole screen already fetching both inputs, so
// Library and Stats read this instead of re-running those queries (useCachedFetch
// has no shared cache, and useDashboard installs a 30s poll per instance).
//
// `null` means "not determined yet" and must suppress the sample preview.
// ERROR-only accounts count as empty here; DashboardScreen adds its own guard so
// sample rows never cover real ERROR sessions.
type EmptyAccountState = {
    isEmpty: boolean | null;
    setIsEmpty: (v: boolean) => void;
    reset: () => void;
};

export const useEmptyAccountStore = create<EmptyAccountState>((set) => ({
    isEmpty: null,
    setIsEmpty: (v) => set({ isEmpty: v }),
    reset: () => set({ isEmpty: null }),
}));
