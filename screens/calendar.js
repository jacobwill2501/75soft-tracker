import { getAllDays, getDay, getUser, saveDay } from '../firebase.js';
import { todayStr, dateForDay, getDayNumber, formatDateLabel } from '../utils/dates.js';

const TASKS = [
  { key: 'exercise', icon: '🏃', name: 'Exercise' },
  { key: 'water',    icon: '💧', name: 'Water' },
  { key: 'reading',  icon: '📖', name: 'Read' },
  { key: 'diet',     icon: '🥗', name: 'Eat Well' },
  { key: 'sleep',    icon: '😴', name: 'Sleep' },
];

let currentUserId = null;
let currentUser   = null;
let allDays       = {};
let sheetData     = {};
let sheetDateStr  = null;

export async function renderCalendar(userId, { showTopBar = true } = {}) {
  currentUserId = userId;
  currentUser   = await getUser(userId);
  allDays       = await getAllDays(userId);
  return buildHTML(showTopBar);
}

function buildHTML(showTopBar = true) {
  if (!currentUser.startDate) {
    return `
      ${showTopBar ? `<div class="top-bar"><div></div><span class="top-bar__title">Calendar</span><div></div></div>` : ''}
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
    ${showTopBar ? `<div class="top-bar"><div></div><span class="top-bar__title">75 Days</span><div></div></div>` : ''}
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

export function initCalendar(readOnly = false) {
  document.querySelectorAll('.cal-cell:not(.future)').forEach(cell => {
    cell.addEventListener('click', () => openDaySheet(cell.dataset.day, cell.dataset.date, readOnly));
  });

  document.getElementById('cal-overlay')?.addEventListener('click', e => {
    if (e.target === e.currentTarget) closeDaySheet();
  });
}

async function openDaySheet(dayNum, dateStr, readOnly = false) {
  const data = allDays[dateStr] || { exercise: false, water: false, reading: false, diet: false, sleep: false };
  sheetData    = { ...data };
  sheetDateStr = dateStr;
  const doneCount = Object.values(sheetData).filter(Boolean).length;

  const rows = TASKS.map(t => `
    <div class="sheet-task-row" data-task="${t.key}" ${readOnly ? '' : 'role="button" tabindex="0" style="cursor:pointer;"'}>
      <span class="sheet-task-icon">${t.icon}</span>
      <span class="sheet-task-name">${t.name}</span>
      <span class="sheet-task-status">${sheetData[t.key] ? '✅' : '⬜'}</span>
    </div>
  `).join('');

  document.getElementById('cal-sheet-content').innerHTML = `
    <div class="sheet-day-header">Day ${dayNum}</div>
    <div class="sheet-day-sub">${formatDateLabel(dateStr)} · ${doneCount}/5 tasks</div>
    ${rows}
  `;

  if (!readOnly) {
    document.querySelectorAll('.sheet-task-row[data-task]').forEach(row => {
      row.addEventListener('click', () => toggleSheetTask(row.dataset.task));
    });
  }

  const overlay = document.getElementById('cal-overlay');
  const sheet   = document.getElementById('cal-sheet');
  overlay.classList.add('open');
  setTimeout(() => sheet.classList.add('open'), 10);
}

async function toggleSheetTask(taskKey) {
  sheetData[taskKey] = !sheetData[taskKey];

  const row = document.querySelector(`.sheet-task-row[data-task="${taskKey}"]`);
  row.querySelector('.sheet-task-status').textContent = sheetData[taskKey] ? '✅' : '⬜';

  const doneCount = Object.values(sheetData).filter(Boolean).length;
  document.querySelector('.sheet-day-sub').textContent =
    `${formatDateLabel(sheetDateStr)} · ${doneCount}/5 tasks`;

  await saveDay(currentUserId, sheetDateStr, sheetData);

  allDays[sheetDateStr] = { ...sheetData };
  const cell = document.querySelector(`.cal-cell[data-date="${sheetDateStr}"]`);
  if (cell) {
    cell.classList.remove('done', 'partial');
    if (doneCount === 5) cell.classList.add('done');
    else if (doneCount > 0) cell.classList.add('partial');
  }
}

function closeDaySheet() {
  const overlay = document.getElementById('cal-overlay');
  const sheet   = document.getElementById('cal-sheet');
  sheet.classList.remove('open');
  setTimeout(() => overlay.classList.remove('open'), 350);
}
