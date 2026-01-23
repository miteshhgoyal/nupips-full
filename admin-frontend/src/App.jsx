// admin/App.jsx
import React, { useState, useEffect, useMemo } from "react";
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
import { filterSidebarLinks } from "./utils/permissions";
import {
  Home,
  User as NavUser,
  ShoppingBag,
  BookA,
  Settings,
  Wallet,
  Users as UsersIcon,
  Swords,
  UserCog,
} from "lucide-react";
import { CONFIG } from "./constants";
import "./App.css";

// Page imports
import Login from "./pages/Login";
import Orders from "./pages/Orders";
import Products from "./pages/Products";
import Courses from "./pages/Courses";
import CourseDetail from "./pages/CourseDetail";
import SystemConfiguration from "./pages/SystemConfiguration";
import SystemIncomes from "./pages/SystemIncomes";
import Profile from "./pages/Profile";
import Dashboard from "./pages/Dashboard";
import Deposits from "./pages/Deposits";
import Withdrawals from "./pages/Withdrawals";
import Users from "./pages/Users";
import GTCMembers from "./pages/GTCMembers";
import Competition from "./pages/Competition";
import Subadmins from "./pages/Subadmins";

// Navigation configuration
const NAVBAR_LINKS = [{ name: "My Profile", href: "/profile", icon: NavUser }];

const ALL_SIDEBAR_LINKS = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: Home,
  },
  {
    name: "Wallet",
    icon: Wallet,
    subItems: [
      { name: "Deposit", href: "/deposits" },
      { name: "Withdrawal", href: "/withdrawals" },
      { name: "System Incomes", href: "/system-incomes" },
    ],
  },
  {
    name: "Marketing Shop",
    icon: ShoppingBag,
    subItems: [
      { name: "Products", href: "/products" },
      { name: "Orders", href: "/orders" },
    ],
  },
  { name: "Competition", href: "/competition", icon: Swords },
  { name: "GTC Members", href: "/gtc-members", icon: UsersIcon },
  { name: "Nupips Membes", href: "/users", icon: UsersIcon },
  { name: "Courses", href: "/courses", icon: BookA },
  {
    name: "System Configuration",
    href: "/system-configuration",
    icon: Settings,
  },
  { name: "Subadmins", href: "/subadmins", icon: UserCog },
];

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
  const { user, permissions } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(
    window.innerWidth >= MOBILE_BREAKPOINT,
  );
  const [isMobile, setIsMobile] = useState(
    window.innerWidth < MOBILE_BREAKPOINT,
  );

  const showLayout = !NO_LAYOUT_ROUTES.includes(location.pathname);

  const filteredSidebarLinks = useMemo(() => {
    return user
      ? filterSidebarLinks(ALL_SIDEBAR_LINKS, user.userType, permissions)
      : ALL_SIDEBAR_LINKS;
  }, [user, permissions]);

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
        navigationLinks={filteredSidebarLinks}
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
        <LayoutWrapper>
          <Routes>
            {/* Auth Routes */}
            <Route
              path="/login"
              element={
                <ProtectedRoute requireAuth={false}>
                  <Login />
                </ProtectedRoute>
              }
            />

            {/* Dashboard */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            {/* Wallet Routes */}
            <Route
              path="/deposits"
              element={
                <ProtectedRoute>
                  <Deposits />
                </ProtectedRoute>
              }
            />
            <Route
              path="/withdrawals"
              element={
                <ProtectedRoute>
                  <Withdrawals />
                </ProtectedRoute>
              }
            />
            <Route
              path="/system-incomes"
              element={
                <ProtectedRoute>
                  <SystemIncomes />
                </ProtectedRoute>
              }
            />

            {/* Marketing Shop Routes */}
            <Route
              path="/products"
              element={
                <ProtectedRoute>
                  <Products />
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

            {/* Competition */}
            <Route
              path="/competition"
              element={
                <ProtectedRoute>
                  <Competition />
                </ProtectedRoute>
              }
            />

            {/* GTC Members */}
            <Route
              path="/gtc-members"
              element={
                <ProtectedRoute>
                  <GTCMembers />
                </ProtectedRoute>
              }
            />

            {/* Users */}
            <Route
              path="/users"
              element={
                <ProtectedRoute>
                  <Users />
                </ProtectedRoute>
              }
            />

            {/* Courses Routes */}
            <Route
              path="/courses"
              element={
                <ProtectedRoute>
                  <Courses />
                </ProtectedRoute>
              }
            />
            <Route
              path="/courses/:id"
              element={
                <ProtectedRoute>
                  <CourseDetail />
                </ProtectedRoute>
              }
            />

            {/* System Configuration */}
            <Route
              path="/system-configuration"
              element={
                <ProtectedRoute>
                  <SystemConfiguration />
                </ProtectedRoute>
              }
            />

            {/* Subadmins */}
            <Route
              path="/subadmins"
              element={
                <ProtectedRoute>
                  <Subadmins />
                </ProtectedRoute>
              }
            />

            {/* Profile */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />

            {/* Default routes */}
            <Route path="/" element={<DefaultRoute />} />
            <Route path="*" element={<DefaultRoute />} />
          </Routes>
        </LayoutWrapper>
      </AuthProvider>
    </Router>
  );
}

export default App;
