from decimal import Decimal

from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Vehicle, Booking


class BookingModelTests(TestCase):
    def setUp(self):
        self.vehicle = Vehicle.objects.create(
            name="Corolla",
            brand="Toyota",
            year=2022,
            price_per_day=Decimal("100.00"),
            fuel_type="Petrol",
        )

    def test_successful_booking_and_total_amount(self):
        start = timezone.now().date() + timezone.timedelta(days=1)
        end = start + timezone.timedelta(days=2)  # inclusive: 3 days
        booking = Booking.objects.create(
            vehicle=self.vehicle,
            customer_name="John Doe",
            customer_phone="1234567890",
            start_date=start,
            end_date=end,
        )

        self.assertEqual(booking.total_amount, Decimal("300.00"))
        self.vehicle.refresh_from_db()
        self.assertFalse(self.vehicle.is_available)

    def test_start_date_in_past_rejected(self):
        start = timezone.now().date() - timezone.timedelta(days=1)
        end = timezone.now().date() + timezone.timedelta(days=1)

        booking = Booking(
            vehicle=self.vehicle,
            customer_name="Jane Doe",
            customer_phone="1234567890",
            start_date=start,
            end_date=end,
        )

        with self.assertRaisesMessage(
            Exception, "Start date cannot be in the past."
        ):
            booking.clean()

    def test_phone_validation(self):
        start = timezone.now().date() + timezone.timedelta(days=1)
        end = start + timezone.timedelta(days=1)
        booking = Booking(
            vehicle=self.vehicle,
            customer_name="Jane Doe",
            customer_phone="12345",  # invalid
            start_date=start,
            end_date=end,
        )

        with self.assertRaisesMessage(
            Exception, "Phone number must be exactly 10 digits."
        ):
            booking.clean()

    def test_overlapping_booking_rejected(self):
        start = timezone.now().date() + timezone.timedelta(days=1)
        end = start + timezone.timedelta(days=2)

        Booking.objects.create(
            vehicle=self.vehicle,
            customer_name="John Doe",
            customer_phone="1234567890",
            start_date=start,
            end_date=end,
        )

        overlapping = Booking(
            vehicle=self.vehicle,
            customer_name="Other",
            customer_phone="1234567890",
            start_date=start + timezone.timedelta(days=1),
            end_date=end + timezone.timedelta(days=1),
        )

        with self.assertRaisesMessage(
            Exception, "already booked for the selected dates."
        ):
            overlapping.clean()


class BookingAPITests(APITestCase):
    def setUp(self):
        self.vehicle = Vehicle.objects.create(
            name="Model 3",
            brand="Tesla",
            year=2023,
            price_per_day=Decimal("200.00"),
            fuel_type="Electric",
        )

    def test_create_booking_success(self):
        start = (timezone.now().date() + timezone.timedelta(days=1)).isoformat()
        end = (timezone.now().date() + timezone.timedelta(days=3)).isoformat()

        payload = {
            "vehicle": self.vehicle.id,
            "customer_name": "API User",
            "customer_phone": "1112223333",
            "start_date": start,
            "end_date": end,
        }

        response = self.client.post("/api/bookings/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        self.vehicle.refresh_from_db()
        self.assertFalse(self.vehicle.is_available)

    def test_create_overlapping_booking_failure(self):
        start = timezone.now().date() + timezone.timedelta(days=1)
        end = start + timezone.timedelta(days=2)

        Booking.objects.create(
            vehicle=self.vehicle,
            customer_name="First",
            customer_phone="1234567890",
            start_date=start,
            end_date=end,
        )

        payload = {
            "vehicle": self.vehicle.id,
            "customer_name": "Second",
            "customer_phone": "9998887777",
            "start_date": (start + timezone.timedelta(days=1)).isoformat(),
            "end_date": (end + timezone.timedelta(days=1)).isoformat(),
        }

        response = self.client.post("/api/bookings/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("already booked", str(response.data))

    def test_vehicle_availability_toggles_on_delete(self):
        start = timezone.now().date() + timezone.timedelta(days=1)
        end = start + timezone.timedelta(days=1)

        booking = Booking.objects.create(
            vehicle=self.vehicle,
            customer_name="Del User",
            customer_phone="1234567890",
            start_date=start,
            end_date=end,
        )

        self.vehicle.refresh_from_db()
        self.assertFalse(self.vehicle.is_available)

        url = f"/api/bookings/{booking.id}/"
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        self.vehicle.refresh_from_db()
        self.assertTrue(self.vehicle.is_available)