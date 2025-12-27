from django.urls import path
from .views import LoginView, GoogleLoginView, UserProfileView
from .github_views import (
    GitHubReposView,
    GitHubRepoContentsView,
    GitHubFileContentView,
    GitHubConnectionStatusView,
)
from .social_views import connected_accounts, unlink_account, update_account_label

urlpatterns = [
    path("login/", LoginView.as_view()),
    path("google/", GoogleLoginView.as_view()),
    path("profile/", UserProfileView.as_view()),
    path("github/repos/", GitHubReposView.as_view()),
    path("github/repos/<str:owner>/<str:repo>/contents/", GitHubRepoContentsView.as_view()),
    path("github/repos/<str:owner>/<str:repo>/file/", GitHubFileContentView.as_view()),
    path("github/status/", GitHubConnectionStatusView.as_view()),
    path("connected-accounts/", connected_accounts, name="connected_accounts"),
    path("unlink-account/", unlink_account, name="unlink_account"),
    path("update-account-label/", update_account_label, name="update_account_label"),
]
