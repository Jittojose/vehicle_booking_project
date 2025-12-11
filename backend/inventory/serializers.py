# backend/inventory/serializers.py
from rest_framework import serializers
from django.utils import timezone
from .models import Vehicle, Booking


class VehicleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vehicle
        fields = "__all__"
        read_only_fields = ("is_available",)


class BookingSerializer(serializers.ModelSerializer):
    vehicle_details = serializers.SerializerMethodField(read_only=True)
    days = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Booking
        fields = [
            "id",
            "vehicle",
            "vehicle_details",
            "customer_name",
            "customer_phone",
            "start_date",
            "end_date",
            "total_amount",
            "days",
            "created_at",
        ]
        read_only_fields = ("total_amount", "created_at")
        extra_kwargs = {"vehicle": {"write_only": True}}

    def get_vehicle_details(self, obj):
        v = obj.vehicle
        return {
            "id": v.id,
            "name": v.name,
            "brand": v.brand,
            "year": v.year,
            "fuel_type": v.get_fuel_type_display(),
        }

    def get_days(self, obj):
        return (obj.end_date - obj.start_date).days + 1

    def validate_start_date(self, value):
        if value < timezone.now().date():
            raise serializers.ValidationError("Start date cannot be in the past.")
        return value

    def validate(self, data):
        start_date = data.get("start_date")
        end_date = data.get("end_date")
        vehicle = data.get("vehicle") or getattr(self.instance, "vehicle", None)

        if start_date and end_date:
            if end_date < start_date:
                raise serializers.ValidationError(
                    {"end_date": "End date must be after start date."}
                )

            if vehicle is None:
                raise serializers.ValidationError({"vehicle": "Vehicle is required."})

            qs = Booking.objects.filter(
                vehicle=vehicle,
                start_date__lte=end_date,
                end_date__gte=start_date,
            )
            if self.instance is not None:
                qs = qs.exclude(pk=self.instance.pk)

            if qs.exists():
                raise serializers.ValidationError(
                    "This vehicle is already booked for the selected dates."
                )

        phone = data.get("customer_phone") or getattr(
            self.instance, "customer_phone", None
        )
        if phone is not None and (not phone.isdigit() or len(phone) != 10):
            raise serializers.ValidationError(
                {"customer_phone": "Phone number must be 10 digits."}
            )

        return data

    def create(self, validated_data):
        days = (validated_data["end_date"] - validated_data["start_date"]).days + 1
        validated_data["total_amount"] = (
            validated_data["vehicle"].price_per_day * days
        )
        return Booking.objects.create(**validated_data)
