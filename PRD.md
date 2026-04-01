# PRD: 75 Soft Tracker

## Document Purpose
This PRD documents the current state of the 75 Soft Tracker web app — its purpose, features, architecture, and user flows — for use by PMs and future implementers. It reflects the **as-built** product.

---

## 1. Product Overview

### What is it?
**75 Soft Tracker** is a mobile-first Progressive Web App (PWA) that helps users track daily progress through the "75 Soft" wellness challenge — a 75-day program requiring four daily habits.

### Core Value Proposition
A lightweight, private, family-friendly habit tracker with no account creation. Users get a shared family password gate plus individual PIN-protected profiles, making it suitable for households where multiple people are doing the challenge together.

### Platform
- Web / PWA (installable on iOS Safari, Android Chrome)
- Single-page app, max 480px width layout (mobile-optimized)
- No native app; no app store distribution

---

## 2. Users & Use Cases

### Primary User
An individual or family doing the 75 Soft challenge who wants a simple, privacy-respecting way to log and review daily progress.

### User Segments
| Segment | Description |
|---|---|
| Solo user | One person, one profile, using a personal password |
| Family group | Up to 5 household members, shared password gate, individual PINs |

### Non-Users (Out of Scope)
- General habit tracking (app is hard-coded to 75 Soft rules)
- Social/community features
- Coach or trainer oversight

---

## 3. The 75 Soft Challenge Rules (Domain Context)

Each day for 75 days, users must complete all four tasks:

| Task | Requirement |
|---|---|
| 🏃 Exercise | 45 minutes of any physical activity |
| 💧 Water | Drink 3 liters of water |
| 📖 Read | Read 10 pages of anything |
| 🥗 Eat Well | Balanced meals, maximum 3 alcoholic drinks |

A day is "complete" when all 4 tasks are checked. There is no "restart on failure" mechanic in the current app.

---

## 4. Authentication & Access Model

### Family Password Gate
- A single SHA-256-hashed password is stored in Firebase under `config/site/passwordHash`
- On first load, the user must enter this password
- On success, `gate_passed` is saved to `sessionStorage` — no re-entry required until tab/browser is closed
- Wrong password shows an inline error; no lockout mechanism

### Profile Selection
- After the gate, users see all existing profiles (up to 5)
- Each profile shows: emoji + name + "Day X of 75"
- Selecting a profile requires entering a 4-digit PIN
- Wrong PIN shows shake animation + error; no lockout mechanism
- Current user ID is stored in `sessionStorage.current_user`

### Session Persistence
- Sessions are **tab-scoped** (`sessionStorage`, not `localStorage`)
- Closing the browser requires re-entering the family password and PIN
- No "remember me" functionality

---

## 5. Feature Specifications

### 5.1 Profile Management

**Profile Creation**
- Triggered from the profile selection screen
- Fields: Name (text, max 20 chars), Emoji (picker with 20 options), PIN (4-digit)
- Maximum 5 profiles per family instance
- User ID auto-generated from name + timestamp
- Profile saved to Firebase on creation

**Profile Editing (via Settings)**
- Edit name (text input, max 20 chars)
- Change emoji (grid picker, 24 options shown in settings)
- Change PIN (4-digit, requires entering new PIN twice — no current PIN verification)

**Profile Switching**
- "Switch Profile" button in Settings returns user to profile selection screen
- Clears `sessionStorage.current_user`

---

### 5.2 Today Screen (Daily Tracking)

**Entry State — No Start Date Set**
- Shows a "Ready to begin?" card
- CTA: "Set start date" — navigates to Settings

**Active State — Challenge In Progress**
- **Header:** Personalized greeting + user emoji + "Day X of 75" + current date
- **Progress Bar:** Visual fill showing `(dayNum - 1) / 75 * 100%`
- **Photo Reminder Banner:** Appears on days 1, 45, and 75 with a reminder to take progress photos; dismissible per session
- **4 Task Cards:** One per task (Exercise, Water, Read, Eat Well)
  - Click/tap to toggle completion
  - Completed state: green card background + filled checkmark
  - Incomplete state: default card + empty circle
  - Changes persist immediately to Firebase (`saveDay`)

**Edge Cases**
- Days beyond day 75 show the full 75/75 progress bar; daily tasks still toggleable
- Day 0 (challenge start day): task tracking available

---

### 5.3 Calendar Screen

**75-Day Grid**
- 7-column grid layout displaying all 75 days
- Column headers: S M T W T F S (day-of-week)
- Cells are color-coded:

