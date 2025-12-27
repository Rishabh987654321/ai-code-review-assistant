"""
Custom social account adapter to prevent silent account merging and hijacking.
"""
from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from allauth.account.adapter import DefaultAccountAdapter
from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model
from django.conf import settings

User = get_user_model()


class CustomSocialAccountAdapter(DefaultSocialAccountAdapter):
    """
    Custom adapter that prevents silent account merging.
    
    Rules:
    1. If user is logged in → allow linking (explicit intent)
    2. If social account exists → normal login
    3. If email exists but user not logged in → BLOCK (prevent hijacking)
    """
    
    def pre_social_login(self, request, sociallogin):
        """
        Called before social login completes.
        Prevents silent account merging and account hijacking.
        
        Flow logic:
        1. User already logged in → linking flow (check if account belongs to different user)
        2. Social account already exists → normal login (allauth handles this)
        3. Email exists but user not logged in → BLOCK (prevent hijacking)
        4. New account → allow signup
        """
        # Case 3: User is already logged in → linking flow (explicit intent)
        if request.user.is_authenticated:
            # Check if this social account is already connected to a DIFFERENT user
            # This prevents account hijacking
            from allauth.socialaccount.models import SocialAccount
            account = sociallogin.account
            
            try:
                existing_account = SocialAccount.objects.get(
                    provider=account.provider,
                    uid=account.uid
                )
                # If account exists and belongs to a different user, BLOCK
                if existing_account.user != request.user:
                    raise ValidationError(
                        f"This {account.provider} account is already connected to another user. "
                        "Please disconnect it from that account first, or use a different account."
                    )
                # If account exists and belongs to same user, allow (reconnection/refresh)
                # allauth will handle this gracefully
            except SocialAccount.DoesNotExist:
                # Account doesn't exist → safe to link to current user
                pass
            
            # Allow linking to proceed
            return

        # Case 1 & 2: Social account already exists → normal login (user already linked this)
        # allauth will authenticate as the existing user - this is correct behavior
        if sociallogin.is_existing:
            return

        # Case 3: Check if email already exists in our system (prevent silent merge)
        # This blocks auto-merging based on email when user is NOT logged in
        email = sociallogin.account.extra_data.get("email")
        if not email:
            # Try to get email from different sources
            email = sociallogin.email_addresses[0].email if sociallogin.email_addresses else None
        
        if email and User.objects.filter(email=email).exists():
            raise ValidationError(
                "An account with this email already exists. Please log in first, then connect this provider from your account settings."
            )
        
        # Case 4: New account → allow signup (handled by is_open_for_signup)

    def is_open_for_signup(self, request, sociallogin):
        """
        Allow signup for new users.
        """
        return True

    def populate_user(self, request, sociallogin, data):
        """
        Populate user data from social account.
        """
        user = super().populate_user(request, sociallogin, data)
        
        # Set email if available
        if not user.email and sociallogin.email_addresses:
            user.email = sociallogin.email_addresses[0].email
        
        return user

    def save_user(self, request, sociallogin, form=None):
        """
        Save user and handle redirect after linking.
        """
        user = super().save_user(request, sociallogin, form)
        return user

    def get_connect_redirect_url(self, request, socialaccount):
        """
        Redirect to GitHub page after successfully linking GitHub account.
        """
        if socialaccount.provider == "github":
            frontend_url = self._get_frontend_url(request)
            return f"{frontend_url}/github"
        return super().get_connect_redirect_url(request, socialaccount)

    def get_login_redirect_url(self, request):
        """
        Redirect to frontend after successful OAuth login.
        This prevents allauth from redirecting to /accounts/profile/ which doesn't exist.
        
        For OAuth logins, we redirect to a callback URL that will handle JWT token generation.
        """
        frontend_url = self._get_frontend_url(request)
        # Check if this is a GitHub login
        if hasattr(request, 'user') and request.user.is_authenticated:
            # Generate JWT tokens for the logged-in user
            from rest_framework_simplejwt.tokens import RefreshToken
            refresh = RefreshToken.for_user(request.user)
            # Redirect to frontend callback with tokens
            return f"{frontend_url}/github/callback?access={refresh.access_token}&refresh={refresh}"
        # Fallback to home
        return f"{frontend_url}/"

    def _get_frontend_url(self, request):
        """
        Helper method to get frontend URL from multiple sources.
        """
        frontend_url = None
        
        # 1. Check HTTP_ORIGIN header (most reliable for CORS requests)
        origin = request.META.get('HTTP_ORIGIN', '')
        if origin:
            frontend_url = origin
        
        # 2. Check referer
        if not frontend_url:
            referer = request.META.get('HTTP_REFERER', '')
            if referer:
                from urllib.parse import urlparse
                parsed = urlparse(referer)
                frontend_url = f"{parsed.scheme}://{parsed.netloc}"
        
        # 3. Check settings
        if not frontend_url:
            frontend_url = getattr(settings, 'FRONTEND_URL', None)
        
        # 4. Fallback: derive from request host
        if not frontend_url:
            scheme = 'https' if request.is_secure() else 'http'
            host = request.get_host()
            # Replace backend port with frontend port
            if ':8000' in host:
                host = host.replace(':8000', ':5173')
            elif host and ':5173' not in host:
                # If no port specified, add frontend port
                host = f"{host}:5173"
            frontend_url = f"{scheme}://{host}"
        
        return frontend_url


class CustomAccountAdapter(DefaultAccountAdapter):
    """
    Custom account adapter to handle redirects after login.
    This prevents allauth from redirecting to /accounts/profile/ which doesn't exist.
    """
    
    def get_login_redirect_url(self, request):
        """
        Redirect to frontend after successful login (including OAuth login).
        This prevents allauth from redirecting to /accounts/profile/ which doesn't exist.
        """
        frontend_url = self._get_frontend_url(request)
        # Check if this is an OAuth login (user is authenticated)
        if hasattr(request, 'user') and request.user.is_authenticated:
            # Generate JWT tokens for the logged-in user
            from rest_framework_simplejwt.tokens import RefreshToken
            refresh = RefreshToken.for_user(request.user)
            # Redirect to frontend callback with tokens
            return f"{frontend_url}/github/callback?access={refresh.access_token}&refresh={refresh}"
        # Fallback to home
        return f"{frontend_url}/"
    
    def _get_frontend_url(self, request):
        """
        Helper method to get frontend URL from multiple sources.
        """
        frontend_url = None
        
        # 1. Check HTTP_ORIGIN header (most reliable for CORS requests)
        origin = request.META.get('HTTP_ORIGIN', '')
        if origin:
            frontend_url = origin
        
        # 2. Check referer
        if not frontend_url:
            referer = request.META.get('HTTP_REFERER', '')
            if referer:
                from urllib.parse import urlparse
                parsed = urlparse(referer)
                frontend_url = f"{parsed.scheme}://{parsed.netloc}"
        
        # 3. Check settings
        if not frontend_url:
            frontend_url = getattr(settings, 'FRONTEND_URL', None)
        
        # 4. Fallback: derive from request host
        if not frontend_url:
            scheme = 'https' if request.is_secure() else 'http'
            host = request.get_host()
            # Replace backend port with frontend port
            if ':8000' in host:
                host = host.replace(':8000', ':5173')
            elif host and ':5173' not in host:
                # If no port specified, add frontend port
                host = f"{host}:5173"
            frontend_url = f"{scheme}://{host}"
        
        return frontend_url

