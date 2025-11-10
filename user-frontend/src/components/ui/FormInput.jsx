// FormInput.jsx
import React from "react";
import { Eye, EyeOff, AlertCircle } from "lucide-react";

const FormInput = ({
  icon: Icon,
  type = "text",
  name,
  value,
  onChange,
  placeholder,
  error,
  showPassword,
  onTogglePassword,
  readOnly = false,
  label,
  ...props
}) => {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          type={
            showPassword !== undefined
              ? showPassword
                ? "text"
                : "password"
              : type
          }
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          readOnly={readOnly}
          className={`w-full px-4 py-3 pl-12 ${
            type === "password" || showPassword !== undefined ? "pr-12" : ""
          } bg-gray-50 border text-gray-900 placeholder-gray-500 
                 focus:ring-orange-500 focus:border-orange-500 hover:border-gray-300
                 ${readOnly ? "cursor-not-allowed opacity-75 bg-gray-100" : ""}
                 ${
                   error ? "border-red-300 bg-red-50" : "border-gray-200"
                 } rounded-xl focus:outline-none focus:ring-2 transition-all duration-200`}
          {...props}
        />
        <Icon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-orange-500" />
        {onTogglePassword && (
          <button
            type="button"
            onClick={onTogglePassword}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 transition-colors text-orange-500 hover:text-orange-600"
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        )}
      </div>
      {error && (
        <p className="text-sm flex items-center gap-1 text-red-500">
          <AlertCircle className="w-4 h-4" />
          {error}
        </p>
      )}
    </div>
  );
};

export default FormInput;
