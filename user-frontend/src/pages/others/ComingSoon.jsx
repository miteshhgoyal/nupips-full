// ComingSoon.jsx
import React from "react";
import { Sparkles, Rocket, Zap } from "lucide-react";
import { Link } from "react-router-dom";

const ComingSoon = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 flex items-center justify-center p-6">
      <div className="max-w-2xl text-center">
        {/* Logo */}
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-lg mb-8 animate-pulse">
          <Rocket className="w-8 h-8 text-white" />
        </div>

        {/* Main Heading */}
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">
          We're Launching Soon
        </h1>

        {/* Subheading */}
        <p className="text-lg md:text-xl text-gray-600 mb-12 leading-relaxed">
          Something extraordinary is in the works. We're crafting an experience
          that will transform the way you connect, create, and grow.
        </p>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow border border-orange-100">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mb-3 mx-auto">
              <Sparkles className="w-5 h-5 text-orange-600" />
            </div>
            <h3 className="font-semibold text-gray-900 text-sm mb-2">
              Beautiful Design
            </h3>
            <p className="text-gray-600 text-xs leading-relaxed">
              Carefully crafted with attention to every detail
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow border border-orange-100">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mb-3 mx-auto">
              <Zap className="w-5 h-5 text-orange-600" />
            </div>
            <h3 className="font-semibold text-gray-900 text-sm mb-2">
              Lightning Fast
            </h3>
            <p className="text-gray-600 text-xs leading-relaxed">
              Optimized performance for the best experience
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow border border-orange-100">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mb-3 mx-auto">
              <Rocket className="w-5 h-5 text-orange-600" />
            </div>
            <h3 className="font-semibold text-gray-900 text-sm mb-2">
              Ready to Scale
            </h3>
            <p className="text-gray-600 text-xs leading-relaxed">
              Built to grow with your needs and ambitions
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="inline-flex items-center gap-2 bg-orange-50 px-6 py-3 rounded-full border border-orange-200 mb-8">
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-orange-700">
            Currently in development
          </span>
        </div>

        {/* Bottom Accent */}
        <div className="mt-12 flex items-center justify-center gap-2">
          <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
          <div className="w-2 h-2 bg-orange-300 rounded-full"></div>
          <div className="w-2 h-2 bg-orange-200 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};

export default ComingSoon;
