import json
import logging
from collections import defaultdict

from django.db.models import Avg, Count, Max, Min
from google.api_core.exceptions import GoogleAPICallError, ResourceExhausted
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from ai_services.gemini import evaluate_answer, generate_followup, generate_interview_question
from resumes.models import Resume
from .models import Interview
from .serializers import InterviewSerializer

logger = logging.getLogger(__name__)


def _gemini_error_response(error):
    if isinstance(error, ResourceExhausted):
        logger.warning("Gemini API quota or rate limit was exceeded.")
        return Response(
            {
                'detail': (
                    'The Gemini API quota or rate limit has been reached. '
                    'Check your Google AI Studio usage and billing, then try again.'
                )
            },
            status=429,
        )

    logger.error("Gemini API request failed: %s", type(error).__name__)
    return Response(
        {'detail': 'The Gemini API request failed. Please try again later.'},
        status=502,
    )


def _recommended_action_for_topic(topic_name):
    area = (topic_name or 'General interview fundamentals').lower()

    if 'rest' in area or 'api' in area:
        return 'Practice 5 REST API questions'
    if 'database' in area or 'sql' in area or 'orm' in area or 'query' in area:
        return 'Review Django ORM optimization'
    if 'system' in area or 'design' in area:
        return 'Attempt a system-design interview'
    if 'communication' in area:
        return 'Practice 5 STAR-format answers'
    if 'leadership' in area:
        return 'Prepare 3 leadership stories with measurable impact'
    if 'problem' in area:
        return 'Walk through 3 debugging-heavy scenario answers'
    return f"Review {topic_name or 'your weak area'} with 3 focused drills"


def _build_learning_plan(interviews):
    recent = list(
        interviews.filter(answer__isnull=False)
        .exclude(answer='')
        .order_by('-created_at')[:8]
    )

    if not recent:
        return {
            'summary': 'Complete a few interviews to generate your AI learning plan.',
            'topics': [],
            'recommended_next_steps': [],
        }

    grouped_scores = defaultdict(list)
    for interview in recent:
        focus_area = (interview.focus_area or 'General interview fundamentals').strip() or 'General interview fundamentals'
        grouped_scores[focus_area].append(int(interview.score or 0))

    topics = []
    for name, values in grouped_scores.items():
        average = round(sum(values) / len(values))
        topics.append({
            'name': name,
            'confidence': int(average),
            'count': len(values),
        })

    topics.sort(key=lambda item: (item['confidence'], item['count']))
    weak_topics = topics[:3]

    return {
        'summary': f'Based on your last {len(recent)} interviews:',
        'topics': [
            {
                'name': topic['name'],
                'confidence': topic['confidence'],
                'count': topic['count'],
            }
            for topic in weak_topics
        ],
        'recommended_next_steps': [
            _recommended_action_for_topic(topic['name'])
            for topic in weak_topics
        ],
    }


class InterviewHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        interviews = Interview.objects.filter(user=request.user).order_by('-created_at')
        serializer = InterviewSerializer(interviews, many=True)
        return Response(serializer.data)


class GenerateQuestionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        role = request.data.get('role')
        if not role:
            return Response({'error': 'Role is required'}, status=400)

        try:
            question = generate_interview_question(role)
        except GoogleAPICallError as error:
            return _gemini_error_response(error)
        interview = Interview.objects.create(user=request.user, role=role, question=question)

        return Response({
            'id': interview.id,
            'role': role,
            'question': question,
        })


class StartInterviewView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        role = request.data.get('role')
        if not role:
            return Response({'error': 'role required'}, status=400)

        try:
            question = generate_interview_question(role)
        except GoogleAPICallError as error:
            return _gemini_error_response(error)
        interview = Interview.objects.create(user=request.user, role=role, question=question)

        return Response({
            'interview_id': interview.id,
            'question': question,
        })


class EvaluateAnswerView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        interview_id = request.data.get('interview_id')
        answer = request.data.get('answer')

        if not interview_id or not answer:
            return Response({'error': 'interview_id and answer are required'}, status=400)

        try:
            interview = Interview.objects.get(id=interview_id, user=request.user)
        except Interview.DoesNotExist:
            return Response({'error': 'Interview not found'}, status=404)

        try:
            data = evaluate_answer(interview.question, answer)
        except GoogleAPICallError as error:
            return _gemini_error_response(error)
        if not isinstance(data, dict):
            try:
                data = json.loads(data)
            except Exception:
                return Response({'error': 'AI returned invalid JSON', 'raw': str(data)}, status=500)

        interview.answer = answer
        interview.feedback = data.get('feedback', '')
        interview.score = data.get('score', 0)
        interview.save()

        return Response({
            'id': interview.id,
            'question': interview.question,
            'answer': answer,
            'score': interview.score,
            'feedback': interview.feedback,
            'improvements': data.get('improvements', ''),
        })


class InterviewStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        interviews = Interview.objects.filter(user=request.user, is_followup=False)
        total = interviews.count()
        resumes_analyzed = Resume.objects.filter(
            user=request.user,
            analysis__isnull=False,
        ).exclude(analysis='').count()
        avg_score = interviews.aggregate(Avg('score'))['score__avg']
        max_score = interviews.aggregate(Max('score'))['score__max']
        min_score = interviews.aggregate(Min('score'))['score__min']

        role_stats = interviews.values('role').annotate(
            count=Count('id'),
            avg=Avg('score'),
        )

        return Response({
            'total_interviews': total,
            'resumes_analyzed': resumes_analyzed,
            'average_score': round(avg_score or 0, 2),
            'highest_score': max_score or 0,
            'lowest_score': min_score or 0,
            'role_performance': role_stats,
            'learning_plan': _build_learning_plan(interviews),
        })


class InterviewChatView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        interview_id = request.data.get('interview_id')
        answer = request.data.get('answer')

        if not interview_id or not answer:
            return Response({'error': 'missing fields'}, status=400)

        try:
            interview = Interview.objects.get(id=interview_id, user=request.user)
        except Interview.DoesNotExist:
            return Response({'error': 'not found'}, status=404)

        try:
            data = evaluate_answer(interview.role, interview.question, answer)
        except GoogleAPICallError as error:
            return _gemini_error_response(error)
        if not isinstance(data, dict):
            try:
                data = json.loads(data)
            except Exception:
                return Response({'error': 'AI invalid JSON', 'raw': str(data)})

        try:
            followup_question = generate_followup(interview.role, interview.question, answer)
        except GoogleAPICallError as error:
            return _gemini_error_response(error)

        interview.answer = answer
        interview.feedback = data.get('feedback', '')
        interview.score = data.get('score', 0)
        interview.focus_area = data.get('focus_area', 'Other')
        interview.save()

        followup = Interview.objects.create(
            user=request.user,
            role=interview.role,
            question=followup_question,
            is_followup=True,
            parent=interview,
        )

        return Response({
            'current_score': interview.score,
            'feedback': interview.feedback,
            'followup_question': followup_question,
            'followup_id': followup.id,
        })
