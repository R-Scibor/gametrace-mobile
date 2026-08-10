import Constants from 'expo-constants';
import * as Application from 'expo-application';
import * as Updates from 'expo-updates';

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

// Short prefix of the running bundle's id. Both values above are pinned to the
// installed binary, so this is the only one that changes when an OTA lands —
// without it there is no way to tell a shipped build from the same build plus
// three updates. Null in Expo Go / dev client, where updates are disabled.
export function updateLabel(): string | null {
    return Updates.updateId ? Updates.updateId.slice(0, 7) : null;
}
