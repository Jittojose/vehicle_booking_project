# Vehicle Booking System Frontend (Bootstrap)

This folder contains a static **HTML + CSS + vanilla JavaScript + Bootstrap 5** frontend
for the Django REST Vehicle Inventory & Booking backend.

## Structure

- `index.html` – Dashboard (summary cards + recent bookings)
- `vehicles.html` – Vehicles list & management (filter, create, edit, delete, book)
- `bookings.html` – Booking list & management (create, cancel)
- `booking-detail.html` – Single booking detail view with cancel option

- `css/`
  - `styles.css` – small theme + Bootstrap overrides
- `js/`
  - `config.js` – single config for `API_BASE` and `AUTH_TOKEN`
  - `api.js` – Fetch helpers for vehicles and bookings
  - `ui.js` – toasts, loading overlay, form & date helpers
  - `dashboard.js` – controller for `index.html`
  - `vehicles.js` – controller for `vehicles.html`
  - `bookings.js` – controller for `bookings.html`
  - `booking-detail.js` – controller for `booking-detail.html`
- `examples/` – sample JSON payloads and cURL examples

## 1. Configure API base URL

Edit `js/config.js`:

```js
export const API_BASE = 'http://localhost:8000/api';
export const AUTH_TOKEN = null; // e.g. 'Bearer <token>' if auth added later
```

Make sure this matches your Django backend URL.

## 2. Serving the frontend locally

Because the JavaScript uses ES modules (`type="module"`), you should serve the
files over HTTP rather than opening them directly from `file://`.

### Option A: Python simple HTTP server

From the `frontend-bootstrap` folder:

```bash
cd frontend-bootstrap
python -m http.server 5500
```

Then open in your browser:

- `http://127.0.0.1:5500/index.html`
- `http://127.0.0.1:5500/vehicles.html`
- `http://127.0.0.1:5500/bookings.html`

### Option B: `npx serve`

If you have Node.js installed:

```bash
cd frontend-bootstrap
npx serve .
```

Open the URL printed by `serve` (e.g. `http://localhost:3000/index.html`).

## 3. Backend requirements

Assumptions:

- API endpoints:
  - `GET /api/vehicles/` (list) and `POST /api/vehicles/` (create)
  - `GET /api/vehicles/{id}/`, `PUT /api/vehicles/{id}/`, `DELETE /api/vehicles/{id}/`
  - `GET /api/bookings/` (list) and `POST /api/bookings/` (create)
  - `GET /api/bookings/{id}/`, `DELETE /api/bookings/{id}/`
- Responses are standard Django REST Framework JSON (optionally paginated).
- No authentication is required.

## 4. CORS notes

If you serve the frontend from a different origin (e.g. `http://127.0.0.1:5500`),
make sure your Django settings allow that origin. For example:

```python
CORS_ALLOW_ALL_ORIGINS = True
# or, more strictly:
# CORS_ALLOWED_ORIGINS = [
#     'http://127.0.0.1:5500',
#     'http://localhost:3000',
# ]
```

## 5. Manual QA checklist

1. **Create vehicle**
   - Go to `vehicles.html`.
   - Click **Add Vehicle**, fill in fields (brand, name, year, price, fuel) and save.
   - Verify the vehicle appears in the grid and `/api/vehicles/` returns it.

2. **Filter vehicles**
   - Use search box, fuel dropdown, and "Only show available" checkbox.
   - Verify results match expectations.

3. **Create booking**
   - Go to `bookings.html`.
   - Click **New Booking**.
   - Select an available vehicle, enter name and 10-digit phone, choose start/end dates.
   - Check the estimated total is shown.
   - Submit; booking should appear in the table and on `/api/bookings/`.

4. **Overlapping booking**
   - Attempt to create a second booking with overlapping dates for the same vehicle.
   - Backend should return a validation error; UI shows error message near the form
     and/or as a toast.

5. **Cancel booking**
   - From `bookings.html` table, click **Cancel** and confirm.
   - Booking should disappear from the list.
   - The associated vehicle should become available again.

6. **Dashboard**
   - Open `index.html`.
   - Verify summary counts and recent bookings table reflect current data.

## 6. Example cURL commands

These match what the frontend sends.

### Create vehicle

```bash
curl -X POST "http://localhost:8000/api/vehicles/" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Corolla",
    "brand": "Toyota",
    "year": 2023,
    "price_per_day": "65.00",
    "fuel_type": "Petrol"
  }'
```

### Create booking

```bash
curl -X POST "http://localhost:8000/api/bookings/" \
  -H "Content-Type: application/json" \
  -d '{
    "vehicle": 1,
    "customer_name": "Alice Smith",
    "customer_phone": "1234567890",
    "start_date": "2025-01-10",
    "end_date": "2025-01-12"
  }'
```

### Cancel booking

```bash
curl -X DELETE "http://localhost:8000/api/bookings/1/"
```

## 7. Known limitations

- No authentication or user accounts.
- No pagination controls on the frontend (relies on backend defaults).
- Basic styling only; you can further customize `css/styles.css`.
