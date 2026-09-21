import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

import fitz  # PyMuPDF
from ai_services.gemini import model


def _extract_docx_text(file_path):
    try:
        with zipfile.ZipFile(file_path) as archive:
            content = archive.read("word/document.xml")
    except Exception:
        return ""

    try:
        root = ET.fromstring(content)
        ns = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
        paragraphs = []

        for paragraph in root.findall(".//w:p", ns):
            texts = [node.text for node in paragraph.findall(".//w:t", ns) if node.text]
            if texts:
                paragraphs.append("".join(texts))

        return "\n".join(paragraphs)
    except Exception:
        return ""


def extract_text_from_pdf(file_path):
    extension = Path(file_path).suffix.lower()

    if extension == ".docx":
        return _extract_docx_text(file_path)

    if extension == ".doc":
        return "Please convert the .doc file to PDF or .docx before uploading."

    if extension != ".pdf":
        try:
            return Path(file_path).read_text(encoding="utf-8", errors="ignore")
        except Exception:
            return ""

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