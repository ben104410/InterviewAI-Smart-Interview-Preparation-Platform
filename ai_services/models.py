from django.db import models
from django.db import models
from django.contrib.auth.models import User


class Interview(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='interviews'
    )

    role = models.CharField(max_length=100)

    question = models.TextField()

    answer = models.TextField(
        blank=True,
        null=True
    )

    feedback = models.TextField(
        blank=True,
        null=True
    )

    score = models.IntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.role}"
# Create your models here.
