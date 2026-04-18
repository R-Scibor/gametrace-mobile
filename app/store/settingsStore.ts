import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

type SettingsState = {
    isDarkMode: boolean;
    toggleDarkMode: () => void;
};

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            isDarkMode: false,

            toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
        }),
        {
            name: 'settings-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);