# Architecture

How GameTrace Mobile is put together. For the directory map and run instructions see the [README](../README.md); this document covers how the pieces interact.

## Layers

```
screens ──uses──► hooks ──calls──► api ──HTTP──► GameTrace backend
   │                │                │
   └────reads───────┴────reads───────┴──► store (Zustand)
   │
   └────styles from──► theme        components ──shared UI──► screens
   │
   └────copy from──► i18n (i18next catalogs pl/en)
```

Screens compose UI and delegate data work to hooks. Hooks call the typed `api/` modules and read/write Zustand stores. The Axios client injects the server URL and auth token on every request. Components and theme are shared presentation with no business logic. User-visible strings go through `react-i18next` namespaces under `app/i18n/locales/{pl,en}/`.

## Navigation

`RootNavigator` is a native stack with two gates, evaluated top-down:

1. **No server URL** → `Welcome`, which offers the official server or self-hosting; `OfficialPolicy` and `CustomServer` are sibling routes in the same `!serverUrl` branch (nothing else is reachable).
2. **Not authenticated** → `AuthScreen`.
3. **Authenticated** → `Main` (the bottom tabs) plus the pushable stack screens `GameDetail`, `EditSession`, `Trash`, and `Voice`.

`TabNavigator` holds five tabs: **Dashboard**, **Library**, **Add session**, **Stats**, **Settings**. Tab labels and screen copy follow the active language.

Because the gates key off `serverStore.serverUrl` and `authStore.isAuthenticated`, clearing either value (e.g. logging out, or changing servers) automatically returns the user to the right screen — there are no imperative `navigate` calls for auth transitions.

On the authenticated tree, `useLanguageSync` runs so profile language can adopt into i18n after login. Global hosts (`GlobalAlertHost`, report FAB / sheet, server-join host) sit at the navigator level.

## State (Zustand)

Each store is a small slice with its own concern; the server, auth, and settings stores persist to `AsyncStorage`.

