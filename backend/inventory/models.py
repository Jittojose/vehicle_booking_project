# backend/inventory/models.py
from django.db import models
from decimal import Decimal
from django.core.validators import MinValueValidator
from django.utils import timezone
from django.db.models import Q
from django.core.exceptions import ValidationError

class Vehicle(models.Model):
    FUEL_TYPES = [
        ('Petrol', 'Petrol'),
        ('Diesel', 'Diesel'),
        ('Electric', 'Electric'),
        ('Hybrid', 'Hybrid'),
    ]

    name = models.CharField(max_length=200)
    brand = models.CharField(max_length=100)
    year = models.IntegerField()
    price_per_day = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    fuel_type = models.CharField(max_length=10, choices=FUEL_TYPES)
    is_available = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.brand} {self.name} ({self.year})"

    def update_availability(self):
        now = timezone.now().date()
        has_active_booking = self.bookings.filter(
            start_date__lte=now,
            end_date__gte=now
        ).exists()
        self.is_available = not has_active_booking
        self.save(update_fields=['is_available'])

class Booking(models.Model):
    vehicle = models.ForeignKey(
        Vehicle, 
        on_delete=models.CASCADE,
        related_name='bookings'
    )
    customer_name = models.CharField(max_length=200)
    customer_phone = models.CharField(max_length=10)
    start_date = models.DateField()
    end_date = models.DateField()
    total_amount = models.DecimalField(
        max_digits=12, 
        decimal_places=2,
        editable=False
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def clean(self):
        if self.start_date < timezone.now().date():
            raise ValidationError({'start_date': 'Start date cannot be in the past.'})
        
        if self.end_date < self.start_date:
            raise ValidationError({'end_date': 'End date must be after start date.'})

        if not self.customer_phone.isdigit() or len(self.customer_phone) != 10:
            raise ValidationError(
                {'customer_phone': 'Phone number must be exactly 10 digits.'}
            )

        if not self.pk or self.start_date != self.__class__.objects.get(pk=self.pk).start_date or \
                         self.end_date != self.__class__.objects.get(pk=self.pk).end_date:
            overlapping_bookings = self.vehicle.bookings.exclude(pk=self.pk).filter(
                start_date__lte=self.end_date,
                end_date__gte=self.start_date
            )
            if overlapping_bookings.exists():
                raise ValidationError(
                    'This vehicle is already booked for the selected dates.'
                )

    def save(self, *args, **kwargs):
        days = (self.end_date - self.start_date).days + 1
        self.total_amount = self.vehicle.price_per_day * days
        
        from django.db import transaction
        with transaction.atomic():
            vehicle = Vehicle.objects.select_for_update().get(pk=self.vehicle.pk)
            super().save(*args, **kwargs)
            vehicle.update_availability()

    def delete(self, *args, **kwargs):
        vehicle = self.vehicle
        super().delete(*args, **kwargs)
        vehicle.update_availability()

    def __str__(self):
        return f"Booking {self.id} - {self.customer_name} ({self.start_date} to {self.end_date})"
