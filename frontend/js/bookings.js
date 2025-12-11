// frontend-bootstrap/js/bookings.js
// Controller for bookings page: list, create, cancel.

import {
  getBookings,
  createBooking,
  deleteBooking,
  getVehicles,
} from './api.js';
import {
  showToast,
  showErrorToast,
  showLoading,
  hideLoading,
  clearFormErrors,
  setFieldError,
  attachPhoneMask,
  computeInclusiveDays,
  formatCurrency,
  maskPhone,
  handleServerValidationErrors,
} from './ui.js';

let cancelBookingId = null;

function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

async function loadAvailableVehiclesForSelect() {
  const select = document.getElementById('bookingVehicle');
  const preselectId = getQueryParam('vehicle');
  select.innerHTML = '<option value="">Loading...</option>';
  try {
    const res = await getVehicles({ only_available: true });
    const vehicles = res.results || res;
    if (!vehicles.length) {
      select.innerHTML = '<option value="">No available vehicles</option>';
      return;
    }
    select.innerHTML = '<option value="">Select a vehicle</option>';
    vehicles.forEach((v) => {
      const opt = document.createElement('option');
      opt.value = v.id;
      opt.textContent = `${v.brand} ${v.name} (${v.year}) - ${formatCurrency(v.price_per_day)}/day`;
      if (preselectId && Number(preselectId) === v.id) {
        opt.selected = true;
      }
      select.appendChild(opt);
    });
  } catch (error) {
    console.error(error);
    showErrorToast(error);
    select.innerHTML = '<option value="">Error loading vehicles</option>';
  }
}

