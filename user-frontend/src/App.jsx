// App.jsx
import React, { useState, useEffect, useMemo } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { GTCFxAuthProvider, useGTCFxAuth } from "./contexts/GTCFxAuthContext";
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
  Wallet,
  Users,
  Coins,
  Link2,
  Swords,
} from "lucide-react";
import { CONFIG } from "./constants";
import "./App.css";
import api from "./services/api";

// Import your pages
import Register from "./pages/Register";
import Login from "./pages/Login";
import ComingSoon from "./pages/others/ComingSoon";

import Deposit from "./pages/wallet/Deposit";
import Withdrawal from "./pages/wallet/Withdrawal";
import TransactionHistory from "./pages/wallet/TransactionHistory";

import BrokerSelection from "./pages/user/BrokerSelection";

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

import Profile from "./pages/user/Profile";
import Dashboard from "./pages/user/Dashboard";
import Transfer from "./pages/wallet/Transfer";
import NupipsTeam from "./pages/user/NupipsTeam";
import Shop from "./pages/others/Shop";
import Orders from "./pages/user/Orders";
import ProductItem from "./pages/others/ProductItem";
import PlaceOrder from "./pages/others/PlaceOrder";

import Learn from "./pages/others/Learn";
import CourseView from "./pages/others/CourseView";
import LessonView from "./pages/others/LessonView";
import NupipsIncomes from "./pages/user/NupipsIncomes";
import Competition from "./pages/Competition";

// Navigation configuration
const navbarLinks = [
  { name: "My Profile", href: "/profile", icon: NavUser },
  { name: "My Orders", href: "/orders", icon: ShoppingBag },
];

// Base sidebar links always visible
const baseSidebarLinks = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Nupips Team", href: "/nupips-team", icon: Users },
  { name: "Shop", href: "/shop", icon: ShoppingBag },
  { name: "Learn", href: "/learn", icon: Book },
];

// Competition link (conditionally shown)
const competitionLink = {
  name: "Competition",
  href: "/competition",
  icon: Swords,
};

// GTC FX sidebar section (only when connected)
const gtcFxSidebarSection = {
  name: "GTC FX",
  icon: TrendingUp,
  subItems: [
    { name: "Authentication", href: "/gtcfx/auth" },
    { name: "Dashboard", href: "/gtcfx/dashboard" },
    { name: "Profit Logs", href: "/gtcfx/profit-logs" },
    { name: "Agent Members", href: "/gtcfx/agent/members" },
  ],
};

// Broker connection link (only when not connected)
const brokerConnectionLink = {
  name: "Connect Your Broker",
  href: "/brokers",
  icon: Link2,
};

// Wallet section (always visible)
const walletSidebarSection = {
  name: "Wallet",
  icon: Wallet,
  subItems: [
    { name: "Nupips Incomes", href: "/nupips-incomes" },
    { name: "Deposit", href: "/deposit" },
    { name: "Withdrawal", href: "/withdrawal" },
    { name: "Internal Transfer", href: "/transfer" },
    { name: "Transaction History", href: "/transaction-history" },
  ],
};

// Default Route Component
const DefaultRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-orange-200">
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

// Layout Wrapper Component with Dynamic Sidebar
const LayoutWrapper = ({ children, competitionEnabled }) => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const { gtcAuthenticated, gtcUser } = useGTCFxAuth();

  // Check if current route should show layout
  const noLayoutRoutes = [
    "/login",
    "/register",
    "/verify-otp",
    "/forgot-password",
    "/reset-password",
  ];

  const showLayout = !noLayoutRoutes.includes(location.pathname);

  // Generate dynamic sidebar links based on GTC FX connection status
  const dynamicSidebarLinks = useMemo(() => {
    const links = [...baseSidebarLinks];

    // Add competition link if enabled
    if (competitionEnabled) {
      links.push(competitionLink);
    }

    // Add broker connection link if GTC FX is NOT connected
    if (!gtcAuthenticated && !gtcUser) {
      links.push(brokerConnectionLink);
    }

    // Add GTC FX section if connected
    if (gtcAuthenticated && gtcUser) {
      links.push(gtcFxSidebarSection);
    }

    // Always add wallet section at the end
    links.push(walletSidebarSection);

    return links;
  }, [gtcAuthenticated, gtcUser, competitionEnabled]);

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
        navigationLinks={dynamicSidebarLinks}
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
  const [competitionEnabled, setCompetitionEnabled] = useState(false);

  // Fetch competition config to check if enabled
  useEffect(() => {
    const checkCompetitionStatus = async () => {
      try {
        const response = await api.get(`/competition/status`);
        const data = await response.data;
        if (data.status) {
          setCompetitionEnabled(data.status);
        }
      } catch (error) {
        console.error("Failed to check competition status:", error);
        setCompetitionEnabled(false);
      }
    };

    checkCompetitionStatus();
  }, []);

  return (
    <Router>
      <AuthProvider>
        <GTCFxAuthProvider>
          <LayoutWrapper competitionEnabled={competitionEnabled}>
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

              {/* Competition route - conditionally rendered */}
              <Route
                path="/competition"
                element={
                  <ProtectedRoute>
                    <Competition />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/brokers"
                element={
                  <ProtectedRoute>
                    <BrokerSelection />
                  </ProtectedRoute>
                }
              />

              {/* Main App Protected routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/nupips-team"
                element={
                  <ProtectedRoute>
                    <NupipsTeam />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/nupips-incomes"
                element={
                  <ProtectedRoute>
                    <NupipsIncomes />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/shop"
                element={
                  <ProtectedRoute>
                    <Shop />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/orders"
                element={
                  <ProtectedRoute>
                    <Orders />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/product/:id"
                element={
                  <ProtectedRoute>
                    <ProductItem />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/place-order"
                element={
                  <ProtectedRoute>
                    <PlaceOrder />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/learn"
                element={
                  <ProtectedRoute>
                    <Learn />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/learn/course/:id"
                element={
                  <ProtectedRoute>
                    <CourseView />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/learn/course/:courseId/lesson/:lessonId"
                element={
                  <ProtectedRoute>
                    <LessonView />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/deposit"
                element={
                  <ProtectedRoute>
                    <Deposit />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/withdrawal"
                element={
                  <ProtectedRoute>
                    <Withdrawal />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/transaction-history"
                element={
                  <ProtectedRoute>
                    <TransactionHistory />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/transfer"
                element={
                  <ProtectedRoute>
                    <Transfer />
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
