from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status

from .serializers import RegisterSerializer

class DashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({
            "message": f"Welcome {request.user.username}"
        })


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response(RegisterSerializer(user).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)