from django.contrib.auth.models import User
from django.db import models


class AccountProfile(models.Model):
    EXPERIENCE_LEVELS = (
        ('Student', 'Student'),
        ('Junior', 'Junior'),
        ('Mid-level', 'Mid-level'),
        ('Senior', 'Senior'),
    )
    INTERVIEW_TYPES = (
        ('Technical', 'Technical'),
        ('Behavioral', 'Behavioral'),
        ('HR', 'HR'),
        ('Mixed', 'Mixed'),
    )

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='account_profile')
    field_of_study = models.CharField(max_length=120, blank=True, default='Computer Science')
    target_role = models.CharField(max_length=100, blank=True, default='')
    experience_level = models.CharField(max_length=20, choices=EXPERIENCE_LEVELS, default='Junior')
    preferred_interview_type = models.CharField(max_length=20, choices=INTERVIEW_TYPES, default='Technical')

    def __str__(self):
        return f"{self.user.username}'s profile"
