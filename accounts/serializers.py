from rest_framework import serializers
from .models import User


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for user profile with read-only email."""
    full_name = serializers.ReadOnlyField()
    email = serializers.ReadOnlyField()
    profile_picture_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "full_name",
            "profile_picture",
            "profile_picture_url",
            "bio",
            "role",
            "is_google_account",
            "date_joined",
            "last_login",
        ]
        read_only_fields = ["id", "email", "date_joined", "last_login", "is_google_account"]

    def get_profile_picture_url(self, obj):
        """Return the full URL for the profile picture."""
        if obj.profile_picture:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.profile_picture.url)
            return obj.profile_picture.url
        return None

