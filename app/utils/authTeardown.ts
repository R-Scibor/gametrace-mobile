let suspended = false;

export function suspendAuthTeardown(): void {
  suspended = true;
}

export function resumeAuthTeardown(): void {
  suspended = false;
}

export function isAuthTeardownSuspended(): boolean {
  return suspended;
}
