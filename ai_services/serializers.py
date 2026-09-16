from rest_framework import serializers


class GenerateQuestionSerializer(serializers.Serializer):
    role = serializers.CharField(max_length=100)


class EvaluateAnswerSerializer(serializers.Serializer):
    interview_id = serializers.IntegerField()
    answer = serializers.CharField()


class FollowUpSerializer(serializers.Serializer):
    interview_id = serializers.IntegerField()
    answer = serializers.CharField()


class AIResponseSerializer(serializers.Serializer):
    status = serializers.CharField()
    message = serializers.CharField(required=False, allow_blank=True)
