import React, { useState, useRef } from "react";
import {
  BsArrowLeft,
  BsCheck2,
  BsPencil,
  BsCamera,
  BsLock,
} from "react-icons/bs";
import { useSelector, useDispatch } from "react-redux";
import { updateUser } from "../../redux/Auth/Action";
import { fileUploadApi, API_ENDPOINTS, apiHelpers } from "../../config/api";
import ChangePassword from "./ChangePassword";

const Profile = ({ onBack }) => {
  const dispatch = useDispatch();
  const auth = useSelector((store) => store.auth);
  const currentUser = auth?.user;

  const [currentView, setCurrentView] = useState("profile");
  const [editMode, setEditMode] = useState({
    fullName: false,
  });
  const [fullName, setFullName] = useState(currentUser?.fullName || "");
  const [avatarPreview, setAvatarPreview] = useState(
    currentUser?.urlAvatar || null,
  );
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");

  const fileInputRef = useRef(null);

  const handleNavigate = () => {
    onBack();
  };

  const handleGoToChangePassword = () => {
    setCurrentView("changePassword");
  };

  const handleBackFromChangePassword = () => {
    setCurrentView("profile");
  };

  const handleToggleNameEdit = () => {
    if (editMode.fullName) {
      handleSaveFullName();
    } else {
      setEditMode({ ...editMode, fullName: true });
      setErrors({});
      setSuccessMessage("");
    }
  };

  const validateFullName = (name) => {
    if (!name.trim()) {
      return "Full name cannot be empty";
    }
    if (name.trim().length < 2) {
      return "Full name must be at least 2 characters";
    }
    if (name.trim().length > 50) {
      return "Full name must not exceed 50 characters";
    }
    if (!/^[a-zA-ZÀ-ÿ\s]+$/.test(name.trim())) {
      return "Full name can only contain letters and spaces";
    }
    return null;
  };

  const handleSaveFullName = async () => {
    const trimmedName = fullName.trim();
    const validationError = validateFullName(trimmedName);

    if (validationError) {
      setErrors({ fullName: validationError });
      return;
    }

    if (trimmedName === currentUser?.fullName) {
      setEditMode({ ...editMode, fullName: false });
      setErrors({});
      return;
    }

    setIsUpdatingName(true);
    setErrors({});
    setSuccessMessage("");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication required. Please login again.");
      }

      await dispatch(updateUser({ fullName: trimmedName }, token));

      setEditMode({ ...editMode, fullName: false });
      setSuccessMessage("Name updated successfully!");

      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (error) {
      console.error("Error updating full name:", error);

      const errorInfo = apiHelpers.handleApiError(error);
      setErrors({
        fullName:
          errorInfo.message || "Failed to update name. Please try again.",
      });

      setFullName(currentUser?.fullName || "");
    } finally {
      setIsUpdatingName(false);
    }
  };

  const handleFullNameChange = (e) => {
    setFullName(e.target.value);
    if (errors.fullName) {
      setErrors({});
    }
    setSuccessMessage("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSaveFullName();
    } else if (e.key === "Escape") {
      setFullName(currentUser?.fullName || "");
      setEditMode({ ...editMode, fullName: false });
      setErrors({});
    }
  };

  const handleAvatarClick = () => {
    if (!isUploadingAvatar) {
      fileInputRef.current?.click();
    }
  };

  const validateImageFile = (file) => {
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    const maxSize = 5 * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
      return "Please select a valid image file (JPEG, PNG, GIF, WebP)";
    }

    if (file.size > maxSize) {
      return "File size must be less than 5MB";
    }

    return null;
  };

  const handleAvatarChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const validationError = validateImageFile(file);
    if (validationError) {
      setErrors({ avatar: validationError });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setAvatarPreview(e.target.result);
    };
    reader.readAsDataURL(file);

    setIsUploadingAvatar(true);
    setErrors({});
    setSuccessMessage("");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication required. Please login again.");
      }

      const formData = new FormData();
      formData.append("file", file);

      const response = await fileUploadApi.post(
        API_ENDPOINTS.USERS.UPLOAD_AVATAR,
        formData,
      );

      const imageUrl = response.data.imageUrl;

      await dispatch(updateUser({ urlAvatar: imageUrl }, token));

      setSuccessMessage("Avatar updated successfully!");

      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (error) {
      console.error("Error uploading avatar:", error);

      const errorInfo = apiHelpers.handleApiError(error);

      let errorMessage = "Failed to upload avatar. Please try again.";

      if (errorInfo.status === 413) {
        errorMessage = "File is too large. Please choose a smaller image.";
      } else if (errorInfo.status === 415) {
        errorMessage =
          "Unsupported file type. Please use JPEG, PNG, GIF, or WebP.";
      } else if (errorInfo.message) {
        errorMessage = errorInfo.message;
      }

      setErrors({ avatar: errorMessage });

      setAvatarPreview(currentUser?.urlAvatar || null);
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleCancelNameEdit = () => {
    setFullName(currentUser?.fullName || "");
    setEditMode({ ...editMode, fullName: false });
    setErrors({});
  };

  if (currentView === "changePassword") {
    return <ChangePassword onBack={handleBackFromChangePassword} />;
  }

  return (
    <div className="w-full h-screen bg-gray-100 flex flex-col">
      {/* Profile header */}
      <div className="flex items-center space-x-10 bg-[#008069] text-white pt-11 px-10 pb-5 flex-shrink-0">
        <BsArrowLeft
          size={20}
          className="cursor-pointer text-2xl font-bold hover:text-gray-200 transition-colors"
          onClick={handleNavigate}
        />
        <p className="cursor-pointer font-semibold">Profile</p>
      </div>

      {/* Profile content - with proper scrolling */}
      <div className="flex-1 overflow-y-auto">
        {/* Success Message */}
        {successMessage && (
          <div className="mx-4 mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BsCheck2 className="h-5 w-5 text-green-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  {successMessage}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Profile avatar */}
        <div className="flex flex-col items-center space-y-5 mt-10 mb-8">
          <div className="relative group">
            <img
              className={`rounded-full w-32 h-32 cursor-pointer object-cover border-4 border-white shadow-lg transition-all duration-200 ${
                isUploadingAvatar
                  ? "opacity-50 cursor-not-allowed"
                  : "group-hover:shadow-xl group-hover:scale-105"
              }`}
              src={avatarPreview || "/avatar-default.svg"}
              alt="Profile"
              onClick={handleAvatarClick}
              onError={(e) => {
                e.target.src = "avatar-default.svg";
              }}
            />

            {/* Camera overlay */}
            <div
              className={`absolute inset-0 rounded-full bg-black bg-opacity-40 flex items-center justify-center opacity-0 transition-all duration-200 ${
                isUploadingAvatar
                  ? "cursor-not-allowed"
                  : "group-hover:opacity-100 cursor-pointer"
              }`}
              onClick={handleAvatarClick}
            >
              {isUploadingAvatar ? (
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
              ) : (
                <BsCamera className="text-white text-2xl" />
              )}
            </div>

            {/* Upload status indicator */}
            {isUploadingAvatar && (
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full whitespace-nowrap">
                  Uploading...
                </div>
              </div>
            )}
          </div>

          {/* Avatar error */}
          {errors.avatar && (
            <div className="text-center max-w-xs">
              <p className="text-sm text-red-600">{errors.avatar}</p>
            </div>
          )}

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
            disabled={isUploadingAvatar}
          />

          <div className="text-center">
            <p className="text-gray-600 text-sm">
              Click photo to change avatar
            </p>
            <p className="text-gray-500 text-xs mt-1">
              Max 5MB • JPEG, PNG, GIF, WebP
            </p>
          </div>
        </div>

        {/* Profile details */}
        <div className="px-6 space-y-6 pb-8">
          {/* Full Name Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                {editMode.fullName ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={fullName}
                      onChange={handleFullNameChange}
                      onKeyDown={handleKeyPress}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#008069] focus:border-transparent transition-colors ${
                        errors.fullName
                          ? "border-red-300 bg-red-50"
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                      placeholder="Enter your full name"
                      autoFocus
                      disabled={isUpdatingName}
                      maxLength={50}
                    />
                    {errors.fullName && (
                      <p className="text-sm text-red-600">{errors.fullName}</p>
                    )}
                    <div className="flex space-x-2">
                      <button
                        onClick={handleSaveFullName}
                        disabled={isUpdatingName || !fullName.trim()}
                        className={`px-3 py-1 text-sm rounded-md transition-colors ${
                          isUpdatingName || !fullName.trim()
                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                            : "bg-[#008069] text-white hover:bg-[#00a884]"
                        }`}
                      >
                        {isUpdatingName ? (
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent mr-1"></div>
                            Saving...
                          </div>
                        ) : (
                          "Save"
                        )}
                      </button>
                      <button
                        onClick={handleCancelNameEdit}
                        disabled={isUpdatingName}
                        className="px-3 py-1 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <p className="text-gray-900 font-medium">
                      {currentUser?.fullName || "Not set"}
                    </p>
                    <button
                      onClick={handleToggleNameEdit}
                      className="p-2 text-[#008069] hover:bg-gray-100 rounded-full transition-colors"
                      title="Edit name"
                    >
                      <BsPencil size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Email Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <p className="text-gray-900 font-medium">
              {currentUser?.email || "Not available"}
            </p>
            <p className="text-gray-500 text-xs mt-1">
              Email cannot be changed
            </p>
          </div>

          {/* Username Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <p className="text-gray-900 font-medium">
              @{currentUser?.username || "Not available"}
            </p>
            <p className="text-gray-500 text-xs mt-1">
              Username cannot be changed
            </p>
          </div>

          {/* Security Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-1">
                  Password & Security
                </h3>
                <p className="text-gray-500 text-xs">
                  Manage your account security settings
                </p>
              </div>
              <button
                onClick={handleGoToChangePassword}
                className="flex items-center space-x-2 px-4 py-2 bg-[#008069] text-white rounded-lg hover:bg-[#00a884] transition-colors focus:ring-2 focus:ring-[#008069] focus:ring-offset-2"
              >
                <BsLock size={16} />
                <span className="text-sm font-medium">Change Password</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
