import Constants from 'expo-constants';

// eas.json sets appVersionSource: "remote", so EAS — not app.json — owns the
// Android versionCode. Read expoConfig, which carries what the build injected;
// the bundled app.json value is permanently stale.
export function appVersion(): string {
    return Constants.expoConfig?.version ?? '—';
}

export function buildNumber(): number | null {
    return Constants.expoConfig?.android?.versionCode ?? null;
}

// "v0.4.3 (12)", or "v0.4.3" where no build number exists (Expo Go, dev client).
export function formatAppVersion(): string {
    const build = buildNumber();
    return build == null ? `v${appVersion()}` : `v${appVersion()} (${build})`;
}
