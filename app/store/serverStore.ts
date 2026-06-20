import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ServerState = {
    serverUrl: string | null;
    setServerUrl: (url: string) => void;
    clearServerUrl: () => void;
};

export const useServerStore = create<ServerState>()(
    persist(
        (set) => ({
            serverUrl: null,
            setServerUrl: (url) => set({ serverUrl: url }),
            clearServerUrl: () => set({ serverUrl: null }),
        }),
        {
            name: 'server-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
