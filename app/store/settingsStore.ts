import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

type SettingsState = {
    isDarkMode: boolean;
    timezone: string;
    toggleDarkMode: () => void;
    setTimezone: (tz: string) => void;
};

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            isDarkMode: false,
            timezone: 'UTC',

            toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
            setTimezone: (tz) => set({ timezone: tz }),
        }),
        {
            name: 'settings-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
