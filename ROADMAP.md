# GameTrace Mobile — Roadmap

Product backlog distilled from locked design decisions. Visual redesign explorations live separately; this file tracks **behaviour and UX** work.

---

## Dashboard

### Dashboard onboarding (first-run & empty state)

**Status:** decided · not implemented

New or returning users with **no play history** need a proper onboarding experience on the dashboard — not an empty shell. This is the third hero state from *Hero region — always occupied*; copy and steps are still TBD but the slot and intent are locked.

**Goals:**

- Explain what GameTrace does in one glance (track playtime, sessions, stats).
- Guide the first meaningful action — e.g. add a session manually, connect bot, or browse library.
- Fill the hero region so the dashboard still feels complete before any data exists.

**Content direction (draft):**

- Short welcome headline + 1–2 lines of value prop (Polish).
- Primary CTA — likely **Dodaj sesję** or link to bot/setup docs if bot is the main path.
- Optional secondary hints — where stats live, how sessions appear after logging.
- Stat tiles and **Ostatnie sesje** can show empty-state placeholders or stay hidden until first session — decide at implementation (hero carries the story either way).

**Dismissal / persistence:**

- Show while user has zero completed sessions (and no active session).
- Replace automatically with last-played spotlight once history exists — no manual “dismiss forever” required unless product wants it.

**Touches:** `DashboardScreen`, hero component branch, possibly `useDashboard` / session count check, navigation to `AddSession` or settings/bot help.

---

## Sessions

### Edit session — expand editable scope

**Status:** partially shipped — read-only context done; editable scope pending

Read-only context now ships on `EditSessionScreen`: game (cover + name), start time, **live** computed duration (updates as the end time is picked), and a status (`COMPLETED` / `ERROR`) badge with source (`BOT` / `MANUAL`). Save is disabled when the end precedes the start (with a hint), and editing a `BOT` session warns — via the styled confirm sheet — that its source flips to manual and may not count toward some community stats.

**Still pending:**

- Start time edit — if API supports patch; required for fixing ERROR sessions.
- Created-at / “logged” timestamp in context where useful.
- Confirm the source flip fires only when the backend actually reassigns source (currently warns on any save of a `BOT` session).

**Touches:** `EditSessionScreen`, `SessionPatch` / API if `start_time` patch needed.

> Discard/void shipped: "Odrzuć sesję" → `DELETE /sessions/{id}` (soft-delete). The `discard` PATCH field never existed server-side and was removed from `SessionPatch`.

### Session trash / restore (Kosz)

**Status:** decided · not implemented

Discard is a **soft-delete** — the backend keeps trashed sessions ~7 days and exposes `GET /sessions/trash`, `POST /sessions/{id}/restore`, and `DELETE /sessions/{id}?hard=true`. Mobile has no surface for this yet: no way to view discarded sessions, restore one, or purge. Worth a "Kosz" view (likely under Settings or the session history) before the 7-day auto-purge makes accidental discards unrecoverable.

**Touches:** new trash screen/list, `api/sessions` (trash list / restore / hard-delete), navigation.

---

## Changelog

| Date | Item |
|------|------|
| 2026-06-17 | Roadmap created — dashboard stat tiles, hero spotlight, edit session context. |
| 2026-06-17 | Dashboard onboarding (first-run hero) added. |
| 2026-06-17 | Shipped active-card polish + idle last-played spotlight; removed those and the stat-tiles item (dashboard already has 3 tiles) from the backlog. |
| 2026-06-18 | Shipped dashboard *Ostatnie sesje* fit-to-screen (measure-and-floor, no scroll). |
| 2026-06-18 | Shipped library tabs *Moje gry* / *Inne* (NEEDS_REVIEW inbox), server-side search (`?q=`), `total` count, and lazy-paginated game history. |
| 2026-06-18 | Shipped game accept/ignore + un-ignore via `GameDetailScreen` OPCJE sheet with status tags; added *Ignored games — management surface* to the backlog. |
| 2026-06-18 | Shipped edit-session read-only context (game / start / live duration / status / source), save-disable on invalid end, and styled bot-source-flip warning; trimmed the edit-session item to remaining editable-scope work. |
| 2026-06-18 | Extracted shared `BottomSheet` / `ConfirmSheet` from the GameDetail menu styling. |
| 2026-06-18 | Unified session duration formatting (floor) into `utils/duration`; fixed GameDetail rounding mismatch. |
| 2026-06-18 | Shipped session discard via `DELETE /sessions/{id}` + styled `AlertSheet`; removed the non-existent `SessionPatch.discard`; added *Session trash / restore* to the backlog. |
| 2026-06-18 | *Inne* tab now lists out-of-library games (`?in_library=false` union of ignored + unaccepted stubs) with ⚠/UKRYTE markers; revert/accept via GameDetail. Closes the *Ignored games — management surface* backlog item. |