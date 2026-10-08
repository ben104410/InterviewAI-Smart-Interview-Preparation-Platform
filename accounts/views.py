from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import AccountProfile
from .serializers import AccountProfileSerializer, RegisterSerializer


class DashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({
            'username': request.user.username,
            'email': request.user.email,
            'first_name': request.user.first_name,
            'last_name': request.user.last_name,
        })


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response(RegisterSerializer(user).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AccountProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile, _ = AccountProfile.objects.get_or_create(user=request.user)
        serializer = AccountProfileSerializer(request.user)
        data = serializer.to_representation(request.user)
        return Response(data)

    def put(self, request):
        serializer = AccountProfileSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        profile, _ = AccountProfile.objects.get_or_create(user=request.user)
        return Response(AccountProfileSerializer(request.user).to_representation(request.user))