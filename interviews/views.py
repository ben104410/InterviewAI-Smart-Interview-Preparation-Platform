from django.shortcuts import render
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Avg, Max, Min, Count
import json

from .models import Interview
from ai_services.gemini import generate_interview_question, evaluate_answer, generate_followup
from .serializers import InterviewSerializer


class InterviewHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        interviews = Interview.objects.filter(
            user=request.user
        ).order_by('-created_at')

        serializer = InterviewSerializer(
            interviews,
            many=True
        )

        return Response(serializer.data)
 

class GenerateQuestionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        role = request.data.get("role")

        if not role:
            return Response({"error": "Role is required"}, status=400)

        question = generate_interview_question(role)

        interview = Interview.objects.create(
            user=request.user,
            role=role,
            question=question
        )

        return Response({
            "id": interview.id,
            "role": role,
            "question": question
        })


class StartInterviewView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        role = request.data.get("role")

        if not role:
            return Response({"error": "role required"}, status=400)

        question = generate_interview_question(role)

        interview = Interview.objects.create(
            user=request.user,
            role=role,
            question=question
        )

        return Response({
            "interview_id": interview.id,
            "question": question
        })


class EvaluateAnswerView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        interview_id = request.data.get("interview_id")
        answer = request.data.get("answer")

        if not interview_id or not answer:
            return Response({"error": "interview_id and answer are required"}, status=400)

        try:
            interview = Interview.objects.get(id=interview_id, user=request.user)
        except Interview.DoesNotExist:
            return Response({"error": "Interview not found"}, status=404)

        # Get AI evaluation (returns dict)
        result = evaluate_answer(interview.question, answer)

        # result should already be a dict; defensively handle strings
        if isinstance(result, str):
            try:
                data = __import__('json').loads(result)
            except Exception:
                return Response({"error": "AI returned invalid JSON", "raw": result}, status=500)
        else:
            data = result

        # Save to DB
        interview.answer = answer
        interview.feedback = data.get("feedback", "")
        interview.score = data.get("score", 0)
        interview.save()

        return Response({
            "id": interview.id,
            "question": interview.question,
            "answer": answer,
            "score": interview.score,
            "feedback": interview.feedback,
            "improvements": data.get("improvements", "")
        })


class InterviewStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        interviews = Interview.objects.filter(user=request.user)

        total = interviews.count()
        avg_score = interviews.aggregate(Avg('score'))['score__avg']
        max_score = interviews.aggregate(Max('score'))['score__max']
        min_score = interviews.aggregate(Min('score'))['score__min']

        # Role breakdown
        role_stats = interviews.values('role').annotate(
            count=Count('id'),
            avg=Avg('score')
        )

        return Response({
            "total_interviews": total,
            "average_score": round(avg_score or 0, 2),
            "highest_score": max_score or 0,
            "lowest_score": min_score or 0,
            "role_performance": role_stats
        })


class InterviewChatView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        interview_id = request.data.get("interview_id")
        answer = request.data.get("answer")

        if not interview_id or not answer:
            return Response({"error": "missing fields"}, status=400)

        try:
            interview = Interview.objects.get(
                id=interview_id,
                user=request.user
            )
        except Interview.DoesNotExist:
            return Response({"error": "not found"}, status=404)

        # Step 1: Evaluate answer
        result = evaluate_answer(
            interview.question,
            answer,
            role=interview.role
        )

        data = result if isinstance(result, dict) else json.loads(result)

        interview.answer = answer
        interview.feedback = data.get("feedback", "")
        interview.score = data.get("score", 0)
        interview.save()

        # Step 2: Generate follow-up question
        followup_question = generate_followup(
            interview.role,
            interview.question,
            answer
        )

        followup = Interview.objects.create(
            user=request.user,
            role=interview.role,
            question=followup_question,
            is_followup=True,
            parent=interview
        )

        return Response({
            "current_score": interview.score,
            "feedback": interview.feedback,
            "followup_question": followup_question,
            "followup_id": followup.id
        })
