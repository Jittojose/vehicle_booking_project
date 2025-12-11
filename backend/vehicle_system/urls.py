# backend/vehicle_system/urls.py
from django.contrib import admin
from django.urls import path, include
from django.views.generic import TemplateView
from rest_framework.routers import DefaultRouter
from inventory import views

router = DefaultRouter()
router.register(r'vehicles', views.VehicleViewSet)
router.register(r'bookings', views.BookingViewSet)

urlpatterns = [
    # Frontend pages served as Django templates
    path('', TemplateView.as_view(template_name='index.html'), name='dashboard'),
    path('vehicles/', TemplateView.as_view(template_name='vehicles.html'), name='vehicles'),
    path('bookings/', TemplateView.as_view(template_name='bookings.html'), name='bookings'),
    path('booking-detail/', TemplateView.as_view(template_name='booking-detail.html'), name='booking-detail'),
    # Allow legacy .html style URL as well
    path('booking-detail.html', TemplateView.as_view(template_name='booking-detail.html')),

    # Admin and API
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
]