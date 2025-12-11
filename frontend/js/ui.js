// frontend-bootstrap/js/ui.js
// UI helpers: toasts, loading overlays, form helpers, date & currency utilities.

// Toast utilities -----------------------------------------------------------

export function showToast(message, variant = 'primary') {
  const containerId = 'toast-container';
  let container = document.getElementById(containerId);
  if (!container) {
    container = document.createElement('div');
    container.id = containerId;
    container.className = 'toast-container position-fixed top-0 end-0 p-3';
    document.body.appendChild(container);
  }

  const wrapper = document.createElement('div');
  wrapper.className = `toast align-items-center text-bg-${variant} border-0`;
  wrapper.setAttribute('role', 'status');
  wrapper.setAttribute('aria-live', 'polite');
  wrapper.setAttribute('aria-atomic', 'true');

  wrapper.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">
        ${message}
      </div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
  `;

  container.appendChild(wrapper);
  const toast = new bootstrap.Toast(wrapper, { delay: 4000 });
  toast.show();
}

export function showErrorToast(error) {
  const message = typeof error === 'string' ? error : error.message || 'Something went wrong.';
  showToast(message, 'danger');
}

// Loading overlay -----------------------------------------------------------

let overlayCount = 0;

export function showLoading() {
  overlayCount += 1;
  let overlay = document.getElementById('global-loading-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'global-loading-overlay';
    overlay.className = 'global-loading-overlay d-flex align-items-center justify-content-center';
    overlay.innerHTML = `
      <div class="spinner-border text-primary" role="status" aria-label="Loading">
        <span class="visually-hidden">Loading...</span>
      </div>
    `;
    document.body.appendChild(overlay);
  }
  overlay.classList.add('show');
}

export function hideLoading() {
  overlayCount = Math.max(0, overlayCount - 1);
  const overlay = document.getElementById('global-loading-overlay');
  if (overlay && overlayCount === 0) {
    overlay.classList.remove('show');
  }
}

// Form & input helpers ------------------------------------------------------

export function attachPhoneMask(input) {
  if (!input) return;
  input.setAttribute('inputmode', 'numeric');
  input.setAttribute('maxlength', '10');

  input.addEventListener('input', () => {
    const digits = input.value.replace(/\D/g, '').slice(0, 10);
    input.value = digits;
  });
}

export function setFieldError(input, message) {
  const feedbackId = `${input.id || 'field'}-feedback`;
  let feedback = document.getElementById(feedbackId);
  if (!feedback) {
    feedback = document.createElement('div');
    feedback.id = feedbackId;
    feedback.className = 'invalid-feedback';
    input.insertAdjacentElement('afterend', feedback);
  }
  input.classList.add('is-invalid');
  feedback.textContent = message || '';
}

export function clearFieldError(input) {
  input.classList.remove('is-invalid');
}

export function clearFormErrors(form) {
  form.querySelectorAll('.is-invalid').forEach((el) => el.classList.remove('is-invalid'));
}

// Date & formatting helpers -------------------------------------------------

export function toISODate(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

export function computeInclusiveDays(startStr, endStr) {
  if (!startStr || !endStr) return null;
  const start = new Date(startStr);
  const end = new Date(endStr);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  const diffMs = end - start;
  const days = diffMs / (1000 * 60 * 60 * 24) + 1;
  return days > 0 ? days : null;
}

export function formatCurrency(value) {
  const num = Number(value) || 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(num);
}

export function maskPhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length <= 4) return digits;
  const last4 = digits.slice(-4);
  return `••••••${last4}`;
}

export function handleServerValidationErrors(error, fieldMap = {}) {
  if (!error || !error.data || typeof error.data !== 'object') return;
  Object.entries(error.data).forEach(([field, messages]) => {
    const input = fieldMap[field];
    if (!input) return;
    const message = Array.isArray(messages) ? messages.join(' ') : String(messages);
    setFieldError(input, message);
  });
}
