"""
Handle GitHub OAuth callback and return JWT tokens.
This view processes the GitHub OAuth callback from allauth.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from django.contrib.auth import login
from rest_framework_simplejwt.tokens import RefreshToken
from allauth.socialaccount.models import SocialAccount
from django.shortcuts import redirect


def github_callback_view(request):
    """
    Handle GitHub OAuth callback.
    This is called by allauth after successful GitHub authentication.
    """
    # Check if user is authenticated (allauth handles this)
    if request.user.is_authenticated:
        # Generate JWT tokens
        refresh = RefreshToken.for_user(request.user)
        
        # Redirect to frontend with tokens in URL (for development)
        # In production, use a more secure method
        frontend_url = request.GET.get('next', 'http://localhost:5173')
        redirect_url = f"{frontend_url}?access={refresh.access_token}&refresh={refresh}"
        return redirect(redirect_url)
    
    # If not authenticated, redirect to login
    return redirect('/login')

