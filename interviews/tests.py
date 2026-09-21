from django.test import TestCase, override_settings

from ai_services import gemini


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
