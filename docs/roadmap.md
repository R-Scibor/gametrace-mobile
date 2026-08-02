# Roadmap

Behaviour and UX work for GameTrace Mobile, distilled from locked design decisions. Visual redesign explorations are tracked separately. The split is simple: **Planned** is what's decided but not built; **Shipped** is the log of what's done.

---

## Planned

_Nothing queued._

---

## Shipped

Most recent first. Dates are approximate when several commits landed together.

| Date | Item |
|------|------|
| 2026-08 | **Empty states + sample preview** — get-started card on the empty dashboard, plus a labelled sample-data preview on Dashboard / Library / Stats built from fabricated seeds (`app/utils/sampleData.ts`). Emptiness published once by the Dashboard via `emptyAccountStore`, so Library and Stats add no fetches or polls. |
| 2026-08 | **Bilingual UI (pl / en)** — `i18next` + catalogs, Settings language control, profile sync (`useLanguage` / `useLanguageSync`), device-locale hydrate, parity tests. Default remains **pl**. |
| 2026-08 | **Merge-candidate report** — user reports a duplicate pair via `MergeCandidateSheet` (compose message → in-app report). Admin public merge route removed from mobile. |
| 2026-07 | **Offline read cache (phase 1)** — `useCachedFetch` + AsyncStorage snapshots; stale banners on dashboard/recents (and related read paths). |
| 2026-07 | **Library sort + facet drill-down** — server-side `sort` (`name` / `playtime` / `last_played`) and filter params; Stats → Library handoff. |
| 2026-07 | **Discord OAuth + link-code login** — native redirect scheme, bot invite / server-join host, Settings feedback + report FAB. |
| 2026-07 | **Stats screen expansion** — sectioned layout (overview → games → when you play → taste → creators), global period selector including all-time, ranked lists with show-more. |
| 2026-06-20 | Configurable API server — first-run `ServerSetupScreen` gate, `/health` probe with HTTPS-preferred / insecure-HTTP confirm, change-server from Settings (logs out on switch). |
| 2026-06-18 | Session trash (Settings → Trash) — list / restore / permanent-delete of discarded sessions. |
| 2026-06-18 | GameDetail pull-to-refresh + auto-refetch on focus after a session changes. |
| 2026-06-18 | *Inne* / out-of-library tab (`?in_library=false`, ignored + unaccepted stubs) with markers; accept/ignore via GameDetail. |
| 2026-06-18 | Session discard via `DELETE /sessions/{id}` + styled `AlertSheet`. |
| 2026-06-18 | Unified session duration formatting (floor) into `utils/duration`. |
| 2026-06-18 | Shared `BottomSheet` / `ConfirmSheet`. |
| 2026-06-18 | Edit-session read-only context, save-disable on invalid end, bot-source-flip warning. |
| 2026-06-18 | Game accept/ignore + un-ignore via GameDetail options sheet. |
| 2026-06-18 | Library tabs *Moje gry* / *Inne*, server-side search (`?q=`), `total` count, lazy-paginated history. |
| 2026-06-18 | Dashboard *Recent sessions* fit-to-screen (measure-and-floor). |
| 2026-06-17 | Dashboard active-card polish + idle last-played spotlight. |
