import zipfile
from pathlib import Path
import xml.etree.ElementTree as ET

import fitz

from ai_services.gemini import analyze_resume as _analyze_resume


def _extract_docx_text(file_path):
    try:
        with zipfile.ZipFile(file_path) as archive:
            content = archive.read('word/document.xml')
    except Exception:
        return ''

    try:
        root = ET.fromstring(content)
        namespace = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
        paragraphs = []

        for paragraph in root.findall('.//w:p', namespace):
            texts = [node.text for node in paragraph.findall('.//w:t', namespace) if node.text]
            if texts:
                paragraphs.append(''.join(texts))

        return '\n'.join(paragraphs)
    except Exception:
        return ''


def extract_text_from_pdf(file_path):
    extension = Path(file_path).suffix.lower()

    if extension == '.docx':
        return _extract_docx_text(file_path)

    if extension == '.doc':
        return 'Please convert the .doc file to PDF or .docx before uploading.'

    if extension != '.pdf':
        try:
            return Path(file_path).read_text(encoding='utf-8', errors='ignore')
        except Exception:
            return ''

    doc = fitz.open(file_path)
    text = ''

    for page in doc:
        text += page.get_text()

    return text


def analyze_resume(text):
    return _analyze_resume(text)