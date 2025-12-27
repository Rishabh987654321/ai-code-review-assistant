from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django_ratelimit.decorators import ratelimit
from django.utils.decorators import method_decorator
from allauth.socialaccount.models import SocialAccount, SocialToken, SocialApp
from .models import GitHubProfile
from .services import get_github_repos, get_github_repo_contents, get_github_file_content


def get_github_token(github_account):
    """
    Helper function to get GitHub access token from SocialToken.
    Handles different ways the token might be stored.
    Falls back to GitHubProfile if SocialToken is not available.
    
    For multiple GitHub accounts, we MUST use SocialToken as GitHubProfile
    only stores the latest account (OneToOneField limitation).
    """
    try:
        # First try: get by app provider (most reliable for multiple accounts)
        github_app = SocialApp.objects.filter(provider="github").first()
        if github_app:
            social_token = SocialToken.objects.filter(
                account=github_account,
                app=github_app
            ).first()
            if social_token and social_token.token:
                return social_token.token
        
        # Second try: get any token for this account (fallback)
        social_token = SocialToken.objects.filter(
            account=github_account
        ).first()
        if social_token and social_token.token:
            return social_token.token
        
        # Third try: fallback to GitHubProfile (for backward compatibility)
        # WARNING: This only works if the requested account is the latest one connected
        # because GitHubProfile has OneToOneField and only stores the last account
        try:
            github_profile = GitHubProfile.objects.get(
                user=github_account.user
            )
            # Only use if the github_id matches (for multiple accounts, this won't work)
            if github_profile.github_id == github_account.uid and github_profile.access_token:
                return github_profile.access_token
        except GitHubProfile.DoesNotExist:
            pass
        except Exception:
            pass
        
        # If we get here, the token doesn't exist - this shouldn't happen if signal worked
        # Log for debugging
        import logging
        logger = logging.getLogger(__name__)
        logger.warning(
            f"GitHub token not found for account {github_account.uid} (user: {github_account.user.email}). "
            f"SocialToken exists: {SocialToken.objects.filter(account=github_account).exists()}"
        )
        
        return None
    except Exception as e:
        # Log error for debugging
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error getting GitHub token: {str(e)}")
        return None


