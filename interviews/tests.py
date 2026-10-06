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


class InterviewLearningPlanTests(APITestCase):
    def setUp(self):
        user_model = get_user_model()
        self.user = user_model.objects.create_user(
            username="learner",
            password="test-password",
        )

    def test_stats_include_learning_plan_for_recurring_weak_areas(self):
        focus_areas = [
            ("REST APIs", 58),
            ("REST APIs", 62),
            ("Database optimization", 64),
            ("Database optimization", 68),
            ("System design", 61),
            ("System design", 67),
            ("Communication", 75),
            ("Communication", 81),
        ]

        for focus_area, score in focus_areas:
            Interview.objects.create(
                user=self.user,
                role="Backend Engineer",
                question="Describe a trade-off in your work.",
                answer="A thoughtful answer with examples.",
                feedback="Good effort.",
                score=score,
                focus_area=focus_area,
            )

        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/interviews/stats/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("learning_plan", response.data)
        self.assertIn("Based on your last 8 interviews", response.data["learning_plan"]["summary"])
        self.assertEqual(response.data["learning_plan"]["topics"][0]["name"], "REST APIs")
        self.assertEqual(response.data["learning_plan"]["topics"][0]["confidence"], 60)
        self.assertIn("Practice 5 REST API questions", response.data["learning_plan"]["recommended_next_steps"])
