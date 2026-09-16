import json
import re

import google.generativeai as genai
from django.conf import settings

# Configure using `GEMINI_API_KEY` from Django settings
genai.configure(api_key=settings.GEMINI_API_KEY)

model = genai.GenerativeModel("gemini-2.5-flash")


def _extract_json_object(text):
    try:
        return json.loads(text)
    except (TypeError, ValueError):
        match = re.search(r"\{.*\}", text, re.S)
        if match:
            try:
                return json.loads(match.group(0))
            except (TypeError, ValueError):
                pass
    return {}


def generate_interview_question(role):
    prompt = f"""
You are an expert technical interviewer.

Generate ONE clear interview question for a {role} position.

Rules:
- Return only the question
- No numbering
- No explanation
"""

    response = model.generate_content(prompt)
    return response.text.strip()


def evaluate_answer(*args, **kwargs):
    """Support both call styles:
    evaluate_answer(question, answer)
    evaluate_answer(role, question, answer)
    """
    if len(args) == 2:
        question, answer = args
        role = kwargs.get("role")
    elif len(args) == 3:
        role, question, answer = args
    else:
        raise TypeError("evaluate_answer expects either (question, answer) or (role, question, answer)")

    prompt = f"""
You are an expert technical interviewer and grader.

Role: {role or 'general'}
Question: {question}
Candidate Answer: {answer}

Return STRICT JSON in this format:
{{
  "feedback": "short constructive feedback",
  "score": 0,
  "improvements": "what the candidate should improve"
}}

Rules:
- Score from 0 to 100
- Be fair and professional
- Return ONLY JSON
"""

    response = model.generate_content(prompt)
    text = response.text.strip()
    data = _extract_json_object(text)

    if not data:
        return {
            "feedback": text,
            "score": 0,
            "improvements": "Keep practicing and provide a more detailed answer."
        }

    return {
        "feedback": str(data.get("feedback", "Good effort. Keep improving.")).strip(),
        "score": int(data.get("score", 0)),
        "improvements": str(data.get("improvements", "Keep practicing and provide examples.")).strip(),
    }


def analyze_resume(text):
    prompt = f"""
You are a professional HR recruiter and career advisor.

Analyze this resume:

{text}

Return STRICT JSON:
{{
  "summary": "short summary of candidate",
  "strengths": "key strengths",
  "weaknesses": "missing skills or gaps",
  "suggestions": "how to improve resume",
  "job_roles": "best suitable job roles"
}}

Rules:
- Be honest and professional
- Return ONLY JSON
"""

    response = model.generate_content(prompt)
    return response.text.strip()


def generate_followup(role, question, answer):
    prompt = f"""
You are a senior technical interviewer.

Based on the candidate's answer, generate a FOLLOW-UP question.

Role: {role}
Question: {question}
Answer: {answer}

Rules:
- Ask only ONE follow-up question
- Make it deeper or challenging
- No explanation, only question
"""

    response = model.generate_content(prompt)
    return response.text.strip()