from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models
from django.utils import timezone
from django.conf import settings
from .manager import UserManager


class User(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True, null=True, blank=True)
    phone_number = models.CharField(max_length=15, unique=True, null=True, blank=True)

    # Profile fields
    first_name = models.CharField(max_length=150, blank=True)
    last_name = models.CharField(max_length=150, blank=True)
    profile_picture = models.ImageField(upload_to='profile_pictures/', blank=True, null=True)
    bio = models.TextField(blank=True, max_length=500)
    role = models.CharField(max_length=100, blank=True)

    is_google_account = models.BooleanField(default=False)
    is_phone_verified = models.BooleanField(default=False)

    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    date_joined = models.DateTimeField(default=timezone.now)
    last_login = models.DateTimeField(null=True, blank=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    objects = UserManager()

    def __str__(self):
        return self.email or self.phone_number

    @property
    def full_name(self):
        if self.first_name or self.last_name:
            return f"{self.first_name} {self.last_name}".strip()
        return self.email or "User"


class GitHubProfile(models.Model):
    """Store GitHub account information and access token for repo access."""
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="github_profile"
    )
    github_id = models.CharField(max_length=255, unique=True)
    username = models.CharField(max_length=255)
    access_token = models.TextField()  # Encrypted in production
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"GitHub: {self.username} ({self.user.email})"


class ConnectedAccount(models.Model):
    """
    Helper model to track and label connected OAuth accounts.
    Improves UX by allowing users to name their accounts.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="connected_accounts"
    )
    provider = models.CharField(max_length=50)  # github, google
    provider_uid = models.CharField(max_length=255)
    label = models.CharField(max_length=100, blank=True)  # "Work GitHub", "Personal"
    last_used = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [['user', 'provider', 'provider_uid']]

    def __str__(self):
        return f"{self.provider}: {self.label or self.provider_uid} ({self.user.email})"
