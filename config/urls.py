from django.contrib import admin
from django.urls import path
from django.urls import path, include

from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/accounts/', include('accounts.urls')),
    path(
    'api/interviews/',
    include('interviews.urls')
),
    path(
    'api/resumes/',
    include('resumes.urls')
),
    path(
    'api/ai-services/',
    include('ai_services.urls')
),
]

urlpatterns += [
    path('api/token/', TokenObtainPairView.as_view()),
    path('api/token/refresh/', TokenRefreshView.as_view()),
]