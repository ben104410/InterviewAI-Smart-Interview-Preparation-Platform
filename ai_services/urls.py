from django.urls import path
from .views import AIHealthView

urlpatterns = [
    path("health/", AIHealthView.as_view(), name="ai-health"),
]
