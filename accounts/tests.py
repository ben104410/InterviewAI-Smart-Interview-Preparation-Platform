from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase
from .models import AccountProfile


class DashboardProfileTests(APITestCase):
	def setUp(self):
		self.user = get_user_model().objects.create_user(
			username="candidate",
			email="candidate@example.com",
			password="test-password",
			first_name="Alex",
			last_name="Morgan",
		)

	def test_dashboard_returns_profile_fields_for_authenticated_user(self):
		self.client.force_authenticate(user=self.user)

		response = self.client.get("/api/accounts/dashboard/")

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertEqual(response.data["username"], "candidate")
		self.assertEqual(response.data["email"], "candidate@example.com")
		self.assertEqual(response.data["first_name"], "Alex")
		self.assertEqual(response.data["last_name"], "Morgan")

	def test_dashboard_requires_authentication(self):
		response = self.client.get("/api/accounts/dashboard/")

		self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class AccountProfileTests(APITestCase):
	def setUp(self):
		self.user = get_user_model().objects.create_user(
			username="profile-user",
			email="old@example.com",
			password="test-password",
		)
		self.client.force_authenticate(user=self.user)

	def test_profile_get_returns_defaults(self):
		response = self.client.get("/api/accounts/profile/")

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertEqual(response.data["username"], "profile-user")
		self.assertEqual(response.data["field_of_study"], "Computer Science")
		self.assertEqual(response.data["experience_level"], "Junior")
		self.assertEqual(response.data["preferred_interview_type"], "Technical")

	def test_profile_update_persists_user_fields_and_preferences(self):
		response = self.client.put(
			"/api/accounts/profile/",
			{
				"first_name": "Benjamin",
				"last_name": "Mwasya",
				"email": "benjamin@example.com",
				"field_of_study": "Computer Science",
				"target_role": "Django Developer",
				"experience_level": "Junior",
				"preferred_interview_type": "Technical",
			},
		)

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.user.refresh_from_db()
		profile = AccountProfile.objects.get(user=self.user)
		self.assertEqual(self.user.first_name, "Benjamin")
		self.assertEqual(self.user.email, "benjamin@example.com")
		self.assertEqual(profile.target_role, "Django Developer")
		self.assertEqual(profile.preferred_interview_type, "Technical")

	def test_profile_rejects_unknown_preference_values(self):
		response = self.client.put(
			"/api/accounts/profile/",
			{"experience_level": "Expert beyond choices"},
		)

		self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

	def test_profile_requires_authentication(self):
		self.client.force_authenticate(user=None)

		response = self.client.get("/api/accounts/profile/")

		self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
