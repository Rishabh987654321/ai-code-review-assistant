from django.db import models
from django.conf import settings
from django.contrib.auth.models import (
    AbstractBaseUser,
    PermissionsMixin,
    BaseUserManager,
)

class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Email is required")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        return self.create_user(email, password, **extra_fields)



class CodeSubmission(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="submissions"
    )
    LANGUAGE_CHOICES = [
        ("python", "Python"),
        ("javascript", "JavaScript"),
        ("cpp", "C++"),
        ("java", "Java"),
        ("sql", "SQL"),
    ]
    language = models.CharField(max_length=20, choices=LANGUAGE_CHOICES)
    code = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.language} submission ({self.id})"
