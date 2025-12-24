from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from django_ratelimit.decorators import ratelimit
from django.utils.decorators import method_decorator
from .models import User
from .serializers import UserProfileSerializer
import requests


class LoginView(APIView):
    permission_classes = []
    authentication_classes = []  # Disable authentication for login endpoint

    @method_decorator(ratelimit(key='ip', rate='5/m', method='POST'))
    def post(self, request):
        email = request.data.get("email")
        password = request.data.get("password")

        user = authenticate(email=email, password=password)

        if user is None:
            return Response(
                {"error": "Invalid credentials"},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Update last login
        user.last_login = timezone.now()
        user.save(update_fields=['last_login'])

        refresh = RefreshToken.for_user(user)

        # Send login notification email
        try:
            send_mail(
                subject='New Login Detected',
                message=f'You have successfully logged in to your account.\n\nIf this was not you, please secure your account immediately.',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=True,
            )
        except Exception:
            pass  # Fail silently if email is not configured

        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        })


class GoogleLoginView(APIView):
    permission_classes = []
    authentication_classes = []  # Disable authentication for Google login endpoint

    @method_decorator(ratelimit(key='ip', rate='10/m', method='POST'))
    def post(self, request):
        access_token = request.data.get("access_token")
        
        if not access_token:
            return Response(
                {"error": "Access token is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Verify the Google access token and get user info
        try:
            # Get user info from Google using the access token
            response = requests.get(
                "https://www.googleapis.com/oauth2/v2/userinfo",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            
            if response.status_code != 200:
                return Response(
                    {"error": "Invalid Google token"},
                    status=status.HTTP_401_UNAUTHORIZED
                )

            user_data = response.json()
            email = user_data.get("email")
            google_id = user_data.get("id")
            name = user_data.get("name", "")
            picture = user_data.get("picture", "")

            if not email:
                return Response(
                    {"error": "Email not provided by Google"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Get or create user
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    "is_google_account": True,
                    "is_active": True,
                }
            )

            # Update name if available
            if name and not user.first_name:
                name_parts = name.split(" ", 1)
                user.first_name = name_parts[0]
                if len(name_parts) > 1:
                    user.last_name = name_parts[1]
                user.save(update_fields=['first_name', 'last_name'])

            # If user already exists but wasn't a Google account, update it
            if not created and not user.is_google_account:
                user.is_google_account = True
                user.save(update_fields=['is_google_account'])

            # Update last login
            user.last_login = timezone.now()
            user.save(update_fields=['last_login'])

            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)

            return Response({
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": {
                    "email": user.email,
                    "is_google_account": user.is_google_account,
                }
            })

        except Exception as e:
            return Response(
                {"error": f"Error verifying Google token: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class UserProfileView(APIView):
    """View for getting and updating user profile."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get current user's profile."""
        serializer = UserProfileSerializer(request.user, context={'request': request})
        return Response(serializer.data)

    def put(self, request):
        """Update current user's profile."""
        serializer = UserProfileSerializer(
            request.user, 
            data=request.data, 
            partial=True,
            context={'request': request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request):
        """Partially update current user's profile."""
        return self.put(request)
