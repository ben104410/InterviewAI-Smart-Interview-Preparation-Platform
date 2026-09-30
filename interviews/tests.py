from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from rest_framework import status
from rest_framework.test import APITestCase

from ai_services import gemini
from .models import Interview


class GeminiFallbackTests(TestCase):
    @override_settings(GEMINI_API_KEY=None)
    def test_generate_interview_question_falls_back_without_api_key(self):
        question = gemini.generate_interview_question("Python Developer")

        self.assertIn("Python", question)
        self.assertTrue(question.endswith("?") or len(question) > 20)

    @override_settings(GEMINI_API_KEY=None)
    def test_evaluate_answer_falls_back_without_api_key(self):
        result = gemini.evaluate_answer(
            "Describe a microservice you built.",
            "I designed a REST API with authentication, caching, and monitoring."
        )

        self.assertIn("feedback", result)
        self.assertIn("score", result)
        self.assertGreaterEqual(result["score"], 0)
        self.assertLessEqual(result["score"], 100)


class InterviewOwnershipTests(APITestCase):
    def setUp(self):
        user_model = get_user_model()
        self.owner = user_model.objects.create_user(
            username="owner",
            password="test-password",
        )
        self.other_user = user_model.objects.create_user(
            username="other",
            password="test-password",
        )
        self.interview = Interview.objects.create(
            user=self.owner,
            role="Django Developer",
            question="What is middleware?",
        )

    def test_history_only_returns_current_users_interviews(self):
        self.client.force_authenticate(user=self.other_user)

        response = self.client.get("/api/interviews/history/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, [])

    def test_user_cannot_submit_answer_for_another_users_interview(self):
        self.client.force_authenticate(user=self.other_user)

        response = self.client.post(
            "/api/interviews/evaluate/",
            {"interview_id": self.interview.id, "answer": "A response"},
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
