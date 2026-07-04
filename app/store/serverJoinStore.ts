import { create } from 'zustand';

// Non-persisted prompt shown after a Discord login that returns
// needs_server_join. A single ServerJoinHost renders the sheet at the app root,
// so it survives the navigation switch into the app.
type ServerJoinState = {
    visible: boolean;
    show: () => void;
    hide: () => void;
};

export const useServerJoinStore = create<ServerJoinState>((set) => ({
    visible: false,
    show: () => set({ visible: true }),
    hide: () => set({ visible: false }),
}));
