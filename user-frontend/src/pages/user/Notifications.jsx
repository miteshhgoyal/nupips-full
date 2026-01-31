import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import {
	Bell,
	CheckCircle,
	XCircle,
	Clock,
	TrendingUp,
	Wallet,
	AlertCircle,
	Trash2,
	RefreshCw,
	ChevronLeft,
	ArrowDown,
	ArrowUp,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../services/api";

const Notifications = () => {
	const navigate = useNavigate();
	const { user } = useAuth();
	const [notifications, setNotifications] = useState([]);
	const [loading, setLoading] = useState(true);
	const [deleting, setDeleting] = useState(false);
	const [selectedNotifications, setSelectedNotifications] = useState([]);
	const [showBulkActions, setShowBulkActions] = useState(false);
	const [filterType, setFilterType] = useState("all");

	// Fetch notifications
	const fetchNotifications = async () => {
		try {
			setLoading(true);
			const response = await api.get("/notifications");
			if (response.data.success) {
				setNotifications(response.data.notifications);
			}
		} catch (error) {
			console.error("Failed to fetch notifications:", error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchNotifications();
	}, []);

	const markAsRead = async (notificationId) => {
		try {
			await api.put(`/notifications/${notificationId}/read`);
			setNotifications((prev) =>
				prev.map((notif) =>
					notif._id === notificationId
						? { ...notif, isRead: true }
						: notif,
				),
			);
		} catch (error) {
			console.error("Failed to mark as read:", error);
		}
	};

	const deleteNotification = async (notificationId) => {
		if (!window.confirm("Delete this notification?")) return;

		try {
			setDeleting(true);
			await api.delete(`/notifications/${notificationId}`);
			setNotifications((prev) =>
				prev.filter((n) => n._id !== notificationId),
			);
		} catch (error) {
			console.error("Failed to delete notification:", error);
		} finally {
			setDeleting(false);
		}
	};

	const deleteBulk = async (type) => {
		if (selectedNotifications.length === 0) return;

		if (
			!window.confirm(
				`Delete ${selectedNotifications.length} selected notification(s)?`,
			)
		)
			return;

		try {
			setDeleting(true);
			await Promise.all(
				selectedNotifications.map((id) =>
					api.delete(`/notifications/${id}`),
				),
			);
			setNotifications((prev) =>
				prev.filter((n) => !selectedNotifications.includes(n._id)),
			);
			setSelectedNotifications([]);
			setShowBulkActions(false);
		} catch (error) {
			console.error("Failed to delete notifications:", error);
		} finally {
			setDeleting(false);
		}
	};

	const toggleSelectAll = () => {
		if (selectedNotifications.length === notifications.length) {
			setSelectedNotifications([]);
		} else {
			setSelectedNotifications(notifications.map((n) => n._id));
		}
	};

	const getNotificationIcon = (type) => {
		const baseClasses =
			"w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm";
		switch (type) {
			case "pamm":
				return (
					<div className={`${baseClasses} bg-emerald-100`}>
						<TrendingUp className="w-5 h-5 text-emerald-600" />
					</div>
				);
			case "wallet":
				return (
					<div className={`${baseClasses} bg-orange-100`}>
						<Wallet className="w-5 h-5 text-orange-600" />
					</div>
				);
			case "warning":
				return (
					<div className={`${baseClasses} bg-amber-100`}>
						<AlertCircle className="w-5 h-5 text-amber-600" />
					</div>
				);
			case "success":
				return (
					<div className={`${baseClasses} bg-green-100`}>
						<CheckCircle className="w-5 h-5 text-green-600" />
					</div>
				);
			default:
				return (
					<div className={`${baseClasses} bg-blue-100`}>
						<Bell className="w-5 h-5 text-blue-600" />
					</div>
				);
		}
	};

	// Format timestamp
	const formatTimestamp = (date) => {
		if (!date) return "";
		const now = new Date();
		const notifDate = new Date(date);
		const diffMs = now - notifDate;
		const diffMins = Math.floor(diffMs / 60000);
		const diffHours = Math.floor(diffMs / 3600000);
		const diffDays = Math.floor(diffMs / 86400000);

		if (diffMins < 1) return "Just now";
		if (diffMins < 60) return `${diffMins}m ago`;
		if (diffHours < 24) return `${diffHours}h ago`;
		if (diffDays < 7) return `${diffDays}d ago`;
		return notifDate.toLocaleDateString("en-IN", {
			day: "numeric",
			month: "short",
		});
	};

	const filteredNotifications = notifications.filter(
		(n) => filterType === "all" || n.type === filterType,
	);

	const unreadCount = notifications.filter((n) => !n.isRead).length;

	return (
		<>
			<Helmet>
				<title>Notifications - {user?.name || "GTC FX"}</title>
			</Helmet>

			<div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 p-4 sm:p-6 lg:p-8">
				{/* Header */}
				<div className="mb-8">
					<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
						<div>
							<h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
								<Bell className="w-9 h-9 text-orange-600" />
								Notifications
							</h1>
							<p className="text-gray-600 mt-2">
								{unreadCount > 0
									? `${unreadCount} unread `
									: `${notifications.length} `}
								notification
								{notifications.length !== 1 ? "s" : ""}
							</p>
						</div>
						<button
							onClick={fetchNotifications}
							disabled={loading}
							className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors disabled:opacity-50"
						>
							<RefreshCw
								className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
							/>
							Refresh
						</button>
					</div>
				</div>

				{/* Filters & Bulk Actions */}
				{(notifications.length > 0 || loading) && (
					<div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-200 shadow-sm mb-8">
						<div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
							<div className="flex items-center gap-4 flex-wrap">
								<label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
									<input
										type="checkbox"
										checked={
											selectedNotifications.length ===
												notifications.length &&
											notifications.length > 0
										}
										onChange={toggleSelectAll}
										className="w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500 cursor-pointer"
									/>
									Select all ({selectedNotifications.length})
								</label>

								{selectedNotifications.length > 0 && (
									<div className="flex gap-2 bg-orange-50 p-2 rounded-xl border border-orange-200">
										<button
											onClick={() => deleteBulk()}
											disabled={
												deleting ||
												selectedNotifications.length ===
													0
											}
											className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-red-700 bg-white hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
										>
											<Trash2 className="w-3 h-3" />
											Delete Selected (
											{selectedNotifications.length})
										</button>
									</div>
								)}
							</div>

							<div className="flex items-center gap-2 w-full lg:w-auto">
								<select
									value={filterType}
									onChange={(e) =>
										setFilterType(e.target.value)
									}
									className="w-full lg:w-auto px-4 py-2 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
								>
									<option value="all">All Types</option>
									<option value="pamm">PAMM</option>
									<option value="wallet">Wallet</option>
									<option value="warning">Warnings</option>
									<option value="success">Success</option>
								</select>
							</div>
						</div>
					</div>
				)}

				{/* Notifications List */}
				<div className="space-y-4 max-w-4xl mx-auto">
					{loading ? (
						<div className="bg-white rounded-2xl p-12 border border-gray-200 shadow-sm text-center">
							<Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
							<p className="text-lg font-medium text-gray-600">
								Loading notifications...
							</p>
						</div>
					) : filteredNotifications.length === 0 ? (
						<div className="bg-white rounded-2xl p-12 border border-gray-200 shadow-sm text-center">
							<Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
							<h3 className="text-xl font-semibold text-gray-900 mb-2">
								No notifications
							</h3>
							<p className="text-gray-500">
								You'll see important updates here
							</p>
						</div>
					) : (
						filteredNotifications.map((notification) => (
							<div
								key={notification._id}
								className={`group bg-white rounded-2xl p-4 sm:p-6 border-2 transition-all duration-200 relative ${
									!notification.isRead
										? "border-blue-200 bg-blue-50/30 shadow-md"
										: "border-gray-200 hover:border-orange-200 hover:shadow-md hover:bg-orange-50/30"
								} ${
									selectedNotifications.includes(
										notification._id,
									)
										? "ring-2 ring-orange-400"
										: ""
								}`}
							>
								{/* Checkbox - Always visible on mobile, hover on desktop */}
								<label className="absolute top-4 right-4 flex items-center gap-2 p-2 rounded-lg bg-white border-2 border-gray-300 hover:border-orange-400 transition-all cursor-pointer lg:opacity-0 lg:group-hover:opacity-100 shadow-sm z-10">
									<input
										type="checkbox"
										checked={selectedNotifications.includes(
											notification._id,
										)}
										onChange={(e) => {
											if (e.target.checked) {
												setSelectedNotifications([
													...selectedNotifications,
													notification._id,
												]);
											} else {
												setSelectedNotifications(
													selectedNotifications.filter(
														(id) =>
															id !==
															notification._id,
													),
												);
											}
											setShowBulkActions(
												e.target.checked ||
													selectedNotifications.length >
														0,
											);
										}}
										className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500 cursor-pointer"
									/>
								</label>

								<div className="flex flex-col sm:flex-row items-start gap-4 pr-12 sm:pr-4">
									{/* Icon */}
									<div className="flex-shrink-0">
										{getNotificationIcon(notification.type)}
									</div>

									{/* Content */}
									<div className="flex-1 min-w-0 w-full">
										<div className="flex items-start justify-between gap-3 mb-2">
											<div className="flex-1">
												<div className="flex items-center gap-2 mb-1">
													<h3 className="text-base sm:text-lg font-bold text-gray-900">
														{notification.message}
													</h3>
													{!notification.isRead && (
														<div className="w-2.5 h-2.5 bg-orange-500 rounded-full flex-shrink-0 animate-pulse" />
													)}
												</div>

												{/* Type Badge & Timestamp */}
												<div className="flex items-center gap-2 flex-wrap">
													{notification.type && (
														<span className="inline-flex items-center px-2.5 py-0.5 bg-gray-100 text-xs font-medium text-gray-700 rounded-full capitalize">
															{notification.type}
														</span>
													)}
													<span className="text-xs text-gray-500 flex items-center gap-1">
														<Clock className="w-3 h-3" />
														{formatTimestamp(
															notification.createdAt,
														)}
													</span>
												</div>
											</div>
										</div>

										{/* Additional details if present */}
										{notification.details && (
											<p className="text-sm text-gray-600 mt-2 leading-relaxed">
												{notification.details}
											</p>
										)}

										{/* Action Buttons - Below content on mobile */}
										<div className="flex items-center gap-2 mt-3 sm:hidden">
											<button
												onClick={() =>
													markAsRead(notification._id)
												}
												disabled={notification.isRead}
												className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
													notification.isRead
														? "text-gray-400 bg-gray-100 cursor-not-allowed"
														: "text-green-700 bg-green-50 hover:bg-green-100"
												}`}
											>
												<CheckCircle className="w-3.5 h-3.5" />
												{notification.isRead
													? "Read"
													: "Mark read"}
											</button>

											<button
												onClick={() =>
													deleteNotification(
														notification._id,
													)
												}
												disabled={deleting}
												className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-all disabled:opacity-50"
											>
												<Trash2 className="w-3.5 h-3.5" />
												Delete
											</button>
										</div>
									</div>

									{/* Action Buttons - Side position on desktop */}
									<div className="hidden sm:flex items-center gap-2 flex-shrink-0">
										<button
											onClick={() =>
												markAsRead(notification._id)
											}
											disabled={notification.isRead}
											className={`p-2 rounded-xl transition-all ${
												notification.isRead
													? "text-gray-400 cursor-not-allowed"
													: "text-green-600 hover:bg-green-50 hover:shadow-sm"
											}`}
											title={
												notification.isRead
													? "Read"
													: "Mark as read"
											}
										>
											<CheckCircle className="w-5 h-5" />
										</button>

										<button
											onClick={() =>
												deleteNotification(
													notification._id,
												)
											}
											disabled={deleting}
											className="p-2 text-red-600 hover:bg-red-50 hover:shadow-sm rounded-xl transition-all disabled:opacity-50"
											title="Delete"
										>
											<Trash2 className="w-5 h-5" />
										</button>
									</div>
								</div>
							</div>
						))
					)}
				</div>
			</div>
		</>
	);
};

export default Notifications;
