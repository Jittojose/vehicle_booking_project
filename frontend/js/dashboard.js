// frontend-bootstrap/js/dashboard.js
// Controller for dashboard page: loads summary stats and recent bookings.

import { getVehicles, getBookings } from './api.js';
import { showErrorToast, formatCurrency, computeInclusiveDays } from './ui.js';

function countActiveBookings(bookings) {
  const todayStr = new Date().toISOString().slice(0, 10);
  return bookings.filter((b) => b.start_date <= todayStr && b.end_date >= todayStr).length;
}

function renderSummary(vehicles, bookings) {
  const totalVehiclesEl = document.getElementById('totalVehicles');
  const availableVehiclesEl = document.getElementById('availableVehicles');
  const totalBookingsEl = document.getElementById('totalBookings');
  const activeBookingsEl = document.getElementById('activeBookings');

  const totalVehicles = vehicles.length;
  const availableVehicles = vehicles.filter((v) => v.is_available).length;
  const totalBookings = bookings.length;
  const active = countActiveBookings(bookings);

  totalVehiclesEl.textContent = totalVehicles;
  availableVehiclesEl.textContent = availableVehicles;
  totalBookingsEl.textContent = totalBookings;
  activeBookingsEl.textContent = active;
}

function renderRecentBookings(bookings) {
  const tbody = document.getElementById('recentBookingsBody');
  tbody.innerHTML = '';

  if (!bookings.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center text-muted py-4">
          No bookings yet. Create the first booking from the Bookings page.
        </td>
      </tr>
    `;
    return;
  }

  bookings.slice(0, 5).forEach((b) => {
    const tr = document.createElement('tr');
    const vehicle = b.vehicle_details || {};

    const days = computeInclusiveDays(b.start_date, b.end_date) || '';
    const datesLabel = days
      ? `${b.start_date} – ${b.end_date} (${days} day${days === 1 ? '' : 's'})`
      : `${b.start_date} – ${b.end_date}`;

    tr.innerHTML = `
      <td>${b.customer_name}</td>
      <td>${vehicle.brand || ''} ${vehicle.name || ''}</td>
      <td>${datesLabel}</td>
      <td>${formatCurrency(b.total_amount)}</td>
      <td>${b.created_at?.slice(0, 10) || ''}</td>
      <td class="text-end">
        <a href="booking-detail.html?id=${b.id}" class="btn btn-sm btn-outline-primary">
          Details
        </a>
      </td>
    `;

    tbody.appendChild(tr);
  });
}

async function initDashboard() {
  try {
    const [vehiclesRes, bookingsRes] = await Promise.all([
      getVehicles(),
      getBookings(),
    ]);

    // DRF may paginate; use results if present
    const vehicles = vehiclesRes.results || vehiclesRes;
    const bookings = bookingsRes.results || bookingsRes;

    renderSummary(vehicles, bookings);
    renderRecentBookings(bookings);
  } catch (error) {
    console.error(error);
    showErrorToast(error);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  initDashboard();
});
