from rest_framework import serializers
from .models import CodeSubmission
from dj_rest_auth.registration.serializers import RegisterSerializer

class CodeSubmissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = CodeSubmission
        fields = "__all__"
        read_only_fields = ["user", "created_at"]





class CustomRegisterSerializer(RegisterSerializer):
    email = serializers.EmailField(required=True)

    def get_cleaned_data(self):
        return {
            "email": self.validated_data.get("email", ""),
            "password1": self.validated_data.get("password1", ""),
        }
