import axios from "axios";
import React, { useState } from "react";
import { backendUrl } from "../App";
import { toast } from "react-toastify";

const Login = ({ setToken }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onSubmitHandler = async (e) => {
    try {
      e.preventDefault();
      const response = await axios.post(backendUrl + "/api/user/admin", {
        email,
        password,
      });
      if (response.data.success) {
        setToken(response.data.token);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center w-full px-4 py-8 bg-gradient-to-br from-red-50 to-orange-100">
      <div className="bg-white shadow-lg rounded-lg px-6 py-8 w-full max-w-md mx-4 sm:px-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2 bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
            Nupips
          </h1>
          <p className="text-gray-600 text-sm">Admin Panel Login</p>
        </div>

        <form onSubmit={onSubmitHandler} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              onChange={(e) => setEmail(e.target.value)}
              value={email}
              className="w-full px-3 py-3 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
              type="email"
              placeholder="your@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              onChange={(e) => setPassword(e.target.value)}
              value={password}
              className="w-full px-3 py-3 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
              type="password"
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            className="w-full py-3 px-4 bg-gradient-to-r from-red-600 to-orange-600 text-white font-medium rounded-md hover:from-red-700 hover:to-orange-700 focus:ring-4 focus:ring-red-200 transition-all duration-200 mt-6"
            type="submit"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
