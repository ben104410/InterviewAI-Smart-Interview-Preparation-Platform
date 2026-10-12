from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import TestCase
from google.api_core.exceptions import ResourceExhausted
from google.genai.errors import APIError
from rest_framework.test import APIClient

from .models import Interview
from resumes.models import Resume


class GeminiQuotaHandlingTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username='quota-test-user',
            password='test-password',
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_start_returns_rate_limit_when_gemini_quota_is_exhausted(self):
        with patch(
            'interviews.views.generate_interview_question',
            side_effect=ResourceExhausted('quota exhausted'),
        ):
            response = self.client.post(
                '/api/interviews/start/',
                {'role': 'Python developer'},
                format='json',
            )

        self.assertEqual(response.status_code, 429)
        self.assertIn('quota or rate limit', response.data['detail'])
        self.assertFalse(Interview.objects.filter(user=self.user).exists())

    def test_start_handles_new_gemini_sdk_quota_errors(self):
        with patch(
            'interviews.views.generate_interview_question',
            side_effect=APIError(429, {'error': {'message': 'quota exhausted'}}),
        ):
            response = self.client.post(
                '/api/interviews/start/',
                {'role': 'Python developer'},
                format='json',
            )

        self.assertEqual(response.status_code, 429)
        self.assertIn('quota or rate limit', response.data['detail'])
        self.assertFalse(Interview.objects.filter(user=self.user).exists())

    def test_chat_does_not_save_answer_when_evaluation_quota_is_exhausted(self):
        interview = Interview.objects.create(
            user=self.user,
            role='Python developer',
            question='What is a Python decorator?',
        )

        with patch(
            'interviews.views.evaluate_answer',
            side_effect=ResourceExhausted('quota exhausted'),
        ):
            response = self.client.post(
                '/api/interviews/chat/',
                {'interview_id': interview.id, 'answer': 'A function wrapper.'},
                format='json',
            )

        interview.refresh_from_db()
        self.assertEqual(response.status_code, 429)
        self.assertIsNone(interview.answer)
        self.assertFalse(interview.followups.exists())

    def test_chat_does_not_save_answer_when_followup_quota_is_exhausted(self):
        interview = Interview.objects.create(
            user=self.user,
            role='Python developer',
            question='What is a Python decorator?',
        )

        with (
            patch(
                'interviews.views.evaluate_answer',
                return_value={'feedback': 'Good answer.', 'score': 8},
            ),
            patch(
                'interviews.views.generate_followup',
                side_effect=ResourceExhausted('quota exhausted'),
            ),
        ):
            response = self.client.post(
                '/api/interviews/chat/',
                {'interview_id': interview.id, 'answer': 'A function wrapper.'},
                format='json',
            )

        interview.refresh_from_db()
        self.assertEqual(response.status_code, 429)
        self.assertIsNone(interview.answer)
        self.assertFalse(interview.followups.exists())


class InterviewStatsTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username='stats-test-user',
            password='test-password',
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_stats_include_user_interviews_and_successfully_analyzed_resumes(self):
        first_interview = Interview.objects.create(
            user=self.user,
            role='Python developer',
            question='What is a Python decorator?',
        )
        Interview.objects.create(
            user=self.user,
            role='Python developer',
            question='What is a closure?',
            is_followup=True,
            parent=first_interview,
        )
        Interview.objects.create(
            user=self.user,
            role='Backend developer',
            question='What is an API?',
        )
        Resume.objects.create(
            user=self.user,
            file='resumes/analyzed.pdf',
            analysis='{"summary": "Analyzed"}',
        )
        Resume.objects.create(
            user=self.user,
            file='resumes/pending.pdf',
            analysis='',
        )

        other_user = get_user_model().objects.create_user(
            username='other-stats-user',
            password='test-password',
        )
        Interview.objects.create(
            user=other_user,
            role='Other role',
            question='Other question',
        )
        Resume.objects.create(
            user=other_user,
            file='resumes/other-analyzed.pdf',
            analysis='{"summary": "Other user"}',
        )

        response = self.client.get('/api/interviews/stats/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['total_interviews'], 2)
        self.assertEqual(response.data['resumes_analyzed'], 1)