class GitHubReposView(APIView):
    """View to fetch user's GitHub repositories."""
    permission_classes = [IsAuthenticated]

    @method_decorator(ratelimit(key='user', rate='30/m', method='GET'))
    def get(self, request):
        """Get list of user's GitHub repositories."""
        # Get GitHub account UID from query params (optional - defaults to first)
        github_uid = request.query_params.get("github_uid")
        
        # Get the specific GitHub account
        try:
            if github_uid:
                # Use specific GitHub account
                github_account = SocialAccount.objects.get(
                    user=request.user,
                    provider="github",
                    uid=github_uid
                )
            else:
                # Use first available GitHub account
                github_account = SocialAccount.objects.filter(
                    user=request.user,
                    provider="github"
                ).first()
                
                if not github_account:
                    return Response(
                        {"error": "GitHub account not connected. Please connect your GitHub account first."},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            # Get access token
            access_token = get_github_token(github_account)
            if not access_token:
                # For accounts connected before the signal fix, try to create SocialToken from GitHubProfile
                # This is a one-time fix for existing accounts
                try:
                    github_profile = GitHubProfile.objects.get(user=request.user)
                    if github_profile.github_id == github_account.uid and github_profile.access_token:
                        # Create SocialToken from GitHubProfile
                        github_app = SocialApp.objects.filter(provider="github").first()
                        if github_app:
                            SocialToken.objects.update_or_create(
                                account=github_account,
                                app=github_app,
                                defaults={"token": github_profile.access_token}
                            )
                            access_token = github_profile.access_token
                except GitHubProfile.DoesNotExist:
                    pass
                
                if not access_token:
                    return Response(
                        {
                            "error": "GitHub access token not found. Please disconnect and reconnect this GitHub account.",
                            "account_uid": github_account.uid,
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )
        except SocialAccount.DoesNotExist:
            return Response(
                {"error": "GitHub account not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        try:
            repos = get_github_repos(access_token)
            
            # Format response
            formatted_repos = []
            for repo in repos:
                formatted_repos.append({
                    "id": repo.get("id"),
                    "name": repo.get("name"),
                    "full_name": repo.get("full_name"),
                    "private": repo.get("private", False),
                    "description": repo.get("description", ""),
                    "language": repo.get("language", ""),
                    "html_url": repo.get("html_url"),
                    "clone_url": repo.get("clone_url"),
                    "default_branch": repo.get("default_branch", "main"),
                    "updated_at": repo.get("updated_at"),
                })
            
            return Response(formatted_repos)
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class GitHubRepoContentsView(APIView):
    """View to fetch contents of a GitHub repository."""
    permission_classes = [IsAuthenticated]

    @method_decorator(ratelimit(key='user', rate='30/m', method='GET'))
    def get(self, request, owner, repo):
        """Get contents of a GitHub repository."""
        path = request.query_params.get("path", "")
        github_uid = request.query_params.get("github_uid")
        
        # Get the specific GitHub account
        try:
            if github_uid:
                github_account = SocialAccount.objects.get(
                    user=request.user,
                    provider="github",
                    uid=github_uid
                )
            else:
                github_account = SocialAccount.objects.filter(
                    user=request.user,
                    provider="github"
                ).first()
                
                if not github_account:
                    return Response(
                        {"error": "GitHub account not connected."},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            # Get access token
            access_token = get_github_token(github_account)
            if not access_token:
                return Response(
                    {"error": "GitHub access token not found. Please reconnect your GitHub account."},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except SocialAccount.DoesNotExist:
            return Response(
                {"error": "GitHub account not connected."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            contents = get_github_repo_contents(
                access_token,
                owner,
                repo,
                path
            )
            return Response(contents)
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class GitHubFileContentView(APIView):
    """View to fetch content of a specific file from GitHub."""
    permission_classes = [IsAuthenticated]

    @method_decorator(ratelimit(key='user', rate='30/m', method='GET'))
    def get(self, request, owner, repo):
        """Get content of a specific file."""
        path = request.query_params.get("path")
        github_uid = request.query_params.get("github_uid")
        
        if not path:
            return Response(
                {"error": "Path parameter is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get the specific GitHub account
        try:
            if github_uid:
                github_account = SocialAccount.objects.get(
                    user=request.user,
                    provider="github",
                    uid=github_uid
                )
            else:
                github_account = SocialAccount.objects.filter(
                    user=request.user,
                    provider="github"
                ).first()
                
                if not github_account:
                    return Response(
                        {"error": "GitHub account not connected."},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            # Get access token
            access_token = get_github_token(github_account)
            if not access_token:
                return Response(
                    {"error": "GitHub access token not found. Please reconnect your GitHub account."},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except SocialAccount.DoesNotExist:
            return Response(
                {"error": "GitHub account not connected."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            content = get_github_file_content(
                access_token,
                owner,
                repo,
                path
            )
            return Response({
                "content": content,
                "path": path,
            })
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class GitHubConnectionStatusView(APIView):
    """View to check if user has connected GitHub account(s)."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Check GitHub connection status and list all connected accounts."""
        github_accounts = SocialAccount.objects.filter(
            user=request.user,
            provider="github"
        )
        
        if not github_accounts.exists():
            return Response({
                "connected": False,
                "accounts": [],
            })
        
        accounts_list = []
        for acc in github_accounts:
            extra_data = acc.extra_data or {}
            accounts_list.append({
                "uid": acc.uid,
                "username": extra_data.get("login", ""),
                "email": extra_data.get("email", ""),
                "avatar_url": extra_data.get("avatar_url", ""),
            })
        
        return Response({
            "connected": True,
            "accounts": accounts_list,
        })

