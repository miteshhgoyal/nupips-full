import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import {
  Search,
  TrendingUp,
  TrendingDown,
  Loader,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Target,
  Users,
  DollarSign,
  BarChart3,
  Calendar,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../../services/api";

const StrategiesPage = () => {
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
    navigate(`/strategies/${uuid}`);
  };

  const getRiskLevelColor = (level) => {
    if (level <= 2) return "bg-green-100 text-green-800";
    if (level <= 5) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const getRiskLevelLabel = (level) => {
    if (level <= 2) return "Low";
    if (level <= 5) return "Medium";
    return "High";
  };

  if (loading && currentPage === 1) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-12 h-12 text-orange-600 animate-spin" />
          <p className="text-slate-600 font-medium">Loading strategies...</p>
        </div>
      </div>
    );
  }

  if (error && strategies.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <p className="text-red-600 font-medium mb-4">{error}</p>
          <button
            onClick={() => {
              setCurrentPage(1);
              fetchStrategiesData();
            }}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet title="Strategies" />
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-orange-900">
            Trading Strategies
          </h1>
          <p className="text-slate-600 mt-2">
            Browse and subscribe to professional trading strategies
          </p>
        </div>

        {/* Search & Filters */}
        <div className="bg-white rounded-lg p-6 border border-orange-200 shadow-sm space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search strategies by name or description..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
            />
          </div>

          {/* Date Range Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={filters.start_time}
                onChange={(e) =>
                  setFilters({ ...filters, start_time: e.target.value })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={filters.end_time}
                onChange={(e) =>
                  setFilters({ ...filters, end_time: e.target.value })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={handleApplyFilters}
                className="w-full px-4 py-2 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 transition"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>

        {/* Strategies Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {strategies.map((strategy) => (
            <div
              key={strategy.uuid}
              onClick={() => handleStrategyClick(strategy.uuid)}
              className="bg-white rounded-lg border border-orange-200 shadow-sm hover:shadow-lg transition cursor-pointer overflow-hidden group"
            >
              {/* Header with Image */}
              <div className="relative h-40 bg-gradient-to-br from-orange-500 to-orange-600 overflow-hidden">
                {strategy.profile_photo && (
                  <img
                    src={strategy.profile_photo}
                    alt={strategy.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition"
                  />
                )}
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition" />

                {/* Risk Level Badge */}
                <div className="absolute top-3 right-3">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getRiskLevelColor(
                      strategy.risk_level
                    )}`}
                  >
                    {getRiskLevelLabel(strategy.risk_level)} Risk
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                {/* Strategy Name */}
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-orange-600 transition line-clamp-1">
                  {strategy.name}
                </h3>

                {/* Description */}
                <p className="text-sm text-slate-600 mt-2 line-clamp-2">
                  {strategy.description || "No description available"}
                </p>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 mt-4">
                  {/* Total Profit */}
                  <div className="p-2 bg-orange-50 rounded-lg">
                    <p className="text-xs text-slate-600 font-medium">
                      Total Profit
                    </p>
                    <p
                      className={`text-sm font-bold mt-1 ${
                        parseFloat(strategy.total_profit) >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      ${parseFloat(strategy.total_profit || 0).toFixed(2)}
                    </p>
                  </div>

                  {/* Max Drawdown */}
                  <div className="p-2 bg-orange-50 rounded-lg">
                    <p className="text-xs text-slate-600 font-medium">
                      Max Drawdown
                    </p>
                    <p className="text-sm font-bold text-red-600 mt-1">
                      {parseFloat(strategy.max_drawdown || 0).toFixed(2)}%
                    </p>
                  </div>

                  {/* Performance Fee */}
                  <div className="p-2 bg-orange-50 rounded-lg">
                    <p className="text-xs text-slate-600 font-medium">
                      Performance Fee
                    </p>
                    <p className="text-sm font-bold text-slate-900 mt-1">
                      {strategy.performace_fee}%
                    </p>
                  </div>

                  {/* Management Fee */}
                  <div className="p-2 bg-orange-50 rounded-lg">
                    <p className="text-xs text-slate-600 font-medium">
                      Management Fee
                    </p>
                    <p className="text-sm font-bold text-slate-900 mt-1">
                      {strategy.management_fee}%
                    </p>
                  </div>
                </div>

                {/* Bottom Info */}
                <div className="mt-4 pt-4 border-t border-orange-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-400" />
                    <span className="text-xs text-slate-600">
                      {strategy.total_copy_count} Followers
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-slate-400" />
                    <span className="text-xs text-slate-600">
                      ${parseFloat(strategy.minimum_deposit || 0).toFixed(0)}{" "}
                      Min
                    </span>
                  </div>
                </div>

                {/* Subscribe Button */}
                <button
                  onClick={() => handleStrategyClick(strategy.uuid)}
                  className="w-full mt-4 px-4 py-2 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 transition"
                >
                  View & Subscribe
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {strategies.length === 0 && !loading && (
          <div className="text-center py-12">
            <Target className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">No strategies found</p>
            <p className="text-slate-400 text-sm mt-1">
              Try adjusting your search filters
            </p>
          </div>
        )}

        {/* Pagination */}
        {strategies.length > 0 && (
          <div className="flex items-center justify-center gap-4 py-6">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-2 border border-orange-300 rounded-lg hover:bg-orange-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                value={currentPage}
                onChange={(e) => setCurrentPage(parseInt(e.target.value) || 1)}
                className="w-12 px-2 py-1 border border-orange-300 rounded text-center focus:ring-2 focus:ring-orange-500 outline-none"
              />
              <span className="text-slate-600 text-sm">Page</span>
            </div>

            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={strategies.length < ITEMS_PER_PAGE}
              className="p-2 border border-orange-300 rounded-lg hover:bg-orange-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default StrategiesPage;
