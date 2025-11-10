// components/GTCFxProtectedRoute.jsx
import React from "react";
import { useGTCFxAuth } from "../contexts/GTCFxAuthContext";
import GTCFxAuthRequired from "../pages/gtcfx/GTCFxAuthRequired";

const GTCFxProtectedRoute = ({ children }) => {
  const { gtcAuthenticated, gtcLoading } = useGTCFxAuth();

  if (gtcLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-700 text-lg">Loading GTC FX...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, show the auth required page
  if (!gtcAuthenticated) {
    return <GTCFxAuthRequired />;
  }

  // If authenticated, render the protected content
  return children;
};

export default GTCFxProtectedRoute;
