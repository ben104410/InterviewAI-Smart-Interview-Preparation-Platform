import json
import random
import re
import time

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


def _random_choice(options):
    return random.choice(options)


def _fallback_question(role):
    clean_role = (role or "candidate").strip() or "candidate"
    templates = [
        f"Tell me about a project where you used your {clean_role} skills to solve a real problem and explain the impact of your work.",
        f"Describe a time you had to make a difficult decision in a {clean_role} role. What was the situation, and what did you do?",
        f"How have you handled ambiguity or changing priorities in a {clean_role} project, and what was the result?",
        f"Walk me through a challenge you faced in a {clean_role} task and how you prioritized the work to deliver value.",
        f"Give an example of a measurable improvement you delivered in a {clean_role} project and how you tracked its success.",
    ]
    return _random_choice(templates)


def _fallback_feedback(answer):
    answer_text = (answer or "").strip()
    if len(answer_text) < 40:
        variants = [
            {
                "feedback": "Your answer is brief. Add more specifics, concrete examples, and the outcome of your work.",
                "score": 6,
                "improvements": "Include a project example, your responsibilities, and the measurable result.",
            },
            {
                "feedback": "The answer is a good start, but it needs more depth and a clearer example of your contribution.",
                "score": 7,
                "improvements": "Explain your role, key decisions, and the result using a structured example.",
            },
            {
                "feedback": "You have potential here, but the response would be stronger with more concrete evidence and business impact.",
                "score": 5,
                "improvements": "Share one detailed story, mention trade-offs, and quantify the outcome.",
            },
        ]
        return _random_choice(variants)

    variants = [
        {
            "feedback": "You gave a reasonable answer with a clear direction. Strengthen it by adding specific examples and measurable impact.",
            "score": 8,
            "improvements": "Use the STAR structure and quantify your achievements with metrics and outcomes.",
        },
        {
            "feedback": "Your answer shows good awareness and structure. To make it stronger, connect your actions directly to measurable results.",
            "score": 9,
            "improvements": "Describe the challenge, the decisions you made, and the impact on the team or business.",
        },
        {
            "feedback": "This was a solid answer with relevant context. Add a sharper example of ownership and the outcome to make it stand out.",
            "score": 8,
            "improvements": "Be more explicit about your contribution and the business value created.",
        },
    ]
    return _random_choice(variants)


def _variation_seed(prefix=""):
    choices = [
        "problem-solving",
        "leadership",
        "technical-depth",
        "teamwork",
        "stakeholder-impact",
        "decision-making",
    ]
    index = int(time.time() * 1000) % len(choices)
    return f"{prefix}{choices[index]}" if prefix else choices[index]


def _generation_config():
    config = {
        "temperature": 0.9,
        "top_p": 0.9,
        "top_k": 40,
        "max_output_tokens": 256,
    }

    if genai is not None and hasattr(genai, "types") and hasattr(genai.types, "GenerationConfig"):
        try:
            return genai.types.GenerationConfig(**config)
        except Exception:
            return config
    return config


def _call_model(prompt):
    if model is None:
        raise RuntimeError("Gemini model is unavailable because no valid API key was configured.")

    try:
        return model.generate_content(prompt, generation_config=_generation_config())
    except TypeError:
        return model.generate_content(prompt)


def generate_interview_question(role):
    variation = _variation_seed("angle-")
    prompt = f"""
You are an expert technical interviewer.

Generate ONE unique interview question for a {role} position.
Use a different angle from standard interview questions and keep it realistic.
Variation focus: {variation}

Rules:
- Return only the question
- No numbering
- No explanation
- Make it original and specific to the role
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

    variation = _variation_seed("evaluation-")
    prompt = f"""
You are an expert technical interviewer and grader.

Role: {role or 'general'}
Question: {question}
Candidate Answer: {answer}
Evaluation emphasis: {variation}

Return STRICT JSON in this format:
{{
  "feedback": "short constructive feedback",
  "score": 0,
  "improvements": "what the candidate should improve"
}}

Rules:
- Score from 0 to 100
- Be fair and professional
- Keep the feedback specific and original
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
    variation = _variation_seed("followup-")
    prompt = f"""
You are a senior technical interviewer.

Based on the candidate's answer, generate a FOLLOW-UP question.
Make it distinctive and not a generic repetition of the original theme.

Role: {role}
Question: {question}
Answer: {answer}
Variation focus: {variation}

Rules:
- Ask only ONE follow-up question
- Make it deeper or challenging
- Make it feel fresh and specific to that answer
- No explanation, only question
"""

    try:
        response = _call_model(prompt)
        return response.text.strip()
    except Exception:
        followups = [
            "What trade-offs did you consider while implementing this solution, and how did you decide on the final approach?",
            "If you had to do this again, what would you improve and why?",
            "How did you measure success for this work, and what signals told you it was effective?",
            "What was the hardest constraint in this situation, and how did you work around it?",
            "Looking back, what would you change in your approach and what did you learn from it?",
        ]
        return _random_choice(followups)