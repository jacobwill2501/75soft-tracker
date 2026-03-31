import { getUser, saveUser } from '../firebase.js';
import { sha256 } from '../utils/hash.js';
import { formatDateLabel, todayStr } from '../utils/dates.js';

const EMOJIS = ['🌸','🌿','🌻','🦋','⭐','🍀','🌙','🌊','🎯','🏃','💪','🧘','🌺','🦄','🎈','🍃','✨','🌈','🔥','🌷'];

let currentUserId = null;
let currentUser   = null;

export async function renderSettings(userId) {
  currentUserId = userId;
  currentUser   = await getUser(userId);
  return buildHTML();
}

function buildHTML() {
  const startLabel = currentUser.startDate
    ? formatDateLabel(currentUser.startDate)
    : 'Not set';

  return `
    <div class="top-bar">
      <div></div>
      <span class="top-bar__title">Settings</span>
      <div></div>
    </div>
    <div class="page-content">

      <div class="settings-section">
        <div class="settings-section-title">Profile</div>
        <div class="settings-row" id="edit-name-btn">
          <span class="settings-row__label">Name</span>
          <span class="settings-row__value">${currentUser.name} ›</span>
        </div>
        <div class="settings-row" id="edit-emoji-btn">
          <span class="settings-row__label">Emoji</span>
          <span class="settings-row__value">${currentUser.emoji} ›</span>
        </div>
      </div>

      <div class="settings-section">
        <div class="settings-section-title">Challenge</div>
        <div class="settings-row" id="edit-start-btn">
          <span class="settings-row__label">Start date</span>
          <span class="settings-row__value">${startLabel} ›</span>
        </div>
      </div>

      <div class="settings-section">
        <div class="settings-section-title">Security</div>
        <div class="settings-row" id="edit-pin-btn">
          <span class="settings-row__label">Change PIN</span>
          <span class="settings-row__value">›</span>
        </div>
      </div>

      <div class="settings-section">
        <div class="settings-section-title">Account</div>
        <div class="settings-row settings-row--danger" id="logout-btn">
          <span class="settings-row__label">Switch profile</span>
          <span class="settings-row__value">›</span>
        </div>
      </div>

    </div>

    <!-- Edit name sheet -->
    <div class="sheet-overlay" id="name-overlay">
      <div class="sheet" id="name-sheet">
        <div class="sheet-handle"></div>
        <h3 style="margin-bottom:20px;">Edit Name</h3>
        <div class="input-group">
          <input class="input" id="name-input" type="text" placeholder="Your name" maxlength="20" autocapitalize="words" />
        </div>
        <button class="btn btn-primary" id="save-name-btn">Save</button>
      </div>
    </div>

    <!-- Edit emoji sheet -->
    <div class="sheet-overlay" id="emoji-overlay">
      <div class="sheet" id="emoji-sheet">
        <div class="sheet-handle"></div>
        <h3 style="margin-bottom:12px;">Choose Emoji</h3>
        <div class="emoji-grid" id="settings-emoji-grid"></div>
        <button class="btn btn-primary mt-4" id="save-emoji-btn">Save</button>
      </div>
    </div>

    <!-- Start date sheet -->
    <div class="sheet-overlay" id="start-overlay">
      <div class="sheet" id="start-sheet">
        <div class="sheet-handle"></div>
        <h3 style="margin-bottom:8px;">Start Date</h3>
        <p style="margin-bottom:20px;">When did (or will) your 75 days begin?</p>
        <div class="input-group">
          <input class="input" id="start-input" type="date" />
        </div>
        <button class="btn btn-primary" id="save-start-btn">Save</button>
      </div>
    </div>

    <!-- Change PIN sheet -->
    <div class="sheet-overlay" id="pin-change-overlay">
      <div class="sheet" id="pin-change-sheet">
        <div class="sheet-handle"></div>
        <div class="center">
          <h3 style="margin-bottom:4px;">New PIN</h3>
          <p style="margin-bottom:0;">Enter a new 4-digit PIN</p>
          <div class="pin-display">
            <div class="pin-dot" id="chpin-dot-0"></div>
            <div class="pin-dot" id="chpin-dot-1"></div>
            <div class="pin-dot" id="chpin-dot-2"></div>
            <div class="pin-dot" id="chpin-dot-3"></div>
          </div>
        </div>
        <div class="numpad" id="chpin-numpad"></div>
        <p class="gate-error" id="chpin-error"></p>
      </div>
    </div>
  `;
}

