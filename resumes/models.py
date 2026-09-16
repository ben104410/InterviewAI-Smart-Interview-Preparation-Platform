from django.db import models
from django.contrib.auth.models import User


class Resume(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    file = models.FileField(upload_to="resumes/")
    analysis = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} resume"