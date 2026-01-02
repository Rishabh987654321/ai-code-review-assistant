from django.contrib import admin
from .models import CodeSubmission, Repository, RepoSync


@admin.register(CodeSubmission)
class CodeSubmissionAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'language', 'created_at', 'code_preview']
    list_filter = ['language', 'created_at', 'user']
    search_fields = ['user__email', 'language', 'code']
    readonly_fields = ['created_at', 'user']
    date_hierarchy = 'created_at'
    ordering = ['-created_at']

    def code_preview(self, obj):
        """Show first 50 characters of code."""
        return obj.code[:50] + "..." if len(obj.code) > 50 else obj.code
    code_preview.short_description = 'Code Preview'

    def get_queryset(self, request):
        """Optimize queryset with select_related."""
        qs = super().get_queryset(request)
        return qs.select_related('user')

    def changelist_view(self, request, extra_context=None):
        """Add analytics to admin changelist."""
        response = super().changelist_view(request, extra_context=extra_context)
        
        try:
            qs = response.context_data['cl'].queryset
            # Submissions per language
            language_stats = {}
            for lang in CodeSubmission.LANGUAGE_CHOICES:
                count = qs.filter(language=lang[0]).count()
                if count > 0:
                    language_stats[lang[1]] = count
            
            # Total submissions
            total_submissions = qs.count()
            
            # Recent submissions (last 7 days)
            from django.utils import timezone
            from datetime import timedelta
            recent_submissions = qs.filter(
                created_at__gte=timezone.now() - timedelta(days=7)
            ).count()
            
            response.context_data['language_stats'] = language_stats
            response.context_data['total_submissions'] = total_submissions
            response.context_data['recent_submissions'] = recent_submissions
        except (AttributeError, KeyError):
            pass
        
        return response


@admin.register(Repository)
class RepositoryAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'full_name', 'provider', 'private', 'default_branch', 'created_at']
    list_filter = ['provider', 'private', 'created_at', 'language']
    search_fields = ['user__email', 'name', 'full_name', 'owner', 'description']
    readonly_fields = ['created_at', 'updated_at', 'repo_id']
    date_hierarchy = 'created_at'
    ordering = ['-created_at']
    
    fieldsets = (
        ('Repository Info', {
            'fields': ('user', 'provider', 'provider_account_id', 'repo_id')
        }),
        ('GitHub Details', {
            'fields': ('owner', 'name', 'full_name', 'default_branch', 'html_url')
        }),
        ('Metadata', {
            'fields': ('description', 'private', 'language')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )
    
    def get_queryset(self, request):
        """Optimize queryset with select_related."""
        qs = super().get_queryset(request)
        return qs.select_related('user', 'sync_status')


@admin.register(RepoSync)
class RepoSyncAdmin(admin.ModelAdmin):
    list_display = ['repository', 'status', 'last_synced', 'files_count', 'branches_count', 'updated_at']
    list_filter = ['status', 'last_synced', 'updated_at']
    search_fields = ['repository__full_name', 'repository__user__email', 'last_sync_error']
    readonly_fields = ['created_at', 'updated_at']
    date_hierarchy = 'last_synced'
    ordering = ['-updated_at']
    
    fieldsets = (
        ('Repository', {
            'fields': ('repository',)
        }),
        ('Sync Status', {
            'fields': ('status', 'last_synced', 'last_sync_error')
        }),
        ('Sync Metrics', {
            'fields': ('files_count', 'branches_count')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )
    
    def get_queryset(self, request):
        """Optimize queryset with select_related."""
        qs = super().get_queryset(request)
        return qs.select_related('repository', 'repository__user')
