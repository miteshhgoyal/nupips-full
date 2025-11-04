import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { Helmet } from "react-helmet";
import "./App.css";

// Auth Pages
import Login from "./pages/Login";

// Layout Components
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";

// User Pages
import Dashboard from "./pages/user/Dashboard";
import Strategies from "./pages/user/Strategies";
import StrategyDetail from "./pages/user/StrategyDetail";
import MySubscriptions from "./pages/user/MySubscriptions";
import ProfitLogs from "./pages/user/ProfitLogs";
import Redeem from "./pages/user/Redeem";
import CommissionReport from "./pages/user/CommissionReport";
import AgentMembers from "./pages/user/AgentMembers";

const DefaultRoute = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-50 to-white flex items-center justify-center">
        <div className="text-center animate-pulse">
          <div className="w-8 h-8 bg-gradient-to-br from-gray-900 to-black rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />;
};

const ProtectedRoute = ({ requireAuth = true, children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-50 to-white flex items-center justify-center">
        <div className="text-center animate-pulse">
          <div className="w-8 h-8 bg-gradient-to-br from-gray-900 to-black rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!requireAuth && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const ProtectedDashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleSidebarCollapse = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <ProtectedRoute requireAuth={true}>
      <div className="min-h-screen bg-slate-50 relative">
        <div className="fixed top-0 left-0 right-0 z-50">
          <Navbar
            toggleSidebar={toggleSidebar}
            toggleSidebarCollapse={toggleSidebarCollapse}
            sidebarCollapsed={sidebarCollapsed}
          />
        </div>

        <Sidebar
          isOpen={sidebarOpen}
          onToggle={toggleSidebar}
          isCollapsed={sidebarCollapsed}
          toggleCollapsed={toggleSidebarCollapse}
        />

        <main
          className={`
            pt-16 min-h-screen transition-all duration-300 ease-in-out
            ${sidebarCollapsed ? "lg:ml-16" : "lg:ml-60"}
          `}
        >
          <div className="p-3 sm:p-4 md:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <Helmet titleTemplate="%s | Nupips" defaultTitle="Nupips Platform">
            <meta
              name="description"
              content="Professional Nupips platform for managing your trading strategies and investments."
            />
            <meta name="theme-color" content="#1e293b" />
          </Helmet>

          <Routes>
            {/* Public Routes */}
            <Route
              path="/login"
              element={
                <ProtectedRoute requireAuth={false}>
                  <Login />
                </ProtectedRoute>
              }
            />

            {/* Protected User Routes */}
            <Route element={<ProtectedDashboardLayout />}>
              {/* Dashboard & Main Pages */}
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/strategies" element={<Strategies />} />
              <Route path="/strategies/:uuid" element={<StrategyDetail />} />

              {/* Portfolio Routes */}
              <Route path="/subscriptions" element={<MySubscriptions />} />
              <Route path="/profit-logs" element={<ProfitLogs />} />
              <Route path="/unsubscribe" element={<Redeem />} />

              {/* Agent Routes */}
              <Route path="/agent/commission" element={<CommissionReport />} />
              <Route path="/agent/members" element={<AgentMembers />} />
            </Route>

            {/* Default Redirects */}
            <Route path="/" element={<DefaultRoute />} />
            <Route path="*" element={<DefaultRoute />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
