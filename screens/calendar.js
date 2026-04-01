import { getAllDays, getDay, getUser } from '../firebase.js';
import { todayStr, dateForDay, getDayNumber, formatDateLabel } from '../utils/dates.js';

const TASKS = [
  { key: 'exercise', icon: '🏃', name: 'Exercise' },
  { key: 'water',    icon: '💧', name: 'Water' },
  { key: 'reading',  icon: '📖', name: 'Read' },
  { key: 'diet',     icon: '🥗', name: 'Eat Well' },
];

let currentUserId = null;
let currentUser   = null;
let allDays       = {};

export async function renderCalendar(userId) {
  currentUserId = userId;
  currentUser   = await getUser(userId);
  allDays       = await getAllDays(userId);
  return buildHTML();
}

function buildHTML() {
  if (!currentUser.startDate) {
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
  }

  const today  = todayStr();
  const dayNum = getDayNumber(currentUser.startDate) || 0;

  const cells = Array.from({ length: 75 }, (_, i) => {
    const n       = i + 1;
    const dateStr = dateForDay(currentUser.startDate, n);
    const data    = allDays[dateStr];
    const isPast  = dateStr < today;
    const isToday = dateStr === today;
    const isFuture = dateStr > today;

    let cls = 'cal-cell';
    if (isFuture) {
      cls += ' future';
    } else if (data) {
      const done = Object.values(data).filter(Boolean).length;
      if (done === 5) cls += ' done';
      else if (done > 0) cls += ' partial';
    }
    if (isToday) cls += ' today';

    return `<div class="${cls}" data-day="${n}" data-date="${dateStr}" ${isFuture ? '' : 'role="button" tabindex="0"'}>${n}</div>`;
  }).join('');

  return `
    <div class="top-bar">
      <div></div>
      <span class="top-bar__title">75 Days</span>
      <div></div>
    </div>
    <div class="page-content">
      <!-- Legend -->
      <div style="display:flex; gap:12px; margin-bottom:16px; flex-wrap:wrap;">
        <div style="display:flex;align-items:center;gap:6px;font-size:0.8125rem;color:var(--text-secondary);">
          <div style="width:14px;height:14px;border-radius:4px;background:var(--sage-light);border:1.5px solid var(--sage);"></div> All done
        </div>
        <div style="display:flex;align-items:center;gap:6px;font-size:0.8125rem;color:var(--text-secondary);">
          <div style="width:14px;height:14px;border-radius:4px;background:var(--amber-light);border:1.5px solid var(--amber);"></div> Partial
        </div>
        <div style="display:flex;align-items:center;gap:6px;font-size:0.8125rem;color:var(--text-secondary);">
          <div style="width:14px;height:14px;border-radius:4px;background:var(--border);"></div> Missed
        </div>
      </div>

      <div class="calendar-grid">${cells}</div>

      <p class="text-sm text-muted mt-4 center">Day ${Math.min(dayNum, 75)} of 75 complete</p>
    </div>

    <!-- Day detail sheet -->
    <div class="sheet-overlay" id="cal-overlay">
      <div class="sheet" id="cal-sheet">
        <div class="sheet-handle"></div>
        <div id="cal-sheet-content"></div>
      </div>
    </div>
  `;
}

export function initCalendar() {
  document.querySelectorAll('.cal-cell:not(.future)').forEach(cell => {
    cell.addEventListener('click', () => openDaySheet(cell.dataset.day, cell.dataset.date));
  });

  document.getElementById('cal-overlay')?.addEventListener('click', e => {
    if (e.target === e.currentTarget) closeDaySheet();
  });
}

async function openDaySheet(dayNum, dateStr) {
  const data = allDays[dateStr] || { exercise: false, water: false, reading: false, diet: false };
  const doneCount = Object.values(data).filter(Boolean).length;

  const rows = TASKS.map(t => `
    <div class="sheet-task-row">
      <span class="sheet-task-icon">${t.icon}</span>
      <span class="sheet-task-name">${t.name}</span>
      <span class="sheet-task-status">${data[t.key] ? '✅' : '⬜'}</span>
    </div>
  `).join('');

  document.getElementById('cal-sheet-content').innerHTML = `
    <div class="sheet-day-header">Day ${dayNum}</div>
    <div class="sheet-day-sub">${formatDateLabel(dateStr)} · ${doneCount}/4 tasks</div>
    ${rows}
  `;

  const overlay = document.getElementById('cal-overlay');
  const sheet   = document.getElementById('cal-sheet');
  overlay.classList.add('open');
  setTimeout(() => sheet.classList.add('open'), 10);
}

function closeDaySheet() {
  const overlay = document.getElementById('cal-overlay');
  const sheet   = document.getElementById('cal-sheet');
  sheet.classList.remove('open');
  setTimeout(() => overlay.classList.remove('open'), 350);
}
