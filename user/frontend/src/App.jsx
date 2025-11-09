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
import { GTCFxAuthProvider } from "./contexts/GTCFxAuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import GTCFxProtectedRoute from "./components/GTCFxProtectedRoute";
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
import Register from "./pages/Register";
import Login from "./pages/Login";
import ComingSoon from "./pages/others/ComingSoon";

// Import GTC FX Pages
import GTCFxAuth from "./pages/gtcfx/Auth";
import GTCFxDashboard from "./pages/gtcfx/user/Dashboard";
import GTCFxStrategies from "./pages/gtcfx/user/Strategies";
import GTCFxStrategyDetail from "./pages/gtcfx/user/StrategyDetail";
import GTCFxSubscriptions from "./pages/gtcfx/user/MySubscriptions";
import GTCFxProfitLogs from "./pages/gtcfx/user/ProfitLogs";
import GTCFxUnsubscribe from "./pages/gtcfx/user/Unsubscribe";
import GTCFxAgentMembers from "./pages/gtcfx/user/AgentMembers";
import GTCFxCommissionReport from "./pages/gtcfx/user/CommissionReport";

// Navigation configuration
const navbarLinks = [{ name: "My Profile", href: "/profile", icon: NavUser }];

const sidebarLinks = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: Home,
  },
  {
    name: "Shop",
    href: "/shop",
    icon: ShoppingBag,
  },
  {
    name: "Learn",
    href: "/learn",
    icon: Book,
  },
  {
    name: "GTC FX",
    icon: TrendingUp,
    subItems: [
      { name: "Authentication", href: "/gtcfx/auth" },
      { name: "Dashboard", href: "/gtcfx/dashboard" },
    //   { name: "Strategies", href: "/gtcfx/strategies" },
    //   { name: "My Subscriptions", href: "/gtcfx/subscriptions" },
      { name: "Profit Logs", href: "/gtcfx/profit-logs" },
    //   { name: "Unsubscribe", href: "/gtcfx/unsubscribe" },
      { name: "Agent Members", href: "/gtcfx/agent/members" },
      { name: "Commission Report", href: "/gtcfx/agent/commission" },
    ],
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
        <GTCFxAuthProvider>
          <LayoutWrapper>
            <Routes>
              {/* Public routes - no authentication required */}
              <Route
                path="/register"
                element={
                  <ProtectedRoute requireAuth={false}>
                    <Register />
                  </ProtectedRoute>
                }
              />
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
                path="/shop"
                element={
                  <ProtectedRoute>
                    <ComingSoon />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/learn"
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

              {/* GTC FX Login - Only requires main auth */}
              <Route
                path="/gtcfx/auth"
                element={
                  <ProtectedRoute>
                    <GTCFxAuth />
                  </ProtectedRoute>
                }
              />

              {/* GTC FX Protected Routes - Requires both main auth AND GTC FX auth */}
              <Route
                path="/gtcfx/dashboard"
                element={
                  <ProtectedRoute>
                    <GTCFxProtectedRoute>
                      <GTCFxDashboard />
                    </GTCFxProtectedRoute>
                  </ProtectedRoute>
                }
              />
              {/* <Route
                path="/gtcfx/strategies"
                element={
                  <ProtectedRoute>
                    <GTCFxProtectedRoute>
                      <GTCFxStrategies />
                    </GTCFxProtectedRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/gtcfx/strategies/:uuid"
                element={
                  <ProtectedRoute>
                    <GTCFxProtectedRoute>
                      <GTCFxStrategyDetail />
                    </GTCFxProtectedRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/gtcfx/subscriptions"
                element={
                  <ProtectedRoute>
                    <GTCFxProtectedRoute>
                      <GTCFxSubscriptions />
                    </GTCFxProtectedRoute>
                  </ProtectedRoute>
                }
              /> */}
              <Route
                path="/gtcfx/profit-logs"
                element={
                  <ProtectedRoute>
                    <GTCFxProtectedRoute>
                      <GTCFxProfitLogs />
                    </GTCFxProtectedRoute>
                  </ProtectedRoute>
                }
              />
              {/* <Route
                path="/gtcfx/unsubscribe"
                element={
                  <ProtectedRoute>
                    <GTCFxProtectedRoute>
                      <GTCFxUnsubscribe />
                    </GTCFxProtectedRoute>
                  </ProtectedRoute>
                }
              /> */}
              <Route
                path="/gtcfx/agent/members"
                element={
                  <ProtectedRoute>
                    <GTCFxProtectedRoute>
                      <GTCFxAgentMembers />
                    </GTCFxProtectedRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/gtcfx/agent/commission"
                element={
                  <ProtectedRoute>
                    <GTCFxProtectedRoute>
                      <GTCFxCommissionReport />
                    </GTCFxProtectedRoute>
                  </ProtectedRoute>
                }
              />

              {/* Default redirect */}
              <Route path="/" element={<DefaultRoute />} />

              {/* 404 fallback */}
              <Route path="*" element={<DefaultRoute />} />
            </Routes>
          </LayoutWrapper>
        </GTCFxAuthProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
