import { useReportStore } from '../reportStore';

beforeEach(() => useReportStore.setState({ isOpen: false, submitting: false }));

test('open sets isOpen true', () => {
  useReportStore.getState().open();
  expect(useReportStore.getState().isOpen).toBe(true);
});

test('close resets isOpen and submitting', () => {
  useReportStore.setState({ isOpen: true, submitting: true });
  useReportStore.getState().close();
  expect(useReportStore.getState().isOpen).toBe(false);
  expect(useReportStore.getState().submitting).toBe(false);
});

test('setSubmitting toggles submitting', () => {
  useReportStore.getState().setSubmitting(true);
  expect(useReportStore.getState().submitting).toBe(true);
});
