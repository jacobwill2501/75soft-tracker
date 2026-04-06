# Family Hub — Design Spec

**Date:** 2026-04-05
**Status:** Approved

---

## Context

Users of the 75 Soft Tracker want to see the progress of other family members on the same Firebase instance. Currently all profiles are completely siloed — there is no cross-profile visibility. This feature adds a "Family Hub" screen and a persistent bottom navigation bar so any family member can view any other profile's full 75-day calendar without needing that profile's PIN.

---

## Design

### Navigation Architecture

A persistent bottom nav bar replaces the existing in-screen navigation buttons. It is rendered by a new `nav.js` module and injected by `app.js` once the family password gate is passed.

**Pre-login state** (profiles screen + family hub):
- Tabs: **Profiles** | **Family Hub**

**Post-login state** (after a profile PIN is entered):
- Tabs: **Today** | **Calendar** | **Family Hub** | **Settings**

The nav highlights the active tab based on the current screen. Existing in-screen nav buttons (e.g., calendar link on Today screen) are removed since the bottom nav replaces them.

### Family Hub Screen (`screens/family.js`)

- Accessible pre-login (no PIN required — family password gate is sufficient)
- Lists all profiles in the instance, each showing: emoji, name, current day number (e.g., "Day 23")
- Tapping a profile opens a **read-only calendar view** for that profile
- Back button returns to the Family Hub list

### Read-Only Calendar View

- Reuses the existing calendar rendering logic from `screens/calendar.js`
- Passed a different userId to display another user's data
- No edit interactions — checkboxes/toggles are disabled or removed
- Uses existing `getUser()` and `getDays()` from `firebase.js` — no new Firestore logic needed

### Data & Security

- No data model changes required
- All users and their day records are already readable by anyone with the family password (existing security model)
- The Family Hub simply calls existing Firebase read functions with a different userId

---

## Files to Create / Modify

| File | Change |
|---|---|
| `screens/family.js` | **Create** — Family Hub screen (profile list + read-only calendar view) |
| `nav.js` | **Create** — Bottom nav component (render + active state logic) |
| `app.js` | **Modify** — Inject nav after gate, wire Family Hub route, update screen transitions |
| `screens/profiles.js` | **Modify** — Nav handles routing; remove any redundant navigation |
| `screens/today.js` | **Modify** — Remove in-screen calendar nav button |
| `screens/calendar.js` | **Modify** — Accept optional userId param for read-only mode; remove in-screen nav buttons |
| `screens/settings.js` | **Modify** — Remove in-screen nav buttons |
| `style.css` | **Modify** — Add bottom nav bar styles; adjust screen layout for nav height offset |

---

## Existing Utilities to Reuse

- `firebase.js` — `getUser(userId)`, `getDays(userId)` for fetching any profile's data
- `utils/dates.js` — day number calculations for displaying "Day N" on hub profile cards
- `screens/calendar.js` — calendar grid rendering logic, adapted for read-only + arbitrary userId

---

## Verification

1. Pass family password gate → bottom nav shows **Profiles | Family Hub**
2. Tap **Family Hub** without entering any PIN → all profiles listed with emoji, name, day number
3. Tap a profile → read-only calendar opens; no edit interactions available
4. Back returns to Family Hub list
5. Select a profile + enter PIN → nav expands to **Today | Calendar | Family Hub | Settings**
6. Confirm all in-screen nav buttons are gone and bottom nav handles all navigation
7. Active tab highlights correctly on each screen
8. Family Hub tab works from all post-login screens
