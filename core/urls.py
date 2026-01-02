from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CodeSubmissionViewSet, RepositoryViewSet, RepositoryImportView

router = DefaultRouter()
router.register(r'submissions', CodeSubmissionViewSet, basename='submission')
router.register(r'repositories', RepositoryViewSet, basename='repository')

urlpatterns = [
    # Put explicit paths BEFORE router to avoid conflicts
    # The router might match /repositories/import/ as a detail view with pk="import"
    path("repositories/import/", RepositoryImportView.as_view(), name="repository-import"),
    path("", include(router.urls)),
]