export function initSettings(onLogout) {
  let selectedEmoji = currentUser.emoji;
  let newPinBuffer  = '';

  // Name
  document.getElementById('edit-name-btn').addEventListener('click', () => {
    document.getElementById('name-input').value = currentUser.name;
    openSheet('name-overlay', 'name-sheet');
  });
  document.getElementById('name-overlay').addEventListener('click', e => { if (e.target === e.currentTarget) closeSheet('name-overlay', 'name-sheet'); });
  document.getElementById('save-name-btn').addEventListener('click', async () => {
    const val = document.getElementById('name-input').value.trim();
    if (!val) return;
    await saveUser(currentUserId, { name: val });
    currentUser.name = val;
    document.querySelector('#edit-name-btn .settings-row__value').textContent = `${val} ›`;
    closeSheet('name-overlay', 'name-sheet');
  });

  // Emoji
  document.getElementById('edit-emoji-btn').addEventListener('click', () => {
    buildSettingsEmojiGrid(selectedEmoji, e => { selectedEmoji = e; });
    openSheet('emoji-overlay', 'emoji-sheet');
  });
  document.getElementById('emoji-overlay').addEventListener('click', e => { if (e.target === e.currentTarget) closeSheet('emoji-overlay', 'emoji-sheet'); });
  document.getElementById('save-emoji-btn').addEventListener('click', async () => {
    await saveUser(currentUserId, { emoji: selectedEmoji });
    currentUser.emoji = selectedEmoji;
    document.querySelector('#edit-emoji-btn .settings-row__value').textContent = `${selectedEmoji} ›`;
    closeSheet('emoji-overlay', 'emoji-sheet');
  });

  // Start date
  document.getElementById('edit-start-btn').addEventListener('click', () => {
    document.getElementById('start-input').value = currentUser.startDate || todayStr();
    openSheet('start-overlay', 'start-sheet');
  });
  document.getElementById('start-overlay').addEventListener('click', e => { if (e.target === e.currentTarget) closeSheet('start-overlay', 'start-sheet'); });
  document.getElementById('save-start-btn').addEventListener('click', async () => {
    const val = document.getElementById('start-input').value;
    if (!val) return;
    await saveUser(currentUserId, { startDate: val });
    currentUser.startDate = val;
    document.querySelector('#edit-start-btn .settings-row__value').textContent = `${formatDateLabel(val)} ›`;
    closeSheet('start-overlay', 'start-sheet');
  });

  // Change PIN
  buildNumpad('chpin-numpad', async key => {
    if (key === 'del') {
      newPinBuffer = newPinBuffer.slice(0, -1);
    } else if (newPinBuffer.length < 4) {
      newPinBuffer += key;
    }
    updateDots('chpin-dot', newPinBuffer.length);
    if (newPinBuffer.length === 4) {
      const hash = await sha256(newPinBuffer);
      await saveUser(currentUserId, { pinHash: hash });
      newPinBuffer = '';
      updateDots('chpin-dot', 0);
      closeSheet('pin-change-overlay', 'pin-change-sheet');
    }
  });
  document.getElementById('edit-pin-btn').addEventListener('click', () => {
    newPinBuffer = '';
    updateDots('chpin-dot', 0);
    openSheet('pin-change-overlay', 'pin-change-sheet');
  });
  document.getElementById('pin-change-overlay').addEventListener('click', e => { if (e.target === e.currentTarget) closeSheet('pin-change-overlay', 'pin-change-sheet'); });

  // Logout
  document.getElementById('logout-btn').addEventListener('click', () => {
    sessionStorage.removeItem('current_user');
    onLogout();
  });
}

function buildSettingsEmojiGrid(current, onChange) {
  const grid = document.getElementById('settings-emoji-grid');
  grid.innerHTML = EMOJIS.map(e => `
    <div class="emoji-option${e === current ? ' selected' : ''}" data-emoji="${e}">${e}</div>
  `).join('');
  grid.querySelectorAll('.emoji-option').forEach(el => {
    el.addEventListener('click', () => {
      onChange(el.dataset.emoji);
      grid.querySelectorAll('.emoji-option').forEach(o => o.classList.remove('selected'));
      el.classList.add('selected');
    });
  });
}

function openSheet(overlayId, sheetId) {
  document.getElementById(overlayId).classList.add('open');
  setTimeout(() => document.getElementById(sheetId).classList.add('open'), 10);
}

function closeSheet(overlayId, sheetId) {
  document.getElementById(sheetId).classList.remove('open');
  setTimeout(() => document.getElementById(overlayId).classList.remove('open'), 350);
}

function updateDots(prefix, count) {
  for (let i = 0; i < 4; i++) {
    const dot = document.getElementById(`${prefix}-${i}`);
    if (dot) dot.classList.toggle('filled', i < count);
  }
}

function buildNumpad(containerId, onKey) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const keys = ['1','2','3','4','5','6','7','8','9','','0','del'];
  container.innerHTML = keys.map(k => {
    if (k === '') return `<button class="numpad-key empty" disabled></button>`;
    if (k === 'del') return `<button class="numpad-key delete" data-key="del">⌫</button>`;
    return `<button class="numpad-key" data-key="${k}">${k}</button>`;
  }).join('');
  container.querySelectorAll('.numpad-key:not(.empty)').forEach(btn => {
    btn.addEventListener('click', () => onKey(btn.dataset.key));
  });
}
