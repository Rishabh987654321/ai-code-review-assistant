from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, GitHubProfile, ConnectedAccount


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['email', 'first_name', 'last_name', 'is_staff', 'is_active', 'date_joined', 'submission_count']
    list_filter = ['is_staff', 'is_active', 'is_google_account', 'date_joined']
    search_fields = ['email', 'first_name', 'last_name']
    ordering = ['-date_joined']
    
    # Override fieldsets to include profile fields without duplicates
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name', 'profile_picture', 'bio', 'role')}),
        ('Permissions', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
        }),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
        ('Additional Information', {
            'fields': ('phone_number', 'is_google_account', 'is_phone_verified')
        }),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2', 'first_name', 'last_name'),
        }),
    )

    def submission_count(self, obj):
        """Count of user's submissions."""
        return obj.submissions.count()
    submission_count.short_description = 'Submissions'

    def get_queryset(self, request):
        """Optimize queryset with annotations."""
        qs = super().get_queryset(request)
        return qs.prefetch_related('submissions')


@admin.register(GitHubProfile)
class GitHubProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'username', 'github_id', 'created_at']
    list_filter = ['created_at']
    search_fields = ['user__email', 'username', 'github_id']
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['-created_at']


@admin.register(ConnectedAccount)
class ConnectedAccountAdmin(admin.ModelAdmin):
    list_display = ['user', 'provider', 'provider_uid', 'label', 'last_used', 'created_at']
    list_filter = ['provider', 'created_at']
    search_fields = ['user__email', 'provider_uid', 'label']
    readonly_fields = ['created_at']
    ordering = ['-created_at']
