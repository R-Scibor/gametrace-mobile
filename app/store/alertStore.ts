import { create } from 'zustand';

type AlertState = {
    alert: { title: string; message: string } | null;
    showAlert: (title: string, message: string) => void;
    dismiss: () => void;
};

// Lightweight, non-persisted store so non-component code (e.g. the axios
// interceptor) can surface the app's styled AlertSheet instead of the native
// Alert.alert. A single GlobalAlertHost renders the sheet at the app root.
export const useAlertStore = create<AlertState>((set) => ({
    alert: null,
    showAlert: (title, message) => set({ alert: { title, message } }),
    dismiss: () => set({ alert: null }),
}));
