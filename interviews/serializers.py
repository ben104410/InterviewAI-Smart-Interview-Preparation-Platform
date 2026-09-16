from rest_framework import serializers
from .models import Interview


class InterviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Interview
        fields = '__all__'
        read_only_fields = ['user']