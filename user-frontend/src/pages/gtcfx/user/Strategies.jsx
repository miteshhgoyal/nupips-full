// pages/gtcfx/user/Strategies.jsx
import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import {
  Search,
  TrendingUp,
  Loader,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Target,
  Users,
  DollarSign,
  Calendar,
  BarChart3,
  ArrowRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../../services/gtcfxApi";

const GTCFxStrategies = () => {
  const navigate = useNavigate();
  const [strategies, setStrategies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    keyword: "",
    start_time: "",
    end_time: "",
  });

  const ITEMS_PER_PAGE = 12;

  useEffect(() => {
    fetchStrategiesData();
  }, [currentPage]);

  const fetchStrategiesData = async () => {
    setLoading(true);
    setError(null);

    try {
      const payload = {
        page: currentPage,
        page_size: ITEMS_PER_PAGE,
        keyword: filters.keyword || "",
      };

      if (filters.start_time) {
        payload.start_time = Math.floor(
          new Date(filters.start_time).getTime() / 1000
        );
      }
      if (filters.end_time) {
        payload.end_time = Math.floor(
          new Date(filters.end_time).getTime() / 1000
        );
      }

      const response = await api.post("/pamm_list", payload);

      if (response.data.code === 200) {
        setStrategies(response.data.data.list || []);
      } else {
        setError(response.data.message || "Failed to fetch strategies");
      }
    } catch (err) {
      console.error("Fetch strategies error:", err);
      setError(
        err.response?.data?.message || "Network error. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setFilters({ ...filters, keyword: value });
    setCurrentPage(1);
  };

  const handleApplyFilters = () => {
    setCurrentPage(1);
    fetchStrategiesData();
  };

  const handleStrategyClick = (uuid) => {
    navigate(`/gtcfx/strategies/${uuid}`);
  };

  const getRiskLevelColor = (level) => {
    if (level <= 2) return "bg-green-100 text-green-700 border-green-200";
    if (level <= 5) return "bg-yellow-100 text-yellow-700 border-yellow-200";
    return "bg-red-100 text-red-700 border-red-200";
  };

  const getRiskLevelLabel = (level) => {
    if (level <= 2) return "Low Risk";
    if (level <= 5) return "Medium Risk";
    return "High Risk";
  };

  if (loading && currentPage === 1) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-12 h-12 text-orange-600 animate-spin" />
          <p className="text-gray-600 font-medium">Loading strategies...</p>
        </div>
      </div>
    );
  }

  if (error && strategies.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Failed to Load Strategies
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => {
              setCurrentPage(1);
              fetchStrategiesData();
            }}
            className="px-6 py-3 bg-linear-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-medium transition-all shadow-md hover:shadow-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Trading Strategies - GTC FX</title>
      </Helmet>

      <div className="min-h-screen bg-white p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-orange-600" />
            Trading Strategies
          </h1>
          <p className="text-gray-600 mt-2">
            Browse and subscribe to professional trading strategies
          </p>
        </div>

        {/* Search & Filters Card */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm mb-8">
          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search strategies by name or description..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full pl-12 pr-4 py-3 border border-gray-200 bg-gray-50 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
            />
          </div>

          {/* Date Range Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Start Date
              </label>
              <input
                type="date"
                value={filters.start_time}
                onChange={(e) =>
                  setFilters({ ...filters, start_time: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-200 bg-gray-50 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                End Date
              </label>
              <input
                type="date"
                value={filters.end_time}
                onChange={(e) =>
                  setFilters({ ...filters, end_time: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-200 bg-gray-50 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={handleApplyFilters}
                className="w-full px-4 py-2 bg-linear-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium rounded-xl transition-all shadow-md hover:shadow-lg"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>

        {/* Strategies Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {strategies.map((strategy) => (
            <div
              key={strategy.uuid}
              onClick={() => handleStrategyClick(strategy.uuid)}
              className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all cursor-pointer overflow-hidden group"
            >
              {/* Header with Image */}
              <div className="relative h-40 bg-linear-to-br from-orange-500 to-orange-600 overflow-hidden">
                {strategy.profile_photo ? (
                  <img
                    src={strategy.profile_photo}
                    alt={strategy.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BarChart3 className="w-16 h-16 text-white/50" />
                  </div>
                )}
                <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent" />

                {/* Risk Level Badge */}
                <div className="absolute top-3 right-3">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getRiskLevelColor(
                      strategy.risk_level
                    )}`}
                  >
                    {getRiskLevelLabel(strategy.risk_level)}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                {/* Strategy Name */}
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-orange-600 transition-colors line-clamp-1 mb-2">
                  {strategy.name}
                </h3>

                {/* Description */}
                <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                  {strategy.description || "Professional trading strategy"}
                </p>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {/* Total Profit */}
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600 font-medium mb-1">
                      Total Profit
                    </p>
                    <p
                      className={`text-base font-bold ${
                        parseFloat(strategy.total_profit) >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      ${parseFloat(strategy.total_profit || 0).toFixed(2)}
                    </p>
                  </div>

                  {/* Max Drawdown */}
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600 font-medium mb-1">
                      Max Drawdown
                    </p>
                    <p className="text-base font-bold text-red-600">
                      {parseFloat(strategy.max_drawdown || 0).toFixed(2)}%
                    </p>
                  </div>

                  {/* Performance Fee */}
                  <div className="p-3 bg-orange-50 rounded-lg border border-orange-100">
                    <p className="text-xs text-gray-600 font-medium mb-1">
                      Performance
                    </p>
                    <p className="text-base font-bold text-orange-600">
                      {strategy.performace_fee}%
                    </p>
                  </div>

                  {/* Management Fee */}
                  <div className="p-3 bg-orange-50 rounded-lg border border-orange-100">
                    <p className="text-xs text-gray-600 font-medium mb-1">
                      Management
                    </p>
                    <p className="text-base font-bold text-orange-600">
                      {strategy.management_fee}%
                    </p>
                  </div>
                </div>

                {/* Bottom Info */}
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Users className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Followers</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {strategy.total_copy_count}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Min Deposit</p>
                      <p className="text-sm font-semibold text-gray-900">
                        ${parseFloat(strategy.minimum_deposit || 0).toFixed(0)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* View Details Button */}
                <button
                  onClick={() => handleStrategyClick(strategy.uuid)}
                  className="w-full px-4 py-3 bg-linear-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 group"
                >
                  <span>View Details</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {strategies.length === 0 && !loading && (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Strategies Found
            </h3>
            <p className="text-gray-600 mb-6">
              Try adjusting your search filters or check back later
            </p>
            <button
              onClick={() => {
                setSearchTerm("");
                setFilters({ keyword: "", start_time: "", end_time: "" });
                fetchStrategiesData();
              }}
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-all"
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* Pagination */}
        {strategies.length > 0 && (
          <div className="flex items-center justify-center gap-4 py-6">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-3 border border-gray-200 rounded-xl hover:bg-orange-50 hover:border-orange-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-200 transition-all"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>

            <div className="flex items-center gap-3">
              <span className="text-gray-600 text-sm">Page</span>
              <input
                type="number"
                min="1"
                value={currentPage}
                onChange={(e) =>
                  setCurrentPage(Math.max(1, parseInt(e.target.value) || 1))
                }
                className="w-16 px-3 py-2 border border-gray-200 bg-gray-50 rounded-xl text-center focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none font-medium"
              />
            </div>

            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={strategies.length < ITEMS_PER_PAGE}
              className="p-3 border border-gray-200 rounded-xl hover:bg-orange-50 hover:border-orange-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-200 transition-all"
              aria-label="Next page"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default GTCFxStrategies;
