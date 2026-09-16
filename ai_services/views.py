from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny


class AIHealthView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({
            "status": "ok",
            "message": "AI interview service is running",
            "features": [
                "question_generation",
                "answer_evaluation",
                "resume_analysis",
                "follow_up_questions",
            ],
        })
