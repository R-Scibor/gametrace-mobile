# GameTrace Mobile — Roadmap

Product backlog distilled from locked design decisions. Visual redesign explorations live separately; this file tracks **behaviour and UX** work.

---

## Dashboard

### Stat tiles — rule of three

**Status:** decided · not implemented

Replace the current four-tile row with **three** summary tiles:

| Tile | Metric | Scope |
|------|--------|--------|
| 1 | Total playtime | **Dziś** |
| 2 | Total playtime | **7 dni** |
| 3 | Average session length | **Last 7 days** (`ŚR. SESJA`) |

- **Remove** the “30 DNI” tile from the dashboard — long-window totals stay on **Statystyki** only.
- Third tile uses the same label + big number + unit pattern as neighbours (not a game name).
- Edge cases: no sessions in 7d window → `—` or `0`; exclude in-progress session from average until ended.

**Touches:** `DashboardScreen`, stats API/hooks if new aggregate needed.

---

### Hero region — always occupied

**Status:** decided · not implemented

The top hero slot is **never empty** on the dashboard.

| State | Hero content |
|-------|----------------|
| Active session | Live card (timer, game, bot footer) |
| No active session | **Last played game** spotlight |
| No play history | Onboarding / first-run hero (copy TBD) |

**Idle spotlight (locked):**

- Game cover + name (most recently played)
- Last played recency (e.g. wczoraj, 3 dni temu)
- **All-time** playtime on that game
- +2 game-scoped quick stats — pair TBD at implementation
- Calmer chrome than active card; tap → game detail

**Touches:** `DashboardScreen`, `useDashboard` (or new hook), possibly backend if all-time-per-game not already available on dashboard payload.

---

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

### Edit session — richer context

**Status:** decided · not implemented

`EditSessionScreen` is too bare today: only **end time** and **notes**, with no session context. Users opening edit from game history or an error banner lack the information needed to understand or fix a session.

**Show (read-only context at minimum):**

- Game — cover + name
- Start time
- Computed duration (from start/end)
- Status (`COMPLETED` / `ERROR`) and source (`BOT` / `MANUAL`)
- Created-at or “logged” timestamp where useful

**Edit (scope TBD, expand beyond today):**

- End time (existing)
- Start time — if API supports patch; required for fixing ERROR sessions
- Notes (existing)
- Discard / void session — `SessionPatch.discard` exists in types but is not exposed in UI

**UX notes:**

- ERROR sessions (dashboard banner, game history) should surface *why* editing is needed — status badge, short helper copy.
- Parity with **Dodaj sesję** where it helps: same date/time field patterns, game always visible even when not editable.
- Block ONGOING sessions (keep current behaviour).

**Touches:** `EditSessionScreen`, `SessionPatch` / API if `start_time` patch needed, navigation params (may only need `sessionId` once screen loads full session).

---

## Changelog

| Date | Item |
|------|------|
| 2026-06-17 | Roadmap created — dashboard stat tiles, hero spotlight, edit session context. |
| 2026-06-17 | Dashboard onboarding (first-run hero) added. |