function renderBookings(bookings) {
  const tbody = document.getElementById('bookingsBody');
  const status = document.getElementById('bookingsStatus');
  tbody.innerHTML = '';
  status.innerHTML = '';

  if (!bookings.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center text-muted py-4">
          No bookings yet. Use the "New Booking" button to create one.
        </td>
      </tr>`;
    return;
  }

  bookings.forEach((b) => {
    const tr = document.createElement('tr');
    const vehicle = b.vehicle_details || {};
    const days = computeInclusiveDays(b.start_date, b.end_date) || '';
    const datesLabel = days
      ? `${b.start_date} – ${b.end_date} (${days} day${days === 1 ? '' : 's'})`
      : `${b.start_date} – ${b.end_date}`;

    tr.innerHTML = `
      <td>${b.customer_name}</td>
      <td>${maskPhone(b.customer_phone)}</td>
      <td>${vehicle.brand || ''} ${vehicle.name || ''}</td>
      <td>${datesLabel}</td>
      <td>${formatCurrency(b.total_amount)}</td>
      <td class="text-end">
        <div class="btn-group btn-group-sm" role="group" aria-label="Booking actions">
          <a href="/booking-detail/?id=${b.id}" class="btn btn-outline-primary">
            Details
          </a>
          <button type="button" class="btn btn-outline-danger" data-id="${b.id}" data-action="cancel">
            Cancel
          </button>
        </div>
      </td>
    `;

    tbody.appendChild(tr);
  });
}

async function loadBookings() {
  showLoading();
  try {
    const res = await getBookings();
    const bookings = res.results || res;
    renderBookings(bookings);
  } catch (error) {
    console.error(error);
    showErrorToast(error);
  } finally {
    hideLoading();
  }
}

function validateBookingForm() {
  const form = document.getElementById('bookingForm');
  clearFormErrors(form);

  const vehicle = document.getElementById('bookingVehicle');
  const name = document.getElementById('bookingCustomerName');
  const phone = document.getElementById('bookingPhone');
  const start = document.getElementById('bookingStartDate');
  const end = document.getElementById('bookingEndDate');

  let valid = true;

  if (!vehicle.value) {
    setFieldError(vehicle, 'Vehicle is required.');
    valid = false;
  }
  if (!name.value.trim()) {
    setFieldError(name, 'Customer name is required.');
    valid = false;
  }

  const digits = phone.value.replace(/\D/g, '');
  if (digits.length !== 10) {
    setFieldError(phone, 'Phone must be exactly 10 digits.');
    valid = false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startDate = new Date(start.value);
  const endDate = new Date(end.value);

  if (Number.isNaN(startDate.getTime())) {
    setFieldError(start, 'Start date is required.');
    valid = false;
  } else if (startDate < today) {
    setFieldError(start, 'Start date cannot be in the past.');
    valid = false;
  }

  if (Number.isNaN(endDate.getTime())) {
    setFieldError(end, 'End date is required.');
    valid = false;
  } else if (!Number.isNaN(startDate.getTime()) && endDate <= startDate) {
    setFieldError(end, 'End date must be after start date.');
    valid = false;
  }

  return valid;
}

function updateEstimate() {
  const estimateEl = document.getElementById('bookingEstimate');
  const vehicleSelect = document.getElementById('bookingVehicle');
  const start = document.getElementById('bookingStartDate');
  const end = document.getElementById('bookingEndDate');

  const days = computeInclusiveDays(start.value, end.value);
  const selectedOpt = vehicleSelect.selectedOptions[0];

  if (!days || !selectedOpt) {
    estimateEl.textContent = '--';
    return;
  }

  const match = selectedOpt.textContent.match(/([0-9]+\.[0-9]{2})\/day/);
  const price = match ? Number(match[1]) : null;
  if (!price) {
    estimateEl.textContent = '--';
    return;
  }

  const total = price * days;
  estimateEl.textContent = `${formatCurrency(total)} (${days} day${days === 1 ? '' : 's'})`;
}

async function handleBookingSubmit(event) {
  event.preventDefault();
  const form = document.getElementById('bookingForm');
  const errorBox = document.getElementById('bookingFormError');
  errorBox.textContent = '';

  if (!validateBookingForm()) {
    return;
  }

  const payload = {
    vehicle: Number(document.getElementById('bookingVehicle').value),
    customer_name: document.getElementById('bookingCustomerName').value.trim(),
    customer_phone: document.getElementById('bookingPhone').value.trim(),
    start_date: document.getElementById('bookingStartDate').value,
    end_date: document.getElementById('bookingEndDate').value,
  };

  showLoading();
  try {
    await createBooking(payload);
    showToast('Booking created successfully', 'success');
    const modal = bootstrap.Modal.getInstance(document.getElementById('bookingModal'));
    modal.hide();
    form.reset();
    document.getElementById('bookingEstimate').textContent = '--';
    await loadBookings();
    await loadAvailableVehiclesForSelect();
  } catch (error) {
    console.error(error);
    errorBox.textContent = error.message || 'Failed to create booking.';
    handleServerValidationErrors(error, {
      vehicle: document.getElementById('bookingVehicle'),
      customer_name: document.getElementById('bookingCustomerName'),
      customer_phone: document.getElementById('bookingPhone'),
      start_date: document.getElementById('bookingStartDate'),
      end_date: document.getElementById('bookingEndDate'),
    });
  } finally {
    hideLoading();
  }
}

function onBookingsTableClick(event) {
  const btn = event.target.closest('button[data-action]');
  if (!btn) return;
  const id = btn.getAttribute('data-id');
  const action = btn.getAttribute('data-action');

  if (action === 'cancel') {
    cancelBookingId = id;
    const modal = new bootstrap.Modal(document.getElementById('cancelBookingModal'));
    modal.show();
  }
}

async function confirmCancelBooking() {
  if (!cancelBookingId) return;
  showLoading();
  try {
    await deleteBooking(cancelBookingId);
    showToast('Booking cancelled', 'success');
    cancelBookingId = null;
    await loadBookings();
    await loadAvailableVehiclesForSelect();
  } catch (error) {
    console.error(error);
    showErrorToast(error);
  } finally {
    hideLoading();
  }
}

function initBookingsPage() {
  const phoneInput = document.getElementById('bookingPhone');
  attachPhoneMask(phoneInput);

  document
    .getElementById('bookingStartDate')
    .addEventListener('change', updateEstimate);
  document
    .getElementById('bookingEndDate')
    .addEventListener('change', updateEstimate);
  document
    .getElementById('bookingVehicle')
    .addEventListener('change', updateEstimate);

  document
    .getElementById('bookingForm')
    .addEventListener('submit', handleBookingSubmit);

  document
    .getElementById('bookingsBody')
    .addEventListener('click', onBookingsTableClick);

  document
    .getElementById('confirmCancelBookingBtn')
    .addEventListener('click', confirmCancelBooking);

  document
    .getElementById('refreshBookingsBtn')
    .addEventListener('click', () => loadBookings());

  loadAvailableVehiclesForSelect();
  loadBookings();
}

window.addEventListener('DOMContentLoaded', initBookingsPage);
