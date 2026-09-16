from django.shortcuts import render
import json

from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Resume
from .utils import extract_text_from_pdf
from ai_services.gemini import analyze_resume
from .utils import analyze_resume as analyze_resume_local
# Create your views here.


class ResumeUploadView(APIView):
	permission_classes = [IsAuthenticated]

	def post(self, request):
		file = request.FILES.get("file")

		if not file:
			return Response({"error": "File required"}, status=400)

		# Save file
		resume = Resume.objects.create(
			user=request.user,
			file=file
		)

		# Extract text
		text = extract_text_from_pdf(resume.file.path)

		# AI analysis
		# Prefer local analyzer if available
		try:
			result = analyze_resume_local(text)
		except Exception:
			result = analyze_resume(text)

		# Parse JSON safely
		try:
			data = json.loads(result)
		except Exception:
			return Response({"error": "AI returned invalid JSON", "raw": result}, status=500)

		# Save analysis
		resume.analysis = result
		resume.save()

		return Response({
			"id": resume.id,
			"analysis": data
		})
