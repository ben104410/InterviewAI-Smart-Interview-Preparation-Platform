from django.urls import path
from .views import (
    StartInterviewView,
    InterviewChatView,
    InterviewStatsView,
    GenerateQuestionView,
    EvaluateAnswerView,
    InterviewHistoryView,
)

urlpatterns = [
    path("start/", StartInterviewView.as_view()),
    path("generate/", GenerateQuestionView.as_view()),
    path("evaluate/", EvaluateAnswerView.as_view()),
    path("chat/", InterviewChatView.as_view()),
    path("history/", InterviewHistoryView.as_view()),
    path("stats/", InterviewStatsView.as_view()),
]