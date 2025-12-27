"""
Views for managing connected OAuth accounts (link/unlink).
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from allauth.socialaccount.models import SocialAccount, SocialToken
from django_ratelimit.decorators import ratelimit
from django.utils.decorators import method_decorator
from .models import ConnectedAccount


@api_view(["GET"])
@permission_classes([IsAuthenticated])
@ratelimit(key='user', rate='30/m', method='GET')
def connected_accounts(request):
    """
    List all connected OAuth accounts for the current user.
    """
    accounts = SocialAccount.objects.filter(user=request.user).select_related('user')
    
    result = {}
    for acc in accounts:
        provider = acc.provider
        if provider not in result:
            result[provider] = []
        
        # Get account details
        extra_data = acc.extra_data or {}
        account_info = {
            "uid": acc.uid,
            "provider": provider,
            "email": extra_data.get("email", ""),
            "username": extra_data.get("login") or extra_data.get("name", ""),
            "picture": extra_data.get("avatar_url") or extra_data.get("picture", ""),
            "date_joined": acc.date_joined.isoformat() if acc.date_joined else None,
        }
        
        # Add label if exists
        try:
            connected = ConnectedAccount.objects.get(
                user=request.user,
                provider=provider,
                provider_uid=acc.uid
            )
            account_info["label"] = connected.label
            account_info["last_used"] = connected.last_used.isoformat() if connected.last_used else None
        except ConnectedAccount.DoesNotExist:
            account_info["label"] = ""
        
        result[provider].append(account_info)
    
    return Response(result)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
@ratelimit(key='user', rate='10/m', method='POST')
def unlink_account(request):
    """
    Unlink a connected OAuth account.
    Requires explicit user action.
    """
    provider = request.data.get("provider")
    uid = request.data.get("uid")
    
    if not provider or not uid:
        return Response(
            {"error": "Provider and UID are required"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Delete social account (this also deletes associated tokens)
        account = SocialAccount.objects.get(
            user=request.user,
            provider=provider,
            uid=uid
        )
        
        # Delete connected account record if exists
        ConnectedAccount.objects.filter(
            user=request.user,
            provider=provider,
            provider_uid=uid
        ).delete()
        
        # Delete GitHubProfile if it's a GitHub account
        if provider == "github":
            from .models import GitHubProfile
            GitHubProfile.objects.filter(
                user=request.user,
                github_id=uid
            ).delete()
        
        account.delete()
        
        return Response({"status": "unlinked", "message": f"{provider} account unlinked successfully"})
    except SocialAccount.DoesNotExist:
        return Response(
            {"error": "Account not found"},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
@ratelimit(key='user', rate='10/m', method='POST')
def update_account_label(request):
    """
    Update the label for a connected account.
    """
    provider = request.data.get("provider")
    uid = request.data.get("uid")
    label = request.data.get("label", "").strip()
    
    if not provider or not uid:
        return Response(
            {"error": "Provider and UID are required"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Verify account exists
    try:
        SocialAccount.objects.get(
            user=request.user,
            provider=provider,
            uid=uid
        )
    except SocialAccount.DoesNotExist:
        return Response(
            {"error": "Account not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Update or create ConnectedAccount
    connected, created = ConnectedAccount.objects.update_or_create(
        user=request.user,
        provider=provider,
        provider_uid=uid,
        defaults={"label": label}
    )
    
    return Response({
        "status": "updated" if not created else "created",
        "label": connected.label
    })

