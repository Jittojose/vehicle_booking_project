// frontend-bootstrap/js/booking-detail.js
// Simple controller for booking detail page with cancel option.

import { getBooking, deleteBooking } from './api.js';
import {
  showToast,
  showErrorToast,
  showLoading,
  hideLoading,
  computeInclusiveDays,
  formatCurrency,
  maskPhone,
} from './ui.js';

function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

async function loadBookingDetail() {
  const id = getQueryParam('id');
  const container = document.getElementById('bookingDetailBody');
  if (!id) {
    container.innerHTML = '<div class="alert alert-danger">Missing booking ID in URL.</div>';
    return;
  }

  showLoading();
  try {
    const b = await getBooking(id);
    const vehicle = b.vehicle_details || {};
    const days = computeInclusiveDays(b.start_date, b.end_date) || '';
    const datesLabel = days
      ? `${b.start_date} – ${b.end_date} (${days} day${days === 1 ? '' : 's'})`
      : `${b.start_date} – ${b.end_date}`;

    container.innerHTML = `
      <dl class="row mb-0">
        <dt class="col-sm-3">Customer</dt>
        <dd class="col-sm-9">${b.customer_name}</dd>

        <dt class="col-sm-3">Phone</dt>
        <dd class="col-sm-9">${maskPhone(b.customer_phone)}</dd>

        <dt class="col-sm-3">Vehicle</dt>
        <dd class="col-sm-9">${vehicle.brand || ''} ${vehicle.name || ''} (${vehicle.year || ''})</dd>

        <dt class="col-sm-3">Dates</dt>
        <dd class="col-sm-9">${datesLabel}</dd>

        <dt class="col-sm-3">Total amount</dt>
        <dd class="col-sm-9">${formatCurrency(b.total_amount)}</dd>

        <dt class="col-sm-3">Created at</dt>
        <dd class="col-sm-9">${b.created_at?.replace('T', ' ').slice(0, 19) || ''}</dd>
      </dl>
    `;

    const cancelBtn = document.getElementById('cancelBookingDetailBtn');
    cancelBtn.dataset.id = b.id;
  } catch (error) {
    console.error(error);
    showErrorToast(error);
    container.innerHTML = '<div class="alert alert-danger">Failed to load booking.</div>';
  } finally {
    hideLoading();
  }
}

async function cancelBookingFromDetail() {
  const id = getQueryParam('id');
  if (!id) return;
  showLoading();
  try {
    await deleteBooking(id);
    showToast('Booking cancelled', 'success');
    window.location.href = 'bookings.html';
  } catch (error) {
    console.error(error);
    showErrorToast(error);
  } finally {
    hideLoading();
  }
}

function initBookingDetailPage() {
  document
    .getElementById('cancelBookingDetailBtn')
    .addEventListener('click', () => {
      const modal = new bootstrap.Modal(
        document.getElementById('cancelBookingDetailModal')
      );
      modal.show();
    });

  document
    .getElementById('confirmCancelDetailBtn')
    .addEventListener('click', cancelBookingFromDetail);

  loadBookingDetail();
}

window.addEventListener('DOMContentLoaded', initBookingDetailPage);
