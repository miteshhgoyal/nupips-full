import React, { useState } from "react";
import { User, Lock, Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../services/api";

const Login = () => {
  const { login, clearError, error: authError } = useAuth();
  const navigate = useNavigate();

  const pageConfig = {
    title: "Login to your GTC FX Account",
    submitButton: {
      loading: "Signing In...",
      default: "Continue",
    },
  };

  const fieldConfigs = [
    {
      name: "account",
      label: "Email",
      type: "email",
      placeholder: "Enter your email",
      icon: User,
      validation: "Email is required",
      required: true,
    },
    {
      name: "password",
      label: "Password",
      type: "password",
      placeholder: "Enter your password",
      icon: Lock,
      validation: "Password is required",
      required: true,
      hasToggle: true,
    },
  ];

  const initialFormData = fieldConfigs.reduce((acc, field) => {
    acc[field.name] = "";
    return acc;
  }, {});

  const [formData, setFormData] = useState(initialFormData);
  const [passwordVisibility, setPasswordVisibility] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
    if (submitError) {
      setSubmitError("");
    }
    if (authError) {
      clearError();
    }
  };

  const togglePasswordVisibility = (fieldName) => {
    setPasswordVisibility((prev) => ({
      ...prev,
      [fieldName]: !prev[fieldName],
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    fieldConfigs.forEach((field) => {
      if (field.required && !formData[field.name]?.trim()) {
        newErrors[field.name] = field.validation;
      }
    });

    if (
      formData.account &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.account)
    ) {
      newErrors.account = "Please enter a valid email address";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setSubmitError("");

    try {
      const response = await api.post("/login", {
        account: formData.account,
        password: formData.password,
      });

      if (response.data.code === 200 && response.data.data) {
        const { access_token, refresh_token, email } = response.data.data;

        const loginSuccess = login({
          access_token,
          refresh_token,
          email: email || formData.account,
        });

        if (loginSuccess) {
          navigate("/dashboard", { replace: true });
        } else {
          setSubmitError("Failed to complete login. Please try again.");
        }
      } else {
        setSubmitError(
          response.data.message ||
            "Login failed. Please check your credentials."
        );
      }
    } catch (error) {
      console.error("Login error:", error);

      if (error.response?.data?.code === -1) {
        setSubmitError(
          error.response.data.message ||
            "User does not exist or password is incorrect"
        );
      } else if (error.response?.data?.message) {
        setSubmitError(error.response.data.message);
      } else if (error.message === "Network Error") {
        setSubmitError(
          "Network error. Please check your connection and try again."
        );
      } else {
        setSubmitError("Login failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderFormField = (field) => {
    const Icon = field.icon;
    const isPassword = field.type === "password";
    const showPassword = passwordVisibility[field.name];

    return (
      <div key={field.name}>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {field.label}
        </label>
        <div className="relative">
          <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-orange-500" />
          <input
            type={isPassword && showPassword ? "text" : field.type}
            name={field.name}
            value={formData[field.name]}
            onChange={handleInputChange}
            disabled={isLoading}
            className={`w-full pl-10 pr-12 py-2 border rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
              errors[field.name] ? "border-red-500" : "border-gray-300"
            } disabled:bg-gray-100 disabled:cursor-not-allowed`}
            placeholder={field.placeholder}
            autoComplete={
              field.name === "account" ? "email" : "current-password"
            }
          />
          {field.hasToggle && (
            <button
              type="button"
              onClick={() => togglePasswordVisibility(field.name)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-orange-600 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {showPassword ? (
                <Eye className="w-5 h-5" />
              ) : (
                <EyeOff className="w-5 h-5" />
              )}
            </button>
          )}
        </div>
        {errors[field.name] && (
          <p className="mt-1 text-sm text-red-600">{errors[field.name]}</p>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-orange-900">
            {pageConfig.title}
          </h1>
        </div>

        <div className="bg-white rounded-md p-6 shadow-lg border border-orange-200">
          {submitError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              {submitError}
            </div>
          )}

          {authError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              {authError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {fieldConfigs.map(renderFormField)}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isLoading
                ? pageConfig.submitButton.loading
                : pageConfig.submitButton.default}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
