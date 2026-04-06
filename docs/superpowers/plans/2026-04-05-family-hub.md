# Family Hub Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Family Hub screen and persistent bottom nav so any family member can view any other profile's full read-only 75-day calendar without entering a PIN.

**Architecture:** The existing `bottom-nav` in `index.html` is extended with "Profiles" and "Family Hub" tabs. A CSS class `nav--prelogin` controls which tabs are visible before/after profile login. A new `screens/family.js` renders the hub profile list and dispatches member calendar views. `screens/calendar.js` gains a `readOnly` flag and optional top-bar suppression so its grid can be embedded inside the member view.

**Tech Stack:** Vanilla JS ES modules, Firebase Firestore (existing), CSS custom properties (existing).

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `index.html` | Modify | Add Profiles + Family Hub tabs to nav |
| `style.css` | Modify | Nav pre/post-login visibility; Family Hub list styles |
| `screens/family.js` | Create | Hub profile list; member calendar sub-view dispatch |
| `screens/calendar.js` | Modify | Accept `readOnly` + `showTopBar` options |
| `app.js` | Modify | Pre-login nav state; Family Hub routing; clean up dead `settings-btn` listener |

---

## Task 1: Add nav tabs to `index.html`

**Files:**
- Modify: `index.html:25-38`

- [ ] **Step 1: Replace the 3-tab nav with a 5-tab nav**

Open `index.html`. Replace the entire `<nav>` block (lines 25–38) with:

```html
  <!-- Bottom navigation -->
  <nav class="bottom-nav" id="bottom-nav" style="display:none;">
    <button class="nav-tab" data-tab="profiles">
      <div class="nav-tab__icon">👥</div>
      <span class="nav-tab__label">Profiles</span>
    </button>
    <button class="nav-tab active" data-tab="today">
      <div class="nav-tab__icon">☀️</div>
      <span class="nav-tab__label">Today</span>
    </button>
    <button class="nav-tab" data-tab="calendar">
      <div class="nav-tab__icon">📅</div>
      <span class="nav-tab__label">Calendar</span>
    </button>
    <button class="nav-tab" data-tab="family">
      <div class="nav-tab__icon">🏠</div>
      <span class="nav-tab__label">Family</span>
    </button>
    <button class="nav-tab" data-tab="settings">
      <div class="nav-tab__icon">⚙️</div>
      <span class="nav-tab__label">Settings</span>
    </button>
  </nav>
```

- [ ] **Step 2: Open the app in a browser and confirm the nav renders with 5 tabs (Today active)**

The nav is still hidden at this point (logged-out state), so inspect the DOM to verify the 5 buttons exist.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: add Profiles and Family Hub tabs to bottom nav"
```

---

## Task 2: Add nav visibility CSS and Family Hub styles to `style.css`

**Files:**
- Modify: `style.css`

- [ ] **Step 1: Add pre/post-login nav visibility rules**

Append the following to `style.css` (after the existing `.bottom-nav` and `.nav-tab` rules, before the `@media` block at the end):

```css
/* ============================================================
   Nav state: pre-login shows Profiles + Family only
   ============================================================ */

.bottom-nav.nav--prelogin [data-tab="today"],
.bottom-nav.nav--prelogin [data-tab="calendar"],
.bottom-nav.nav--prelogin [data-tab="settings"] {
  display: none;
}

.bottom-nav:not(.nav--prelogin) [data-tab="profiles"] {
  display: none;
}

/* ============================================================
   Family Hub
   ============================================================ */

.family-hub-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.family-hub-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  background: var(--surface);
  border-radius: var(--radius-lg);
  border: 1.5px solid var(--border);
  cursor: pointer;
  transition: transform 0.1s ease;
}

.family-hub-row:active { transform: scale(0.98); }

.family-hub-row__emoji { font-size: 2rem; line-height: 1; }

.family-hub-row__info { flex: 1; }

.family-hub-row__name {
  font-weight: 600;
  font-size: 1rem;
  color: var(--text-primary);
}

.family-hub-row__day {
  font-size: 0.8125rem;
  color: var(--text-secondary);
  margin-top: 2px;
}

