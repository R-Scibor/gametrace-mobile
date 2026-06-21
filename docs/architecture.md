# Architecture

How GameTrace Mobile is put together. For the directory map and run instructions see the [README](../README.md); this document covers how the pieces interact.

## Layers

```
screens ──uses──► hooks ──calls──► api ──HTTP──► GameTrace backend
   │                │                │
   └────reads───────┴────reads───────┴──► store (Zustand)
   │
   └────styles from──► theme        components ──shared UI──► screens
```

Screens compose UI and delegate data work to hooks. Hooks call the typed `api/` modules and read/write Zustand stores. The Axios client injects the server URL and auth token on every request. Components and theme are shared presentation with no business logic.

## Navigation

`RootNavigator` is a native stack with two gates, evaluated top-down:

1. **No server URL** → `ServerSetupScreen` (nothing else is reachable).
2. **Not authenticated** → `AuthScreen`.
3. **Authenticated** → `Main` (the bottom tabs) plus the pushable stack screens `GameDetail`, `EditSession`, `Trash`, and `Voice`.

`TabNavigator` holds five tabs: **Dashboard**, **Biblioteka** (Library), **Dodaj** (Add session), **Statystyki** (Stats), **Ustawienia** (Settings).

Because the gates key off `serverStore.serverUrl` and `authStore.isAuthenticated`, clearing either value (e.g. logging out, or changing servers) automatically returns the user to the right screen — there are no imperative `navigate` calls for auth transitions.

## State (Zustand)

Each store is a small slice with its own concern; the server, auth, and settings stores persist to `AsyncStorage`.

| Store | Responsibility |
|-------|----------------|
| `serverStore` | Resolved API base URL. Persisted. Drives the first navigation gate. |
| `authStore` | Token + `isAuthenticated`. Persisted. `logout()` is called on `401`. |
| `settingsStore` | User preferences (e.g. timezone). Persisted. |
| `gamesStore` | Cached library/game data. |
| `sessionsStore` | Session lists and in-flight session state. |
| `localCoversStore` | Local cover-image overrides keyed by game. |
| `alertStore` | Queue of app-wide alerts (see [Alerts](#alerts)). |

## API layer

`api/client.ts` is a single shared Axios instance. A request interceptor reads `serverStore` and sets `config.baseURL` per request, then attaches `Authorization: Bearer <token>` from `authStore`. A response interceptor catches `401`, logs the user out, and — only if they were previously authenticated — surfaces a "session expired" alert.

`api/resolveServer.ts` turns user input into a usable base URL. It strips trailing slashes, probes `<host>/health` (expecting `{ status: "ok" }`), prefers `https://`, and falls back to `http://` reporting an `insecure` status the UI confirms before accepting. It returns one of `ok` / `insecure` / `unreachable` / `invalid`.

Per-domain modules (`auth`, `games`, `sessions`, `stats`, `profile`, `voice`, `health`) wrap individual endpoints and return types from `types/api.ts`. The backend mounts everything under `/api/v1`; the full endpoint reference lives in the [backend docs](https://github.com/r-scibor/gametrace-backend/blob/main/docs/api.md).

## Hooks

Screen-facing hooks own data fetching and derived state so screens stay declarative: `useAuth`, `useDashboard`, `useGameStats`, `useRecentSessions`, `useVoiceRecord`, plus `useChangeServer` for the Settings server-switch flow.

## Theming

`theme/colors.ts` defines the palette — a dark base (`bg`…`bg4`), warm orange accent (`orange`), and muted text ramp (`text`…`text3`). `theme/fonts.ts` wires the Google fonts (Space Grotesk / DM Sans) loaded in `App.tsx`, and `theme/styles.ts` holds shared style fragments. There is no component library; UI is built directly from React Native `StyleSheet`.

## Alerts

Native `Alert` is not used. `alertStore` holds an alert/confirm queue; `GlobalAlertHost` (mounted once in `RootNavigator`) renders them as styled bottom sheets (`AlertSheet` / `ConfirmSheet`, built on `BottomSheet`). This lets non-React code (e.g. the Axios `401` interceptor) raise UI by calling `alertStore.getState().showAlert(...)`.

## Testing

Jest with `jest-expo` and `@testing-library/react-native`. Tests sit in `__tests__/` folders beside the code under test and cover the server-resolution logic, the Axios client, the server stores and setup screens, and a navigation smoke test. Run with `npm test`.
