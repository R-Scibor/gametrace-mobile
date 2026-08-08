import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import * as Sentry from '@sentry/react-native';
import { clearAllCache } from '../utils/cacheStorage';
import { useEmptyAccountStore } from './emptyAccountStore';
import type { PendingDeletion } from '../types/api';

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
    pendingDeletion: PendingDeletion | null;
    login: (token: string, user: User, isAdmin?: boolean, pendingDeletion?: PendingDeletion | null) => void;
    setIsAdmin: (isAdmin: boolean) => void;
    setPendingDeletion: (pendingDeletion: PendingDeletion | null) => void;
    logout: () => void;
};

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            token: null,
            user: null,
            isAdmin: false,
            isAuthenticated: false,
            pendingDeletion: null,

            login: (token, user, isAdmin = false, pendingDeletion = null) => {
                set({ token, user, isAdmin, isAuthenticated: true, pendingDeletion });
                // Sole set site: every login path funnels through useAuth.seedSession.
                // discordId only — never the username (spec: Sentry PII).
                Sentry.setUser({ id: user.discordId });
            },
            setIsAdmin: (isAdmin) => set({ isAdmin }),
            setPendingDeletion: (pendingDeletion) => set({ pendingDeletion }),
            logout: () => {
                set({
                    token: null,
                    user: null,
                    isAdmin: false,
                    isAuthenticated: false,
                    pendingDeletion: null,
                });
                // Sole clear site (spec): covers settings logout, the axios 401
                // interceptor, and change-server. Fire-and-forget.
                void clearAllCache();
                // The next account must not inherit this account's verdict.
                useEmptyAccountStore.getState().reset();
                // Sole clear site: settings logout, axios 401, change-server,
                // and both deletion screens all land here.
                Sentry.setUser(null);
            },
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => secureStorage),
        }
    )
);
