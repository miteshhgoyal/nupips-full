// ComingSoon.jsx
import React from "react";
import { Wrench } from "lucide-react";

const ComingSoon = () => {
  return (
    <div className="min-h-[calc(100vh-8rem)] bg-gradient-to-br from-orange-50 via-white to-orange-50 flex items-center justify-center p-6">
      <div className="max-w-lg text-center">
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-lg mb-6">
          <Wrench className="w-8 h-8 text-white" />
        </div>

        {/* Heading */}
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
          Work in Progress
        </h1>

        {/* Description */}
        <p className="text-base md:text-lg text-gray-600 mb-8">
          We're building something great. This feature will be available soon.
        </p>

        {/* Status Badge */}
        <div className="inline-flex items-center gap-2 bg-orange-50 px-5 py-2.5 rounded-full border border-orange-200">
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-orange-700">
            Under Development
          </span>
        </div>

        {/* Bottom Accent */}
        <div className="mt-10 flex items-center justify-center gap-2">
          <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
          <div className="w-2 h-2 bg-orange-300 rounded-full"></div>
          <div className="w-2 h-2 bg-orange-200 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};

export default ComingSoon;
