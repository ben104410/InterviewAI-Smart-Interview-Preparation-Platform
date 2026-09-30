from django.db import models
from django.contrib.auth.models import User


class Interview(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, default=1)
    role = models.CharField(max_length=100)

    question = models.TextField()
    answer = models.TextField(blank=True, null=True)

    feedback = models.TextField(blank=True, null=True)
    score = models.IntegerField(default=0)

    is_followup = models.BooleanField(default=False)

    parent = models.ForeignKey(
        'self',
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name='followups'
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.role} - {self.user.username}" if self.user_id else self.role
