import { sha256 } from '../utils/hash.js';
import { getAllUsers, saveUser } from '../firebase.js';
import { getDayNumber } from '../utils/dates.js';

const EMOJIS = ['🌸','🌿','🌻','🦋','⭐','🍀','🌙','🌊','🎯','🏃','💪','🧘','🌺','🦄','🎈','🍃','✨','🌈','🔥','🌷'];

let users = [];
let selectedUser = null;
let pinBuffer = '';
let creatingNew = false;
let newUserData = {};

export async function renderProfiles(onLogin) {
  users = await getAllUsers();
  return buildProfilesHTML();
}

function buildProfilesHTML() {
  const cards = users.map(u => {
    const day = u.startDate ? getDayNumber(u.startDate) : null;
    const dayLabel = day ? `Day ${day} of 75` : 'Not started';
    return `
      <div class="profile-card animate-in" data-id="${u.id}">
        <span class="profile-card__emoji">${u.emoji}</span>
        <span class="profile-card__name">${u.name}</span>
        <span class="profile-card__day">${dayLabel}</span>
      </div>
    `;
  }).join('');

  const addCard = users.length < 5 ? `
    <div class="profile-card profile-card--add animate-in" id="add-profile-btn">
      <span class="profile-card__emoji">➕</span>
      <span class="profile-card__name">Add profile</span>
      <span class="profile-card__day">&nbsp;</span>
    </div>
  ` : '';

  return `
    <div class="top-bar">
      <div></div>
      <span class="top-bar__title">Who's tracking?</span>
      <div></div>
    </div>
    <div class="page-content">
      <div class="profiles-grid">${cards}${addCard}</div>
    </div>

    <!-- PIN entry sheet -->
    <div class="sheet-overlay" id="pin-overlay">
      <div class="sheet" id="pin-sheet">
        <div class="sheet-handle"></div>
        <div class="center">
          <div class="today-headline" id="pin-name" style="font-size:1.25rem; margin-bottom:4px;"></div>
          <p id="pin-prompt" style="margin-bottom:0;">Enter your PIN</p>
          <div class="pin-display">
            <div class="pin-dot" id="dot-0"></div>
            <div class="pin-dot" id="dot-1"></div>
            <div class="pin-dot" id="dot-2"></div>
            <div class="pin-dot" id="dot-3"></div>
          </div>
        </div>
        <div class="numpad" id="numpad"></div>
      </div>
    </div>

    <!-- New profile sheet -->
    <div class="sheet-overlay" id="new-profile-overlay">
      <div class="sheet" id="new-profile-sheet">
        <div class="sheet-handle"></div>
        <h3 style="margin-bottom:20px;">New Profile</h3>
        <div class="input-group">
          <label class="input-label">Name</label>
          <input class="input" id="new-name" type="text" placeholder="e.g. Sarah" maxlength="20" autocapitalize="words" />
        </div>
        <div class="input-group">
          <label class="input-label">Choose an emoji</label>
          <div class="emoji-grid" id="emoji-grid"></div>
        </div>
        <div class="input-group">
          <label class="input-label">Set a 4-digit PIN</label>
          <div class="pin-display" style="justify-content:flex-start; gap:10px; margin:12px 0;">
            <div class="pin-dot" id="new-dot-0"></div>
            <div class="pin-dot" id="new-dot-1"></div>
            <div class="pin-dot" id="new-dot-2"></div>
            <div class="pin-dot" id="new-dot-3"></div>
          </div>
          <div class="numpad" id="new-numpad" style="max-width:240px;"></div>
        </div>
        <button class="btn btn-primary mt-4" id="save-profile-btn">Create Profile</button>
        <p class="gate-error" id="new-profile-error"></p>
      </div>
    </div>
  `;
}

export function initProfiles(onLogin) {
  // Profile tap
  document.querySelectorAll('.profile-card[data-id]').forEach(card => {
    card.addEventListener('click', () => openPinSheet(card.dataset.id, onLogin));
  });

  // Add profile
  const addBtn = document.getElementById('add-profile-btn');
  if (addBtn) addBtn.addEventListener('click', openNewProfileSheet);

  buildNumpad('numpad', handlePinKey);
  buildNumpad('new-numpad', handleNewPinKey);
  buildEmojiGrid();

  // Close sheets on overlay click
  document.getElementById('pin-overlay').addEventListener('click', e => {
    if (e.target === e.currentTarget) closePinSheet();
  });
  document.getElementById('new-profile-overlay').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeNewProfileSheet();
  });

  document.getElementById('save-profile-btn').addEventListener('click', saveNewProfile);
}

// ── PIN Sheet ─────────────────────────────────────────────────

