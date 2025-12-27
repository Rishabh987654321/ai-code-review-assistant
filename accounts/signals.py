from allauth.socialaccount.signals import social_account_added
from django.dispatch import receiver
from .models import GitHubProfile, ConnectedAccount


@receiver(social_account_added)
def save_github_token(request, sociallogin, **kwargs):
    """
    Automatically save GitHub access token when user connects GitHub account.
    Also create ConnectedAccount record for better UX.
    
    Note: We now support multiple GitHub accounts per user.
    GitHubProfile is kept for backward compatibility but we primarily use
    SocialAccount and SocialToken from allauth.
    """
    account = sociallogin.account
    user = sociallogin.user
    
    # Save GitHub profile if it's a GitHub account
    # Note: GitHubProfile has OneToOneField, so only the latest account will be stored here
    # For multiple accounts, use SocialAccount directly
    if account.provider == "github":
        token = sociallogin.token.token if sociallogin.token else None
        extra_data = account.extra_data or {}
        
        # CRITICAL: Ensure SocialToken exists for this account
        # This is required for multiple GitHub accounts per user
        from allauth.socialaccount.models import SocialToken, SocialApp
        github_app = SocialApp.objects.filter(provider="github").first()
        
        if github_app and token:
            # Create or update SocialToken for this specific account
            SocialToken.objects.update_or_create(
                account=account,
                app=github_app,
                defaults={
                    "token": token,
                }
            )
        
        # Update or create GitHubProfile (for backward compatibility)
        # This stores the LATEST connected account only (OneToOneField limitation)
        # For multiple accounts, we rely on SocialToken above
        if token:
            GitHubProfile.objects.update_or_create(
                user=user,
                defaults={
                    "github_id": account.uid,
                    "username": extra_data.get("login", ""),
                    "access_token": token,
                },
            )
    
    # Create ConnectedAccount record for all providers
    ConnectedAccount.objects.update_or_create(
        user=user,
        provider=account.provider,
        provider_uid=account.uid,
        defaults={
            "label": "",  # User can set this later
        }
    )

