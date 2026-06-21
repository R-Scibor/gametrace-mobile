# Roadmap

Behaviour and UX work for GameTrace Mobile, distilled from locked design decisions. Visual redesign explorations are tracked separately. The split is simple: **Planned** is what's decided but not built; **Shipped** is the log of what's done.

---

## Planned

### Dashboard — onboarding / empty state

**Status:** decided · not implemented

Users with no play history need a real first-run experience on the dashboard, not an empty shell. This is the third hero state from *hero region — always occupied*; the slot and intent are locked, copy and steps are still draft.

**Goals**

- Explain what GameTrace does in one glance (track playtime, sessions, stats).
- Guide the first meaningful action — add a session manually, connect the bot, or browse the library.
- Keep the hero region filled so the dashboard feels complete before any data exists.

**Direction (draft)**

- Short welcome headline + 1–2 lines of value prop (Polish).
- Primary CTA — likely **Dodaj sesję**, or a link to bot/setup help if the bot is the main path.
- Stat tiles and **Ostatnie sesje** can show empty-state placeholders or stay hidden until the first session — decide at implementation.

**Persistence:** show while the user has zero completed sessions and no active session; replace automatically with the last-played spotlight once history exists. No manual dismiss unless product wants one.

**Touches:** `DashboardScreen`, hero component branch, `useDashboard` / session-count check, navigation to `AddSession` or settings/bot help.

### Library — sort / ordering

**Status:** decided · not implemented

The library grid has no sort control. Add ordering:

- **By title** (A–Z)
- **By total playtime** (most played first)
- **By latest played** (most recently played first) — likely the default

Must be **server-side**: the list is paginated, so a client-side sort would only order already-loaded pages (the same limitation we hit with search). "Total playtime" and "last played" aren't on the games-list response today (they live in `/stats`), so the backend needs to expose them as sortable fields plus `sort` / `order` params on `GET /games`. Applies per tab (*Moje gry* / *Inne*) and should compose with `q` search.

**Touches:** `LibraryScreen` (header sort control), `getGames` (`sort` / `order` params), backend (sortable fields + ordering).

---

## Shipped

Most recent first.

| Date | Item |
|------|------|
| 2026-06-20 | Configurable API server — first-run `ServerSetupScreen` gate, `/health` probe with HTTPS-preferred / insecure-HTTP confirm, change-server from Settings (logs out on switch). |
| 2026-06-18 | Session trash (Settings → **Kosz**) — list / restore / permanent-delete of discarded sessions. |
| 2026-06-18 | GameDetail pull-to-refresh + auto-refetch on focus after a session changes. |
| 2026-06-18 | *Inne* tab lists out-of-library games (`?in_library=false`, ignored + unaccepted stubs) with ⚠ / UKRYTE markers; revert/accept via GameDetail. |
| 2026-06-18 | Session discard via `DELETE /sessions/{id}` + styled `AlertSheet`; removed the non-existent `SessionPatch.discard`. |
| 2026-06-18 | Unified session duration formatting (floor) into `utils/duration`; fixed GameDetail rounding mismatch. |
| 2026-06-18 | Extracted shared `BottomSheet` / `ConfirmSheet` from the GameDetail menu styling. |
| 2026-06-18 | Edit-session read-only context (game / start / live duration / status / source), save-disable on invalid end, styled bot-source-flip warning. |
| 2026-06-18 | Game accept/ignore + un-ignore via GameDetail OPCJE sheet with status tags. |
| 2026-06-18 | Library tabs *Moje gry* / *Inne* (NEEDS_REVIEW inbox), server-side search (`?q=`), `total` count, lazy-paginated game history. |
| 2026-06-18 | Dashboard *Ostatnie sesje* fit-to-screen (measure-and-floor, no scroll). |
| 2026-06-17 | Dashboard active-card polish + idle last-played spotlight. |
