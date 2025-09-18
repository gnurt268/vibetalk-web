import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import {
  AiOutlineEye,
  AiOutlineEyeInvisible,
  AiOutlineCheckCircle,
} from "react-icons/ai";
import { BiLock } from "react-icons/bi";
import { MdError } from "react-icons/md";
import { resetPassword, validateResetToken } from "../../redux/Auth/Action";

const ResetPassword = () => {
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isValidatingToken, setIsValidatingToken] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  useEffect(() => {
    const checkToken = async () => {
      if (!token) {
        setErrors({ token: "Invalid or missing reset token" });
        setIsValidatingToken(false);
        return;
      }

      try {
        const result = await dispatch(validateResetToken(token));
        if (result.status) {
          setIsValidToken(true);
        } else {
          setErrors({ token: "Invalid or expired reset token" });
        }
      } catch (error) {
        setErrors({ token: "Invalid or expired reset token" });
      } finally {
        setIsValidatingToken(false);
      }
    };

    checkToken();
  }, [token, dispatch]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.newPassword) {
      newErrors.newPassword = "New password is required";
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = "Password must be at least 6 characters";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    setIsLoading(true);
    try {
      const resetData = {
        token,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword,
      };

      const result = await dispatch(resetPassword(resetData));

      if (result.status) {
        setIsSuccess(true);
      }
    } catch (error) {
      setErrors({
        submit:
          error.response?.data?.message ||
          "Failed to reset password. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleNewPasswordVisibility = () => {
    setShowNewPassword(!showNewPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleGoToLogin = () => {
    navigate("/login");
  };

  if (isValidatingToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#008069] to-[#00a884] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#008069] mx-auto mb-4"></div>
            <p className="text-gray-600">Validating reset token...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isValidToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#008069] to-[#00a884] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <MdError className="text-red-600 text-3xl" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Invalid Link
            </h1>
            <p className="text-gray-600 text-sm leading-relaxed">
              {errors.token ||
                "This password reset link is invalid or has expired."}
            </p>
          </div>

          <div className="space-y-3">
            <Link
              to="/forgot-password"
              className="w-full bg-[#008069] text-white py-3 px-4 rounded-lg font-semibold hover:bg-[#00a884] focus:ring-2 focus:ring-[#008069] focus:ring-offset-2 transition-all text-center block"
            >
              Request New Reset Link
            </Link>

            <Link
              to="/login"
              className="w-full text-[#008069] hover:text-[#00a884] py-2 px-4 rounded-lg font-medium transition-colors text-center block"
            >
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#008069] to-[#00a884] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <AiOutlineCheckCircle className="text-green-600 text-3xl" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Password Reset Successfully!
            </h1>
            <p className="text-gray-600 text-sm leading-relaxed">
              Your password has been updated successfully. You can now sign in
              with your new password.
            </p>
          </div>

          <button
            onClick={handleGoToLogin}
            className="w-full bg-[#008069] text-white py-3 px-4 rounded-lg font-semibold hover:bg-[#00a884] focus:ring-2 focus:ring-[#008069] focus:ring-offset-2 transition-all"
          >
            Sign In Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#008069] to-[#00a884] flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-[#008069] rounded-full flex items-center justify-center mb-4">
            <BiLock className="text-white text-2xl" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Reset Password
          </h1>
          <p className="text-gray-600 text-sm leading-relaxed">
            Enter your new password below to complete the reset process.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Message */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-700 text-sm">{errors.submit}</p>
            </div>
          )}

          {/* New Password Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Password
            </label>
            <div className="relative">
              <BiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type={showNewPassword ? "text" : "password"}
                name="newPassword"
                value={formData.newPassword}
                onChange={handleInputChange}
                className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-[#008069] focus:border-transparent transition-all ${
                  errors.newPassword ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter new password"
                autoFocus
              />
              <button
                type="button"
                onClick={toggleNewPasswordVisibility}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showNewPassword ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
              </button>
            </div>
            {errors.newPassword && (
              <p className="text-red-500 text-xs mt-1">{errors.newPassword}</p>
            )}
          </div>

          {/* Confirm Password Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <BiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-[#008069] focus:border-transparent transition-all ${
                  errors.confirmPassword ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Confirm new password"
              />
              <button
                type="button"
                onClick={toggleConfirmPasswordVisibility}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? (
                  <AiOutlineEyeInvisible />
                ) : (
                  <AiOutlineEye />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-red-500 text-xs mt-1">
                {errors.confirmPassword}
              </p>
            )}
          </div>

          {/* Password Requirements */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Password requirements:
            </p>
            <ul className="text-xs text-gray-600 space-y-1">
              <li
                className={`flex items-center ${
                  formData.newPassword.length >= 6 ? "text-green-600" : ""
                }`}
              >
                <span className="mr-2">
                  {formData.newPassword.length >= 6 ? "✓" : "•"}
                </span>
                At least 6 characters
              </li>
              <li
                className={`flex items-center ${
                  formData.newPassword &&
                  formData.confirmPassword &&
                  formData.newPassword === formData.confirmPassword
                    ? "text-green-600"
                    : ""
                }`}
              >
                <span className="mr-2">
                  {formData.newPassword &&
                  formData.confirmPassword &&
                  formData.newPassword === formData.confirmPassword
                    ? "✓"
                    : "•"}
                </span>
                Passwords match
              </li>
            </ul>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#008069] text-white py-3 px-4 rounded-lg font-semibold hover:bg-[#00a884] focus:ring-2 focus:ring-[#008069] focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Resetting password...
              </div>
            ) : (
              "Reset Password"
            )}
          </button>
        </form>

        {/* Back to Login */}
        <div className="text-center mt-8">
          <Link
            to="/login"
            className="text-[#008069] hover:text-[#00a884] font-medium transition-colors"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
