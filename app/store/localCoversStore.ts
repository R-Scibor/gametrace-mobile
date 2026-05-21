import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';

const COVERS_DIR = FileSystem.documentDirectory + 'covers/';

type LocalCoversState = {
    covers: Record<number, string>;
    setCover: (gameId: number, sourceUri: string) => Promise<void>;
    clearCover: (gameId: number) => Promise<void>;
};

const ensureDir = async () => {
    try {
        const info = await FileSystem.getInfoAsync(COVERS_DIR);
        if (!info.exists) {
            await FileSystem.makeDirectoryAsync(COVERS_DIR, { intermediates: true });
        }
    } catch {
        // TODO
    }
};

export const useLocalCoversStore = create<LocalCoversState>()(
    persist(
        (set, get) => ({
            covers: {},

            setCover: async (gameId, sourceUri) => {
                await ensureDir();
                const dest = `${COVERS_DIR}${gameId}.jpg`;
                try {
                    const existing = await FileSystem.getInfoAsync(dest);
                    if (existing.exists) await FileSystem.deleteAsync(dest, { idempotent: true });
                    await FileSystem.copyAsync({ from: sourceUri, to: dest });
                } catch {
                    // TODO
                    return;
                }
                // cache-bust so <Image> re-renders even when path is identical
                const uri = `${dest}?v=${Date.now()}`;
                set({ covers: { ...get().covers, [gameId]: uri } });
            },

            clearCover: async (gameId) => {
                const dest = `${COVERS_DIR}${gameId}.jpg`;
                try {
                    await FileSystem.deleteAsync(dest, { idempotent: true });
                } catch {
                    // TODO
                }
                const next = { ...get().covers };
                delete next[gameId];
                set({ covers: next });
            },
        }),
        {
            name: 'local-covers-storage',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({ covers: state.covers }),
        }
    )
);
