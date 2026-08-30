import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  Filter,
  Edit3,
  Trash2,
  User,
  Mail,
  Calendar,
  Shield,
  ChevronLeft,
  ChevronRight,
  Users,
  UserCheck,
  UserX,
  AlertTriangle,
  CheckCircle,
  X,
} from "lucide-react";
import Admin from "../../services/Admin";
import { motion, AnimatePresence } from "framer-motion";

const roles = ["USER", "VENDOR", "PUBLISHER", "ADMIN"];

const AdminUser = () => {
  const [serverPage, setServerPage] = useState([]); // raw page data from backend
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // server pagination
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // UI filters (frontend-side)
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("ALL");
  const [sortBy, setSortBy] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");

  // modals
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState("");

  // notification
  const [notification, setNotification] = useState(null);

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // fetch from backend (ONLY page + size)
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const page = await Admin.getAllUsers({
        page: currentPage,
        size: pageSize,
      });

      // page is Page<UserResponse>
      const content = page?.content ?? [];
      setServerPage(content);
      setTotalPages(page?.totalPages ?? 0);
      setTotalElements(page?.totalElements ?? 0);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Failed to load users. Check token + ADMIN role, then try again.");
      setServerPage([]);
      setTotalPages(0);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  // ✅ Frontend-side filter + sort (because backend does not support search/role/sort)
  const users = useMemo(() => {
    let data = [...serverPage];

    // filter role
    if (selectedRole !== "ALL") {
      data = data.filter((u) => String(u.role || "").toUpperCase() === selectedRole);
    }

    // search (name/email)
    const q = searchTerm.trim().toLowerCase();
    if (q) {
      data = data.filter((u) => {
        const name = (u.name || "").toLowerCase();
        const email = (u.email || "").toLowerCase();
        const id = String(u.id ?? "");
        return name.includes(q) || email.includes(q) || id.includes(q);
      });
    }

    // sort
    const dir = sortDirection === "asc" ? 1 : -1;
    data.sort((a, b) => {
      const av = a?.[sortBy];
      const bv = b?.[sortBy];

      // dates
      if (sortBy === "createdAt") {
        const ad = av ? new Date(av).getTime() : 0;
        const bd = bv ? new Date(bv).getTime() : 0;
        return (ad - bd) * dir;
      }

      // strings
      const as = String(av ?? "").toLowerCase();
      const bs = String(bv ?? "").toLowerCase();
      return as.localeCompare(bs) * dir;
    });

    return data;
  }, [serverPage, selectedRole, searchTerm, sortBy, sortDirection]);

  const handleSort = (field) => {
    if (sortBy === field) setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(field);
      setSortDirection("asc");
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case "ADMIN":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "PUBLISHER":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      case "VENDOR":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      default:
        return "bg-green-500/20 text-green-400 border-green-500/30";
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case "ADMIN":
        return <Shield size={14} />;
      case "PUBLISHER":
        return <UserCheck size={14} />;
      case "VENDOR":
        return <User size={14} />;
      default:
        return <Users size={14} />;
    }
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setShowEditModal(true);
  };

  const handleDeleteUser = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const confirmEdit = async () => {
    if (!selectedUser || !newRole) return;

    try {
      await Admin.updateUserRole(selectedUser.id, newRole);
      setShowEditModal(false);
      setSelectedUser(null);
      showNotification("User role updated successfully!", "success");
      fetchUsers();
    } catch (err) {
      console.error("Error updating user:", err);
      showNotification("Failed to update user role.", "error");
    }
  };

  const confirmDelete = async () => {
    if (!selectedUser) return;

    try {
      await Admin.deleteUser(selectedUser.id);
      setShowDeleteModal(false);
      setSelectedUser(null);
      showNotification("User deleted successfully!", "success");
      fetchUsers();
    } catch (err) {
      console.error("Error deleting user:", err);
      showNotification("Failed to delete user.", "error");
    }
  };

  const Pagination = () => {
    const startItem = totalElements === 0 ? 0 : currentPage * pageSize + 1;
    const endItem = Math.min((currentPage + 1) * pageSize, totalElements);

    return (
      <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800/50">
        <div className="text-sm text-slate-400">
          Showing {startItem} to {endItem} of {totalElements} users
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            className="p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={16} />
          </button>

          <div className="px-3 py-1 rounded-lg text-sm bg-slate-800/50 text-slate-200">
            {currentPage + 1} / {Math.max(1, totalPages)}
          </div>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={totalPages === 0 || currentPage >= totalPages - 1}
            className="p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">User Management</h1>
              <p className="text-slate-400">Manage and monitor all platform users</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-2xl font-bold text-white">{totalElements}</p>
                <p className="text-sm text-slate-400">Total Users</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
                <Users size={24} className="text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800/50 rounded-xl p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search name/email/id..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Role filter */}
            <div className="relative">
              <Filter size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ALL">All Roles</option>
                {roles.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="name">Sort by Name</option>
                <option value="email">Sort by Email</option>
                <option value="role">Sort by Role</option>
                <option value="createdAt">Sort by Date</option>
              </select>
            </div>

            {/* Sort direction */}
            <button
              onClick={() => setSortDirection((d) => (d === "asc" ? "desc" : "asc"))}
              className="px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white hover:bg-slate-700/50 transition-colors flex items-center justify-center"
              title="Toggle sort direction"
            >
              {sortDirection === "asc" ? "ASC" : "DESC"}
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800/50 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800/50">
            <div className="grid grid-cols-12 gap-4 text-sm font-semibold text-slate-300">
              <div className="col-span-4 cursor-pointer hover:text-white" onClick={() => handleSort("name")}>
                User {sortBy === "name" && (sortDirection === "asc" ? "↑" : "↓")}
              </div>
              <div className="col-span-3 cursor-pointer hover:text-white" onClick={() => handleSort("email")}>
                Email {sortBy === "email" && (sortDirection === "asc" ? "↑" : "↓")}
              </div>
              <div className="col-span-2 cursor-pointer hover:text-white" onClick={() => handleSort("role")}>
                Role {sortBy === "role" && (sortDirection === "asc" ? "↑" : "↓")}
              </div>
              <div className="col-span-2 cursor-pointer hover:text-white" onClick={() => handleSort("createdAt")}>
                Joined {sortBy === "createdAt" && (sortDirection === "asc" ? "↑" : "↓")}
              </div>
              <div className="col-span-1 text-center">Actions</div>
            </div>
          </div>

          <div className="divide-y divide-slate-800/50">
            {loading ? (
              <div className="px-6 py-12 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4" />
                <p className="text-slate-400">Loading users...</p>
              </div>
            ) : error ? (
              <div className="px-6 py-12 text-center">
                <AlertTriangle size={48} className="text-red-400 mx-auto mb-4" />
                <p className="text-red-400 mb-2">Error loading users</p>
                <p className="text-slate-400 text-sm">{error}</p>
                <button
                  onClick={fetchUsers}
                  className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : users.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <UserX size={48} className="text-slate-500 mx-auto mb-4" />
                <p className="text-slate-400">No users found</p>
              </div>
            ) : (
              users.map((u) => (
                <motion.div
                  key={u.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="px-6 py-4 hover:bg-slate-800/30 transition-colors"
                >
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <User size={16} className="text-white" />
                        </div>
                        <div>
                          <p className="text-white font-medium">{u.name}</p>
                          <p className="text-slate-400 text-sm">ID: {u.id}</p>
                        </div>
                      </div>
                    </div>

                    <div className="col-span-3">
                      <div className="flex items-center space-x-2">
                        <Mail size={14} className="text-slate-400" />
                        <span className="text-slate-300">{u.email}</span>
                      </div>
                    </div>

                    <div className="col-span-2">
                      <span
                        className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(
                          u.role
                        )}`}
                      >
                        {getRoleIcon(u.role)}
                        <span>{u.role}</span>
                      </span>
                    </div>

                    <div className="col-span-2">
                      <div className="flex items-center space-x-2">
                        <Calendar size={14} className="text-slate-400" />
                        <span className="text-slate-300 text-sm">
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "N/A"}
                        </span>
                      </div>
                    </div>

                    <div className="col-span-1">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={() => handleEditUser(u)}
                          className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                          title="Edit User"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u)}
                          className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Delete User"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {totalPages > 1 && <Pagination />}
        </div>

        {/* Edit modal */}
        <AnimatePresence>
          {showEditModal && selectedUser && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-md"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white">Edit User Role</h3>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <X size={20} className="text-slate-400" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="p-3 bg-slate-800/50 rounded-lg">
                    <p className="text-white font-medium">{selectedUser.name}</p>
                    <p className="text-slate-400 text-sm">{selectedUser.email}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">New Role</label>
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {roles.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmEdit}
                    className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                  >
                    Update Role
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete modal */}
        <AnimatePresence>
          {showDeleteModal && selectedUser && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-md"
              >
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-3 bg-red-500/20 rounded-full">
                    <AlertTriangle size={24} className="text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Delete User</h3>
                    <p className="text-slate-400">This action cannot be undone</p>
                  </div>
                </div>

                <div className="p-4 bg-slate-800/50 rounded-lg mb-6">
                  <p className="text-white font-medium">{selectedUser.name}</p>
                  <p className="text-slate-400 text-sm">{selectedUser.email}</p>
                  <p className="text-slate-500 text-xs mt-1">Role: {selectedUser.role}</p>
                </div>

                <p className="text-slate-300 mb-6">
                  Are you sure you want to delete this user? This will permanently remove their account.
                </p>

                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                  >
                    Delete User
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* notification */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              className="fixed top-6 right-6 z-50"
            >
              <div
                className={`px-6 py-4 rounded-xl shadow-lg border backdrop-blur-sm ${
                  notification.type === "success"
                    ? "bg-green-500/20 border-green-500/30 text-green-400"
                    : "bg-red-500/20 border-red-500/30 text-red-400"
                }`}
              >
                <div className="flex items-center space-x-3">
                  {notification.type === "success" ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
                  <p className="font-medium">{notification.message}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AdminUser;
