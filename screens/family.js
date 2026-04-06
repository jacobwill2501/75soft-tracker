import { getAllUsers } from '../firebase.js';
import { getDayNumber } from '../utils/dates.js';
import { escapeHTML } from '../utils/html.js';

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
        <span class="family-hub-row__emoji">${escapeHTML(u.emoji)}</span>
        <div class="family-hub-row__info">
          <div class="family-hub-row__name">${escapeHTML(u.name)}</div>
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
