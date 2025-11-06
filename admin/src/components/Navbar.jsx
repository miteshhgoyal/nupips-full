import React from "react";
import { LogOut, Menu, X, Shield } from "lucide-react";

const Navbar = ({ setToken, sidebarOpen, setSidebarOpen }) => {
  const handleLogout = () => {
    setToken("");
  };

  return (
    <div className="bg-gradient-to-r from-orange-600 to-orange-700 shadow-lg border-b-4 border-orange-800 sticky top-0 z-50">
      <div className="flex items-center justify-between px-4 sm:px-6 py-4">
        {/* Left Section - Menu & Logo */}
        <div className="flex items-center">
          {/* Mobile menu button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded-md text-white hover:bg-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-300 transition-colors"
          >
            {sidebarOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>

          {/* Logo Section */}
          <div className="flex items-center ml-2 lg:ml-0 gap-3">
            <div className="bg-white rounded-lg p-2 shadow-md">
              <Shield className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">
                Nupips
              </h1>
              <p className="text-xs sm:text-sm text-orange-100 font-medium">
                Admin Control Panel
              </p>
            </div>
          </div>
        </div>

        {/* Right Section - User Info & Logout */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center space-x-1 sm:space-x-2 bg-white text-orange-600 px-3 sm:px-5 py-2 rounded-lg hover:bg-orange-50 focus:ring-4 focus:ring-orange-300 transition-all duration-200 font-semibold text-sm sm:text-base shadow-md hover:shadow-lg"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:block">Logout</span>
            <span className="sm:hidden">Exit</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
