import json

from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from ai_services.gemini import analyze_resume
from .models import Resume
from .utils import extract_text_from_pdf


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
            return Response({'error': 'AI analysis failed', 'raw': str(result) if 'result' in locals() else ''}, status=500)

        resume.analysis = result
        resume.save()

        return Response({
            'id': resume.id,
            'analysis': data,
        })
