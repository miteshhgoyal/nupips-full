import React, { useEffect } from "react";
import {
  Plus,
  Package,
  ShoppingBag,
  X,
  Shield,
  Settings,
  BarChart3,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const location = useLocation();

  const menuItems = [
    {
      id: "add",
      label: "Add Product",
      icon: Plus,
      path: "/add",
    },
    {
      id: "list",
      label: "Product List",
      icon: Package,
      path: "/list",
    },
    {
      id: "orders",
      label: "Orders",
      icon: ShoppingBag,
      path: "/orders",
    },
  ];

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [setSidebarOpen]);

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed lg:relative inset-y-0 left-0 z-50 lg:z-auto transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 transition-transform duration-300 ease-in-out lg:block w-64 bg-gradient-to-b from-orange-50 to-white h-full border-r-4 border-orange-200 flex flex-col shadow-lg`}
      >
        {/* Header with Shield Icon */}
        <div className="p-4 border-b-2 border-orange-200 bg-gradient-to-r from-orange-100 to-orange-50">
          <div className="flex items-center justify-between lg:hidden">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-orange-600" />
              <h2 className="text-lg font-bold text-orange-700">Menu</h2>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-md text-orange-600 hover:text-orange-700 hover:bg-orange-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Desktop Logo */}
          <div className="hidden lg:flex items-center gap-2 mb-2">
            <div className="bg-orange-600 rounded-lg p-1.5">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-orange-700">Admin Panel</h3>
              <p className="text-xs text-orange-600">Management</p>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            const isActive =
              location.pathname === item.path ||
              (location.pathname === "/" && item.path === "/list");

            return (
              <Link
                key={item.id}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? "bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-lg border-l-4 border-orange-700"
                    : "text-gray-700 hover:bg-orange-100 hover:text-orange-700 border-l-4 border-transparent"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <IconComponent
                    className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                      isActive ? "text-white" : "text-orange-600"
                    }`}
                  />
                  <span className="font-semibold text-sm">{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-xs font-bold px-2 py-1 rounded-full ${
                      isActive
                        ? "bg-orange-300 text-orange-900"
                        : "bg-orange-200 text-orange-700"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
};

export default Sidebar;
