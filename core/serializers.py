from rest_framework import serializers
from .models import CodeSubmission, Repository, RepoSync
from dj_rest_auth.registration.serializers import RegisterSerializer

class CodeSubmissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = CodeSubmission
        fields = "__all__"
        read_only_fields = ["user", "created_at"]


class RepoSyncSerializer(serializers.ModelSerializer):
    """Serializer for repository sync status."""
    class Meta:
        model = RepoSync
        fields = [
            "status", "last_synced", "last_sync_error",
            "files_count", "branches_count", "updated_at"
        ]
        read_only_fields = [
            "status", "last_synced", "last_sync_error",
            "files_count", "branches_count", "updated_at"
        ]


class RepositorySerializer(serializers.ModelSerializer):
    """Serializer for Repository model."""
    sync_status = RepoSyncSerializer(read_only=True)
    
    class Meta:
        model = Repository
        fields = [
            "id", "provider", "provider_account_id",
            "repo_id", "owner", "name", "full_name",
            "default_branch", "description", "private",
            "language", "html_url", "created_at", "updated_at",
            "sync_status"
        ]
        read_only_fields = [
            "id", "created_at", "updated_at", "sync_status"
        ]
    
    def validate(self, data):
        """Ensure provider_account_id exists for the user."""
        # Only validate if provider_account_id is being set
        if 'provider_account_id' in data:
            user = self.context['request'].user
            provider_account_id = data.get('provider_account_id')
            
            if provider_account_id:
                from allauth.socialaccount.models import SocialAccount
                try:
                    SocialAccount.objects.get(
                        user=user,
                        provider=data.get('provider', 'github'),
                        uid=provider_account_id
                    )
                except SocialAccount.DoesNotExist:
                    raise serializers.ValidationError(
                        f"GitHub account with UID {provider_account_id} not found. "
                        "Please connect this GitHub account first."
                    )
        
        return data





class CustomRegisterSerializer(RegisterSerializer):
    email = serializers.EmailField(required=True)

    def get_cleaned_data(self):
        return {
            "email": self.validated_data.get("email", ""),
            "password1": self.validated_data.get("password1", ""),
        }
