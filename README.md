# GameTrace Mobile

The mobile client for [GameTrace](https://github.com/r-scibor/gametrace-backend) — a distributed game-time tracking system. A Discord bot detects game activity and logs play sessions; this React Native app lets you browse your library, review and edit sessions, log play manually or by voice, and see your stats. Built with Expo and a custom dark, high-contrast UI assembled from React Native primitives (no UI kit).

## Stack

| Concern | Technology |
|-----------|-----------|
| Framework | React Native + Expo (TypeScript) |
| State | Zustand + AsyncStorage persistence |
| Networking | Axios with a shared client and interceptors |
| Navigation | React Navigation (native stack + bottom tabs) |
| i18n | `i18next` / `react-i18next` (pl + en) |
| UI | Custom design system on React Native `StyleSheet` |
| Icons | `react-native-svg` |
| Testing | Jest (`jest-expo`) + Testing Library |

## Quick start

```bash
npm install
npx expo start
```

Open the project in [Expo Go](https://expo.dev/go) (scan the QR code) or an Android/iOS emulator. Discord OAuth needs a **dev build** (custom scheme); link-code login works more broadly.

On first launch the app asks for your **GameTrace API server URL** (see [Configuration](#configuration)). You then log in with Discord OAuth or a bot-issued link code — see the [backend README](https://github.com/r-scibor/gametrace-backend#user-onboarding).

> You need a running GameTrace backend to use the app. Follow the [backend quick start](https://github.com/r-scibor/gametrace-backend#quick-start) to stand one up.

## Features

- **Configurable server** — first-run setup probes the server's `/health` endpoint, prefers HTTPS, and warns before connecting over insecure HTTP. Switchable later from Settings (changing servers logs you out).
- **Auth** — Discord OAuth and link-code login; optional bot invite / server-join flow after auth.
- **Dashboard** — live ongoing-session card, last-played spotlight, stat tiles, recent sessions, offline stale indicators.
- **Library** — library / out-of-library tabs, server-side search and sort, facet drill-down from Stats; accept or ignore games from the detail view.
- **Sessions** — log play manually, or by **voice**: record audio and the backend transcribes it into a session. Edit end times; editing a bot-tracked session flips its source to manual (with a warning).
- **Stats** — period-aware playtime analytics (overview, games, rhythm, taste, creators).
- **Trash** — soft-deleted sessions with restore and permanent-delete.
- **Custom covers** — set your own cover image for a game from your photo library (local device storage).
- **Reporting** — in-app feedback and merge-candidate (duplicate game) reports.
- **Bilingual UI** — Polish and English, with profile + device-locale resolution (default **pl**).
- **Offline read cache** — last-good snapshots for key read paths when the network fails.

## Configuration

There is no hardcoded server address. The API base URL is entered at runtime:

- **First run** — `ServerSetupScreen` gates the app until a server resolves. Enter a host (e.g. `gametrace.example.com` or `192.168.1.10:8010`); the app probes `<host>/health`, preferring `https://` and falling back to `http://` with an insecure-connection warning. The resolved `…/api/v1` base URL is persisted via `serverStore`.
- **Later** — change it from **Settings → server**. Switching servers clears auth and logs you out.

Discord client id / invite URL and optional dev-login secret come from `EXPO_PUBLIC_*` env vars (see `.env.example`). Preview EAS builds set Discord vars in `eas.json`.

See `app/api/resolveServer.ts` for the resolution rules.

## Project structure

```
app/
  api/         Axios client, server resolution, per-domain endpoint modules
  components/  Reusable UI — bottom sheets, alerts, cover, timers, icons
  hooks/       Screen/data hooks (useDashboard, useCachedFetch, useLanguage, …)
  i18n/        i18next setup + pl/en catalogs
  navigation/  Root stack (server → auth → tabs) and bottom tabs
  screens/     One file per screen
  store/       Zustand stores (auth, server, settings, report, cache-related, …)
  theme/       Colors, fonts, shared styles
  types/       API response types
  utils/       Pure helpers (duration, errors, timezones, cache storage, …)
```

See **[docs/architecture.md](docs/architecture.md)** for how these fit together.

## Testing

```bash
npm test
```

Jest with `jest-expo` and `@testing-library/react-native`. Tests live in `__tests__/` folders beside the code they cover.

## Docs

| Document | Description |
|----------|-------------|
| [docs/architecture.md](docs/architecture.md) | App architecture — navigation gates, stores, API layer, i18n, theming |
| [docs/roadmap.md](docs/roadmap.md) | Planned work and a log of what has shipped |
| [docs/internal/TechDebt.md](docs/internal/TechDebt.md) | Known gaps (internal) |
| [docs/internal/Gotchas.md](docs/internal/Gotchas.md) | Platform quirks worth knowing before debugging |

## License

[MIT](LICENSE) — © 2026 R-Scibor
