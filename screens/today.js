import { getDay, saveDay, getUser } from '../firebase.js';
import { todayStr, getDayNumber, greeting, formatDateLabel } from '../utils/dates.js';

const TASKS = [
  { key: 'exercise', icon: '🏃', title: 'Exercise', sub: '45 minutes of activity' },
  { key: 'water',    icon: '💧', title: 'Water',    sub: 'Drink 3 liters today' },
  { key: 'reading',  icon: '📖', title: 'Read',     sub: '10 pages of anything' },
  { key: 'diet',     icon: '🥗', title: 'Eat Well', sub: 'Balanced meals, max 25g added sugar' },
  { key: 'sleep',   icon: '😴', title: 'Sleep',    sub: '8 hours of quality sleep' },
];

const PHOTO_DAYS = [1, 45, 75];

let currentUserId = null;
let currentUser   = null;
let todayData     = {};

export async function renderToday(userId) {
  currentUserId = userId;
  currentUser   = await getUser(userId);
  const today   = todayStr();
  todayData     = await getDay(userId, today);
  return buildHTML();
}

function buildHTML() {
  const today  = todayStr();
  const dayNum = currentUser.startDate ? getDayNumber(currentUser.startDate) : null;
  const pct    = dayNum ? Math.round(((dayNum - 1) / 75) * 100) : 0;

  // Photo reminder check
  const dismissed = sessionStorage.getItem(`photo_dismissed_${today}_${currentUserId}`);
  const showPhoto = dayNum && PHOTO_DAYS.includes(dayNum) && !dismissed;

  const taskCards = TASKS.map(t => `
    <div class="task-card animate-in${todayData[t.key] ? ' done' : ''}" data-task="${t.key}">
      <div class="task-card__icon">${t.icon}</div>
      <div class="task-card__body">
        <div class="task-card__title">${t.title}</div>
        <div class="task-card__sub">${t.sub}</div>
      </div>
      <div class="task-card__check">${todayData[t.key] ? '✓' : ''}</div>
    </div>
  `).join('');

  const photoBanner = showPhoto ? `
    <div class="photo-banner animate-in" id="photo-banner">
      <span class="photo-banner__icon">📸</span>
      <div class="photo-banner__body">
        <div class="photo-banner__title">Progress photo reminder!</div>
        <div class="photo-banner__sub">Day ${dayNum} — snap a photo to document your journey.</div>
      </div>
      <button class="photo-banner__close" id="photo-dismiss">✕</button>
    </div>
  ` : '';

  const notStarted = !currentUser.startDate ? `
    <div class="card animate-in" style="text-align:center; padding:28px 20px;">
      <div style="font-size:2.5rem; margin-bottom:12px;">🌿</div>
      <h3 style="margin-bottom:6px;">Ready to begin?</h3>
      <p style="margin-bottom:20px;">Set your start date to kick off your 75 days.</p>
      <button class="btn btn-primary" id="set-start-btn">Set start date</button>
    </div>
  ` : '';

  return `
    <div class="today-header">
      <div class="today-greeting">${greeting()}, ${currentUser.name} ${currentUser.emoji}</div>
      <div class="today-headline">${dayNum ? `Day ${dayNum} <span style="color:var(--text-secondary);font-size:1.25rem;">of 75</span>` : 'Not started'}</div>
      <div class="today-date">${formatDateLabel(todayStr())}</div>
    </div>

    ${dayNum ? `
    <div class="progress-section animate-in">
      <div class="progress-header">
        <span class="progress-day">Overall progress</span>
        <span class="progress-pct">${pct}%</span>
      </div>
      <div class="progress-track">
        <div class="progress-fill" style="width:${pct}%"></div>
      </div>
    </div>
    ` : ''}

    <div class="page-content">
      ${photoBanner}
      ${notStarted}
      ${dayNum ? `<div class="stack">${taskCards}</div>` : ''}
    </div>
  `;
}

export function initToday(onNavigate) {
  // Task toggle
  document.querySelectorAll('.task-card[data-task]').forEach(card => {
    card.addEventListener('click', () => toggleTask(card.dataset.task));
  });

  // Photo dismiss
  const dismissBtn = document.getElementById('photo-dismiss');
  if (dismissBtn) {
    dismissBtn.addEventListener('click', () => {
      sessionStorage.setItem(`photo_dismissed_${todayStr()}_${currentUserId}`, '1');
      document.getElementById('photo-banner')?.remove();
    });
  }

  // Start date button
  const startBtn = document.getElementById('set-start-btn');
  if (startBtn) startBtn.addEventListener('click', () => onNavigate('settings'));
}

async function toggleTask(taskKey) {
  todayData[taskKey] = !todayData[taskKey];
  const card  = document.querySelector(`.task-card[data-task="${taskKey}"]`);
  const check = card?.querySelector('.task-card__check');
  if (card)  card.classList.toggle('done', todayData[taskKey]);
  if (check) check.textContent = todayData[taskKey] ? '✓' : '';
  await saveDay(currentUserId, todayStr(), todayData);
}