| Color | Meaning |
|---|---|
| Sage green | All 4 tasks completed |
| Amber | 1–3 tasks completed (partial) |
| Gray | 0 tasks completed (missed day) |
| Faded/muted | Future day (not yet reachable) |
| Lavender border | Today |

- Legend displayed below grid
- Future days are not interactive

**Day Detail Sheet**
- Tapping a past or current day opens a bottom sheet
- Shows: Day number, full date, count ("3/4 tasks"), and individual task status (✅ or ⬜)
- Dismissible by swiping down or tapping the overlay

---

### 5.4 Settings Screen

**Profile Section**
- Edit name (inline text input)
- Change emoji (grid picker)
- Save button → `saveUser()` to Firebase

**Challenge Section**
- Set or change start date (date picker input)
- Save button → `saveUser()` to Firebase

**Security Section**
- Change PIN (4-digit numpad entry)
- No current-PIN verification required

**Account Section**
- "Switch Profile" — returns to profile selection, clears session

---

### 5.5 Navigation

**Bottom Tab Bar** (visible after login)
- ☀️ Today
- 📅 Calendar
- ⚙️ Settings

Active tab is highlighted. Tab bar uses backdrop blur for mobile feel.

---

## 6. Data Model

### Firebase Structure (Cloud Firestore)

```
config/
  site/
    passwordHash: string (SHA-256)

users/
  {userId}/
    name: string
    emoji: string
    pinHash: string (SHA-256)
    startDate: string (YYYY-MM-DD) | ""
    days/
      {YYYY-MM-DD}/
        exercise: boolean
        water: boolean
        reading: boolean
        diet: boolean
```

### Session Storage (Browser, Tab-Scoped)
| Key | Value |
|---|---|
| `gate_passed` | `"true"` after family password verified |
| `current_user` | userId string of logged-in profile |
| `photo_dismissed_{date}_{userId}` | `"true"` after user dismisses photo banner |

---

## 7. Technical Architecture

| Layer | Technology |
|---|---|
| Frontend | Vanilla JavaScript (ES6 modules), HTML5, CSS3 |
| Backend / Database | Firebase Cloud Firestore |
| Auth | Custom SHA-256 password/PIN hashing via Web Crypto API |
| Hosting | Firebase Hosting (assumed) |
| PWA | `manifest.json` + favicon.svg |
| Session | Browser `sessionStorage` |

**Architecture Pattern:** Screen-based, each screen module exports `render()` (HTML template) and `init()` (event binding). `app.js` orchestrates screen transitions.

**No frameworks, no build tools, no npm dependencies** beyond the Firebase SDK (v10.12.2 loaded via CDN).

---

## 8. Design System Summary

**Color Tokens**
| Role | Color |
|---|---|
| Primary (completed, CTA) | Sage green `#A8C5A0` |
| Secondary (progress, focus) | Lavender `#D4B8E0` |
| Warning (partial) | Amber `#F2C97D` |
| Background | Off-white / light gray |

**Key UI Patterns**
- Cards with rounded corners for all content
- Bottom sheets (slide-up) for detail views and edit flows
- 4-dot PIN display with shake animation on error
- `fadeUp` entrance animation (staggered 40ms per item)
- Mobile-safe area insets for notch/home bar

---

## 9. Known Constraints & Limitations

| Constraint | Detail |
|---|---|
| Max profiles | 5 per Firebase instance |
| PIN security | No lockout after failed attempts |
| Session scope | Tab-only; browser close requires full re-auth |
| Photo tracking | Reminder UI only; no actual photo upload/storage |
| No offline support | No service worker; requires network connection |
| No data deletion | No delete account / reset challenge option in UI |
| Single instance | One Firebase project = one family; no multi-tenant |
| No push notifications | No reminders to complete daily tasks |

---

## 10. File Map (Critical Files)

| File | Purpose |
|---|---|
| `index.html` | Single page entry point |
| `app.js` | Screen router and app orchestration |
| `firebase.js` | All Firestore read/write functions |
| `config.js` | Firebase project credentials |
| `style.css` | Complete design system (CSS custom properties) |
| `screens/gate.js` | Family password screen |
| `screens/profiles.js` | Profile selection + creation |
| `screens/today.js` | Daily task tracking |
| `screens/calendar.js` | 75-day calendar view |
| `screens/settings.js` | User settings |
| `utils/dates.js` | Date arithmetic (day number calculations) |
| `utils/hash.js` | SHA-256 hashing utility |
| `manifest.json` | PWA manifest |
