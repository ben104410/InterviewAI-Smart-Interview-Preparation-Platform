from django.urls import path
from .views import DashboardView, RegisterView

urlpatterns = [
    path('register/', RegisterView.as_view()),
    path('dashboard/', DashboardView.as_view()),
]