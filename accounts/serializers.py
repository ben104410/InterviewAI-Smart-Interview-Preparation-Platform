from rest_framework import serializers
from django.contrib.auth.models import User
from .models import AccountProfile


class AccountProfileSerializer(serializers.Serializer):
    username = serializers.CharField(read_only=True)
    email = serializers.EmailField()
    first_name = serializers.CharField(max_length=150, allow_blank=True, required=False)
    last_name = serializers.CharField(max_length=150, allow_blank=True, required=False)
    field_of_study = serializers.CharField(max_length=120, allow_blank=True, required=False)
    target_role = serializers.CharField(max_length=100, allow_blank=True, required=False)
    experience_level = serializers.ChoiceField(
        choices=AccountProfile.EXPERIENCE_LEVELS,
        required=False,
    )
    preferred_interview_type = serializers.ChoiceField(
        choices=AccountProfile.INTERVIEW_TYPES,
        required=False,
    )

    def to_representation(self, instance):
        profile, _ = AccountProfile.objects.get_or_create(user=instance)
        return {
            "username": instance.username,
            "email": instance.email,
            "first_name": instance.first_name,
            "last_name": instance.last_name,
            "field_of_study": profile.field_of_study,
            "target_role": profile.target_role,
            "experience_level": profile.experience_level,
            "preferred_interview_type": profile.preferred_interview_type,
        }

    def update(self, instance, validated_data):
        profile_fields = {
            "field_of_study",
            "target_role",
            "experience_level",
            "preferred_interview_type",
        }
        user_fields = []

        for field, value in validated_data.items():
            if field in profile_fields:
                continue
            setattr(instance, field, value)
            user_fields.append(field)

        if user_fields:
            instance.save(update_fields=user_fields)

        profile, _ = AccountProfile.objects.get_or_create(user=instance)
        for field in profile_fields.intersection(validated_data):
            setattr(profile, field, validated_data[field])
        if profile_fields.intersection(validated_data):
            profile.save()

        return instance

    def create(self, validated_data):
        raise NotImplementedError("Profile records are updated, not created through this serializer.")

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password']

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        return user