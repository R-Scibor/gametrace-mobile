import Constants from 'expo-constants';
import * as Application from 'expo-application';

// EAS remote versioning does not touch expo.version, so Constants.expoConfig
// stays accurate across OTAs — safe to read here.
export function appVersion(): string {
    return Constants.expoConfig?.version ?? '—';
}

// Constants.expoConfig reflects the currently loaded manifest, which after an
// expo-updates OTA is the update's manifest, not the installed binary's — and
// `eas update` never resolves EAS remote versioning, so it would embed
// app.json's stale literal. Read the real installed binary's build number
// instead, which is correct by construction regardless of OTA state. On
// Android this is the versionCode as a string; it is null where there is no
// native binary (Expo Go, dev client).
export function buildNumber(): string | null {
    return Application.nativeBuildVersion;
}

// "v0.4.3 (12)", or "v0.4.3" where no build number exists (Expo Go, dev client).
export function formatAppVersion(): string {
    const build = buildNumber();
    return build == null ? `v${appVersion()}` : `v${appVersion()} (${build})`;
}
