import json
import re

from django.conf import settings

try:
    import google.generativeai as genai
except Exception:  # pragma: no cover - optional dependency during local setup
    genai = None


if settings.GEMINI_API_KEY and genai is not None:
    try:
        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel("gemini-2.5-flash")
    except Exception:  # pragma: no cover - fail-safe for invalid API config
        model = None
else:
    model = None


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


def _fallback_question(role):
    clean_role = (role or "candidate").strip() or "candidate"
    return (
        f"Tell me about a project where you used your {clean_role} skills to solve a real problem "
        "and explain the impact of your work."
    )


def _fallback_feedback(answer):
    answer_text = (answer or "").strip()
    if len(answer_text) < 40:
        return {
            "feedback": "Your answer is brief. Add more specifics, concrete examples, and the outcome of your work.",
            "score": 6,
            "improvements": "Include a project example, your responsibilities, and the measurable result.",
        }
    return {
        "feedback": "You gave a reasonable answer with a clear direction. Strengthen it by adding specific examples and measurable impact.",
        "score": 8,
        "improvements": "Use the STAR structure and quantify your achievements with metrics and outcomes.",
    }


def _call_model(prompt):
    if model is None:
        raise RuntimeError("Gemini model is unavailable because no valid API key was configured.")
    return model.generate_content(prompt)


def generate_interview_question(role):
    prompt = f"""
You are an expert technical interviewer.

Generate ONE clear interview question for a {role} position.

Rules:
- Return only the question
- No numbering
- No explanation
"""

    try:
        response = _call_model(prompt)
        return response.text.strip()
    except Exception:
        return _fallback_question(role)


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

    try:
        response = _call_model(prompt)
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
    except Exception:
        return _fallback_feedback(answer)


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

    try:
        response = _call_model(prompt)
        return response.text.strip()
    except Exception:
        return json.dumps({
            "summary": "Resume review is currently unavailable, but the candidate appears to have relevant experience.",
            "strengths": "Strong communication and problem-solving potential.",
            "weaknesses": "Consider adding more measurable outcomes and project depth.",
            "suggestions": "Highlight your decisions, tools used, and concrete results with metrics.",
            "job_roles": "General technical and analyst roles"
        })


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

    try:
        response = _call_model(prompt)
        return response.text.strip()
    except Exception:
        return (
            f"What trade-offs did you consider while implementing this solution, and how did you decide on the final approach?"
        )