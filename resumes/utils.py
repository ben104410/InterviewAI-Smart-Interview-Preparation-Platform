import fitz  # PyMuPDF
from ai_services.gemini import model


def extract_text_from_pdf(file_path):
    doc = fitz.open(file_path)
    text = ""

    for page in doc:
        text += page.get_text()

    return text


def analyze_resume(text):
    prompt = f"""
You are a professional HR recruiter and career advisor.

Analyze this resume:

{text}

Return STRICT JSON:
{
  "summary": "short summary of candidate",
  "strengths": "key strengths",
  "weaknesses": "missing skills or gaps",
  "suggestions": "how to improve resume",
  "job_roles": "best suitable job roles"
}

Rules:
- Be honest and professional
- Return ONLY JSON
"""

    response = model.generate_content(prompt)
    return response.text.strip()