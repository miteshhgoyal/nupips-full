import React, { useEffect, useState } from "react";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import { Routes, Route } from "react-router-dom";
import Add from "./pages/Add";
import List from "./pages/List";
import Orders from "./pages/Orders";
import Login from "./components/Login";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export const backendUrl = import.meta.env.VITE_BACKEND_URL;
export const currency = "₹";

const App = () => {
  const [token, setToken] = useState(
    localStorage.getItem("token") ? localStorage.getItem("token") : ""
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("token", token);
  }, [token]);

  return (
    <div className="min-h-screen bg-gray-50">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        className="z-50 mt-16 sm:mt-0"
        toastClassName="text-sm"
      />

      {token === "" ? (
        <Login setToken={setToken} />
      ) : (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
          {/* Sidebar */}
          <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
            {/* Top Navigation */}
            <Navbar
              setToken={setToken}
              sidebarOpen={sidebarOpen}
              setSidebarOpen={setSidebarOpen}
            />

            {/* Page Content */}
            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
              <div className="w-full min-h-full">
                <div className="p-0 sm:p-0 lg:p-0">
                  <Routes>
                    <Route path="/add" element={<Add token={token} />} />
                    <Route path="/list" element={<List token={token} />} />
                    <Route path="/orders" element={<Orders token={token} />} />
                    <Route path="/" element={<List token={token} />} />
                  </Routes>
                </div>
              </div>
            </main>

            {/* Footer - Hidden on mobile, visible on larger screens */}
            <footer className="hidden md:block bg-white border-t border-gray-200 px-4 sm:px-6 py-3">
              <div className="flex flex-col sm:flex-row items-center justify-between text-xs sm:text-sm text-gray-600 space-y-2 sm:space-y-0">
                <div className="flex items-center space-x-2 sm:space-x-4">
                  <span>© 2025 Nupips Admin</span>
                </div>
                <div className="flex items-center space-x-4">
                  <span>
                    Last updated: {new Date().toLocaleDateString("en-IN")}
                  </span>
                </div>
              </div>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
