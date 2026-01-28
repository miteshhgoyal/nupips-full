// admin-frontend/src/pages/AdminCompetition.jsx
import React, { useState, useEffect } from "react";
import {
	Settings,
	Trophy,
	Award,
	Calendar,
	Save,
	RefreshCw,
	Plus,
	Trash2,
	Edit2,
	X,
	Check,
	Loader,
	ArrowLeft,
	AlertCircle,
	CheckCircle,
	DollarSign,
	Users,
	TrendingUp,
	Target,
	Shield,
	Copy,
	Eye,
	Crown,
	Gift,
	Medal,
	BarChart3,
	Activity,
	Search,
	Filter,
	ChevronDown,
	ChevronUp,
	Info,
	Zap,
	PlayCircle,
	StopCircle,
	ToggleLeft,
	ToggleRight,
	Download,
	ExternalLink,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const InfoTooltip = ({ title, items }) => {
	const [show, setShow] = useState(false);

	return (
		<div className="relative inline-block">
			<button
				onMouseEnter={() => setShow(true)}
				onMouseLeave={() => setShow(false)}
				onClick={(e) => {
					e.stopPropagation();
					setShow(!show);
				}}
				className="ml-1 p-0.5 hover:bg-gray-100 rounded transition-colors"
			>
				<Info className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
			</button>

			{show && (
				<div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-50 w-48">
					<div className="bg-gray-900 text-white text-xs rounded-lg p-3 shadow-xl">
						<div className="font-semibold mb-2 border-b border-gray-700 pb-1">
							{title}
						</div>
						<div className="space-y-1.5">
							{items.map((item, idx) => (
								<div
									key={idx}
									className="flex items-center justify-between"
								>
									<span className="text-gray-300">
										{item.label}:
									</span>
									<span className="font-semibold ml-2">
										{item.value}
									</span>
								</div>
							))}
						</div>
						<div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900"></div>
					</div>
				</div>
			)}
		</div>
	);
};

const AdminCompetition = () => {
	const navigate = useNavigate();
	const [loading, setLoading] = useState(true);
	const [competitions, setCompetitions] = useState([]);
	const [filteredCompetitions, setFilteredCompetitions] = useState([]);
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");
	const [message, setMessage] = useState(null);
	const [overviewStats, setOverviewStats] = useState(null);

	const [showCreateModal, setShowCreateModal] = useState(false);
	const [showEditModal, setShowEditModal] = useState(false);
	const [showStatusModal, setShowStatusModal] = useState(false);
	const [showWinnersModal, setShowWinnersModal] = useState(false);
	const [showParticipantsModal, setShowParticipantsModal] = useState(false);
	const [showRecalculateModal, setShowRecalculateModal] = useState(false);
	const [selectedCompetition, setSelectedCompetition] = useState(null);

	useEffect(() => {
		fetchCompetitions();
		fetchOverviewStats();
	}, []);

	useEffect(() => {
		filterCompetitions();
	}, [competitions, searchQuery, statusFilter]);

	const fetchCompetitions = async () => {
		try {
			setLoading(true);
			const response = await api.get("/competition/admin/list");
			if (response.data.success) {
				setCompetitions(response.data.competitions || []);
			}
		} catch (error) {
			showMessage("Failed to load competitions", "error");
			console.error("Error fetching competitions:", error);
		} finally {
			setLoading(false);
		}
	};

	const fetchOverviewStats = async () => {
		try {
			const response = await api.get("/competition/admin/stats/overview");
			if (response.data.success) {
				setOverviewStats(response.data.stats);
			}
		} catch (error) {
			console.error("Error fetching overview stats:", error);
		}
	};

	const filterCompetitions = () => {
		let filtered = [...competitions];

		if (statusFilter !== "all") {
			filtered = filtered.filter((c) => c.status === statusFilter);
		}

		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			filtered = filtered.filter(
				(c) =>
					c.title?.toLowerCase().includes(query) ||
					c.description?.toLowerCase().includes(query) ||
					c.slug?.toLowerCase().includes(query),
			);
		}

		setFilteredCompetitions(filtered);
	};

	const showMessage = (text, type = "success") => {
		setMessage({ text, type });
		setTimeout(() => setMessage(null), 5000);
	};

	const handleStatusChange = async (newStatus) => {
		if (!selectedCompetition) return;

		try {
			const response = await api.patch(
				`/competition/admin/${selectedCompetition._id}/status`,
				{ status: newStatus },
			);
			if (response.data.success) {
				showMessage(`Competition status changed to ${newStatus}!`);
				setShowStatusModal(false);
				setSelectedCompetition(null);
				fetchCompetitions();
				fetchOverviewStats();
			}
		} catch (error) {
			showMessage(
				error.response?.data?.message || "Failed to change status",
				"error",
			);
			console.error("Error changing status:", error);
		}
	};

	const handleRecalculateAll = async () => {
		if (!selectedCompetition) return;

		try {
			const response = await api.post(
				`/competition/admin/${selectedCompetition._id}/recalculate-all`,
			);
			if (response.data.success) {
				showMessage(
					`Recalculated ${response.data.stats.successCount} participant scores!`,
				);
				setShowRecalculateModal(false);
				setSelectedCompetition(null);
				fetchCompetitions();
			}
		} catch (error) {
			showMessage(
				error.response?.data?.message || "Failed to recalculate scores",
				"error",
			);
			console.error("Error recalculating scores:", error);
		}
	};

	const getStatusBadge = (status) => {
		const badges = {
			draft: {
				bg: "bg-gray-100",
				text: "text-gray-700",
				border: "border-gray-300",
				label: "Draft",
			},
			upcoming: {
				bg: "bg-blue-100",
				text: "text-blue-700",
				border: "border-blue-300",
				label: "Upcoming",
			},
			active: {
				bg: "bg-green-100",
				text: "text-green-700",
				border: "border-green-300",
				label: "Active",
			},
			completed: {
				bg: "bg-purple-100",
				text: "text-purple-700",
				border: "border-purple-300",
				label: "Completed",
			},
			cancelled: {
				bg: "bg-red-100",
				text: "text-red-700",
				border: "border-red-300",
				label: "Cancelled",
			},
		};
		const badge = badges[status] || badges.draft;
		return (
			<span
				className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold border ${badge.bg} ${badge.text} ${badge.border} whitespace-nowrap`}
			>
				{badge.label}
			</span>
		);
	};

	const formatDate = (dateString) => {
		if (!dateString) return "N/A";
		try {
			return new Date(dateString).toLocaleDateString("en-US", {
				year: "numeric",
				month: "short",
				day: "numeric",
			});
		} catch (error) {
			return "Invalid Date";
		}
	};

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-white px-4">
				<div className="flex flex-col items-center gap-4">
					<Loader className="w-10 h-10 sm:w-12 sm:h-12 text-orange-600 animate-spin" />
					<p className="text-gray-600 font-medium text-sm sm:text-base">
						Loading competitions...
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-white p-3 sm:p-4 md:p-6 lg:p-8">
			<div className="max-w-7xl mx-auto">
				<div className="mb-6 sm:mb-8">
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4">
						<div>
							<h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2 sm:gap-3">
								<Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600" />
								Competition Management
							</h1>
							<p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">
								Create and manage trading competitions
							</p>
						</div>
						<button
							onClick={() => setShowCreateModal(true)}
							className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl text-sm sm:text-base"
						>
							<Plus className="w-4 h-4 sm:w-5 sm:h-5" />
							<span className="hidden sm:inline">
								Create Competition
							</span>
							<span className="sm:hidden">Create</span>
						</button>
					</div>

					{message && (
						<div
							className={`p-3 sm:p-4 rounded-xl border flex items-start gap-2 sm:gap-3 ${
								message.type === "error"
									? "bg-red-50 border-red-200"
									: "bg-green-50 border-green-200"
							}`}
						>
							{message.type === "error" ? (
								<AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 flex-shrink-0 mt-0.5" />
							) : (
								<CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0 mt-0.5" />
							)}
							<p
								className={`text-xs sm:text-sm font-medium flex-1 ${
									message.type === "error"
										? "text-red-700"
										: "text-green-700"
								}`}
							>
								{message.text}
							</p>
							<button
								onClick={() => setMessage(null)}
								className="ml-auto"
							>
								<X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
							</button>
						</div>
					)}
				</div>

				{overviewStats && (
					<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6">
						<div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-blue-200">
							<div className="flex items-center gap-2 sm:gap-3">
								<div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
									<Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
								</div>
								<div className="min-w-0">
									<p className="text-xs sm:text-sm text-gray-600 font-medium truncate">
										Total
									</p>
									<p className="text-lg sm:text-2xl font-bold text-gray-900">
										{overviewStats.totalCompetitions || 0}
									</p>
								</div>
							</div>
						</div>

						<div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-green-200">
							<div className="flex items-center gap-2 sm:gap-3">
								<div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
									<Activity className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
								</div>
								<div className="min-w-0">
									<p className="text-xs sm:text-sm text-gray-600 font-medium truncate">
										Active
									</p>
									<p className="text-lg sm:text-2xl font-bold text-gray-900">
										{overviewStats.activeCompetitions || 0}
									</p>
								</div>
							</div>
						</div>

						<div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-blue-200">
							<div className="flex items-center gap-2 sm:gap-3">
								<div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
									<Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
								</div>
								<div className="min-w-0">
									<p className="text-xs sm:text-sm text-gray-600 font-medium truncate">
										Upcoming
									</p>
									<p className="text-lg sm:text-2xl font-bold text-gray-900">
										{overviewStats.upcomingCompetitions ||
											0}
									</p>
								</div>
							</div>
						</div>

						<div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-purple-200">
							<div className="flex items-center gap-2 sm:gap-3">
								<div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
									<Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
								</div>
								<div className="min-w-0">
									<p className="text-xs sm:text-sm text-gray-600 font-medium truncate">
										Participants
									</p>
									<p className="text-lg sm:text-2xl font-bold text-gray-900">
										{overviewStats.totalParticipations || 0}
									</p>
								</div>
							</div>
						</div>

						<div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-orange-200">
							<div className="flex items-center gap-2 sm:gap-3">
								<div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
									<Target className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
								</div>
								<div className="min-w-0">
									<p className="text-xs sm:text-sm text-gray-600 font-medium truncate">
										Unique
									</p>
									<p className="text-lg sm:text-2xl font-bold text-gray-900">
										{overviewStats.uniqueParticipants || 0}
									</p>
								</div>
							</div>
						</div>

						<div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-purple-200 col-span-2 sm:col-span-1">
							<div className="flex items-center gap-2 sm:gap-3">
								<div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
									<CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
								</div>
								<div className="min-w-0">
									<p className="text-xs sm:text-sm text-gray-600 font-medium truncate">
										Completed
									</p>
									<p className="text-lg sm:text-2xl font-bold text-gray-900">
										{overviewStats.completedCompetitions ||
											0}
									</p>
								</div>
							</div>
						</div>
					</div>
				)}

				<div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3 sm:p-4 mb-4 sm:mb-6">
					<div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
						<div className="flex-1 relative">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
							<input
								type="text"
								placeholder="Search competitions..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
							/>
						</div>

						<div className="flex items-center gap-2 sm:gap-3">
							<div className="flex items-center gap-2 flex-1">
								<Filter className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
								<select
									value={statusFilter}
									onChange={(e) =>
										setStatusFilter(e.target.value)
									}
									className="flex-1 sm:flex-initial px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
								>
									<option value="all">All Status</option>
									<option value="draft">Draft</option>
									<option value="upcoming">Upcoming</option>
									<option value="active">Active</option>
									<option value="completed">Completed</option>
									<option value="cancelled">Cancelled</option>
								</select>
							</div>

							<button
								onClick={fetchCompetitions}
								className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-1 sm:gap-2"
								title="Refresh"
							>
								<RefreshCw className="w-4 h-4" />
								<span className="hidden sm:inline text-sm">
									Refresh
								</span>
							</button>
						</div>
					</div>
				</div>

				<div className="space-y-3 sm:space-y-4">
					{filteredCompetitions.map((competition) => (
						<div
							key={competition._id}
							className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-4 sm:p-5 md:p-6"
						>
							<div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
								<div className="flex-1 min-w-0">
									<div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
										<h3 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
											{competition.title}
										</h3>
										{getStatusBadge(competition.status)}
									</div>
									<p className="text-gray-600 mb-2 text-sm sm:text-base line-clamp-2">
										{competition.description}
									</p>
									<div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
										<span className="flex items-center gap-1">
											<Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
											<span className="truncate">
												{formatDate(
													competition.startDate,
												)}{" "}
												-{" "}
												{formatDate(
													competition.endDate,
												)}
											</span>
										</span>
										<span className="flex items-center gap-1">
											<Users className="w-3 h-3 sm:w-4 sm:h-4" />
											{competition.stats
												?.totalParticipants || 0}{" "}
											participants
										</span>
										{competition.kycConfig
											?.countDownlineKyc && (
											<span className="flex items-center gap-1">
												<Shield className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
												<span className="text-green-600 font-medium">
													KYC Enabled
												</span>
											</span>
										)}
									</div>
								</div>

								<div className="flex items-center gap-1.5 sm:gap-2 sm:ml-4 overflow-x-auto pb-1">
									{competition.status === "active" && (
										<>
											<button
												onClick={() => {
													setSelectedCompetition(
														competition,
													);
													setShowRecalculateModal(
														true,
													);
												}}
												className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-all flex-shrink-0"
												title="Recalculate All Scores"
											>
												<RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
											</button>
											<button
												onClick={() => {
													setSelectedCompetition(
														competition,
													);
													setShowParticipantsModal(
														true,
													);
												}}
												className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all flex-shrink-0"
												title="View Participants"
											>
												<Users className="w-4 h-4 sm:w-5 sm:h-5" />
											</button>
										</>
									)}
									{competition.status === "completed" && (
										<button
											onClick={() => {
												setSelectedCompetition(
													competition,
												);
												setShowWinnersModal(true);
											}}
											className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-all flex-shrink-0"
											title="View Winners"
										>
											<Crown className="w-4 h-4 sm:w-5 sm:h-5" />
										</button>
									)}
									<button
										onClick={() => {
											setSelectedCompetition(competition);
											setShowStatusModal(true);
										}}
										className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all flex-shrink-0"
										title="Change Status"
									>
										<ToggleRight className="w-4 h-4 sm:w-5 sm:h-5" />
									</button>
									<button
										onClick={() => {
											setSelectedCompetition(competition);
											setShowEditModal(true);
										}}
										className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-all flex-shrink-0"
										title="Edit"
									>
										<Edit2 className="w-4 h-4 sm:w-5 sm:h-5" />
									</button>
								</div>
							</div>

							<div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4 pt-3 sm:pt-4 border-t border-gray-200">
								<div>
									<p className="text-xs text-gray-500 mb-1">
										Avg Score
									</p>
									<p className="text-base sm:text-lg font-bold text-gray-900">
										{competition.stats?.averageScore?.toFixed(
											1,
										) || "0.0"}
									</p>
								</div>
								<div>
									<p className="text-xs text-gray-500 mb-1">
										Highest Score
									</p>
									<p className="text-base sm:text-lg font-bold text-gray-900">
										{competition.stats?.highestScore?.toFixed(
											1,
										) || "0.0"}
									</p>
								</div>
								<div>
									<p className="text-xs text-gray-500 mb-1">
										Agents
									</p>
									<p className="text-base sm:text-lg font-bold text-gray-900">
										{competition.stats?.agentCount || 0}
									</p>
								</div>
								<div>
									<p className="text-xs text-gray-500 mb-1">
										Rewards
									</p>
									<p className="text-base sm:text-lg font-bold text-gray-900">
										{competition.rewards?.length || 0}
									</p>
								</div>
								<div>
									<p className="text-xs text-gray-500 mb-1">
										Last Updated
									</p>
									<p className="text-xs sm:text-sm font-medium text-gray-700">
										{formatDate(competition.updatedAt)}
									</p>
								</div>
							</div>
						</div>
					))}

					{filteredCompetitions.length === 0 && (
						<div className="text-center py-12">
							<Trophy className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
							<p className="text-gray-500 font-medium text-sm sm:text-base">
								{searchQuery || statusFilter !== "all"
									? "No competitions found"
									: "No competitions yet. Create your first one!"}
							</p>
						</div>
					)}
				</div>
			</div>

			{showCreateModal && (
				<CreateCompetitionModal
					onClose={() => setShowCreateModal(false)}
					onSuccess={() => {
						fetchCompetitions();
						fetchOverviewStats();
						showMessage("Competition created successfully!");
					}}
					showMessage={showMessage}
				/>
			)}

			{showEditModal && selectedCompetition && (
				<EditCompetitionModal
					competition={selectedCompetition}
					onClose={() => {
						setShowEditModal(false);
						setSelectedCompetition(null);
					}}
					onSuccess={() => {
						fetchCompetitions();
						showMessage("Competition updated successfully!");
					}}
					showMessage={showMessage}
				/>
			)}

			{showStatusModal && selectedCompetition && (
				<StatusChangeModal
					competition={selectedCompetition}
					onClose={() => {
						setShowStatusModal(false);
						setSelectedCompetition(null);
					}}
					onConfirm={handleStatusChange}
				/>
			)}

			{showRecalculateModal && selectedCompetition && (
				<RecalculateModal
					competition={selectedCompetition}
					onClose={() => {
						setShowRecalculateModal(false);
						setSelectedCompetition(null);
					}}
					onConfirm={handleRecalculateAll}
				/>
			)}

			{showWinnersModal && selectedCompetition && (
				<WinnersModal
					competition={selectedCompetition}
					onClose={() => {
						setShowWinnersModal(false);
						setSelectedCompetition(null);
					}}
				/>
			)}

			{showParticipantsModal && selectedCompetition && (
				<ParticipantsModal
					competition={selectedCompetition}
					onClose={() => {
						setShowParticipantsModal(false);
						setSelectedCompetition(null);
					}}
				/>
			)}
		</div>
	);
};

const StatusChangeModal = ({ competition, onClose, onConfirm }) => {
	const [selectedStatus, setSelectedStatus] = useState(competition.status);
	const [loading, setLoading] = useState(false);

	const statusOptions = [
		{ value: "draft", label: "Draft", icon: Edit2, color: "gray" },
		{ value: "upcoming", label: "Upcoming", icon: Calendar, color: "blue" },
		{ value: "active", label: "Active", icon: PlayCircle, color: "green" },
		{
			value: "completed",
			label: "Completed",
			icon: CheckCircle,
			color: "purple",
		},
		{
			value: "cancelled",
			label: "Cancelled",
			icon: StopCircle,
			color: "red",
		},
	];

	const handleSubmit = async () => {
		setLoading(true);
		await onConfirm(selectedStatus);
		setLoading(false);
	};

	return (
		<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
			<div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6">
				<div className="flex items-center gap-3 mb-6">
					<div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
						<ToggleRight className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
					</div>
					<div>
						<h3 className="text-lg sm:text-xl font-bold text-gray-900">
							Change Status
						</h3>
						<p className="text-xs sm:text-sm text-gray-600">
							{competition.title}
						</p>
					</div>
				</div>

				<div className="space-y-2 mb-6">
					{statusOptions.map((option) => {
						const Icon = option.icon;
						const isSelected = selectedStatus === option.value;
						return (
							<button
								key={option.value}
								onClick={() => setSelectedStatus(option.value)}
								className={`w-full p-3 rounded-lg border-2 transition-all flex items-center gap-3 ${
									isSelected
										? `border-${option.color}-500 bg-${option.color}-50`
										: "border-gray-200 hover:border-gray-300"
								}`}
							>
								<Icon
									className={`w-5 h-5 ${isSelected ? `text-${option.color}-600` : "text-gray-400"}`}
								/>
								<span
									className={`font-medium ${isSelected ? "text-gray-900" : "text-gray-600"}`}
								>
									{option.label}
								</span>
								{isSelected && (
									<Check className="w-5 h-5 text-green-600 ml-auto" />
								)}
							</button>
						);
					})}
				</div>

				<div className="flex gap-3">
					<button
						onClick={onClose}
						disabled={loading}
						className="flex-1 px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 font-medium disabled:opacity-50 text-sm sm:text-base"
					>
						Cancel
					</button>
					<button
						onClick={handleSubmit}
						disabled={
							loading || selectedStatus === competition.status
						}
						className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold disabled:opacity-50 text-sm sm:text-base"
					>
						{loading ? "Changing..." : "Change Status"}
					</button>
				</div>
			</div>
		</div>
	);
};

const RecalculateModal = ({ competition, onClose, onConfirm }) => {
	const [loading, setLoading] = useState(false);

	const handleSubmit = async () => {
		setLoading(true);
		await onConfirm();
		setLoading(false);
	};

	return (
		<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
			<div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6">
				<div className="flex items-center gap-3 mb-4">
					<div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-xl flex items-center justify-center">
						<RefreshCw className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
					</div>
					<h3 className="text-lg sm:text-xl font-bold text-gray-900">
						Recalculate All Scores
					</h3>
				</div>

				<p className="text-gray-600 mb-6 text-sm sm:text-base">
					This will recalculate scores for all{" "}
					{competition.stats?.totalParticipants || 0} participants in
					"{competition.title}". This process may take a few minutes.
				</p>

				<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
					<div className="flex items-start gap-2">
						<AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
						<p className="text-xs sm:text-sm text-yellow-800">
							Scores will be updated based on current GTC FX data
							and growth metrics since competition start.
						</p>
					</div>
				</div>

				<div className="flex gap-3">
					<button
						onClick={onClose}
						disabled={loading}
						className="flex-1 px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 font-medium disabled:opacity-50 text-sm sm:text-base"
					>
						Cancel
					</button>
					<button
						onClick={handleSubmit}
						disabled={loading}
						className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold disabled:opacity-50 flex items-center justify-center gap-2 text-sm sm:text-base"
					>
						{loading ? (
							<>
								<Loader className="w-4 h-4 animate-spin" />
								Recalculating...
							</>
						) : (
							<>
								<RefreshCw className="w-4 h-4" />
								Recalculate
							</>
						)}
					</button>
				</div>
			</div>
		</div>
	);
};

const CreateCompetitionModal = ({ onClose, onSuccess, showMessage }) => {
	const [saving, setSaving] = useState(false);
	const [activeTab, setActiveTab] = useState("basic");

	const getDefaultStartDate = () => {
		const date = new Date();
		return date.toISOString().split("T")[0];
	};

	const getDefaultEndDate = () => {
		const date = new Date();
		date.setDate(date.getDate() + 30);
		return date.toISOString().split("T")[0];
	};

	const [formData, setFormData] = useState({
		title: "",
		description: "",
		slug: "",
		status: "draft",
		startDate: getDefaultStartDate(),
		endDate: getDefaultEndDate(),
		rules: {
			directReferralsWeight: 30,
			teamSizeWeight: 20,
			tradingVolumeWeight: 25,
			profitabilityWeight: 15,
			accountBalanceWeight: 10,
			dataSource: {
				directReferrals: "max",
				teamSize: "max",
			},
		},
		rewards: [],
		requirements: {
			requiresGTCAccount: true,
			minAccountBalance: 0,
		},
		normalizationTargets: {
			directReferralsTarget: 10,
			teamSizeTarget: 50,
			tradingVolumeTarget: 100000,
			profitPercentTarget: 100,
			accountBalanceTarget: 10000,
			kycCountTarget: 5,
		},
		kycConfig: {
			countDownlineKyc: false,
			kycWeight: 0,
		},
	});

	const tabs = [
		{ id: "basic", label: "Basic Info", icon: Trophy },
		{ id: "rules", label: "Scoring", icon: Target },
		{ id: "rewards", label: "Rewards", icon: Gift },
		{ id: "notes", label: "Notes", icon: Info },
	];

	const calculateTotalWeight = () => {
		const rulesWeight = Object.entries(formData.rules)
			.filter(([key]) => key.includes("Weight"))
			.reduce((sum, [, val]) => sum + (parseFloat(val) || 0), 0);

		const kycWeight = formData.kycConfig?.countDownlineKyc
			? parseFloat(formData.kycConfig.kycWeight || 0)
			: 0;

		return rulesWeight + kycWeight;
	};

	const validateForm = () => {
		if (!formData.title?.trim()) {
			showMessage("Title is required", "error");
			return false;
		}

		if (!formData.description?.trim()) {
			showMessage("Description is required", "error");
			return false;
		}

		if (!formData.startDate) {
			showMessage("Start date is required", "error");
			return false;
		}

		if (!formData.endDate) {
			showMessage("End date is required", "error");
			return false;
		}

		const startDate = new Date(formData.startDate);
		const endDate = new Date(formData.endDate);

		if (endDate <= startDate) {
			showMessage("End date must be after start date", "error");
			return false;
		}

		const totalWeight = calculateTotalWeight();
		if (totalWeight !== 100) {
			showMessage(
				`Total weight must equal 100%. Current: ${totalWeight}%`,
				"error",
			);
			return false;
		}

		if (formData.rewards.length > 0) {
			for (const reward of formData.rewards) {
				if (
					!reward.title?.trim() ||
					!reward.prize?.trim() ||
					!reward.description?.trim()
				) {
					showMessage("All reward fields are required", "error");
					return false;
				}
				if (!reward.minRank || !reward.maxRank) {
					showMessage("Reward rank range is required", "error");
					return false;
				}
				if (parseInt(reward.minRank) > parseInt(reward.maxRank)) {
					showMessage(
						"Min rank cannot be greater than max rank",
						"error",
					);
					return false;
				}
			}
		}

		return true;
	};

	const handleSubmit = async () => {
		if (!validateForm()) {
			return;
		}

		try {
			setSaving(true);
			const response = await api.post(
				"/competition/admin/create",
				formData,
			);
			if (response.data.success) {
				onSuccess();
				onClose();
			}
		} catch (error) {
			showMessage(
				error.response?.data?.message || "Failed to create competition",
				"error",
			);
		} finally {
			setSaving(false);
		}
	};

	return (
		<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-3 sm:p-4 overflow-y-auto">
			<div className="bg-white rounded-xl sm:rounded-2xl w-full max-w-full sm:max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto my-4 sm:my-8">
				<div className="sticky top-0 bg-white border-b border-gray-200 p-4 sm:p-6 flex items-center justify-between z-10">
					<h2 className="text-lg sm:text-2xl font-bold text-gray-900 flex items-center gap-2 sm:gap-3">
						<Plus className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
						<span className="truncate">Create New Competition</span>
					</h2>
					<button
						onClick={onClose}
						className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
					>
						<X className="w-5 h-5 sm:w-6 sm:h-6" />
					</button>
				</div>

				<div className="border-b border-gray-200 bg-gray-50">
					<div className="flex overflow-x-auto scrollbar-hide">
						{tabs.map((tab) => {
							const Icon = tab.icon;
							return (
								<button
									key={tab.id}
									onClick={() => setActiveTab(tab.id)}
									className={`flex-shrink-0 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-center gap-1.5 sm:gap-2 font-medium transition-colors relative whitespace-nowrap text-sm sm:text-base ${
										activeTab === tab.id
											? "text-orange-600 bg-white"
											: "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
									}`}
								>
									<Icon className="w-4 h-4 sm:w-5 sm:h-5" />
									<span>{tab.label}</span>
									{activeTab === tab.id && (
										<div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-600" />
									)}
								</button>
							);
						})}
					</div>
				</div>

				<div className="p-4 sm:p-6">
					{activeTab === "basic" && (
						<BasicInfoTab
							formData={formData}
							setFormData={setFormData}
						/>
					)}
					{activeTab === "rules" && (
						<ScoringRulesTab
							formData={formData}
							setFormData={setFormData}
						/>
					)}
					{activeTab === "rewards" && (
						<RewardsTab
							formData={formData}
							setFormData={setFormData}
						/>
					)}
					{activeTab === "notes" && (
						<NotesTab
							formData={formData}
							setFormData={setFormData}
						/>
					)}
				</div>

				<div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 sm:p-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
					<p className="text-xs sm:text-sm text-gray-500 text-center sm:text-left">
						Total Weight:{" "}
						<span
							className={`font-bold ${
								calculateTotalWeight() === 100
									? "text-green-600"
									: "text-red-600"
							}`}
						>
							{calculateTotalWeight()}%
						</span>
					</p>
					<div className="flex gap-2 sm:gap-3">
						<button
							onClick={onClose}
							disabled={saving}
							className="flex-1 sm:flex-initial px-4 sm:px-6 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 font-medium disabled:opacity-50 text-sm sm:text-base"
						>
							Cancel
						</button>
						<button
							onClick={handleSubmit}
							disabled={saving || calculateTotalWeight() !== 100}
							className="flex-1 sm:flex-initial px-4 sm:px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold disabled:opacity-50 flex items-center justify-center gap-2 text-sm sm:text-base"
						>
							{saving ? (
								<>
									<Loader className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
									<span className="hidden sm:inline">
										Creating...
									</span>
									<span className="sm:hidden">...</span>
								</>
							) : (
								<>
									<Check className="w-4 h-4 sm:w-5 sm:h-5" />
									Create
								</>
							)}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

const EditCompetitionModal = ({
	competition,
	onClose,
	onSuccess,
	showMessage,
}) => {
	const [saving, setSaving] = useState(false);
	const [activeTab, setActiveTab] = useState("basic");

	const formatDateForInput = (dateString) => {
		if (!dateString) return "";
		try {
			const date = new Date(dateString);
			return date.toISOString().split("T")[0];
		} catch (error) {
			return "";
		}
	};

	const [formData, setFormData] = useState({
		title: competition.title || "",
		description: competition.description || "",
		slug: competition.slug || "",
		status: competition.status || "draft",
		startDate: formatDateForInput(competition.startDate),
		endDate: formatDateForInput(competition.endDate),
		rules: competition.rules || {
			directReferralsWeight: 30,
			teamSizeWeight: 20,
			tradingVolumeWeight: 25,
			profitabilityWeight: 15,
			accountBalanceWeight: 10,
			dataSource: {
				directReferrals: "max",
				teamSize: "max",
			},
		},
		rewards: competition.rewards || [],
		requirements: competition.requirements || {
			requiresGTCAccount: true,
			minAccountBalance: 0,
		},
		normalizationTargets: competition.normalizationTargets || {
			directReferralsTarget: 10,
			teamSizeTarget: 50,
			tradingVolumeTarget: 100000,
			profitPercentTarget: 100,
			accountBalanceTarget: 10000,
			kycCountTarget: 5,
		},
		kycConfig: competition.kycConfig || {
			countDownlineKyc: false,
			kycWeight: 0,
		},
	});

	const tabs = [
		{ id: "basic", label: "Basic Info", icon: Trophy },
		{ id: "rules", label: "Scoring", icon: Target },
		{ id: "rewards", label: "Rewards", icon: Gift },
		{ id: "notes", label: "Notes", icon: Settings },
	];

	const calculateTotalWeight = () => {
		const rulesWeight = Object.entries(formData.rules)
			.filter(([key]) => key.includes("Weight"))
			.reduce((sum, [, val]) => sum + (parseFloat(val) || 0), 0);

		const kycWeight = formData.kycConfig?.countDownlineKyc
			? parseFloat(formData.kycConfig.kycWeight || 0)
			: 0;

		return rulesWeight + kycWeight;
	};

	const validateForm = () => {
		if (!formData.title?.trim()) {
			showMessage("Title is required", "error");
			return false;
		}

		if (!formData.description?.trim()) {
			showMessage("Description is required", "error");
			return false;
		}

		if (!formData.startDate) {
			showMessage("Start date is required", "error");
			return false;
		}

		if (!formData.endDate) {
			showMessage("End date is required", "error");
			return false;
		}

		const startDate = new Date(formData.startDate);
		const endDate = new Date(formData.endDate);

		if (endDate <= startDate) {
			showMessage("End date must be after start date", "error");
			return false;
		}

		const totalWeight = calculateTotalWeight();
		if (totalWeight !== 100) {
			showMessage(
				`Total weight must equal 100%. Current: ${totalWeight}%`,
				"error",
			);
			return false;
		}

		if (formData.rewards.length > 0) {
			for (const reward of formData.rewards) {
				if (
					!reward.title?.trim() ||
					!reward.prize?.trim() ||
					!reward.description?.trim()
				) {
					showMessage("All reward fields are required", "error");
					return false;
				}
				if (!reward.minRank || !reward.maxRank) {
					showMessage("Reward rank range is required", "error");
					return false;
				}
				if (parseInt(reward.minRank) > parseInt(reward.maxRank)) {
					showMessage(
						"Min rank cannot be greater than max rank",
						"error",
					);
					return false;
				}
			}
		}

		return true;
	};

	const handleSubmit = async () => {
		if (!validateForm()) {
			return;
		}

		try {
			setSaving(true);
			const response = await api.put(
				`/competition/admin/${competition._id}`,
				formData,
			);
			if (response.data.success) {
				onSuccess();
				onClose();
			}
		} catch (error) {
			showMessage(
				error.response?.data?.message || "Failed to update competition",
				"error",
			);
		} finally {
			setSaving(false);
		}
	};

	return (
		<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-3 sm:p-4 overflow-y-auto">
			<div className="bg-white rounded-xl sm:rounded-2xl w-full max-w-full sm:max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto my-4 sm:my-8">
				<div className="sticky top-0 bg-white border-b border-gray-200 p-4 sm:p-6 flex items-center justify-between z-10">
					<h2 className="text-lg sm:text-2xl font-bold text-gray-900 flex items-center gap-2 sm:gap-3">
						<Edit2 className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
						<span className="truncate">Edit Competition</span>
					</h2>
					<button
						onClick={onClose}
						className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
					>
						<X className="w-5 h-5 sm:w-6 sm:h-6" />
					</button>
				</div>

				<div className="border-b border-gray-200 bg-gray-50">
					<div className="flex overflow-x-auto scrollbar-hide">
						{tabs.map((tab) => {
							const Icon = tab.icon;
							return (
								<button
									key={tab.id}
									onClick={() => setActiveTab(tab.id)}
									className={`flex-shrink-0 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-center gap-1.5 sm:gap-2 font-medium transition-colors relative whitespace-nowrap text-sm sm:text-base ${
										activeTab === tab.id
											? "text-orange-600 bg-white"
											: "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
									}`}
								>
									<Icon className="w-4 h-4 sm:w-5 sm:h-5" />
									<span>{tab.label}</span>
									{activeTab === tab.id && (
										<div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-600" />
									)}
								</button>
							);
						})}
					</div>
				</div>

				<div className="p-4 sm:p-6">
					{activeTab === "basic" && (
						<BasicInfoTab
							formData={formData}
							setFormData={setFormData}
						/>
					)}
					{activeTab === "rules" && (
						<ScoringRulesTab
							formData={formData}
							setFormData={setFormData}
						/>
					)}
					{activeTab === "rewards" && (
						<RewardsTab
							formData={formData}
							setFormData={setFormData}
						/>
					)}
					{activeTab === "notes" && (
						<NotesTab
							formData={formData}
							setFormData={setFormData}
						/>
					)}
				</div>

				<div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 sm:p-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
					<p className="text-xs sm:text-sm text-gray-500 text-center sm:text-left">
						Total Weight:{" "}
						<span
							className={`font-bold ${
								calculateTotalWeight() === 100
									? "text-green-600"
									: "text-red-600"
							}`}
						>
							{calculateTotalWeight()}%
						</span>
					</p>
					<div className="flex gap-2 sm:gap-3">
						<button
							onClick={onClose}
							disabled={saving}
							className="flex-1 sm:flex-initial px-4 sm:px-6 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 font-medium disabled:opacity-50 text-sm sm:text-base"
						>
							Cancel
						</button>
						<button
							onClick={handleSubmit}
							disabled={saving || calculateTotalWeight() !== 100}
							className="flex-1 sm:flex-initial px-4 sm:px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold disabled:opacity-50 flex items-center justify-center gap-2 text-sm sm:text-base"
						>
							{saving ? (
								<>
									<Loader className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
									<span className="hidden sm:inline">
										Updating...
									</span>
									<span className="sm:hidden">...</span>
								</>
							) : (
								<>
									<Check className="w-4 h-4 sm:w-5 sm:h-5" />
									Update
								</>
							)}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

const BasicInfoTab = ({ formData, setFormData }) => {
	const generateSlug = (title) => {
		return title
			.toLowerCase()
			.replace(/[^\w\s-]/g, "")
			.replace(/\s+/g, "-")
			.replace(/-+/g, "-")
			.trim();
	};

	return (
		<div className="space-y-5">
			<div>
				<label className="block text-sm font-semibold text-gray-900 mb-2">
					Competition Title *
				</label>
				<input
					type="text"
					value={formData.title}
					onChange={(e) => {
						setFormData({
							...formData,
							title: e.target.value,
							slug: generateSlug(e.target.value),
						});
					}}
					placeholder="e.g., Summer Trading Championship 2026"
					className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
				/>
			</div>

			<div>
				<label className="block text-sm font-semibold text-gray-900 mb-2">
					Slug (URL-friendly) *
				</label>
				<input
					type="text"
					value={formData.slug}
					onChange={(e) =>
						setFormData({
							...formData,
							slug: e.target.value.toLowerCase(),
						})
					}
					placeholder="summer-trading-championship-2026"
					className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent font-mono text-sm"
				/>
				<p className="text-xs text-gray-500 mt-1">
					Auto-generated from title. Must be unique.
				</p>
			</div>

			<div>
				<label className="block text-sm font-semibold text-gray-900 mb-2">
					Description *
				</label>
				<textarea
					value={formData.description}
					onChange={(e) =>
						setFormData({
							...formData,
							description: e.target.value,
						})
					}
					rows="4"
					placeholder="Describe the competition objectives, rules, and what participants can expect..."
					className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
				/>
			</div>

			<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<div>
					<label className="block text-sm font-semibold text-gray-900 mb-2">
						Start Date *
					</label>
					<input
						type="date"
						value={formData.startDate}
						onChange={(e) =>
							setFormData({
								...formData,
								startDate: e.target.value,
							})
						}
						className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
					/>
				</div>

				<div>
					<label className="block text-sm font-semibold text-gray-900 mb-2">
						End Date *
					</label>
					<input
						type="date"
						value={formData.endDate}
						onChange={(e) =>
							setFormData({
								...formData,
								endDate: e.target.value,
							})
						}
						className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
					/>
				</div>
			</div>

			<div>
				<label className="block text-sm font-semibold text-gray-900 mb-2">
					Status
				</label>
				<select
					value={formData.status}
					onChange={(e) =>
						setFormData({ ...formData, status: e.target.value })
					}
					className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
				>
					<option value="draft">Draft</option>
					<option value="upcoming">Upcoming</option>
					<option value="active">Active</option>
					<option value="completed">Completed</option>
					<option value="cancelled">Cancelled</option>
				</select>
			</div>
		</div>
	);
};

const ScoringRulesTab = ({ formData, setFormData }) => {
	const updateRuleWeight = (key, value) => {
		setFormData({
			...formData,
			rules: {
				...formData.rules,
				[key]: parseFloat(value) || 0,
			},
		});
	};

	const updateDataSource = (metric, value) => {
		setFormData({
			...formData,
			rules: {
				...formData.rules,
				dataSource: {
					...formData.rules.dataSource,
					[metric]: value,
				},
			},
		});
	};

	const updateNormalizationTarget = (key, value) => {
		setFormData({
			...formData,
			normalizationTargets: {
				...formData.normalizationTargets,
				[key]: parseFloat(value) || 0,
			},
		});
	};

	const updateKycConfig = (key, value) => {
		setFormData({
			...formData,
			kycConfig: {
				...formData.kycConfig,
				[key]: value,
			},
		});
	};

	const scoringMetrics = [
		{
			key: "directReferralsWeight",
			label: "Direct Referrals",
			icon: Users,
			color: "blue",
			targetKey: "directReferralsTarget",
			targetLabel: "Target",
			dataSourceKey: "directReferrals",
		},
		{
			key: "teamSizeWeight",
			label: "Team Size",
			icon: Users,
			color: "purple",
			targetKey: "teamSizeTarget",
			targetLabel: "Target",
			dataSourceKey: "teamSize",
		},
		{
			key: "tradingVolumeWeight",
			label: "Trading Volume",
			icon: TrendingUp,
			color: "green",
			targetKey: "tradingVolumeTarget",
			targetLabel: "Target (USD)",
		},
		{
			key: "profitabilityWeight",
			label: "Profitability",
			icon: DollarSign,
			color: "orange",
			targetKey: "profitPercentTarget",
			targetLabel: "Target (USD)",
		},
		{
			key: "accountBalanceWeight",
			label: "Account Balance",
			icon: Target,
			color: "indigo",
			targetKey: "accountBalanceTarget",
			targetLabel: "Target (USD)",
		},
	];

	return (
		<div className="space-y-6">
			<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
				<div className="flex items-start gap-3">
					<Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
					<div>
						<p className="text-sm font-semibold text-blue-900 mb-1">
							Growth-Based Scoring
						</p>
						<p className="text-xs text-blue-800">
							Scores are calculated based on growth from
							competition start (baseline/watermark) to current
							values. First-time participants start with zero
							growth.
						</p>
					</div>
				</div>
			</div>

			<div className="space-y-4">
				{scoringMetrics.map((metric) => {
					const Icon = metric.icon;
					return (
						<div
							key={metric.key}
							className="bg-white border border-gray-200 rounded-xl p-4"
						>
							<div className="flex items-center gap-3 mb-4">
								<div
									className={`w-10 h-10 bg-${metric.color}-100 rounded-lg flex items-center justify-center`}
								>
									<Icon
										className={`w-5 h-5 text-${metric.color}-600`}
									/>
								</div>
								<div className="flex-1">
									<h3 className="font-semibold text-gray-900">
										{metric.label}
									</h3>
									<p className="text-xs text-gray-500">
										Weight and normalization target
									</p>
								</div>
								<div className="text-right">
									<p className="text-2xl font-bold text-gray-900">
										{formData.rules[metric.key]}%
									</p>
								</div>
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div>
									<label className="block text-xs font-medium text-gray-700 mb-2">
										Weight (%)
									</label>
									<input
										type="number"
										min="0"
										max="100"
										step="1"
										value={formData.rules[metric.key]}
										onChange={(e) =>
											updateRuleWeight(
												metric.key,
												e.target.value,
											)
										}
										className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
									/>
								</div>

								<div>
									<label className="block text-xs font-medium text-gray-700 mb-2">
										{metric.targetLabel}
									</label>
									<input
										type="number"
										min="0"
										step="1"
										value={
											formData.normalizationTargets[
												metric.targetKey
											]
										}
										onChange={(e) =>
											updateNormalizationTarget(
												metric.targetKey,
												e.target.value,
											)
										}
										className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
									/>
								</div>
							</div>

							{metric.dataSourceKey && (
								<div className="mt-3">
									<label className="block text-xs font-medium text-gray-700 mb-2">
										Data Source
									</label>
									<select
										value={
											formData.rules.dataSource?.[
												metric.dataSourceKey
											] || "max"
										}
										onChange={(e) =>
											updateDataSource(
												metric.dataSourceKey,
												e.target.value,
											)
										}
										className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
									>
										<option value="max">
											Maximum (NuPips or GTC)
										</option>
										<option value="nupips">
											NuPips Only
										</option>
										<option value="gtc">GTC Only</option>
									</select>
								</div>
							)}
						</div>
					);
				})}
			</div>

			<div className="bg-white border-2 border-green-200 rounded-xl p-4">
				<div className="flex items-start gap-3 mb-4">
					<div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
						<Shield className="w-5 h-5 text-green-600" />
					</div>
					<div className="flex-1">
						<h3 className="font-semibold text-gray-900">
							KYC Verification Count
						</h3>
						<p className="text-xs text-gray-500 mt-1">
							Count KYC-completed members in downline tree
						</p>
					</div>
					<label className="relative inline-flex items-center cursor-pointer">
						<input
							type="checkbox"
							checked={
								formData.kycConfig?.countDownlineKyc || false
							}
							onChange={(e) =>
								updateKycConfig(
									"countDownlineKyc",
									e.target.checked,
								)
							}
							className="sr-only peer"
						/>
						<div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
					</label>
				</div>

				{formData.kycConfig?.countDownlineKyc && (
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
						<div>
							<label className="block text-xs font-medium text-gray-700 mb-2">
								KYC Weight (%)
							</label>
							<input
								type="number"
								min="0"
								max="100"
								step="1"
								value={formData.kycConfig.kycWeight || 0}
								onChange={(e) =>
									updateKycConfig(
										"kycWeight",
										parseFloat(e.target.value) || 0,
									)
								}
								className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
							/>
						</div>

						<div>
							<label className="block text-xs font-medium text-gray-700 mb-2">
								Target KYC Count
							</label>
							<input
								type="number"
								min="0"
								step="1"
								value={
									formData.normalizationTargets
										.kycCountTarget || 5
								}
								onChange={(e) =>
									updateNormalizationTarget(
										"kycCountTarget",
										e.target.value,
									)
								}
								className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
							/>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

const RewardsTab = ({ formData, setFormData }) => {
	const addReward = () => {
		setFormData({
			...formData,
			rewards: [
				...formData.rewards,
				{
					title: "",
					prize: "",
					description: "",
					minRank: 1,
					maxRank: 1,
					type: "monetary",
				},
			],
		});
	};

	const updateReward = (index, field, value) => {
		const updatedRewards = [...formData.rewards];
		updatedRewards[index] = {
			...updatedRewards[index],
			[field]: value,
		};
		setFormData({ ...formData, rewards: updatedRewards });
	};

	const removeReward = (index) => {
		const updatedRewards = formData.rewards.filter((_, i) => i !== index);
		setFormData({ ...formData, rewards: updatedRewards });
	};

	const getRankBadge = (minRank, maxRank) => {
		if (minRank === maxRank) {
			if (minRank === 1)
				return (
					<span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded">
						1st Place
					</span>
				);
			if (minRank === 2)
				return (
					<span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-bold rounded">
						2nd Place
					</span>
				);
			if (minRank === 3)
				return (
					<span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-bold rounded">
						3rd Place
					</span>
				);
			return (
				<span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">
					Rank {minRank}
				</span>
			);
		}
		return (
			<span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-semibold rounded">
				Ranks {minRank}-{maxRank}
			</span>
		);
	};

	return (
		<div className="space-y-5">
			<div className="flex items-center justify-between">
				<div>
					<h3 className="text-lg font-bold text-gray-900">
						Reward Structure
					</h3>
					<p className="text-sm text-gray-600 mt-1">
						Define prizes for different rank ranges
					</p>
				</div>
				<button
					onClick={addReward}
					className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold flex items-center gap-2 text-sm"
				>
					<Plus className="w-4 h-4" />
					Add Reward
				</button>
			</div>

			{formData.rewards.length === 0 ? (
				<div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
					<Gift className="w-12 h-12 text-gray-300 mx-auto mb-3" />
					<p className="text-gray-500 font-medium mb-2">
						No rewards added yet
					</p>
					<p className="text-sm text-gray-400 mb-4">
						Click "Add Reward" to create prize tiers
					</p>
					<button
						onClick={addReward}
						className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold inline-flex items-center gap-2 text-sm"
					>
						<Plus className="w-4 h-4" />
						Add First Reward
					</button>
				</div>
			) : (
				<div className="space-y-4">
					{formData.rewards.map((reward, index) => (
						<div
							key={index}
							className="bg-white border border-gray-200 rounded-xl p-4"
						>
							<div className="flex items-center justify-between mb-4">
								<div className="flex items-center gap-3">
									<div className="w-10 h-10 bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg flex items-center justify-center">
										<Gift className="w-5 h-5 text-orange-600" />
									</div>
									<div>
										<h4 className="font-semibold text-gray-900">
											Reward #{index + 1}
										</h4>
										{getRankBadge(
											reward.minRank,
											reward.maxRank,
										)}
									</div>
								</div>
								<button
									onClick={() => removeReward(index)}
									className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
									title="Remove Reward"
								>
									<Trash2 className="w-4 h-4" />
								</button>
							</div>

							<div className="space-y-3">
								<div className="grid grid-cols-2 gap-3">
									<div>
										<label className="block text-xs font-medium text-gray-700 mb-1">
											Min Rank *
										</label>
										<input
											type="number"
											min="1"
											value={reward.minRank}
											onChange={(e) =>
												updateReward(
													index,
													"minRank",
													parseInt(e.target.value),
												)
											}
											className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
										/>
									</div>
									<div>
										<label className="block text-xs font-medium text-gray-700 mb-1">
											Max Rank *
										</label>
										<input
											type="number"
											min="1"
											value={reward.maxRank}
											onChange={(e) =>
												updateReward(
													index,
													"maxRank",
													parseInt(e.target.value),
												)
											}
											className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
										/>
									</div>
								</div>

								<div>
									<label className="block text-xs font-medium text-gray-700 mb-1">
										Reward Title *
									</label>
									<input
										type="text"
										value={reward.title}
										onChange={(e) =>
											updateReward(
												index,
												"title",
												e.target.value,
											)
										}
										placeholder="e.g., Grand Prize, Runner-up"
										className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
									/>
								</div>

								<div>
									<label className="block text-xs font-medium text-gray-700 mb-1">
										Prize Value *
									</label>
									<input
										type="text"
										value={reward.prize}
										onChange={(e) =>
											updateReward(
												index,
												"prize",
												e.target.value,
											)
										}
										placeholder="e.g., $5000, iPhone 15 Pro"
										className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
									/>
								</div>

								<div>
									<label className="block text-xs font-medium text-gray-700 mb-1">
										Description *
									</label>
									<textarea
										value={reward.description}
										onChange={(e) =>
											updateReward(
												index,
												"description",
												e.target.value,
											)
										}
										rows="2"
										placeholder="Describe the reward and any conditions..."
										className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
									/>
								</div>

								<div>
									<label className="block text-xs font-medium text-gray-700 mb-1">
										Type
									</label>
									<select
										value={reward.type}
										onChange={(e) =>
											updateReward(
												index,
												"type",
												e.target.value,
											)
										}
										className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
									>
										<option value="monetary">
											Monetary
										</option>
										<option value="physical">
											Physical Item
										</option>
										<option value="digital">
											Digital Asset
										</option>
										<option value="service">
											Service/Subscription
										</option>
										<option value="mixed">Mixed</option>
									</select>
								</div>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
};

const AdvancedTab = ({ formData, setFormData }) => {
	return (
		<div className="space-y-6">
			<div>
				<h3 className="text-lg font-bold text-gray-900 mb-1">
					Requirements & Eligibility
				</h3>
				<p className="text-sm text-gray-600">
					Define who can participate in this competition
				</p>
			</div>

			<div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
							<Shield className="w-5 h-5 text-blue-600" />
						</div>
						<div>
							<p className="font-semibold text-gray-900">
								Require GTC Account Connection
							</p>
							<p className="text-xs text-gray-500">
								Users must link their GTC FX account to
								participate
							</p>
						</div>
					</div>
					<label className="relative inline-flex items-center cursor-pointer">
						<input
							type="checkbox"
							checked={
								formData.requirements?.requiresGTCAccount ||
								false
							}
							onChange={(e) =>
								setFormData({
									...formData,
									requirements: {
										...formData.requirements,
										requiresGTCAccount: e.target.checked,
									},
								})
							}
							className="sr-only peer"
						/>
						<div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
					</label>
				</div>

				<div>
					<label className="block text-sm font-medium text-gray-700 mb-2">
						Minimum Account Balance (USD)
					</label>
					<input
						type="number"
						min="0"
						step="100"
						value={formData.requirements?.minAccountBalance || 0}
						onChange={(e) =>
							setFormData({
								...formData,
								requirements: {
									...formData.requirements,
									minAccountBalance:
										parseFloat(e.target.value) || 0,
								},
							})
						}
						className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
					/>
					<p className="text-xs text-gray-500 mt-1">
						Set to 0 for no minimum balance requirement
					</p>
				</div>
			</div>

			<div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
				<div className="flex items-start gap-3">
					<Info className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
					<div>
						<p className="text-sm font-semibold text-gray-900 mb-2">
							Important Notes
						</p>
						<ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
							<li>
								Participants' scores are based on growth from
								their baseline (first participation)
							</li>
							<li>
								Scores are recalculated when users manually
								update or when admin triggers recalculation
							</li>
							<li>
								Competition status changes affect visibility and
								participation
							</li>
							<li>
								Edit carefully if competition is already active
							</li>
						</ul>
					</div>
				</div>
			</div>
		</div>
	);
};

const NotesTab = ({ formData, setFormData }) => {
	return (
		<div className="space-y-6">
			<div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
				<div className="flex items-start gap-3">
					<Info className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
					<div>
						<p className="text-sm font-semibold text-gray-900 mb-2">
							Important Notes
						</p>
						<ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
							<li>
								Participants' scores are based on growth from
								their baseline (first participation)
							</li>
							<li>
								Scores are recalculated when users manually
								update or when admin triggers recalculation
							</li>
							<li>
								Competition status changes affect visibility and
								participation
							</li>
							<li>
								Edit carefully if competition is already active
							</li>
						</ul>
					</div>
				</div>
			</div>
		</div>
	);
};

const WinnersModal = ({ competition, onClose }) => {
	const [loading, setLoading] = useState(true);
	const [winners, setWinners] = useState([]);

	useEffect(() => {
		fetchWinners();
	}, []);

	const fetchWinners = async () => {
		try {
			setLoading(true);
			const response = await api.get(
				`/competition/admin/${competition._id}/winners`,
			);
			if (response.data.success) {
				setWinners(response.data.winners || []);
			}
		} catch (error) {
			console.error("Error fetching winners:", error);
		} finally {
			setLoading(false);
		}
	};

	const getRankIcon = (rank) => {
		if (rank === 1) return "🥇";
		if (rank === 2) return "🥈";
		if (rank === 3) return "🥉";
		return `#${rank}`;
	};

	return (
		<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
			<div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
				<div className="p-6 border-b border-gray-200 flex items-center justify-between">
					<div className="flex items-center gap-3">
						<div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
							<Crown className="w-6 h-6 text-purple-600" />
						</div>
						<div>
							<h3 className="text-xl font-bold text-gray-900">
								Winners
							</h3>
							<p className="text-sm text-gray-600">
								{competition.title}
							</p>
						</div>
					</div>
					<button
						onClick={onClose}
						className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
					>
						<X className="w-5 h-5" />
					</button>
				</div>

				<div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
					{loading ? (
						<div className="flex items-center justify-center py-12">
							<Loader className="w-8 h-8 text-orange-600 animate-spin" />
						</div>
					) : winners.length === 0 ? (
						<div className="text-center py-12">
							<Crown className="w-16 h-16 text-gray-300 mx-auto mb-4" />
							<p className="text-gray-500 font-medium">
								No winners found
							</p>
						</div>
					) : (
						<div className="space-y-3">
							{winners.map((winner) => (
								<div
									key={winner.userId}
									className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-4"
								>
									<div className="flex items-center justify-between mb-3">
										<div className="flex items-center gap-3">
											<div className="text-2xl">
												{getRankIcon(winner.rank)}
											</div>
											<div>
												<h4 className="font-bold text-gray-900">
													{winner.name}
												</h4>
												<p className="text-sm text-gray-600">
													@{winner.username}
												</p>
											</div>
										</div>
										<div className="text-right">
											<p className="text-2xl font-bold text-purple-600">
												{winner.score}
											</p>
											<p className="text-xs text-gray-500">
												Total Score
											</p>
										</div>
									</div>

									{winner.reward && (
										<div className="bg-white rounded-lg p-3 border border-purple-200">
											<div className="flex items-center gap-2 mb-2">
												<Gift className="w-4 h-4 text-purple-600" />
												<p className="font-semibold text-gray-900">
													{winner.reward.title}
												</p>
											</div>
											<p className="text-sm text-gray-700 mb-1">
												Prize:{" "}
												<span className="font-bold">
													{winner.reward.prize}
												</span>
											</p>
											<p className="text-xs text-gray-600">
												{winner.reward.description}
											</p>
										</div>
									)}
								</div>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

const ParticipantsModal = ({ competition, onClose }) => {
	const [loading, setLoading] = useState(true);
	const [participants, setParticipants] = useState([]);
	const [sortBy, setSortBy] = useState("rank");
	const [searchQuery, setSearchQuery] = useState("");

	useEffect(() => {
		fetchParticipants();
	}, [sortBy]);

	const fetchParticipants = async () => {
		try {
			setLoading(true);
			const response = await api.get(
				`/competition/admin/${competition._id}/participants?sortBy=${sortBy}`,
			);
			if (response.data.success) {
				setParticipants(response.data.participants || []);
			}
		} catch (error) {
			console.error("Error fetching participants:", error);
		} finally {
			setLoading(false);
		}
	};

	const filteredParticipants = participants.filter(
		(p) =>
			p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
			p.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
			p.email?.toLowerCase().includes(searchQuery.toLowerCase()),
	);

	return (
		<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
			<div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
				<div className="p-6 border-b border-gray-200">
					<div className="flex items-center justify-between mb-4">
						<div className="flex items-center gap-3">
							<div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
								<Users className="w-6 h-6 text-blue-600" />
							</div>
							<div>
								<h3 className="text-xl font-bold text-gray-900">
									Participants
								</h3>
								<p className="text-sm text-gray-600">
									{competition.title}
								</p>
							</div>
						</div>
						<button
							onClick={onClose}
							className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
						>
							<X className="w-5 h-5" />
						</button>
					</div>

					<div className="flex gap-3">
						<div className="flex-1 relative">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
							<input
								type="text"
								placeholder="Search participants..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
							/>
						</div>
						<select
							value={sortBy}
							onChange={(e) => setSortBy(e.target.value)}
							className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
						>
							<option value="rank">Sort by Rank</option>
							<option value="score">Sort by Score</option>
							<option value="name">Sort by Name</option>
						</select>
					</div>
				</div>

				<div className="p-6 overflow-y-auto max-h-[calc(90vh-220px)]">
					{loading ? (
						<div className="flex items-center justify-center py-12">
							<Loader className="w-8 h-8 text-orange-600 animate-spin" />
						</div>
					) : filteredParticipants.length === 0 ? (
						<div className="text-center py-12">
							<Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
							<p className="text-gray-500 font-medium">
								No participants found
							</p>
						</div>
					) : (
						<div className="space-y-3">
							{filteredParticipants.map((participant) => (
								<div
									key={participant.userId}
									className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
								>
									<div className="flex items-center justify-between mb-3">
										<div className="flex items-center gap-3">
											<div className="w-10 h-10 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center font-bold text-orange-700">
												#{participant.rank}
											</div>
											<div>
												<h4 className="font-bold text-gray-900">
													{participant.name}
												</h4>
												<p className="text-sm text-gray-600">
													@{participant.username}
												</p>
											</div>
											{participant.isAgent && (
												<span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded">
													Agent
												</span>
											)}
										</div>
										<div className="text-right">
											<p className="text-2xl font-bold text-gray-900">
												{participant.score}
											</p>
											<p className="text-xs text-gray-500">
												Score
											</p>
										</div>
									</div>

									{participant.growth && (
										<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-3">
											<div className="bg-blue-50 rounded-lg p-2">
												<p className="text-xs text-gray-600">
													Direct Referrals
												</p>
												<p className="text-sm font-bold text-blue-700">
													+
													{participant.growth
														.directReferralsGrowth ||
														0}
												</p>
											</div>
											<div className="bg-purple-50 rounded-lg p-2">
												<p className="text-xs text-gray-600">
													Team Size
												</p>
												<p className="text-sm font-bold text-purple-700">
													+
													{participant.growth
														.teamSizeGrowth || 0}
												</p>
											</div>
											<div className="bg-green-50 rounded-lg p-2">
												<p className="text-xs text-gray-600">
													Volume
												</p>
												<p className="text-sm font-bold text-green-700">
													+$
													{participant.growth.tradingVolumeGrowthDollars?.toFixed(
														0,
													) || 0}
												</p>
											</div>
											<div className="bg-orange-50 rounded-lg p-2">
												<p className="text-xs text-gray-600">
													Profit
												</p>
												<p className="text-sm font-bold text-orange-700">
													$
													{participant.growth.profitGrowth?.toFixed(
														2,
													) || 0}
												</p>
											</div>
											<div className="bg-indigo-50 rounded-lg p-2">
												<p className="text-xs text-gray-600">
													Balance
												</p>
												<p className="text-sm font-bold text-indigo-700">
													$
													{participant.growth.accountBalanceGrowth?.toFixed(
														2,
													) || 0}
												</p>
											</div>
											{competition.kycConfig
												?.countDownlineKyc && (
												<div className="bg-green-50 rounded-lg p-2">
													<p className="text-xs text-gray-600">
														KYC Count
													</p>
													<p className="text-sm font-bold text-green-700">
														+
														{participant.growth
															.kycCountGrowth ||
															0}
													</p>
												</div>
											)}
										</div>
									)}

									{participant.breakdown && (
										<div className="flex flex-wrap gap-2">
											{Object.entries(
												participant.breakdown,
											).map(([key, value]) => (
												<span
													key={key}
													className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
												>
													{key.replace(/Score$/, "")}:{" "}
													{value}
												</span>
											))}
										</div>
									)}
								</div>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default AdminCompetition;
