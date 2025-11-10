// App.jsx
import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import {
  Home,
  User as NavUser,
  Book,
  ShoppingBag,
  TrendingUp,
} from "lucide-react";
import { CONFIG } from "./constants";
import "./App.css";

// Import your pages
import Login from "./pages/Login";
import ComingSoon from "./pages/others/ComingSoon";

// Navigation configuration
const navbarLinks = [{ name: "My Profile", href: "/profile", icon: NavUser }];

const sidebarLinks = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: Home,
  },
];

// Default Route Component
const DefaultRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-orange-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-700 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to="/dashboard" replace />;
};

// Layout Wrapper Component
const LayoutWrapper = ({ children }) => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Check if current route should show layout
  const noLayoutRoutes = [
    "/login",
    "/register",
    "/verify-otp",
    "/forgot-password",
    "/reset-password",
  ];

  const showLayout = !noLayoutRoutes.includes(location.pathname);

  useEffect(() => {
    const checkMobile = () => {
      const isMobileNow = window.innerWidth < 768;
      setIsMobile(isMobileNow);

      if (isMobileNow) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    window.toggleSidebar = toggleSidebar;

    return () => {
      window.removeEventListener("resize", checkMobile);
      delete window.toggleSidebar;
    };
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // If no layout needed, render children directly
  if (!showLayout) {
    return <>{children}</>;
  }

  // Render with layout
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 relative overflow-x-hidden">
      <Navbar
        toggleSidebar={toggleSidebar}
        navigationLinks={navbarLinks}
        config={CONFIG}
      />
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={toggleSidebar}
        navigationLinks={sidebarLinks}
        config={CONFIG}
      />

      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          onClick={toggleSidebar}
        />
      )}

      <div className="bg-orange-50">
        <main
          className={`transition-all duration-300 ease-in-out ${
            isMobile
              ? "pt-16 px-4 sm:px-6"
              : `pt-20 md:pt-24 px-4 sm:px-6 lg:px-8 ${
                  sidebarOpen ? "ml-64" : "ml-16"
                }`
          }`}
        >
          <div
            className={`pb-6 pt-3 md:pb-8 md:pt-2 max-w-full ${
              !isMobile && sidebarOpen ? "max-w-[calc(100vw-16rem)]" : ""
            }`}
          >
            <div className="rounded-xl overflow-hidden border border-gray-200">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

// Main App Component
function App() {
  return (
    <Router>
      <AuthProvider>
        <LayoutWrapper>
          <Routes>
            <Route
              path="/login"
              element={
                <ProtectedRoute requireAuth={false}>
                  <Login />
                </ProtectedRoute>
              }
            />

            {/* Main App Protected routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <ComingSoon />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ComingSoon />
                </ProtectedRoute>
              }
            />

            {/* Default redirect */}
            <Route path="/" element={<DefaultRoute />} />

            {/* 404 fallback */}
            <Route path="*" element={<DefaultRoute />} />
          </Routes>
        </LayoutWrapper>
      </AuthProvider>
    </Router>
  );
}

export default App;
