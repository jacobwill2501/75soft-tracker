import { sha256 } from '../utils/hash.js';
import { getSitePasswordHash } from '../firebase.js';

export function renderGate(onSuccess) {
  return `
    <div class="gate-screen">
      <div class="gate-logo">🌿</div>
      <h1 class="gate-title">75 Soft</h1>
      <p class="gate-sub">Track your 75-day wellness journey.<br>Enter the family password to continue.</p>
      <div class="gate-form">
        <div class="input-group">
          <input
            class="input"
            id="gate-input"
            type="password"
            placeholder="Family password"
            autocomplete="current-password"
            autocapitalize="none"
          />
        </div>
        <button class="btn btn-primary" id="gate-btn">Continue</button>
        <p class="gate-error" id="gate-error"></p>
      </div>
    </div>
  `;
}

export function initGate(onSuccess) {
  const btn   = document.getElementById('gate-btn');
  const input = document.getElementById('gate-input');
  const error = document.getElementById('gate-error');

  async function attempt() {
    const val = input.value.trim();
    if (!val) return;
    btn.disabled = true;
    btn.textContent = '…';
    try {
      const hash   = await sha256(val);
      const stored = await getSitePasswordHash();
      if (stored && hash === stored) {
        sessionStorage.setItem('gate_passed', '1');
        onSuccess();
      } else {
        error.textContent = 'Incorrect password. Try again.';
        input.value = '';
        input.focus();
      }
    } catch (e) {
      error.textContent = 'Something went wrong. Check your connection.';
    } finally {
      btn.disabled = false;
      btn.textContent = 'Continue';
    }
  }

  btn.addEventListener('click', attempt);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') attempt(); });
  setTimeout(() => input.focus(), 100);
}
