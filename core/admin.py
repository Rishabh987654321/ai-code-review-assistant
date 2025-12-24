from django.contrib import admin
from .models import CodeSubmission


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
