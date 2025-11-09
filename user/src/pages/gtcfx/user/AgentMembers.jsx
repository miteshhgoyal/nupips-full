import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import {
  Loader,
  AlertCircle,
  Users,
  DollarSign,
  Calendar,
  ChevronLeft,
  ChevronRight,
  User,
  Mail,
  Badge,
  Download,
  Search,
} from "lucide-react";
import api from "../../services/api";

const AgentMembers = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterUserType, setFilterUserType] = useState(""); // all, agent, direct

  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    fetchMembers();
  }, [currentPage]);

  const fetchMembers = async () => {
    setLoading(true);
    setError(null);

    try {
      const payload = {
        page: currentPage,
        page_size: ITEMS_PER_PAGE,
      };

      const response = await api.post("/agent/member", payload);

      if (response.data.code === 200) {
        setMembers(response.data.data.list || []);
      } else {
        setError(response.data.message || "Failed to fetch members");
      }
    } catch (err) {
      console.error("Fetch members error:", err);
      setError(
        err.response?.data?.message || "Network error. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [
        [
          "Member ID",
          "Email",
          "Nickname",
          "Real Name",
          "Account Type",
          "Balance",
          "Registered",
        ],
        ...filteredMembers.map((member) => [
          member.member_id,
          member.email,
          member.nickname,
          member.realname,
          member.user_type,
          member.amount,
          new Date(member.create_time * 1000).toLocaleDateString(),
        ]),
      ]
        .map((e) => e.join(","))
        .join("\n");

    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `agent-members-${new Date().getTime()}.csv`);
    link.click();
  };

  // Filter members based on search and type
  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.nickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.realname.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType =
      filterUserType === "" || member.user_type === filterUserType;

    return matchesSearch && matchesType;
  });

  // Calculate stats
  const stats = {
    total: members.length,
    agents: members.filter((m) => m.user_type === "agent").length,
    directClients: members.filter((m) => m.user_type === "direct").length,
    totalBalance: members.reduce(
      (sum, m) => sum + parseFloat(m.amount || 0),
      0
    ),
  };

  if (loading && currentPage === 1) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-12 h-12 text-orange-600 animate-spin" />
          <p className="text-slate-600 font-medium">Loading members...</p>
        </div>
      </div>
    );
  }

  if (error && members.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <p className="text-red-600 font-medium mb-4">{error}</p>
          <button
            onClick={() => {
              setCurrentPage(1);
              fetchMembers();
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
      <Helmet title="Agent Members" />
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-orange-900">My Members</h1>
            <p className="text-slate-600 mt-2">
              Manage your referred members and agents
            </p>
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-6 border border-orange-200 shadow-sm">
            <p className="text-sm text-slate-600 font-medium">Total Members</p>
            <p className="text-3xl font-bold text-orange-600 mt-2">
              {stats.total}
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 border border-orange-200 shadow-sm">
            <p className="text-sm text-slate-600 font-medium">Sub-Agents</p>
            <p className="text-3xl font-bold text-purple-600 mt-2">
              {stats.agents}
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 border border-orange-200 shadow-sm">
            <p className="text-sm text-slate-600 font-medium">Direct Clients</p>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {stats.directClients}
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 border border-orange-200 shadow-sm">
            <p className="text-sm text-slate-600 font-medium">Total Balance</p>
            <p className="text-3xl font-bold text-orange-600 mt-2">
              ${stats.totalBalance.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="bg-white rounded-lg p-6 border border-orange-200 shadow-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Search Members
              </label>
              <div className="relative">
                <Search className="absolute left-4 top-3 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by email, nickname, or real name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                />
              </div>
            </div>

            {/* Filter by Type */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Member Type
              </label>
              <select
                value={filterUserType}
                onChange={(e) => setFilterUserType(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
              >
                <option value="">All Members</option>
                <option value="agent">Sub-Agents</option>
                <option value="direct">Direct Clients</option>
              </select>
            </div>
          </div>
        </div>

        {/* Members Table */}
        <div className="bg-white rounded-lg border border-orange-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-orange-50 border-b border-orange-200">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                    Member
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                    Type
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-slate-900">
                    Balance
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                    Registered
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                    ID
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((member) => (
                  <tr
                    key={member.member_id}
                    className="border-b border-slate-200 hover:bg-orange-50 transition"
                  >
                    {/* Member Name */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-bold text-sm">
                            {member.nickname.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">
                            {member.nickname}
                          </p>
                          <p className="text-xs text-slate-500">
                            {member.realname}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <p className="text-sm text-slate-600 truncate">
                          {member.email}
                        </p>
                      </div>
                    </td>

                    {/* Type */}
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          member.user_type === "agent"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {member.user_type === "agent"
                          ? "Sub-Agent"
                          : "Direct Client"}
                      </span>
                    </td>

                    {/* Balance */}
                    <td className="px-6 py-4 text-right">
                      <p className="font-semibold text-slate-900">
                        ${parseFloat(member.amount || 0).toFixed(2)}
                      </p>
                    </td>

                    {/* Registered */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <p className="text-sm text-slate-600">
                          {new Date(
                            member.create_time * 1000
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    </td>

                    {/* Member ID */}
                    <td className="px-6 py-4">
                      <p className="text-sm font-mono text-slate-600">
                        {member.member_id}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {filteredMembers.length === 0 && !loading && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">No members found</p>
              <p className="text-slate-400 text-sm mt-1">
                {members.length === 0
                  ? "You don't have any members yet"
                  : "No members match your search criteria"}
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {members.length > 0 && (
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
              disabled={members.length < ITEMS_PER_PAGE}
              className="p-2 border border-orange-300 rounded-lg hover:bg-orange-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Member Hierarchy */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Members by Balance */}
          <div className="bg-white rounded-lg p-6 border border-orange-200 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Top Members by Balance
            </h2>
            <div className="space-y-3">
              {members
                .sort(
                  (a, b) =>
                    parseFloat(b.amount || 0) - parseFloat(a.amount || 0)
                )
                .slice(0, 5)
                .map((member) => (
                  <div
                    key={member.member_id}
                    className="flex items-center justify-between p-3 bg-orange-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-xs">
                          {member.nickname.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 truncate">
                          {member.nickname}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {member.email}
                        </p>
                      </div>
                    </div>
                    <p className="text-orange-600 font-bold flex-shrink-0 ml-2">
                      ${parseFloat(member.amount || 0).toFixed(2)}
                    </p>
                  </div>
                ))}
            </div>
          </div>

          {/* Recent Members */}
          <div className="bg-white rounded-lg p-6 border border-orange-200 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Recent Registrations
            </h2>
            <div className="space-y-3">
              {members
                .sort((a, b) => b.create_time - a.create_time)
                .slice(0, 5)
                .map((member) => (
                  <div
                    key={member.member_id}
                    className="flex items-center justify-between p-3 bg-orange-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-xs">
                          {member.nickname.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 truncate">
                          {member.nickname}
                        </p>
                        <p className="text-xs text-slate-500">
                          {new Date(
                            member.create_time * 1000
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0 ${
                        member.user_type === "agent"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {member.user_type === "agent" ? "Agent" : "Direct"}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AgentMembers;
