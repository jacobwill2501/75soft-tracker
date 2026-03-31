// Returns today's date as YYYY-MM-DD in local time
export function todayStr() {
  const d = new Date();
  return localDateStr(d);
}

// Formats any Date as YYYY-MM-DD in local time
export function localDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Returns "Day N" (1-indexed) given a startDate string (YYYY-MM-DD)
// Returns null if today is before startDate
export function getDayNumber(startDateStr) {
  const start = new Date(startDateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.floor((today - start) / 86400000);
  if (diff < 0) return null;
  return Math.min(diff + 1, 75);
}

// Returns the date string for a given day number (1-indexed)
export function dateForDay(startDateStr, dayNum) {
  const start = new Date(startDateStr + 'T00:00:00');
  start.setDate(start.getDate() + dayNum - 1);
  return localDateStr(start);
}

// Formats a YYYY-MM-DD string as a readable label e.g. "Mon, Mar 31"
export function formatDateLabel(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

// Returns a greeting based on time of day
export function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}
