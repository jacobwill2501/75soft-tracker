import { renderGate, initGate }           from './screens/gate.js';
import { renderProfiles, initProfiles }   from './screens/profiles.js';
import { renderToday, initToday }         from './screens/today.js';
import { renderCalendar, initCalendar }   from './screens/calendar.js';
import { renderSettings, initSettings }  from './screens/settings.js';

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
  document.getElementById('bottom-nav').style.display = 'none';
  initGate(async () => {
    await showProfiles();
  });
}

// ── Profiles ──────────────────────────────────────────────────

async function showProfiles() {
  document.getElementById('bottom-nav').style.display = 'none';
  app.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;min-height:100dvh;font-size:2rem;">🌿</div>';
  const html = await renderProfiles();
  app.innerHTML = html;
  initProfiles(async (userId) => {
    await showMain(userId, 'today');
  });
}

// ── Main (Today / Calendar / Settings) ────────────────────────

async function showMain(userId, tab) {
  activeTab = tab;
  document.getElementById('bottom-nav').style.display = 'flex';
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

  // Settings button (top-right) — only on today/calendar
  const settingsBtn = document.getElementById('settings-btn');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => showMain(userId, 'settings'));
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
  const userId = sessionStorage.getItem('current_user');
  if (userId && tab.dataset.tab !== activeTab) {
    showMain(userId, tab.dataset.tab);
  }
});

// ── Start ─────────────────────────────────────────────────────
boot();
