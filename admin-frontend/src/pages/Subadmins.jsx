// src/pages/Subadmins.jsx
import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import {
  UserCog,
  Users,
  AlertCircle,
  Loader,
  ArrowLeft,
  X,
  CheckCircle,
  Save,
  Plus,
  Trash2,
  Edit3,
  Eye,
  EyeOff,
  Shield,
  Mail,
  Phone,
  User,
  Lock,
  Search,
  AlertTriangle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const Subadmins = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [modalError, setModalError] = useState("");
  const [modalSuccess, setModalSuccess] = useState("");
  const [subadmins, setSubadmins] = useState([]);
  const [availablePages, setAvailablePages] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [selectedSubadmin, setSelectedSubadmin] = useState(null);
  const [subadminToDelete, setSubadminToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    phone: "",
    password: "",
    status: "active",
    permissions: {
      pages: [],
    },
  });

  // Load all data
  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [subadminsRes, pagesRes] = await Promise.all([
        api.get("/admin/subadmins"),
        api.get("/admin/subadmins/available-pages"),
      ]);

      if (subadminsRes.data.success) {
        setSubadmins(subadminsRes.data.data);
      }
      if (pagesRes.data.success) {
        setAvailablePages(pagesRes.data.data);
      }
    } catch (e) {
      setError(e.response?.data?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  // Open create modal
  const handleCreate = () => {
    setModalMode("create");
    setModalError("");
    setModalSuccess("");
    setFormData({
      name: "",
      username: "",
      email: "",
      phone: "",
      password: "",
      status: "active",
      permissions: { pages: [] },
    });
    setShowModal(true);
  };

  // Open edit modal
  const handleEdit = (subadmin) => {
    setModalMode("edit");
    setSelectedSubadmin(subadmin);
    setModalError("");
    setModalSuccess("");
    setFormData({
      name: subadmin.name || "",
      username: subadmin.username || "",
      email: subadmin.email || "",
      phone: subadmin.phone || "",
      password: "",
      status: subadmin.status || "active",
      permissions: {
        pages: subadmin.permissions?.pages || [],
      },
    });
    setShowModal(true);
  };

  // Handle save (create or update)
  const handleSave = async () => {
    setModalError("");
    setModalSuccess("");
    setSaving(true);

    try {
      if (modalMode === "create") {
        const res = await api.post("/admin/subadmins", formData);
        if (res.data.success) {
          setModalSuccess("Subadmin created successfully!");
          setTimeout(() => {
            setShowModal(false);
            setSuccess("Subadmin created successfully!");
            loadData();
            setTimeout(() => setSuccess(""), 3000);
          }, 1500);
        }
      } else {
        const res = await api.patch(
          `/admin/subadmins/${selectedSubadmin._id}`,
          formData
        );
        if (res.data.success) {
          setModalSuccess("Subadmin updated successfully!");
          setTimeout(() => {
            setShowModal(false);
            setSuccess("Subadmin updated successfully!");
            loadData();
            setTimeout(() => setSuccess(""), 3000);
          }, 1500);
        }
      }
    } catch (e) {
      setModalError(e.response?.data?.message || "Failed to save subadmin");
    } finally {
      setSaving(false);
    }
  };

  // Open delete confirmation modal
  const handleDeleteClick = (subadmin) => {
    setSubadminToDelete(subadmin);
    setModalError("");
    setShowDeleteModal(true);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!subadminToDelete) return;

    setModalError("");
    setDeleting(true);
    try {
      const res = await api.delete(`/admin/subadmins/${subadminToDelete._id}`);
      if (res.data.success) {
        setShowDeleteModal(false);
        setSubadminToDelete(null);
        setSuccess("Subadmin deleted successfully!");
        loadData();
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (e) {
      setModalError(e.response?.data?.message || "Failed to delete subadmin");
    } finally {
      setDeleting(false);
    }
  };

  // Cancel delete
  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setSubadminToDelete(null);
    setModalError("");
  };

  // Close modal handler
  const handleCloseModal = () => {
    setShowModal(false);
    setModalError("");
    setModalSuccess("");
  };

  // Toggle permission
  const togglePermission = (pageKey) => {
    setFormData({
      ...formData,
      permissions: {
        pages: formData.permissions.pages.includes(pageKey)
          ? formData.permissions.pages.filter((p) => p !== pageKey)
          : [...formData.permissions.pages, pageKey],
      },
    });
  };

  // Select all permissions
  const selectAllPermissions = () => {
    setFormData({
      ...formData,
      permissions: {
        pages: availablePages.map((p) => p.key),
      },
    });
  };

  // Clear all permissions
  const clearAllPermissions = () => {
    setFormData({
      ...formData,
      permissions: { pages: [] },
    });
  };

  // Filter subadmins
  const filteredSubadmins = subadmins.filter(
    (subadmin) =>
      subadmin.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subadmin.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subadmin.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-12 h-12 text-orange-600 animate-spin" />
          <p className="text-gray-600 font-medium">Loading subadmins...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Subadmin Management - Admin</title>
      </Helmet>
      <div className="min-h-screen bg-white p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </button>

            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <UserCog className="w-8 h-8 text-orange-600" />
                  Subadmin Management
                </h1>
                <p className="text-gray-600 mt-2">
                  Create and manage subadmin accounts with custom permissions
                </p>
              </div>

              <button
                onClick={handleCreate}
                className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold transition-all shadow-md hover:shadow-lg flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add Subadmin
              </button>
            </div>
          </div>

          {/* Alerts */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
              <button onClick={() => setError("")} className="ml-auto">
                <X className="w-5 h-5 text-red-600" />
              </button>
            </div>
          )}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-700">{success}</p>
            </div>
          )}

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, email, or username..."
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-orange-50 rounded-xl p-6 border border-orange-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-orange-900">
                    Total Subadmins
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {subadmins.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 rounded-xl p-6 border border-green-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-green-900">Active</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {subadmins.filter((s) => s.status === "active").length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    Available Permissions
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {availablePages.length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Subadmins List */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Name
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Username
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Permissions
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredSubadmins.length === 0 ? (
                    <tr>
                      <td
                        colSpan="6"
                        className="px-6 py-12 text-center text-gray-500"
                      >
                        {searchTerm
                          ? "No subadmins found matching your search"
                          : "No subadmins yet. Create one to get started!"}
                      </td>
                    </tr>
                  ) : (
                    filteredSubadmins.map((subadmin) => (
                      <tr
                        key={subadmin._id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-orange-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {subadmin.name}
                              </p>
                              <p className="text-sm text-gray-500">
                                {subadmin.phone}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-700">
                          {subadmin.email}
                        </td>
                        <td className="px-6 py-4 text-gray-700">
                          <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                            {subadmin.username}
                          </code>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                            {subadmin.permissions?.pages?.length || 0} pages
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              subadmin.status === "active"
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {subadmin.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEdit(subadmin)}
                              className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(subadmin)}
                              className="p-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full my-8">
            {/* Modal Header - Fixed */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <UserCog className="w-6 h-6 text-orange-600" />
                {modalMode === "create" ? "Create Subadmin" : "Edit Subadmin"}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={saving}
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Modal Alerts */}
            {modalError && (
              <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700 flex-1">{modalError}</p>
                <button onClick={() => setModalError("")}>
                  <X className="w-4 h-4 text-red-600" />
                </button>
              </div>
            )}
            {modalSuccess && (
              <div className="mx-6 mt-4 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-700">{modalSuccess}</p>
              </div>
            )}

            {/* Modal Body - Scrollable */}
            <div className="p-6 space-y-6 max-h-[calc(90vh-200px)] overflow-y-auto">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        placeholder="John Doe"
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Username *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={formData.username}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            username: e.target.value,
                          })
                        }
                        placeholder="johndoe"
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                        disabled={modalMode === "edit"}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        placeholder="john@example.com"
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        placeholder="+91 98765 43210"
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password {modalMode === "create" && "*"}
                      {modalMode === "edit" && " (leave blank to keep current)"}
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            password: e.target.value,
                          })
                        }
                        placeholder="••••••••"
                        className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Permissions */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Permissions
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={selectAllPermissions}
                      type="button"
                      className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                    >
                      Select All
                    </button>
                    <button
                      onClick={clearAllPermissions}
                      type="button"
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto p-4 bg-gray-50 rounded-xl border border-gray-200">
                  {availablePages.map((page) => {
                    const isChecked = formData.permissions.pages.includes(
                      page.key
                    );
                    return (
                      <label
                        key={page.key}
                        className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          isChecked
                            ? "border-orange-500 bg-orange-50"
                            : "border-gray-200 bg-white hover:border-gray-300"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => togglePermission(page.key)}
                          className="mt-1 w-5 h-5 text-orange-600 rounded focus:ring-orange-500"
                        />
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">
                            {page.name}
                          </div>
                          <div className="text-sm text-gray-600">
                            {page.description}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>

                <div className="mt-3 text-sm text-gray-600">
                  Selected: {formData.permissions.pages.length} /{" "}
                  {availablePages.length} permissions
                </div>
              </div>
            </div>

            {/* Modal Footer - Fixed */}
            <div className="bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3 rounded-b-2xl">
              <button
                onClick={handleCloseModal}
                disabled={saving}
                className="px-6 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    {modalMode === "create"
                      ? "Create Subadmin"
                      : "Save Changes"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && subadminToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Delete Subadmin
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    This action cannot be undone
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Alert */}
            {modalError && (
              <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700 flex-1">{modalError}</p>
                <button onClick={() => setModalError("")}>
                  <X className="w-4 h-4 text-red-600" />
                </button>
              </div>
            )}

            {/* Modal Body */}
            <div className="p-6">
              <p className="text-gray-700 mb-4">
                Are you sure you want to delete the subadmin account for{" "}
                <strong className="text-gray-900">
                  {subadminToDelete.name}
                </strong>
                ?
              </p>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-2">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-red-800">
                    <p className="font-semibold mb-1">
                      This will permanently delete:
                    </p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Subadmin account access</li>
                      <li>All assigned permissions</li>
                      <li>Login credentials</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-sm text-gray-600">
                  <p>
                    <strong>Email:</strong> {subadminToDelete.email}
                  </p>
                  <p>
                    <strong>Username:</strong> {subadminToDelete.username}
                  </p>
                  <p>
                    <strong>Permissions:</strong>{" "}
                    {subadminToDelete.permissions?.pages?.length || 0} pages
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                onClick={handleDeleteCancel}
                disabled={deleting}
                className="px-6 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {deleting ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-5 h-5" />
                    Delete Subadmin
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Subadmins;
