import React, { useState, useRef, useEffect } from "react";
import { BsArrowLeft, BsLock } from "react-icons/bs";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { useDispatch } from "react-redux";
import { changePassword } from "../../redux/Auth/Action";
import { api, API_ENDPOINTS, apiHelpers } from "../../config/api";

const ChangePassword = ({ onBack }) => {
  const dispatch = useDispatch();
  const currentPasswordRef = useRef(null);

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [errors, setErrors] = useState({});
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (currentPasswordRef.current) {
      setTimeout(() => {
        currentPasswordRef.current?.focus();
      }, 100);
    }
  }, []);

  const handlePasswordInputChange = (field, value) => {
    setPasswordData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
    if (errors.submit) {
      setErrors((prev) => ({ ...prev, submit: "" }));
    }
    setSuccessMessage("");
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const validateForm = () => {
    const newErrors = {};
    const { currentPassword, newPassword, confirmPassword } = passwordData;

    if (!currentPassword.trim()) {
      newErrors.currentPassword = "Current password is required";
    }

    if (!newPassword.trim()) {
      newErrors.newPassword = "New password is required";
    } else if (newPassword.length < 6) {
      newErrors.newPassword = "New password must be at least 6 characters";
    }

    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = "Please confirm your new password";
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (currentPassword && newPassword && currentPassword === newPassword) {
      newErrors.newPassword =
        "New password must be different from current password";
    }

    return newErrors;
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    setIsChangingPassword(true);
    setErrors({});
    setSuccessMessage("");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication required. Please login again.");
      }

      await dispatch(changePassword(passwordData, token));

      setSuccessMessage("Password changed successfully!");

      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setTimeout(() => {
        onBack();
      }, 2000);
    } catch (error) {
      console.error("Error changing password:", error);

      const errorInfo = apiHelpers.handleApiError(error);

      if (errorInfo.status === 401) {
        setErrors({ submit: "Current password is incorrect" });
      } else if (errorInfo.status === 400) {
        setErrors({ submit: errorInfo.message || "Invalid password data" });
      } else if (errorInfo.status === 0) {
        setErrors({ submit: "Network error. Please check your connection." });
      } else {
        setErrors({
          submit:
            errorInfo.message || "Failed to change password. Please try again.",
        });
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  const getPasswordStrength = (password) => {
    if (!password) return { score: 0, text: "", color: "" };

    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    const strength = {
      0: { text: "Very Weak", color: "text-red-500" },
      1: { text: "Weak", color: "text-red-400" },
      2: { text: "Fair", color: "text-yellow-500" },
      3: { text: "Good", color: "text-blue-500" },
      4: { text: "Strong", color: "text-green-500" },
      5: { text: "Very Strong", color: "text-green-600" },
    };

    return { score, ...strength[score] };
  };

  const passwordStrength = getPasswordStrength(passwordData.newPassword);

  return (
    <div className="w-full h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <div className="flex items-center space-x-10 bg-[#008069] text-white pt-11 px-10 pb-5 flex-shrink-0">
        <BsArrowLeft
          size={20}
          className="cursor-pointer text-2xl font-bold hover:text-gray-200 transition-colors"
          onClick={onBack}
        />
        <p className="cursor-pointer font-semibold">Change Password</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-md mx-auto mt-8 px-4 pb-8">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-[#008069] rounded-full flex items-center justify-center shadow-lg">
              <BsLock className="text-white text-2xl" />
            </div>
          </div>

          {/* Description */}
          <div className="text-center mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Change Your Password
            </h2>
            <p className="text-gray-600 text-sm">
              Enter your current password and choose a new one to update your
              account security.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handlePasswordSubmit} className="space-y-6">
            {/* Success Message */}
            {successMessage && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <AiOutlineEye className="h-5 w-5 text-green-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-800">
                      {successMessage}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* General Error Message */}
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <AiOutlineEyeInvisible className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-red-800">
                      {errors.submit}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Current Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Password *
              </label>
              <div className="relative">
                <input
                  ref={currentPasswordRef}
                  type={showPasswords.current ? "text" : "password"}
                  value={passwordData.currentPassword}
                  onChange={(e) =>
                    handlePasswordInputChange("currentPassword", e.target.value)
                  }
                  className={`w-full pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-[#008069] focus:border-transparent text-base transition-colors ${
                    errors.currentPassword
                      ? "border-red-300 bg-red-50"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                  placeholder="Enter current password"
                  autoComplete="current-password"
                  disabled={isChangingPassword}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility("current")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 transition-colors"
                  disabled={isChangingPassword}
                >
                  {showPasswords.current ? (
                    <AiOutlineEyeInvisible size={20} />
                  ) : (
                    <AiOutlineEye size={20} />
                  )}
                </button>
              </div>
              {errors.currentPassword && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.currentPassword}
                </p>
              )}
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password *
              </label>
              <div className="relative">
                <input
                  type={showPasswords.new ? "text" : "password"}
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    handlePasswordInputChange("newPassword", e.target.value)
                  }
                  className={`w-full pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-[#008069] focus:border-transparent text-base transition-colors ${
                    errors.newPassword
                      ? "border-red-300 bg-red-50"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                  placeholder="Enter new password"
                  autoComplete="new-password"
                  disabled={isChangingPassword}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility("new")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 transition-colors"
                  disabled={isChangingPassword}
                >
                  {showPasswords.new ? (
                    <AiOutlineEyeInvisible size={20} />
                  ) : (
                    <AiOutlineEye size={20} />
                  )}
                </button>
              </div>
              {errors.newPassword && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.newPassword}
                </p>
              )}
              {/* Password Strength Indicator */}
              {passwordData.newPassword && (
                <div className="mt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      Password strength:
                    </span>
                    <span
                      className={`text-xs font-medium ${passwordStrength.color}`}
                    >
                      {passwordStrength.text}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        passwordStrength.score <= 1
                          ? "bg-red-500"
                          : passwordStrength.score <= 2
                            ? "bg-yellow-500"
                            : passwordStrength.score <= 3
                              ? "bg-blue-500"
                              : "bg-green-500"
                      }`}
                      style={{
                        width: `${(passwordStrength.score / 5) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password *
              </label>
              <div className="relative">
                <input
                  type={showPasswords.confirm ? "text" : "password"}
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    handlePasswordInputChange("confirmPassword", e.target.value)
                  }
                  className={`w-full pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-[#008069] focus:border-transparent text-base transition-colors ${
                    errors.confirmPassword
                      ? "border-red-300 bg-red-50"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                  disabled={isChangingPassword}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility("confirm")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 transition-colors"
                  disabled={isChangingPassword}
                >
                  {showPasswords.confirm ? (
                    <AiOutlineEyeInvisible size={20} />
                  ) : (
                    <AiOutlineEye size={20} />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Password Requirements */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-medium text-blue-700 mb-3">
                Password requirements:
              </p>
              <ul className="text-sm text-blue-600 space-y-1">
                <li
                  className={`flex items-center transition-colors ${
                    passwordData.newPassword.length >= 6 ? "text-green-600" : ""
                  }`}
                >
                  <span className="mr-2 font-bold">
                    {passwordData.newPassword.length >= 6 ? "✓" : "•"}
                  </span>
                  At least 6 characters
                </li>
                <li
                  className={`flex items-center transition-colors ${
                    passwordData.newPassword &&
                    passwordData.confirmPassword &&
                    passwordData.newPassword === passwordData.confirmPassword
                      ? "text-green-600"
                      : ""
                  }`}
                >
                  <span className="mr-2 font-bold">
                    {passwordData.newPassword &&
                    passwordData.confirmPassword &&
                    passwordData.newPassword === passwordData.confirmPassword
                      ? "✓"
                      : "•"}
                  </span>
                  Passwords match
                </li>
                <li
                  className={`flex items-center transition-colors ${
                    passwordData.currentPassword &&
                    passwordData.newPassword &&
                    passwordData.currentPassword !== passwordData.newPassword
                      ? "text-green-600"
                      : ""
                  }`}
                >
                  <span className="mr-2 font-bold">
                    {passwordData.currentPassword &&
                    passwordData.newPassword &&
                    passwordData.currentPassword !== passwordData.newPassword
                      ? "✓"
                      : "•"}
                  </span>
                  Different from current password
                </li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-6 pb-8">
              <button
                type="submit"
                disabled={
                  isChangingPassword ||
                  !passwordData.currentPassword ||
                  !passwordData.newPassword ||
                  !passwordData.confirmPassword
                }
                className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-200 ${
                  isChangingPassword ||
                  !passwordData.currentPassword ||
                  !passwordData.newPassword ||
                  !passwordData.confirmPassword
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-[#008069] hover:bg-[#00a884] focus:ring-2 focus:ring-[#008069] focus:ring-offset-2 shadow-md hover:shadow-lg"
                }`}
              >
                {isChangingPassword ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Changing Password...
                  </div>
                ) : (
                  "Change Password"
                )}
              </button>

              <button
                type="button"
                onClick={onBack}
                disabled={isChangingPassword}
                className={`w-full py-3 px-4 border border-gray-300 rounded-lg font-semibold text-gray-700 transition-all duration-200 ${
                  isChangingPassword
                    ? "cursor-not-allowed opacity-50"
                    : "hover:bg-gray-50 hover:border-gray-400 focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
                }`}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;
