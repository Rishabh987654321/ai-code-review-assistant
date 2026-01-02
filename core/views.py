from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from django_ratelimit.decorators import ratelimit
from django.utils.decorators import method_decorator
import requests

from .models import CodeSubmission, Repository, RepoSync
from .serializers import CodeSubmissionSerializer, RepositorySerializer, RepoSyncSerializer
from .permissions import IsOwnerOrReadOnly
from accounts.github_views import get_github_token
from accounts.services import get_github_file_tree, get_github_diff, should_ignore_path
from allauth.socialaccount.models import SocialAccount


class CodeSubmissionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for CodeSubmission model with CRUD operations.
    Supports filtering, sorting, and pagination.
    """
    serializer_class = CodeSubmissionSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['language', 'created_at']
    search_fields = ['language', 'code']
    ordering_fields = ['created_at', 'language']
    ordering = ['-created_at']  # Default ordering: newest first

    def get_queryset(self):
        """Return submissions for the authenticated user only."""
        return CodeSubmission.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        """Save submission with user and send notification email."""
        submission = serializer.save(user=self.request.user)
        
        # Send email notification
        try:
            send_mail(
                subject='Code Submission Successful',
                message=f'Your {submission.language} code submission was received successfully.\n\nSubmission ID: {submission.id}',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[self.request.user.email],
                fail_silently=True,
            )
        except Exception:
            pass  # Fail silently if email is not configured

    def perform_update(self, serializer):
        """Update submission (only owner can update)."""
        serializer.save()

    def perform_destroy(self, instance):
        """Delete submission (only owner can delete)."""
        instance.delete()


class RepositoryViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Repository model with CRUD operations.
    Allows users to import and manage their GitHub repositories.
    """
    serializer_class = RepositorySerializer
    permission_classes = [IsAuthenticated, IsOwnerOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['provider', 'private', 'language']
    search_fields = ['name', 'full_name', 'description', 'owner']
    ordering_fields = ['created_at', 'updated_at', 'name']
    ordering = ['-created_at']  # Default ordering: newest first

    def get_queryset(self):
        """Return repositories for the authenticated user only."""
        return Repository.objects.filter(user=self.request.user).select_related('sync_status')

    def perform_create(self, serializer):
        """Save repository with user and create sync status."""
        repository = serializer.save(user=self.request.user)
        # Create sync status
        RepoSync.objects.get_or_create(repository=repository)

    @action(detail=True, methods=['post'])
    def sync(self, request, pk=None):
        """Trigger a sync for this repository."""
        repository = self.get_object()
        sync_status, created = RepoSync.objects.get_or_create(repository=repository)
        
        # Mark as syncing
        sync_status.mark_syncing()
        
        # TODO: In Phase 2, this will trigger an async job
        # For now, we'll do a basic sync
        try:
            # Get GitHub token
            github_account = SocialAccount.objects.get(
                user=request.user,
                provider="github",
                uid=repository.provider_account_id
            )
            access_token = get_github_token(github_account)
            
            if not access_token:
                sync_status.mark_failed("GitHub access token not found")
                return Response(
                    {"error": "GitHub access token not found. Please reconnect your GitHub account."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Fetch repo info from GitHub API
            headers = {
                "Authorization": f"token {access_token}",
                "Accept": "application/vnd.github+json",
            }
            repo_response = requests.get(
                f"https://api.github.com/repos/{repository.full_name}",
                headers=headers
            )
            
            if repo_response.status_code == 200:
                repo_data = repo_response.json()
                # Update repository metadata
                repository.default_branch = repo_data.get("default_branch", "main")
                repository.description = repo_data.get("description", "")
                repository.private = repo_data.get("private", False)
                repository.language = repo_data.get("language", "")
                repository.save()
                
                sync_status.mark_success()
                return Response(
                    {"message": "Repository synced successfully", "sync_status": RepoSyncSerializer(sync_status).data},
                    status=status.HTTP_200_OK
                )
            else:
                sync_status.mark_failed(f"GitHub API error: {repo_response.status_code}")
                return Response(
                    {"error": f"Failed to sync repository: {repo_response.status_code}"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except SocialAccount.DoesNotExist:
            sync_status.mark_failed("GitHub account not found")
            return Response(
                {"error": "GitHub account not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            sync_status.mark_failed(str(e))
            return Response(
                {"error": f"Sync failed: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['get'])
    @method_decorator(ratelimit(key='user', rate='30/m', method='GET'))
    def tree(self, request, pk=None):
        """
        Get file tree for this repository.
        
        Query params:
            branch: Branch name (default: repository's default_branch)
            path: Starting path (default: root)
        """
        repository = self.get_object()
        branch = request.query_params.get('branch', repository.default_branch)
        path = request.query_params.get('path', '')
        
        try:
            # Get GitHub token
            github_account = SocialAccount.objects.get(
                user=request.user,
                provider="github",
                uid=repository.provider_account_id
            )
            access_token = get_github_token(github_account)
            
            if not access_token:
                return Response(
                    {"error": "GitHub access token not found. Please reconnect your GitHub account."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Fetch file tree
            tree = get_github_file_tree(
                access_token=access_token,
                owner=repository.owner,
                repo=repository.name,
                branch=branch,
                path=path
            )
            
            return Response({
                "repository": repository.full_name,
                "branch": branch,
                "path": path,
                "tree": tree,
                "count": len(tree)
            }, status=status.HTTP_200_OK)
            
        except SocialAccount.DoesNotExist:
            return Response(
                {"error": "GitHub account not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": f"Failed to fetch file tree: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['get'])
    @method_decorator(ratelimit(key='user', rate='20/m', method='GET'))
    def diff(self, request, pk=None):
        """
        Get diff between two commits/branches.
        
        Query params:
            base: Base branch/commit SHA (required)
            head: Head branch/commit SHA (required, defaults to repository's default_branch)
        """
        repository = self.get_object()
        base = request.query_params.get('base')
        head = request.query_params.get('head', repository.default_branch)
        
        if not base:
            return Response(
                {"error": "Base branch/commit is required. Use ?base=main&head=feature-x"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Get GitHub token
            github_account = SocialAccount.objects.get(
                user=request.user,
                provider="github",
                uid=repository.provider_account_id
            )
            access_token = get_github_token(github_account)
            
            if not access_token:
                return Response(
                    {"error": "GitHub access token not found. Please reconnect your GitHub account."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Fetch diff
            diff_data = get_github_diff(
                access_token=access_token,
                owner=repository.owner,
                repo=repository.name,
                base=base,
                head=head
            )
            
            # Filter out ignored files from diff
            filtered_files = []
            for file_info in diff_data.get("files_changed", []):
                file_path = file_info.get("path") or file_info.get("old_path", "")
                if file_path and not should_ignore_path(file_path):
                    filtered_files.append(file_info)
            
            diff_data["files_changed"] = filtered_files
            diff_data["files_count"] = len(filtered_files)
            
            return Response(diff_data, status=status.HTTP_200_OK)
            
        except SocialAccount.DoesNotExist:
            return Response(
                {"error": "GitHub account not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": f"Failed to fetch diff: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class RepositoryImportView(APIView):
    """
    API endpoint to import a repository from GitHub.
    User selects: GitHub account, repo, and branch.
    """
    permission_classes = [IsAuthenticated]

    @method_decorator(ratelimit(key='user', rate='10/m', method='POST'))
    def post(self, request):
        """
        Import a repository from GitHub.
        
        Expected payload:
        {
            "github_uid": "123456",  # GitHub account UID (from SocialAccount)
            "repo_id": "123456789",  # GitHub repo ID (numeric)
            "owner": "username",     # Repo owner
            "name": "repo-name",     # Repo name
            "branch": "main"         # Optional, defaults to repo's default branch
        }
        """
        github_uid = request.data.get("github_uid")
        repo_id = request.data.get("repo_id")
        owner = request.data.get("owner")
        name = request.data.get("name")
        branch = request.data.get("branch")  # Optional
        
        if not all([github_uid, repo_id, owner, name]):
            return Response(
                {"error": "Missing required fields: github_uid, repo_id, owner, name"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verify GitHub account exists and belongs to user
        try:
            github_account = SocialAccount.objects.get(
                user=request.user,
                provider="github",
                uid=github_uid
            )
        except SocialAccount.DoesNotExist:
            return Response(
                {"error": f"GitHub account with UID {github_uid} not found. Please connect this account first."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get GitHub token
        access_token = get_github_token(github_account)
        if not access_token:
            return Response(
                {"error": "GitHub access token not found. Please reconnect your GitHub account."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verify repo exists and user has access
        full_name = f"{owner}/{name}"
        headers = {
            "Authorization": f"token {access_token}",
            "Accept": "application/vnd.github+json",
        }
        
        try:
            repo_response = requests.get(
                f"https://api.github.com/repos/{full_name}",
                headers=headers
            )
            
            if repo_response.status_code == 404:
                return Response(
                    {"error": "Repository not found or you don't have access to it."},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            if repo_response.status_code != 200:
                return Response(
                    {"error": f"GitHub API error: {repo_response.status_code}"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            repo_data = repo_response.json()
            
            # Verify repo_id matches
            if str(repo_data.get("id")) != str(repo_id):
                return Response(
                    {"error": "Repository ID mismatch"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get default branch if not provided
            if not branch:
                branch = repo_data.get("default_branch", "main")
            
            # Create or update repository
            repository, created = Repository.objects.update_or_create(
                user=request.user,
                provider="github",
                repo_id=str(repo_id),
                defaults={
                    "provider_account_id": github_uid,
                    "owner": owner,
                    "name": name,
                    "full_name": full_name,
                    "default_branch": branch,
                    "description": repo_data.get("description", ""),
                    "private": repo_data.get("private", False),
                    "language": repo_data.get("language", ""),
                    "html_url": repo_data.get("html_url", ""),
                }
            )
            
            # Create sync status if new
            if created:
                RepoSync.objects.create(repository=repository)
            
            serializer = RepositorySerializer(repository, context={'request': request})
            return Response(
                {
                    "message": "Repository imported successfully" if created else "Repository updated successfully",
                    "repository": serializer.data
                },
                status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
            )
            
        except requests.RequestException as e:
            return Response(
                {"error": f"Failed to fetch repository from GitHub: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

