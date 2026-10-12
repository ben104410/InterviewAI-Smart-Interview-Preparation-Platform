import json
import logging

from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from ai_services.gemini import analyze_resume
from .models import Resume
from .utils import extract_text_from_pdf

logger = logging.getLogger(__name__)


class ResumeUploadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        file = request.FILES.get('file')
        if not file:
            return Response({'error': 'File required'}, status=400)

        resume = Resume.objects.create(user=request.user, file=file)
        text = extract_text_from_pdf(resume.file.path)

        try:
            result = analyze_resume(text)
            data = json.loads(result)
        except Exception:
            logger.exception("Resume analysis failed for resume %s", resume.pk)
            return Response({'error': 'AI analysis failed'}, status=500)

        resume.analysis = result
        resume.save()

        return Response({
            'id': resume.id,
            'analysis': data,
        })
