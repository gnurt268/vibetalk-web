import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { BiEnvelope, BiArrowBack } from "react-icons/bi";
import { AiOutlineCheckCircle } from "react-icons/ai";
import { forgotPassword } from "../../redux/Auth/Action";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    setEmail(e.target.value);
    if (errors.email) {
      setErrors({});
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Invalid email format";
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
      const result = await dispatch(forgotPassword(email.trim()));

      if (result.status) {
        setIsSuccess(true);
        setSuccessMessage(
          result.message || "Password reset email sent successfully!"
        );
      }
    } catch (error) {
      setErrors({
        submit:
          error.response?.data?.message ||
          "Failed to send reset email. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate("/login");
  };

  const handleResendEmail = () => {
    setIsSuccess(false);
    setSuccessMessage("");
    setErrors({});
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#008069] to-[#00a884] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <AiOutlineCheckCircle className="text-green-600 text-3xl" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Email Sent!
            </h1>
            <p className="text-gray-600 text-sm leading-relaxed">
              {successMessage}
            </p>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-2">Next steps:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Check your email inbox</li>
                <li>Look for an email from VibeTalk</li>
                <li>Click the reset link in the email</li>
                <li>The link will expire in 15 minutes</li>
              </ul>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleBackToLogin}
              className="w-full bg-[#008069] text-white py-3 px-4 rounded-lg font-semibold hover:bg-[#00a884] focus:ring-2 focus:ring-[#008069] focus:ring-offset-2 transition-all"
            >
              Back to Sign In
            </button>

            <button
              onClick={handleResendEmail}
              className="w-full text-[#008069] hover:text-[#00a884] py-2 px-4 rounded-lg font-medium transition-colors"
            >
              Send Another Email
            </button>
          </div>

          {/* Help Text */}
          <div className="text-center mt-6">
            <p className="text-xs text-gray-500">
              Didn't receive the email? Check your spam folder or{" "}
              <button
                onClick={handleResendEmail}
                className="text-[#008069] hover:text-[#00a884] underline"
              >
                try again
              </button>
            </p>
          </div>
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
            <BiEnvelope className="text-white text-2xl" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Forgot Password?
          </h1>
          <p className="text-gray-600 text-sm leading-relaxed">
            Don't worry! Enter your email address and we'll send you a link to
            reset your password.
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

          {/* Email Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <BiEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                name="email"
                value={email}
                onChange={handleInputChange}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#008069] focus:border-transparent transition-all ${
                  errors.email ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter your email address"
                autoFocus
              />
            </div>
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email}</p>
            )}
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
                Sending email...
              </div>
            ) : (
              "Send Reset Link"
            )}
          </button>
        </form>

        {/* Back to Login */}
        <div className="text-center mt-8">
          <Link
            to="/login"
            className="inline-flex items-center text-[#008069] hover:text-[#00a884] font-medium transition-colors"
          >
            <BiArrowBack className="mr-2" />
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
