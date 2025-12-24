import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function Profile() {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    first_name: "",
    last_name: "",
    profile_picture: null,
    profile_picture_url: "",
    bio: "",
    role: "",
  });
  const [preview, setPreview] = useState("");
  const [originalProfile, setOriginalProfile] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get("/api/auth/profile/");
      const profileData = {
        first_name: res.data.first_name || "",
        last_name: res.data.last_name || "",
        profile_picture: null,
        profile_picture_url: res.data.profile_picture_url || "",
        bio: res.data.bio || "",
        role: res.data.role || "",
      };
      setProfile(profileData);
      setOriginalProfile(profileData);
      setPreview(res.data.profile_picture_url || "");
    } catch (err) {
      toast.error("Failed to load profile");
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append("first_name", profile.first_name);
      formData.append("last_name", profile.last_name);
      formData.append("bio", profile.bio);
      formData.append("role", profile.role);
      
      // Only append file if a new one was selected
      if (profile.profile_picture) {
        formData.append("profile_picture", profile.profile_picture);
      }
      
      const res = await api.put("/api/auth/profile/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      
      // Update profile with response data
      const updatedProfile = {
        first_name: res.data.first_name || "",
        last_name: res.data.last_name || "",
        profile_picture: null,
        profile_picture_url: res.data.profile_picture_url || "",
        bio: res.data.bio || "",
        role: res.data.role || "",
      };
      setProfile(updatedProfile);
      setOriginalProfile(updatedProfile);
      setPreview(res.data.profile_picture_url || "");
      setIsEditing(false);
      
      toast.success("Profile updated successfully!");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset to original profile
    if (originalProfile) {
      setProfile({
        ...originalProfile,
        profile_picture: null,
      });
      setPreview(originalProfile.profile_picture_url || "");
    }
    setIsEditing(false);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleChange = (e) => {
    if (e.target.name === "profile_picture" && e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB");
        return;
      }
      
      setProfile({
        ...profile,
        profile_picture: file,
      });
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setProfile({
        ...profile,
        [e.target.name]: e.target.value,
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-10">
      <div className="max-w-2xl mx-auto bg-white p-6 rounded-xl shadow">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Profile</h1>
          <div className="flex gap-2">
            {!isEditing && (
              <button
                onClick={handleEdit}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
              >
                Edit Profile
              </button>
            )}
            <button
              onClick={() => navigate("/")}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition"
            >
              Back
            </button>
            <button
              onClick={() => {
                logout();
                navigate("/login");
              }}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
            >
              Logout
            </button>
          </div>
        </div>

        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">First Name</label>
              <input
                type="text"
                name="first_name"
                value={profile.first_name}
                onChange={handleChange}
                className="border p-2 w-full rounded"
                placeholder="First Name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Last Name</label>
              <input
                type="text"
                name="last_name"
                value={profile.last_name}
                onChange={handleChange}
                className="border p-2 w-full rounded"
                placeholder="Last Name"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Profile Picture</label>
            {preview && (
              <div className="mb-3">
                <img
                  src={preview}
                  alt="Profile preview"
                  className="w-24 h-24 rounded-full object-cover border-2 border-gray-300"
                />
                <p className="text-xs text-gray-500 mt-1">Current picture</p>
              </div>
            )}
            <input
              type="file"
              name="profile_picture"
              accept="image/*"
              onChange={handleChange}
              className="border p-2 w-full rounded"
            />
            <p className="text-xs text-gray-500 mt-1">
              {preview ? "Select a new image to replace, or leave empty to keep current." : "Max size: 5MB. Supported formats: JPG, PNG, GIF"}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Role</label>
            <input
              type="text"
              name="role"
              value={profile.role}
              onChange={handleChange}
              className="border p-2 w-full rounded"
              placeholder="e.g., Software Engineer, Student"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Bio</label>
            <textarea
              name="bio"
              value={profile.bio}
              onChange={handleChange}
              className="border p-2 w-full rounded h-24"
              placeholder="Tell us about yourself..."
              maxLength={500}
            />
            <p className="text-sm text-gray-500 mt-1">{profile.bio.length}/500</p>
          </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={loading}
                className="bg-gray-400 text-white px-6 py-2 rounded hover:bg-gray-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            {/* Profile Picture Display */}
            <div className="flex items-center gap-4">
              {preview ? (
                <img
                  src={preview}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover border-2 border-gray-300"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gray-200 border-2 border-gray-300 flex items-center justify-center">
                  <span className="text-gray-400 text-2xl">
                    {profile.first_name?.[0] || profile.last_name?.[0] || profile.email?.[0] || "U"}
                  </span>
                </div>
              )}
              <div>
                <h2 className="text-xl font-semibold">{profile.first_name} {profile.last_name}</h2>
                <p className="text-gray-600">{profile.email}</p>
              </div>
            </div>

            {/* Profile Information Display */}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">First Name</label>
                <p className="text-gray-900">{profile.first_name || "Not set"}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Last Name</label>
                <p className="text-gray-900">{profile.last_name || "Not set"}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Role</label>
                <p className="text-gray-900">{profile.role || "Not set"}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Bio</label>
                <p className="text-gray-900 whitespace-pre-wrap">{profile.bio || "Not set"}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

