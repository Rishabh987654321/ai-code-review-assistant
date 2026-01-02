from django.db import models
from django.conf import settings
from django.contrib.auth.models import (
    AbstractBaseUser,
    PermissionsMixin,
    BaseUserManager,
)
from django.utils import timezone

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


class Repository(models.Model):
    """
    Stores imported repositories from GitHub (or other providers).
    Links to the specific GitHub account used for access.
    """
    PROVIDER_CHOICES = [
        ("github", "GitHub"),
        # Future: ("gitlab", "GitLab"), ("bitbucket", "Bitbucket")
    ]
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="repositories"
    )
    provider = models.CharField(max_length=20, choices=PROVIDER_CHOICES, default="github")
    
    # Links to the specific GitHub account (SocialAccount.uid) used to import this repo
    # This allows users to have multiple GitHub accounts and select which one to use
    provider_account_id = models.CharField(
        max_length=255,
        help_text="GitHub account UID (from SocialAccount) that has access to this repo"
    )

    # GitHub repo identifiers
    repo_id = models.CharField(
        max_length=255,
        help_text="GitHub repository ID (numeric)"
    )
    owner = models.CharField(
        max_length=255,
        help_text="Repository owner (username or organization)"
    )
    name = models.CharField(max_length=255, help_text="Repository name")
    full_name = models.CharField(
        max_length=500,
        help_text="Full repository name (owner/repo)"
    )
    default_branch = models.CharField(max_length=255, default="main")
    
    # Metadata
    description = models.TextField(blank=True)
    private = models.BooleanField(default=False)
    language = models.CharField(max_length=100, blank=True)
    html_url = models.URLField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name_plural = "Repositories"
        unique_together = [['user', 'provider', 'repo_id']]
        indexes = [
            models.Index(fields=['user', 'provider']),
            models.Index(fields=['provider_account_id']),
        ]
    
    def __str__(self):
        return f"{self.full_name} ({self.user.email})"


class RepoSync(models.Model):
    """
    Tracks synchronization status for repositories.
    Used to know when to refresh repo data from GitHub API.
    """
    SYNC_STATUS_CHOICES = [
        ("pending", "Pending"),
        ("syncing", "Syncing"),
        ("success", "Success"),
        ("failed", "Failed"),
    ]
    
    repository = models.OneToOneField(
        Repository,
        on_delete=models.CASCADE,
        related_name="sync_status"
    )
    status = models.CharField(
        max_length=20,
        choices=SYNC_STATUS_CHOICES,
        default="pending"
    )
    last_synced = models.DateTimeField(null=True, blank=True)
    last_sync_error = models.TextField(blank=True, help_text="Error message if sync failed")
    
    # Track what was synced
    files_count = models.IntegerField(default=0, help_text="Number of files in last sync")
    branches_count = models.IntegerField(default=0, help_text="Number of branches tracked")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name_plural = "Repository Syncs"
    
    def __str__(self):
        return f"{self.repository.full_name} - {self.status}"
    
    def mark_syncing(self):
        """Mark sync as in progress."""
        self.status = "syncing"
        self.save(update_fields=['status', 'updated_at'])
    
    def mark_success(self, files_count=0, branches_count=0):
        """Mark sync as successful."""
        self.status = "success"
        self.last_synced = timezone.now()
        self.files_count = files_count
        self.branches_count = branches_count
        self.last_sync_error = ""
        self.save(update_fields=['status', 'last_synced', 'files_count', 'branches_count', 'last_sync_error', 'updated_at'])
    
    def mark_failed(self, error_message):
        """Mark sync as failed with error message."""
        self.status = "failed"
        self.last_sync_error = str(error_message)[:500]  # Limit error length
        self.save(update_fields=['status', 'last_sync_error', 'updated_at'])
