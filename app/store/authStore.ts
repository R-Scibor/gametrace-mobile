import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import { clearAllCache } from '../utils/cacheStorage';

const secureStorage: StateStorage = {
    getItem: (name) => SecureStore.getItemAsync(name),
    setItem: (name, value) => SecureStore.setItemAsync(name, value),
    removeItem: (name) => SecureStore.deleteItemAsync(name),
};

type User = {
    discordId: string;
    username: string;
    //TODO: avatar??
};

type AuthState = {
    token: string | null;
    user: User | null;
    isAdmin: boolean;
    isAuthenticated: boolean;
    login: (token: string, user: User, isAdmin?: boolean) => void;
    setIsAdmin: (isAdmin: boolean) => void;
    logout: () => void;
};

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            token: null,
            user: null,
            isAdmin: false,
            isAuthenticated: false,

            login: (token, user, isAdmin = false) => set({ token, user, isAdmin, isAuthenticated: true }),
            setIsAdmin: (isAdmin) => set({ isAdmin }),
            logout: () => {
                set({ token: null, user: null, isAdmin: false, isAuthenticated: false });
                // Sole clear site (spec): covers settings logout, the axios 401
                // interceptor, and change-server. Fire-and-forget.
                void clearAllCache();
            },
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => secureStorage),
        }
    )
);