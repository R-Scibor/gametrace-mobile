import { create } from 'zustand';

type ReportState = {
    isOpen: boolean;
    submitting: boolean;
    open: () => void;
    close: () => void;
    setSubmitting: (v: boolean) => void;
};

// Drives the globally-rendered ReportSheet. Any screen (or the FAB / Settings
// row) can call open(); mirrors the alertStore/GlobalAlertHost pattern.
export const useReportStore = create<ReportState>((set) => ({
    isOpen: false,
    submitting: false,
    open: () => set({ isOpen: true }),
    close: () => set({ isOpen: false, submitting: false }),
    setSubmitting: (v) => set({ submitting: v }),
}));
