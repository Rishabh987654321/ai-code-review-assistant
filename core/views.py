from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings

from .models import CodeSubmission
from .serializers import CodeSubmissionSerializer
from .permissions import IsOwnerOrReadOnly


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