.family-hub-row__chevron {
  color: var(--text-secondary);
  font-size: 1.25rem;
}
```

- [ ] **Step 2: Commit**

```bash
git add style.css
git commit -m "feat: add nav pre/post-login visibility and Family Hub styles"
```

---

## Task 3: Modify `screens/calendar.js` to support read-only mode

**Files:**
- Modify: `screens/calendar.js`

The goal: `renderCalendar(userId, { readOnly, showTopBar })` — when `readOnly: true`, day sheets open but tasks cannot be toggled. When `showTopBar: false`, the `<div class="top-bar">` is omitted so the caller can supply its own.

- [ ] **Step 1: Add `readOnly` module-level variable and update `renderCalendar` signature**

At the top of `screens/calendar.js`, after the existing `let` declarations (line 14–16), add:

```js
let readOnly = false;
```

Replace the `renderCalendar` function signature and first lines (lines 18–22):

```js
export async function renderCalendar(userId, { readOnly: ro = false, showTopBar = true } = {}) {
  readOnly     = ro;
  currentUserId = userId;
  currentUser   = await getUser(userId);
  allDays       = await getAllDays(userId);
  return buildHTML(showTopBar);
}
```

- [ ] **Step 2: Update `buildHTML` to accept `showTopBar` and conditionally render the top bar**

Replace the `buildHTML` function definition line and its two `return` statements:

Old signature:
```js
function buildHTML() {
```

New signature:
```js
function buildHTML(showTopBar = true) {
```

In the "no startDate" early-return block, replace:
```js
  return `
      <div class="top-bar">
        <div></div><span class="top-bar__title">Calendar</span><div></div>
      </div>
      <div class="page-content" style="text-align:center; padding-top:60px;">
        <div style="font-size:3rem; margin-bottom:16px;">📅</div>
        <h3 style="margin-bottom:8px;">No challenge started</h3>
        <p>Set a start date in Settings to see your 75-day calendar.</p>
      </div>
    `;
```

With:
```js
  return `
      ${showTopBar ? `<div class="top-bar"><div></div><span class="top-bar__title">Calendar</span><div></div></div>` : ''}
      <div class="page-content" style="text-align:center; padding-top:60px;">
        <div style="font-size:3rem; margin-bottom:16px;">📅</div>
        <h3 style="margin-bottom:8px;">No challenge started</h3>
        <p>Set a start date in Settings to see your 75-day calendar.</p>
      </div>
    `;
```

In the main return at the end of `buildHTML`, replace:
```js
  return `
    <div class="top-bar">
      <div></div>
      <span class="top-bar__title">75 Days</span>
      <div></div>
    </div>
    <div class="page-content">
```

With:
```js
  return `
    ${showTopBar ? `<div class="top-bar"><div></div><span class="top-bar__title">75 Days</span><div></div></div>` : ''}
    <div class="page-content">
```

- [ ] **Step 3: Update `openDaySheet` to skip toggle handlers when `readOnly` is true**

In `openDaySheet`, the task rows are currently always rendered as interactive. Replace the `rows` template in `openDaySheet` with a version that omits interactivity when read-only:

Find this block inside `openDaySheet` (around line 114):
```js
  const rows = TASKS.map(t => `
    <div class="sheet-task-row" data-task="${t.key}" role="button" tabindex="0" style="cursor:pointer;">
      <span class="sheet-task-icon">${t.icon}</span>
      <span class="sheet-task-name">${t.name}</span>
      <span class="sheet-task-status">${sheetData[t.key] ? '✅' : '⬜'}</span>
    </div>
  `).join('');
```

Replace with:
```js
  const rows = TASKS.map(t => `
    <div class="sheet-task-row" data-task="${t.key}" ${readOnly ? '' : 'role="button" tabindex="0" style="cursor:pointer;"'}>
      <span class="sheet-task-icon">${t.icon}</span>
      <span class="sheet-task-name">${t.name}</span>
      <span class="sheet-task-status">${sheetData[t.key] ? '✅' : '⬜'}</span>
    </div>
  `).join('');
```

Then find the block that attaches toggle click handlers (after the `innerHTML` assignment):
```js
  document.querySelectorAll('.sheet-task-row[data-task]').forEach(row => {
    row.addEventListener('click', () => toggleSheetTask(row.dataset.task));
  });
```

Replace with:
```js
  if (!readOnly) {
    document.querySelectorAll('.sheet-task-row[data-task]').forEach(row => {
      row.addEventListener('click', () => toggleSheetTask(row.dataset.task));
    });
  }
```

- [ ] **Step 4: Verify the existing calendar still works (no regression)**

Load the app, log in with a profile, navigate to Calendar. Tap a day cell — the sheet should open and tasks should still be togglable. Check that nothing is broken.

- [ ] **Step 5: Commit**

```bash
git add screens/calendar.js
git commit -m "feat: add readOnly and showTopBar options to renderCalendar"
```

---

## Task 4: Create `screens/family.js`

**Files:**
- Create: `screens/family.js`

- [ ] **Step 1: Write `screens/family.js`**

Create `/Users/jacwilliams/Desktop/Coding/75soft-tracker/screens/family.js` with this content:

```js
import { getAllUsers } from '../firebase.js';
import { getDayNumber } from '../utils/dates.js';

let users = [];

export async function renderFamilyHub() {
  users = await getAllUsers();
  return buildHubHTML();
}

function buildHubHTML() {
  if (!users.length) {
    return `
      <div class="top-bar">
        <div></div>
        <span class="top-bar__title">Family Hub</span>
        <div></div>
      </div>
      <div class="page-content" style="text-align:center; padding-top:60px;">
        <p>No profiles yet.</p>
      </div>
    `;
  }

  const rows = users.map(u => {
    const day = u.startDate ? getDayNumber(u.startDate) : null;
    const dayLabel = day ? `Day ${day} of 75` : 'Not started';
    return `
      <div class="family-hub-row animate-in" data-id="${u.id}">
        <span class="family-hub-row__emoji">${u.emoji}</span>
        <div class="family-hub-row__info">
          <div class="family-hub-row__name">${u.name}</div>
          <div class="family-hub-row__day">${dayLabel}</div>
        </div>
        <span class="family-hub-row__chevron">›</span>
      </div>
    `;
  }).join('');

  return `
    <div class="top-bar">
      <div></div>
      <span class="top-bar__title">Family Hub</span>
      <div></div>
    </div>
    <div class="page-content">
      <div class="family-hub-list">${rows}</div>
    </div>
  `;
}

export function initFamilyHub(onViewMember) {
  document.querySelectorAll('.family-hub-row[data-id]').forEach(row => {
    const user = users.find(u => u.id === row.dataset.id);
    row.addEventListener('click', () => onViewMember(user));
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add screens/family.js
git commit -m "feat: create Family Hub screen"
```

---

## Task 5: Update `app.js` — routing, nav state, Family Hub integration

**Files:**
- Modify: `app.js`

- [ ] **Step 1: Add the `renderFamilyHub` and `initFamilyHub` imports**

At the top of `app.js`, after the existing imports (line 5), add:

```js
import { renderFamilyHub, initFamilyHub } from './screens/family.js';
import { renderCalendar, initCalendar }   from './screens/calendar.js';
```

Wait — `renderCalendar` and `initCalendar` are already imported on line 4. Do not add a duplicate import for them. Only add the `family.js` import:

```js
import { renderFamilyHub, initFamilyHub } from './screens/family.js';
```

Add this after line 5 (after the `renderSettings` import).

- [ ] **Step 2: Add `showFamilyHub` function**

After the `showProfiles` function (after line 45), add:

```js
// ── Family Hub ────────────────────────────────────────────────

async function showFamilyHub() {
  updateNavTabs('family');
  app.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;min-height:100dvh;font-size:2rem;">🌿</div>';
  const html = await renderFamilyHub();
  app.innerHTML = html;
  initFamilyHub(async (user) => {
    await showFamilyMemberCalendar(user);
  });
}

async function showFamilyMemberCalendar(user) {
  app.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;min-height:100dvh;font-size:2rem;">🌿</div>';
  const calHTML = await renderCalendar(user.id, { readOnly: true, showTopBar: false });
  app.innerHTML = `
    <div class="top-bar">
      <button class="top-bar__action" id="family-back-btn">‹</button>
      <span class="top-bar__title">${user.emoji} ${user.name}</span>
      <div></div>
    </div>
    ${calHTML}
  `;
  initCalendar();
  document.getElementById('family-back-btn').addEventListener('click', () => showFamilyHub());
}
```

- [ ] **Step 3: Update `showProfiles` to show the nav in pre-login state**

Replace the current `showProfiles` function (lines 37–45):

```js
async function showProfiles() {
  const nav = document.getElementById('bottom-nav');
  nav.classList.add('nav--prelogin');
  nav.style.display = 'flex';
  updateNavTabs('profiles');
  app.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;min-height:100dvh;font-size:2rem;">🌿</div>';
  const html = await renderProfiles();
  app.innerHTML = html;
  initProfiles(async (userId) => {
    await showMain(userId, 'today');
  });
}
```

- [ ] **Step 4: Update `showMain` to remove the pre-login nav class**

Replace the current `showMain` function's first lines. Find:

```js
async function showMain(userId, tab) {
  activeTab = tab;
  document.getElementById('bottom-nav').style.display = 'flex';
  updateNavTabs(tab);
```

Replace with:

```js
async function showMain(userId, tab) {
  activeTab = tab;
  const nav = document.getElementById('bottom-nav');
  nav.classList.remove('nav--prelogin');
  nav.style.display = 'flex';
  updateNavTabs(tab);
```

- [ ] **Step 5: Update `showGate` to ensure nav is hidden with correct class state**

The gate hides the nav. Find:

```js
async function showGate() {
  app.innerHTML = renderGate();
  document.getElementById('bottom-nav').style.display = 'none';
```

Replace with:

```js
async function showGate() {
  app.innerHTML = renderGate();
  const nav = document.getElementById('bottom-nav');
  nav.style.display = 'none';
  nav.classList.remove('nav--prelogin');
```

- [ ] **Step 6: Update the nav click handler to handle `family` and `profiles` tabs**

Replace the existing nav click handler (lines 86–93):

```js
document.getElementById('bottom-nav').addEventListener('click', e => {
  const tab = e.target.closest('.nav-tab');
  if (!tab) return;
  const tabName = tab.dataset.tab;
  const userId = sessionStorage.getItem('current_user');

  if (tabName === 'family') {
    showFamilyHub();
    return;
  }
  if (tabName === 'profiles') {
    sessionStorage.removeItem('current_user');
    showProfiles();
    return;
  }
  if (userId && tabName !== activeTab) {
    showMain(userId, tabName);
  }
});
```

- [ ] **Step 7: Remove the dead `settings-btn` listener**

Find and remove these lines from `showMain` (currently lines 71–75):

```js
  // Settings button (top-right) — only on today/calendar
  const settingsBtn = document.getElementById('settings-btn');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => showMain(userId, 'settings'));
  }
```

- [ ] **Step 8: Commit**

```bash
git add app.js
git commit -m "feat: wire Family Hub routing and pre-login nav state in app.js"
```

---

## Task 6: End-to-end verification

- [ ] **Step 1: Load the app and pass the family password gate**

Expected: Bottom nav appears with **Profiles** and **Family** tabs only (Today, Calendar, Settings hidden).

- [ ] **Step 2: Tap the Family tab**

Expected: Family Hub screen loads showing all profiles with emoji, name, and day number. No PIN prompt.

- [ ] **Step 3: Tap a profile in the Family Hub**

Expected: Read-only calendar opens for that profile. Top bar shows `‹ [emoji] [name]`. The 75-day grid displays their data.

- [ ] **Step 4: Tap a past day cell**

Expected: Day detail sheet opens showing task status icons (✅/⬜). Tasks are NOT tappable/togglable.

- [ ] **Step 5: Tap the back button (`‹`)**

Expected: Returns to Family Hub profile list.

- [ ] **Step 6: Tap the Profiles tab**

Expected: Returns to the profiles screen (pre-login state). Nav still shows Profiles + Family only.

- [ ] **Step 7: Select a profile and enter the correct PIN**

Expected: Nav switches to **Today | Calendar | Family | Settings** (Profiles tab hidden).

- [ ] **Step 8: Tap the Family tab while logged in**

Expected: Family Hub loads. Nav tab highlights Family as active.

- [ ] **Step 9: Tap a profile in the Family Hub (post-login)**

Expected: Read-only calendar opens. Back button returns to Family Hub. Other nav tabs still accessible.

- [ ] **Step 10: Navigate between Today, Calendar, Family, and Settings**

Expected: Active tab highlights correctly on each screen. No broken navigation.
