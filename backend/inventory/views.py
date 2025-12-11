# backend/inventory/views.py
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.shortcuts import get_object_or_404
from django_filters import rest_framework as filters
from .models import Vehicle, Booking
from .serializers import VehicleSerializer, BookingSerializer

class VehicleFilter(filters.FilterSet):
    brand = filters.CharFilter(field_name='brand', lookup_expr='iexact')
    fuel_type = filters.CharFilter(field_name='fuel_type', lookup_expr='iexact')
    is_available = filters.BooleanFilter(field_name='is_available')
    min_price = filters.NumberFilter(field_name='price_per_day', lookup_expr='gte')
    max_price = filters.NumberFilter(field_name='price_per_day', lookup_expr='lte')
    
    class Meta:
        model = Vehicle
        fields = ['brand', 'fuel_type', 'is_available', 'min_price', 'max_price']

class VehicleViewSet(viewsets.ModelViewSet):
    queryset = Vehicle.objects.all().order_by('brand', 'name')
    serializer_class = VehicleSerializer
    filterset_class = VehicleFilter
    search_fields = ['name', 'brand']
    ordering_fields = ['price_per_day', 'year']

class BookingViewSet(viewsets.ModelViewSet):
    queryset = Booking.objects.select_related('vehicle').all().order_by('-created_at')
    serializer_class = BookingSerializer
    filterset_fields = ['vehicle', 'start_date', 'end_date']
    search_fields = ['customer_name', 'customer_phone']
    ordering_fields = ['created_at', 'start_date', 'total_amount']
    
    def perform_create(self, serializer):
        serializer.save()
    
    def perform_destroy(self, instance):
        instance.delete()