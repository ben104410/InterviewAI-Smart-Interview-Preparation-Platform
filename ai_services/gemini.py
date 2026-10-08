import json
import re

import google.generativeai as genai
from django.conf import settings

if settings.GEMINI_API_KEY:
    genai.configure(api_key=settings.GEMINI_API_KEY)

model = genai.GenerativeModel('gemini-2.5-flash')


def _extract_json_response(text, fallback_key='feedback'):
    if not text:
        return {'feedback': '', 'score': 0, 'improvements': ''}

    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        match = re.search(r'\{.*\}', text, re.S)
        if not match:
            return {'feedback': text.strip(), 'score': 0, 'improvements': ''}
        try:
            data = json.loads(match.group(0))
        except json.JSONDecodeError:
            return {'feedback': text.strip(), 'score': 0, 'improvements': ''}

    feedback = str(data.get('feedback') or data.get('summary') or '').strip()
    score = data.get('score', 0)
    try:
        score = int(score)
    except (TypeError, ValueError):
        score = 0

    return {
        'feedback': feedback,
        'score': score,
        'improvements': data.get('improvements', ''),
    }


def generate_interview_question(role):
    prompt = f'''
You are an expert technical interviewer.

Generate ONE clear interview question for a {role} position.

Rules:
- Return only the question
- No numbering
- No explanation
'''
    response = model.generate_content(prompt)
    return response.text.strip()


def evaluate_answer(*args, **kwargs):
    if len(args) == 2:
        question, answer = args
        role = kwargs.get('role')
    elif len(args) == 3:
        role, question, answer = args
    else:
        question = kwargs.get('question')
        answer = kwargs.get('answer')
        role = kwargs.get('role')

    if question is None or answer is None:
        raise ValueError('Question and answer are required.')

    if role is None:
        prompt = f'''
You are an expert technical interviewer and grader.

Evaluate the candidate's answer to the question below and return a JSON object with two keys:
- "feedback": a short, constructive feedback string
- "score": an integer between 0 and 100

Return ONLY the JSON object and no additional text.

Question:
{question}

Answer:
{answer}
'''
    else:
        prompt = f'''
You are a senior technical interviewer.

Evaluate this interview response.

Role: {role}

Question: {question}

Candidate Answer: {answer}

Return STRICT JSON in this format:
{{
  "score": out of 10,
  "feedback": "detailed feedback",
  "improvements": "what the candidate should improve"
}}

Rules:
- Be strict but fair
- Score based on correctness, clarity, and depth
- Return ONLY JSON, no extra text
'''

    response = model.generate_content(prompt)
    text = response.text.strip()
    return _extract_json_response(text, fallback_key='feedback')


def analyze_resume(text):
    prompt = f'''
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
'''
    response = model.generate_content(prompt)
    return response.text.strip()


def generate_followup(role, question, answer, variation=''):
    prompt = f'''
You are a senior technical interviewer.

Based on the candidate's answer, generate a FOLLOW-UP question.

Role: {role}
Question: {question}
Answer: {answer}
Variation focus: {variation}

Rules:
- Ask only ONE follow-up question
- Make it deeper or challenging
- No explanation, only question
'''
    response = model.generate_content(prompt)
    return response.text.strip()