| Store | Responsibility |
|-------|----------------|
| `serverStore` | Resolved API base URL. Persisted. Drives the first navigation gate. |
| `authStore` | Token + `isAuthenticated` (+ admin flag). Persisted. `logout()` is called on `401`. |
| `settingsStore` | Local preferences (timezone, dark-mode flag). Persisted. Timezone/language truth is also synced via profile APIs. |
| `gamesStore` | Cached library/game data where still used. |
| `sessionsStore` | Session lists and in-flight session state. |
| `localCoversStore` | Local cover-image overrides keyed by game. |
| `alertStore` | Queue of app-wide alerts (see [Alerts](#alerts)). |
| `reportStore` | In-app report sheet open state / context. |
| `serverJoinStore` | Post-auth “join Discord server” prompt state. |

## API layer

`api/client.ts` is a single shared Axios instance. A request interceptor reads `serverStore` and sets `config.baseURL` per request, then attaches `Authorization: Bearer <token>` from `authStore`. A response interceptor catches `401`, logs the user out, and — only if they were previously authenticated — surfaces a "session expired" alert.

`api/resolveServer.ts` turns user input into a usable base URL. It strips trailing slashes, probes `<host>/health` (expecting `{ status: "ok" }`), prefers `https://`, and falls back to `http://` reporting an `insecure` status the UI confirms before accepting. It returns one of `ok` / `insecure` / `unreachable` / `invalid`.

Per-domain modules (`auth`, `games`, `sessions`, `stats`, `profile`, `voice`, `health`, `reports`) wrap individual endpoints and return types from `types/api.ts`. The backend mounts everything under `/api/v1`; the full endpoint reference lives in the [backend docs](https://github.com/r-scibor/gametrace-backend/blob/main/docs/api.md).

## Hooks

Screen-facing hooks own data fetching and derived state so screens stay declarative:

- **Domain (`app/hooks`):** `useAuth`, `useDashboard`, `useGameStats`, `useRecentSessions`, `useVoiceRecord`, `useDiscordOAuth`
- **Preferences:** `useLanguage` / `useLanguageSync` in `app/hooks`; `useTimezone` and `useChangeServer` live next to Settings under `app/screens/`
- **Caching:** `useCachedFetch` — read-through AsyncStorage snapshots (`utils/cacheStorage`) with stale metadata for offline banners

## i18n

`app/i18n/index.ts` registers namespaces and hydrates language before the UI gates fully run. Resolution order (see `resolve.ts`): **profile language → cached `gt.lang` → device locale → `en`**. Product default when nothing is set is still **pl** in practice via device/cache defaults used in the app.

Catalogs live in `app/i18n/locales/{pl,en}/*.json`. A parity test keeps pl/en key trees aligned. Dates and collations use `intlLocale(i18n.language)` rather than hard-coded `'pl'`.

Settings language chips call `updateSettings({ language })` optimistically; timezone uses the same profile settings path.

## Offline read cache

Selected list/summary fetches go through `useCachedFetch`. On success, a snapshot is written under a dedicated AsyncStorage prefix. On failure, the last snapshot is returned with `isStale` so screens can show a `StaleBanner` instead of pretending the network is fine or showing a blank library. This is phase-1 read caching — not a full offline write queue.

## Theming

`theme/colors.ts` defines the palette — a dark base (`bg`…`bg4`), warm orange accent (`orange`), and muted text ramp (`text`…`text3`). `theme/fonts.ts` wires the Google fonts (Space Grotesk / DM Sans) loaded in `App.tsx`, and `theme/styles.ts` holds shared style fragments. There is no component library; UI is built directly from React Native `StyleSheet`. Settings no longer exposes a dark-mode control (dark-only product until a real light theme ships).

## Alerts

Native `Alert` is not used for app chrome. `alertStore` holds an alert/confirm queue; `GlobalAlertHost` (mounted once in `RootNavigator`) renders them as styled bottom sheets (`AlertSheet` / `ConfirmSheet`, built on `BottomSheet`). This lets non-React code (e.g. the Axios `401` interceptor) raise UI by calling `alertStore.getState().showAlert(...)`.

## Crash reporting (Sentry)

`@sentry/react-native` is initialized at module scope in `App.tsx` (`Sentry.wrap` on the default export). Config is intentionally lean: `enabled: !__DEV__`, `tracesSampleRate: 0`, `sendDefaultPii: false`, and `beforeSend` strips auth headers/bodies. DSN comes from `EXPO_PUBLIC_SENTRY_DSN` (set in `eas.json` for preview/production). Org/project live in the `app.json` plugin options; `SENTRY_AUTH_TOKEN` is an EAS secret for sourcemap upload only (never `EXPO_PUBLIC_`). User identity is set only in `authStore` (`login` / `logout` / persist rehydrate) as `{ id: discordId }` — never the username. Product feedback stays on the backend `/reports` path, not Sentry User Feedback.

## Versioning

Two numbers, deliberately from different sources, and both shown in the Settings footer as `GAMETRACE v<version> (<build>)`.

- **`expo.version`** (`app.json`) — the marketing version. `appVersion()` reads it via `expo-constants`, which resolves against the **currently loaded manifest**, so an OTA update carries its own version. Bump **minor** for a new binary, **patch** for an OTA fix.
- **`versionCode`** — the Android build number, owned entirely by EAS (`appVersionSource: "remote"` in `eas.json`) and auto-incremented per build. `buildNumber()` reads it via `expo-application`, which reports the **installed binary**, not the manifest. Never hand-edit it, and never reintroduce `android.versionCode` to `app.json` — a literal there is ignored for versioning but still lands in the manifest, where `Constants.expoConfig` would report it as truth.

The split is the point: `v0.5.1 (10)` means "JS bundle 0.5.1 running on binary 10", which is enough for a tester to report and for us to locate the exact code.

**Bumping `expo.version` invalidates OTA delivery to existing binaries.** `runtimeVersion` uses the **fingerprint** policy, and the app config is part of what the fingerprint hashes. Measured against the `0.4.3+10` build:

| Tree state | Fingerprint |
|---|---|
| `0.4.3` — as built | `df9faf9c…` |
| `0.5.0` | `1a90de29…` |

So a version bump means `eas update` produces a bundle the installed app will not accept. It fails **silently**: the publish succeeds and reaches nobody. Treat a version bump as part of the same change-set as a new build, never as an OTA. This is the fingerprint policy working as intended — it is what stops an OTA shipping JS that assumes native code the binary lacks.

**Check compatibility with `eas fingerprint:compare`, not the bare CLI:**

```bash
eas fingerprint:compare --build-id <build-id>
```

It reports match/differ against a real build and prints the offending config diff. Do **not** use `npx @expo/fingerprint .` for this — it computes different hashes from EAS (which fingerprints on its builder, post-prebuild, with remote versioning resolved), so it will report a mismatch against a perfectly compatible build and send you chasing a problem that does not exist.

Preview APKs for testers are built on EAS (`eas.json` profile `preview`) and published by a `workflow_dispatch` job on a **self-hosted** runner that can write the file nginx serves. The workflow YAML is in git; the runner process is not. Setup and the git-vs-host split: [shipping-preview-apk.md](shipping-preview-apk.md).

## Testing

Jest with `jest-expo` and `@testing-library/react-native`. Tests sit in `__tests__/` folders beside the code under test and cover API modules, stores, hooks (including language and cache), screens, i18n parity/resolve, and navigation smoke. Run with `npm test`.
