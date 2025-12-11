// frontend-bootstrap/js/api.js
// Thin wrapper around Fetch for calling the Django REST API.

import { API_BASE, AUTH_TOKEN } from './config.js';

const DEFAULT_TIMEOUT_MS = 10000;

async function apiFetch(path, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;

  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  if (AUTH_TOKEN) {
    headers.set('Authorization', AUTH_TOKEN);
  }

  let response;
  const controller = new AbortController();
  const signal = controller.signal;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    response = await fetch(url, { ...options, headers, signal });
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.');
    }
    throw new Error('Network error. Please check your connection.');
  } finally {
    clearTimeout(timeoutId);
  }

  let data = null;
  const contentType = response.headers.get('Content-Type') || '';
  if (contentType.includes('application/json')) {
    data = await response.json().catch(() => null);
  } else {
    data = await response.text().catch(() => null);
  }

  if (!response.ok) {
    const message =
      (data && data.detail) ||
      (typeof data === 'string' && data) ||
      'Request failed.';
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

// Vehicle endpoints
export function getVehicles(filters = {}) {
  const params = new URLSearchParams();
  if (filters.search) params.append('search', filters.search);
  if (filters.fuel_type) params.append('fuel_type', filters.fuel_type);
  if (filters.only_available) params.append('is_available', 'true');

  const qs = params.toString();
  return apiFetch(`/vehicles/${qs ? `?${qs}` : ''}`, { method: 'GET' });
}

export function getVehicle(id) {
  return apiFetch(`/vehicles/${id}/`, { method: 'GET' });
}

export function createVehicle(data) {
  return apiFetch('/vehicles/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateVehicle(id, data) {
  return apiFetch(`/vehicles/${id}/`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function deleteVehicle(id) {
  return apiFetch(`/vehicles/${id}/`, { method: 'DELETE' });
}

// Booking endpoints
export function getBookings(filters = {}) {
  const params = new URLSearchParams();
  if (filters.vehicle) params.append('vehicle', filters.vehicle);
  if (filters.start_date) params.append('start_date', filters.start_date);
  if (filters.end_date) params.append('end_date', filters.end_date);

  const qs = params.toString();
  return apiFetch(`/bookings/${qs ? `?${qs}` : ''}`, { method: 'GET' });
}

export function getBooking(id) {
  return apiFetch(`/bookings/${id}/`, { method: 'GET' });
}

export function createBooking(data) {
  return apiFetch('/bookings/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function deleteBooking(id) {
  return apiFetch(`/bookings/${id}/`, { method: 'DELETE' });
}
