import React, { useState, useRef, useEffect } from "react";
import { User, LogOut, Menu } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const Navbar = ({ toggleSidebar, toggleSidebarCollapse, sidebarCollapsed }) => {
  const { user, logout, loading } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const userMenuRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setIsLoggingOut(false);
      setIsUserMenuOpen(false);
    }
  };

  // Display name and email logic
  const displayName = user?.nickname || user?.realname || "User";
  const displayEmail = user?.email || "Loading...";

  return (
    <nav className="bg-white border-b border-orange-200 px-4 sm:px-6 py-3 shadow-sm sticky top-0 z-40">
      <div className="flex items-center justify-between">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          {/* Mobile Menu Button */}
          <button
            onClick={toggleSidebar}
            className="p-2 text-orange-600 hover:text-orange-700 hover:bg-orange-100 rounded-lg lg:hidden transition-colors"
          >
            <Menu size={20} />
          </button>

          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">N</span>
            </div>
            <h1 className="text-lg font-bold text-orange-900 hidden sm:block">
              Nupips
            </h1>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* User Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="p-2 text-orange-600 hover:text-orange-700 hover:bg-orange-100 rounded-lg border border-orange-300 transition-colors"
              disabled={loading}
            >
              <User size={20} />
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-orange-200 py-2 z-50">
                {/* User Info */}
                <div className="px-4 py-3 border-b border-orange-100">
                  <div className="flex items-center gap-3">
                    {user?.avatar ? (
                      <img
                        src={user.avatar}
                        alt={displayName}
                        className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <User size={20} className="text-white" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-orange-900 truncate">
                        {displayName}
                      </div>
                      <div className="text-sm text-gray-500 truncate">
                        {displayEmail}
                      </div>
                      {user?.amount && (
                        <div className="text-xs text-orange-600 font-medium mt-1">
                          Balance: ${parseFloat(user.amount).toFixed(2)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Sign Out */}
                <div className="border-t border-orange-100 pt-2">
                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <LogOut size={16} />
                    {isLoggingOut ? "Signing Out..." : "Sign Out"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
