import { renderGate, initGate }           from './screens/gate.js';
import { renderProfiles, initProfiles }   from './screens/profiles.js';
import { renderToday, initToday }         from './screens/today.js';
import { renderCalendar, initCalendar }   from './screens/calendar.js';
import { renderSettings, initSettings }  from './screens/settings.js';
import { renderFamilyHub, initFamilyHub } from './screens/family.js';
import { escapeHTML }                     from './utils/html.js';

const app = document.getElementById('app');
let activeTab = 'today';

// ── Boot ──────────────────────────────────────────────────────

async function boot() {
  if (!sessionStorage.getItem('gate_passed')) {
    await showGate();
    return;
  }
  const userId = sessionStorage.getItem('current_user');
  if (!userId) {
    await showProfiles();
    return;
  }
  await showMain(userId, 'today');
}

// ── Gate ──────────────────────────────────────────────────────

async function showGate() {
  app.innerHTML = renderGate();
  const nav = document.getElementById('bottom-nav');
  nav.style.display = 'none';
  nav.classList.remove('nav--prelogin');
  initGate(async () => {
    await showProfiles();
  });
}

// ── Profiles ──────────────────────────────────────────────────

async function showProfiles() {
  activeTab = 'profiles';
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

// ── Family Hub ────────────────────────────────────────────────

async function showFamilyHub() {
  activeTab = 'family';
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
  const calHTML = await renderCalendar(user.id, { showTopBar: false });
  app.innerHTML = `
    <div class="top-bar">
      <button class="top-bar__action" id="family-back-btn">‹</button>
      <span class="top-bar__title">${escapeHTML(user.emoji)} ${escapeHTML(user.name)}</span>
      <div></div>
    </div>
    ${calHTML}
  `;
  initCalendar(true);
  document.getElementById('family-back-btn').addEventListener('click', () => showFamilyHub());
}

// ── Main (Today / Calendar / Settings) ────────────────────────

async function showMain(userId, tab) {
  activeTab = tab;
  const nav = document.getElementById('bottom-nav');
  nav.classList.remove('nav--prelogin');
  nav.style.display = 'flex';
  updateNavTabs(tab);

  app.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;min-height:40dvh;font-size:2rem;padding-top:80px;">🌿</div>';

  let html = '';
  if (tab === 'today') {
    html = await renderToday(userId);
    app.innerHTML = html;
    initToday(t => showMain(userId, t));
  } else if (tab === 'calendar') {
    html = await renderCalendar(userId);
    app.innerHTML = html;
    initCalendar();
  } else if (tab === 'settings') {
    html = await renderSettings(userId);
    app.innerHTML = html;
    initSettings(() => showProfiles());
  }

}

// ── Nav Tabs ──────────────────────────────────────────────────

function updateNavTabs(active) {
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.tab === active);
  });
}

document.getElementById('bottom-nav').addEventListener('click', e => {
  const tab = e.target.closest('.nav-tab');
  if (!tab) return;
  const tabName = tab.dataset.tab;
  const userId = sessionStorage.getItem('current_user');

  if (tabName === 'family') {
    showFamilyHub(); // accessible pre-login by design
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

// ── Start ─────────────────────────────────────────────────────
boot();
