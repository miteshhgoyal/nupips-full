// user/App.jsx
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
  Link2,
  Swords,
} from "lucide-react";
import { CONFIG } from "./constants";
import "./App.css";

// Page imports
import Register from "./pages/Register";
import Login from "./pages/Login";
import Deposit from "./pages/wallet/Deposit";
import Withdrawal from "./pages/wallet/Withdrawal";
import TransactionHistory from "./pages/wallet/TransactionHistory";
import BrokerSelection from "./pages/user/BrokerSelection";
import GTCFxAuth from "./pages/gtcfx/Auth";
import GTCFxDashboard from "./pages/gtcfx/user/Dashboard";
import GTCFxProfitLogs from "./pages/gtcfx/user/ProfitLogs";
import GTCFxAgentMembers from "./pages/gtcfx/user/AgentMembers";
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
import Notifications from "./pages/user/Notifications";

// Navigation configuration
const NAVBAR_LINKS = [
  { name: "My Profile", href: "/profile", icon: NavUser },
  { name: "My Orders", href: "/orders", icon: ShoppingBag },
];

const BASE_SIDEBAR_LINKS = [
  { name: "Nupips Dashboard", href: "/dashboard", icon: Home },
  { name: "Nupips Team", href: "/nupips-team", icon: Users },
  { name: "Shop", href: "/shop", icon: ShoppingBag },
  { name: "Learn", href: "/learn", icon: Book },
  { name: "Competition", href: "/competition", icon: Swords },
];

const GTC_FX_SECTION = {
  name: "GTC FX",
  icon: TrendingUp,
  subItems: [
    { name: "Authentication", href: "/gtcfx/auth" },
    { name: "GTC FX Dashboard", href: "/gtcfx/dashboard" },
    { name: "Profit Logs", href: "/gtcfx/profit-logs" },
    { name: "Agent Members", href: "/gtcfx/agent/members" },
  ],
};

const BROKER_CONNECTION_LINK = {
  name: "Connect Your Broker",
  href: "/brokers",
  icon: Link2,
};

const WALLET_SECTION = {
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

const NO_LAYOUT_ROUTES = [
  "/login",
  "/register",
  "/verify-otp",
  "/forgot-password",
  "/reset-password",
];

const MOBILE_BREAKPOINT = 768;

// Default Route Component
const DefaultRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-orange-50 via-white to-orange-200">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-700 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return user ? (
    <Navigate to="/dashboard" replace />
  ) : (
    <Navigate to="/login" replace />
  );
};

// Layout Wrapper Component
const LayoutWrapper = ({ children }) => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(
    window.innerWidth >= MOBILE_BREAKPOINT,
  );
  const [isMobile, setIsMobile] = useState(
    window.innerWidth < MOBILE_BREAKPOINT,
  );
  const { gtcAuthenticated, gtcUser } = useGTCFxAuth();

  const showLayout = !NO_LAYOUT_ROUTES.includes(location.pathname);

  const sidebarLinks = useMemo(() => {
    const links = [...BASE_SIDEBAR_LINKS];

    if (!gtcAuthenticated && !gtcUser) {
      links.push(BROKER_CONNECTION_LINK);
    }

    if (gtcAuthenticated && gtcUser) {
      links.push(GTC_FX_SECTION);
    }

    links.push(WALLET_SECTION);
    return links;
  }, [gtcAuthenticated, gtcUser]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < MOBILE_BREAKPOINT;
      setIsMobile(mobile);
      setSidebarOpen(!mobile);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    window.toggleSidebar = () => setSidebarOpen((prev) => !prev);

    return () => {
      window.removeEventListener("resize", handleResize);
      delete window.toggleSidebar;
    };
  }, []);

  if (!showLayout) {
    return <>{children}</>;
  }

  const mainClasses = isMobile
    ? "pt-16 px-0 md:px-6"
    : `pt-20 md:pt-24 px-4 sm:px-6 lg:px-8 ${sidebarOpen ? "ml-64" : "ml-16"}`;

  const contentClasses = `pb-0 pt-0 md:pb-8 md:pt-2 max-w-full ${
    !isMobile && sidebarOpen ? "max-w-[calc(100vw-16rem)]" : ""
  }`;

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-blue-50/30 relative overflow-x-hidden">
      <Navbar
        toggleSidebar={() => setSidebarOpen((prev) => !prev)}
        navigationLinks={NAVBAR_LINKS}
        config={CONFIG}
      />
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen((prev) => !prev)}
        navigationLinks={sidebarLinks}
        config={CONFIG}
      />

      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="bg-orange-50">
        <main
          className={`transition-all duration-300 ease-in-out ${mainClasses}`}
        >
          <div className={contentClasses}>
            <div className="md:rounded-xl overflow-hidden border border-gray-200">
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
              {/* Public routes */}
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

              {/* Protected routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/notifications"
                element={
                  <ProtectedRoute>
                    <Notifications />
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

              {/* Wallet routes */}
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

              {/* GTC FX routes */}
              <Route
                path="/gtcfx/auth"
                element={
                  <ProtectedRoute>
                    <GTCFxAuth />
                  </ProtectedRoute>
                }
              />
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

              {/* Default routes */}
              <Route path="/" element={<DefaultRoute />} />
              <Route path="*" element={<DefaultRoute />} />
            </Routes>
          </LayoutWrapper>
        </GTCFxAuthProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