function openPinSheet(userId, onLogin) {
  selectedUser = users.find(u => u.id === userId);
  pinBuffer = '';
  updateDots('dot', 0);
  document.getElementById('pin-name').textContent = `${selectedUser.emoji} ${selectedUser.name}`;

  const overlay = document.getElementById('pin-overlay');
  const sheet   = document.getElementById('pin-sheet');
  overlay.classList.add('open');
  setTimeout(() => sheet.classList.add('open'), 10);

  // Store callback
  initProfiles._onLogin = onLogin;
}

function closePinSheet() {
  const overlay = document.getElementById('pin-overlay');
  const sheet   = document.getElementById('pin-sheet');
  sheet.classList.remove('open');
  setTimeout(() => overlay.classList.remove('open'), 350);
  pinBuffer = '';
  updateDots('dot', 0);
}

async function handlePinKey(key) {
  if (key === 'del') {
    pinBuffer = pinBuffer.slice(0, -1);
  } else if (pinBuffer.length < 4) {
    pinBuffer += key;
  }
  updateDots('dot', pinBuffer.length);

  if (pinBuffer.length === 4) {
    const hash = await sha256(pinBuffer);
    if (hash === selectedUser.pinHash) {
      closePinSheet();
      sessionStorage.setItem('current_user', selectedUser.id);
      initProfiles._onLogin(selectedUser.id);
    } else {
      document.querySelectorAll('#pin-sheet .pin-dot').forEach(d => d.classList.add('error'));
      setTimeout(() => {
        document.querySelectorAll('#pin-sheet .pin-dot').forEach(d => d.classList.remove('error'));
        pinBuffer = '';
        updateDots('dot', 0);
      }, 600);
    }
  }
}

// ── New Profile Sheet ─────────────────────────────────────────

let newPinBuffer = '';
let selectedEmoji = EMOJIS[0];

function openNewProfileSheet() {
  newPinBuffer = '';
  newUserData = {};
  selectedEmoji = EMOJIS[0];
  document.getElementById('new-name').value = '';
  document.getElementById('new-profile-error').textContent = '';
  updateDots('new-dot', 0);
  document.querySelectorAll('.emoji-option').forEach((el, i) => {
    el.classList.toggle('selected', i === 0);
  });

  const overlay = document.getElementById('new-profile-overlay');
  const sheet   = document.getElementById('new-profile-sheet');
  overlay.classList.add('open');
  setTimeout(() => sheet.classList.add('open'), 10);
}

function closeNewProfileSheet() {
  const overlay = document.getElementById('new-profile-overlay');
  const sheet   = document.getElementById('new-profile-sheet');
  sheet.classList.remove('open');
  setTimeout(() => overlay.classList.remove('open'), 350);
}

function handleNewPinKey(key) {
  if (key === 'del') {
    newPinBuffer = newPinBuffer.slice(0, -1);
  } else if (newPinBuffer.length < 4) {
    newPinBuffer += key;
  }
  updateDots('new-dot', newPinBuffer.length);
}

async function saveNewProfile() {
  const name  = document.getElementById('new-name').value.trim();
  const error = document.getElementById('new-profile-error');
  if (!name) { error.textContent = 'Please enter a name.'; return; }
  if (newPinBuffer.length < 4) { error.textContent = 'Please set a 4-digit PIN.'; return; }

  const id = name.toLowerCase().replace(/[^a-z0-9]/g, '') + '_' + Date.now();
  const pinHash = await sha256(newPinBuffer);

  await saveUser(id, { name, emoji: selectedEmoji, pinHash, startDate: '' });
  closeNewProfileSheet();

  // Reload profiles
  users = await getAllUsers();
  const container = document.getElementById('app');
  const html = await buildProfilesHTML();
  // Re-render the profile section only
  const grid = document.querySelector('.profiles-grid');
  if (grid) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    grid.replaceWith(tmp.querySelector('.profiles-grid'));
    initProfiles(initProfiles._onLogin);
  }
}

function buildEmojiGrid() {
  const grid = document.getElementById('emoji-grid');
  if (!grid) return;
  grid.innerHTML = EMOJIS.map((e, i) => `
    <div class="emoji-option${i === 0 ? ' selected' : ''}" data-emoji="${e}">${e}</div>
  `).join('');
  grid.querySelectorAll('.emoji-option').forEach(el => {
    el.addEventListener('click', () => {
      selectedEmoji = el.dataset.emoji;
      grid.querySelectorAll('.emoji-option').forEach(o => o.classList.remove('selected'));
      el.classList.add('selected');
    });
  });
}

// ── Shared helpers ────────────────────────────────────────────

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
