from django.urls import path
from .views import LoginView, GoogleLoginView, UserProfileView

urlpatterns = [
    path("login/", LoginView.as_view()),
    path("google/", GoogleLoginView.as_view()),
    path("profile/", UserProfileView.as_view()),
]
