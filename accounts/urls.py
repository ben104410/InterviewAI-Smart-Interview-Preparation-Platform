from django.urls import path

from .views import AccountProfileView, DashboardView, RegisterView

urlpatterns = [
    path('register/', RegisterView.as_view()),
    path('dashboard/', DashboardView.as_view()),
    path('profile/', AccountProfileView.as_view()),
]