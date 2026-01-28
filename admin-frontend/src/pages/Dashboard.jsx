import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import {
	LayoutDashboard,
	Users,
	TrendingUp,
	TrendingDown,
	DollarSign,
	ShoppingCart,
	Package,
	PlayCircle,
	ArrowLeft,
	Loader,
	AlertCircle,
	Activity,
	Wallet,
	Clock,
	Eye,
	RefreshCw,
	Calendar,
	CheckCircle,
	XCircle,
	Download,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const Dashboard = () => {
	const navigate = useNavigate();
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [dashboardData, setDashboardData] = useState(null);
	const [refreshing, setRefreshing] = useState(false);

	useEffect(() => {
		loadDashboard();
	}, []);

	const loadDashboard = async () => {
		setLoading(true);
		setError("");
		try {
			const response = await api.get("/admin/dashboard");
			if (response.data.success) {
				setDashboardData(response.data);
			}
		} catch (e) {
			setError(
				e.response?.data?.message || "Failed to load dashboard data",
			);
		} finally {
			setLoading(false);
		}
	};

	const handleBackup = async () => {
		try {
			const response = await api.get("/admin/backup", {
				responseType: "blob",
			});

			const filename =
				response.headers["content-disposition"]
					?.split("filename=")[1]
					?.replace(/["']/g, "") ||
				`backup_${new Date().toISOString().slice(0, 19).replace(/[T:]/g, "_")}.zip`;

			const url = window.URL.createObjectURL(response.data);
			const a = document.createElement("a");
			a.href = url;
			a.download = filename;
			document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(url);
			document.body.removeChild(a);
		} catch (error) {
			setError("Backup download failed");
			console.error(error);
		}
	};

	const handleRefresh = async () => {
		setRefreshing(true);
		await loadDashboard();
		setRefreshing(false);
	};

	const formatCurrency = (amount) => {
		return `$${parseFloat(amount || 0).toFixed(2)}`;
	};

	const formatDate = (date) => {
		return new Date(date).toLocaleDateString("en-IN", {
			day: "2-digit",
			month: "short",
			year: "numeric",
		});
	};

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-white">
				<div className="flex flex-col items-center gap-4">
					<Loader className="w-12 h-12 text-orange-600 animate-spin" />
					<p className="text-gray-600 font-medium">
						Loading dashboard...
					</p>
				</div>
			</div>
		);
	}

	const {
		overview,
		users,
		financial,
		ecommerce,
		courses,
		incomeExpense,
		recentActivity,
	} = dashboardData || {};

	return (
		<>
			<Helmet>
				<title>Admin Dashboard</title>
			</Helmet>

			<div className="min-h-screen bg-white p-4 sm:p-6 lg:p-8">
				{/* Header */}
				<div className="mb-8">
					<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
						<div>
							<h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
								<LayoutDashboard className="w-8 h-8 text-orange-600" />
								Admin Dashboard
							</h1>
							<p className="text-gray-600 mt-2">
								Overview of system performance and metrics
							</p>
						</div>

						<div className="flex items-center gap-2">
							<button
								onClick={handleBackup}
								disabled={refreshing}
								className="px-4 py-2 bg-linear-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-semibold transition-all shadow-sm hover:shadow-md flex items-center gap-2 disabled:opacity-50"
							>
								<Download
									className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`}
								/>
								Backup All Data
							</button>
							<button
								onClick={handleRefresh}
								disabled={refreshing}
								className="px-4 py-2 bg-linear-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-semibold transition-all shadow-sm hover:shadow-md flex items-center gap-2 disabled:opacity-50"
							>
								<RefreshCw
									className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`}
								/>
								Refresh
							</button>
						</div>
					</div>
				</div>

				{/* Error Alert */}
				{error && (
					<div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
						<AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
						<p className="text-sm text-red-700">{error}</p>
					</div>
				)}

				{/* Main KPI Cards */}
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
					{/* Total Users */}
					<div className="bg-linear-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
						<div className="flex items-center gap-3 mb-2">
							<div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
								<Users className="w-5 h-5 text-white" />
							</div>
							<p className="text-sm font-medium text-blue-900">
								Total Users
							</p>
						</div>
						<p className="text-2xl font-bold text-blue-900">
							{overview?.totalUsers || 0}
						</p>
						<p className="text-xs text-blue-700 mt-1">
							+{overview?.newUsersToday || 0} today
						</p>
					</div>

					{/* Total Wallet Balance */}
					<div className="bg-linear-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
						<div className="flex items-center gap-3 mb-2">
							<div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
								<Wallet className="w-5 h-5 text-white" />
							</div>
							<p className="text-sm font-medium text-green-900">
								Total Balance
							</p>
						</div>
						<p className="text-2xl font-bold text-green-900">
							{formatCurrency(overview?.totalWalletBalance)}
						</p>
						<p className="text-xs text-green-700 mt-1">
							System-wide
						</p>
					</div>

					{/* Net Revenue */}
					<div className="bg-linear-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
						<div className="flex items-center gap-3 mb-2">
							<div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
								<TrendingUp className="w-5 h-5 text-white" />
							</div>
							<p className="text-sm font-medium text-purple-900">
								Net Revenue
							</p>
						</div>
						<p className="text-2xl font-bold text-purple-900">
							{formatCurrency(overview?.netRevenue)}
						</p>
						<p className="text-xs text-purple-700 mt-1">
							Deposits - Withdrawals
						</p>
					</div>

					{/* Total Orders */}
					<div className="bg-linear-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
						<div className="flex items-center gap-3 mb-2">
							<div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
								<ShoppingCart className="w-5 h-5 text-white" />
							</div>
							<p className="text-sm font-medium text-orange-900">
								Total Orders
							</p>
						</div>
						<p className="text-2xl font-bold text-orange-900">
							{formatCurrency(overview?.totalOrders)}
						</p>
						<p className="text-xs text-orange-700 mt-1">
							{overview?.totalOrderCount || 0} orders
						</p>
					</div>
				</div>

				{/* Financial Overview */}
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
					{/* Deposits */}
					<div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
						<div className="p-4 bg-linear-to-r from-green-50 to-green-100 border-b border-green-200">
							<h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
								<TrendingUp className="w-5 h-5 text-green-600" />
								Deposits Overview
							</h2>
						</div>
						<div className="p-6 space-y-4">
							<div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
								<div>
									<p className="text-sm text-gray-600">
										Total Completed
									</p>
									<p className="text-2xl font-bold text-green-600">
										{formatCurrency(
											overview?.totalDeposits,
										)}
									</p>
								</div>
								<div className="text-right">
									<p className="text-sm text-gray-600">
										Count
									</p>
									<p className="text-xl font-semibold text-gray-900">
										{overview?.totalDepositCount || 0}
									</p>
								</div>
							</div>

							<div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
								<div>
									<p className="text-sm text-gray-600">
										Pending
									</p>
									<p className="text-xl font-bold text-yellow-600">
										{formatCurrency(
											overview?.pendingDeposits,
										)}
									</p>
								</div>
								<div className="text-right">
									<p className="text-sm text-gray-600">
										Count
									</p>
									<p className="text-lg font-semibold text-gray-900">
										{overview?.pendingDepositCount || 0}
									</p>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-3">
								<div className="p-3 bg-gray-50 rounded-lg">
									<p className="text-xs text-gray-600">
										Today
									</p>
									<p className="text-lg font-bold text-gray-900">
										{formatCurrency(
											financial?.deposits?.today?.total,
										)}
									</p>
								</div>
								<div className="p-3 bg-gray-50 rounded-lg">
									<p className="text-xs text-gray-600">
										This Month
									</p>
									<p className="text-lg font-bold text-gray-900">
										{formatCurrency(
											financial?.deposits?.thisMonth
												?.total,
										)}
									</p>
								</div>
							</div>
						</div>
					</div>

					{/* Withdrawals */}
					<div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
						<div className="p-4 bg-linear-to-r from-red-50 to-red-100 border-b border-red-200">
							<h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
								<TrendingDown className="w-5 h-5 text-red-600" />
								Withdrawals Overview
							</h2>
						</div>
						<div className="p-6 space-y-4">
							<div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
								<div>
									<p className="text-sm text-gray-600">
										Total Completed
									</p>
									<p className="text-2xl font-bold text-red-600">
										{formatCurrency(
											overview?.totalWithdrawals,
										)}
									</p>
								</div>
								<div className="text-right">
									<p className="text-sm text-gray-600">
										Count
									</p>
									<p className="text-xl font-semibold text-gray-900">
										{overview?.totalWithdrawalCount || 0}
									</p>
								</div>
							</div>

							<div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
								<div>
									<p className="text-sm text-gray-600">
										Pending
									</p>
									<p className="text-xl font-bold text-yellow-600">
										{formatCurrency(
											overview?.pendingWithdrawals,
										)}
									</p>
								</div>
								<div className="text-right">
									<p className="text-sm text-gray-600">
										Count
									</p>
									<p className="text-lg font-semibold text-gray-900">
										{overview?.pendingWithdrawalCount || 0}
									</p>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-3">
								<div className="p-3 bg-gray-50 rounded-lg">
									<p className="text-xs text-gray-600">
										Today
									</p>
									<p className="text-lg font-bold text-gray-900">
										{formatCurrency(
											financial?.withdrawals?.today
												?.total,
										)}
									</p>
								</div>
								<div className="p-3 bg-gray-50 rounded-lg">
									<p className="text-xs text-gray-600">
										This Month
									</p>
									<p className="text-lg font-bold text-gray-900">
										{formatCurrency(
											financial?.withdrawals?.thisMonth
												?.total,
										)}
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* User Breakdown & E-commerce Stats */}
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
					{/* User Stats */}
					<div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
						<div className="p-4 bg-linear-to-r from-blue-50 to-blue-100 border-b border-blue-200">
							<h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
								<Users className="w-5 h-5 text-blue-600" />
								User Statistics
							</h2>
						</div>
						<div className="p-6 space-y-3">
							<div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
								<span className="text-sm font-medium text-gray-700">
									New Today
								</span>
								<span className="text-lg font-bold text-blue-600">
									{overview?.newUsersToday || 0}
								</span>
							</div>
							<div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
								<span className="text-sm font-medium text-gray-700">
									New This Month
								</span>
								<span className="text-lg font-bold text-blue-600">
									{overview?.newUsersThisMonth || 0}
								</span>
							</div>

							<div className="mt-4">
								<h3 className="text-sm font-semibold text-gray-700 mb-2">
									By Type
								</h3>
								{users?.byType?.map((type) => (
									<div
										key={type._id}
										className="flex items-center justify-between py-2"
									>
										<span className="text-sm text-gray-600 capitalize">
											{type._id}
										</span>
										<span className="text-sm font-semibold text-gray-900">
											{type.count}
										</span>
									</div>
								))}
							</div>
						</div>
					</div>

					{/* E-commerce Stats */}
					<div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
						<div className="p-4 bg-linear-to-r from-purple-50 to-purple-100 border-b border-purple-200">
							<h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
								<Package className="w-5 h-5 text-purple-600" />
								E-commerce Overview
							</h2>
						</div>
						<div className="p-6 space-y-4">
							<div className="grid grid-cols-2 gap-3">
								<div className="p-3 bg-purple-50 rounded-lg">
									<p className="text-xs text-gray-600">
										Total Products
									</p>
									<p className="text-2xl font-bold text-purple-600">
										{ecommerce?.products?.total || 0}
									</p>
								</div>
								<div className="p-3 bg-orange-50 rounded-lg">
									<p className="text-xs text-gray-600">
										Bestsellers
									</p>
									<p className="text-2xl font-bold text-orange-600">
										{ecommerce?.products?.bestsellers || 0}
									</p>
								</div>
							</div>

							<div className="p-4 bg-green-50 rounded-lg">
								<p className="text-sm text-gray-600">
									Avg. Product Price
								</p>
								<p className="text-2xl font-bold text-green-600">
									{formatCurrency(
										ecommerce?.products?.averagePrice,
									)}
								</p>
							</div>

							<div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
								<span className="text-sm font-medium text-gray-700">
									Orders Today
								</span>
								<div className="text-right">
									<p className="text-lg font-bold text-gray-900">
										{ecommerce?.orders?.today?.count || 0}
									</p>
									<p className="text-xs text-gray-500">
										{formatCurrency(
											ecommerce?.orders?.today?.total,
										)}
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Courses & Income/Expense */}
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
					{/* Courses Stats */}
					<div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
						<div className="p-4 bg-linear-to-r from-orange-50 to-orange-100 border-b border-orange-200">
							<h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
								<PlayCircle className="w-5 h-5 text-orange-600" />
								Learning Platform
							</h2>
						</div>
						<div className="p-6 space-y-4">
							<div className="grid grid-cols-3 gap-3">
								<div className="p-3 bg-blue-50 rounded-lg text-center">
									<p className="text-xs text-gray-600">
										Courses
									</p>
									<p className="text-2xl font-bold text-blue-600">
										{courses?.total || 0}
									</p>
								</div>
								<div className="p-3 bg-green-50 rounded-lg text-center">
									<p className="text-xs text-gray-600">
										Published
									</p>
									<p className="text-2xl font-bold text-green-600">
										{courses?.published || 0}
									</p>
								</div>
								<div className="p-3 bg-purple-50 rounded-lg text-center">
									<p className="text-xs text-gray-600">
										Videos
									</p>
									<p className="text-2xl font-bold text-purple-600">
										{courses?.totalVideos || 0}
									</p>
								</div>
							</div>
						</div>
					</div>

					{/* Income/Expense Summary */}
					<div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
						<div className="p-4 bg-linear-to-r from-green-50 to-green-100 border-b border-green-200">
							<h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
								<Activity className="w-5 h-5 text-green-600" />
								Financial Summary
							</h2>
						</div>
						<div className="p-6 space-y-4">
							<div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
								<div>
									<p className="text-sm text-gray-600">
										Total Income
									</p>
									<p className="text-2xl font-bold text-green-600">
										{formatCurrency(
											incomeExpense?.totalIncome,
										)}
									</p>
								</div>
								<TrendingUp className="w-8 h-8 text-green-600" />
							</div>

							<div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
								<div>
									<p className="text-sm text-gray-600">
										Total Expense
									</p>
									<p className="text-2xl font-bold text-red-600">
										{formatCurrency(
											incomeExpense?.totalExpense,
										)}
									</p>
								</div>
								<TrendingDown className="w-8 h-8 text-red-600" />
							</div>

							<div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
								<div>
									<p className="text-sm font-semibold text-gray-700">
										Net Profit
									</p>
									<p className="text-2xl font-bold text-blue-600">
										{formatCurrency(
											incomeExpense?.netProfit,
										)}
									</p>
								</div>
								<DollarSign className="w-8 h-8 text-blue-600" />
							</div>
						</div>
					</div>
				</div>

				{/* Recent Activity */}
				<div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
					<div className="p-4 bg-linear-to-r from-orange-50 to-orange-100 border-b border-orange-200">
						<h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
							<Clock className="w-5 h-5 text-orange-600" />
							Recent Activity
						</h2>
					</div>

					<div className="p-6">
						<div className="space-y-6">
							{/* Pending Deposits */}
							{recentActivity?.pendingDeposits?.length > 0 && (
								<div>
									<h3 className="text-sm font-semibold text-gray-700 mb-3">
										Pending Deposits
									</h3>
									<div className="space-y-2">
										{recentActivity.pendingDeposits.map(
											(deposit) => (
												<div
													key={deposit._id}
													className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
												>
													<div className="flex items-center gap-3">
														<div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
															<TrendingUp className="w-4 h-4 text-white" />
														</div>
														<div>
															<p className="text-sm font-semibold text-gray-900">
																{deposit.userId
																	?.name ||
																	"Unknown"}
															</p>
															<p className="text-xs text-gray-500">
																{
																	deposit.transactionId
																}
															</p>
														</div>
													</div>
													<div className="text-right">
														<p className="text-sm font-bold text-gray-900">
															{formatCurrency(
																deposit.amount,
															)}
														</p>
														<span className="text-xs text-yellow-600 font-semibold">
															{deposit.status}
														</span>
													</div>
												</div>
											),
										)}
									</div>
								</div>
							)}

							{/* Pending Withdrawals */}
							{recentActivity?.pendingWithdrawals?.length > 0 && (
								<div>
									<h3 className="text-sm font-semibold text-gray-700 mb-3">
										Pending Withdrawals
									</h3>
									<div className="space-y-2">
										{recentActivity.pendingWithdrawals.map(
											(withdrawal) => (
												<div
													key={withdrawal._id}
													className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg"
												>
													<div className="flex items-center gap-3">
														<div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
															<TrendingDown className="w-4 h-4 text-white" />
														</div>
														<div>
															<p className="text-sm font-semibold text-gray-900">
																{withdrawal
																	.userId
																	?.name ||
																	"Unknown"}
															</p>
															<p className="text-xs text-gray-500">
																{
																	withdrawal.transactionId
																}
															</p>
														</div>
													</div>
													<div className="text-right">
														<p className="text-sm font-bold text-gray-900">
															{formatCurrency(
																withdrawal.netAmount,
															)}
														</p>
														<span className="text-xs text-red-600 font-semibold">
															{withdrawal.status}
														</span>
													</div>
												</div>
											),
										)}
									</div>
								</div>
							)}

							{/* Recent Orders */}
							{recentActivity?.recentOrders?.length > 0 && (
								<div>
									<h3 className="text-sm font-semibold text-gray-700 mb-3">
										Recent Orders
									</h3>
									<div className="space-y-2">
										{recentActivity.recentOrders.map(
											(order) => (
												<div
													key={order._id}
													className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg"
												>
													<div className="flex items-center gap-3">
														<div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
															<ShoppingCart className="w-4 h-4 text-white" />
														</div>
														<div>
															<p className="text-sm font-semibold text-gray-900">
																{order.userId
																	?.name ||
																	"Unknown"}
															</p>
															<p className="text-xs text-gray-500">
																{formatDate(
																	order.createdAt,
																)}
															</p>
														</div>
													</div>
													<div className="text-right">
														<p className="text-sm font-bold text-gray-900">
															{formatCurrency(
																order.amount,
															)}
														</p>
														<span className="text-xs text-blue-600 font-semibold">
															{order.status}
														</span>
													</div>
												</div>
											),
										)}
									</div>
								</div>
							)}

							{/* No Activity */}
							{!recentActivity?.pendingDeposits?.length &&
								!recentActivity?.pendingWithdrawals?.length &&
								!recentActivity?.recentOrders?.length && (
									<div className="text-center py-8">
										<Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
										<p className="text-gray-500">
											No recent activity
										</p>
									</div>
								)}
						</div>
					</div>
				</div>
			</div>
		</>
	);
};

export default Dashboard;
