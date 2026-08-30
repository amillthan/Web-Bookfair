import React, { useState, useEffect } from "react";
import axios from "axios";
import Admin from "../../services/Admin";

const AdminSecurity = () => {
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: false,
    sessionTimeout: 30,
    passwordExpiryDays: 90,
    loginAttempts: 5,
    ipWhitelist: "",
    encryptionEnabled: true,
  });

  const [securityLogs, setSecurityLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersPage, setUsersPage] = useState(0);
  const [usersSize, setUsersSize] = useState(10);
  const [usersTotalPages, setUsersTotalPages] = useState(0);
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const API_BASE_URL = "http://localhost:8088/api/admin/security";

  useEffect(() => {
    fetchSecuritySettings();
    fetchSecurityLogs();
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [usersPage, usersSize, roleFilter]);

  const fetchSecuritySettings = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/settings`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setSecuritySettings(response.data || securitySettings);
    } catch (error) {
      console.error("Error fetching security settings:", error);
      showMessage("Failed to load security settings", "error");
    }
  };

  const fetchSecurityLogs = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/logs`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setSecurityLogs(response.data || []);
    } catch (error) {
      console.error("Error fetching security logs:", error);
      showMessage("Failed to load security logs", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSecuritySettings({
      ...securitySettings,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const saveSecuritySettings = async () => {
    try {
      await axios.post(`${API_BASE_URL}/settings`, securitySettings, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      showMessage("Security settings saved successfully!", "success");
    } catch (error) {
      console.error("Error saving settings:", error);
      showMessage("Failed to save security settings", "error");
    }
  };

  const showMessage = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(""), 4000);
  };

  const getLogLevelColor = (level) => {
    switch (level) {
      case "WARNING":
        return "bg-yellow-500/20 border-yellow-500 text-yellow-400";
      case "ERROR":
        return "bg-red-500/20 border-red-500 text-red-400";
      case "INFO":
        return "bg-blue-500/20 border-blue-500 text-blue-400";
      case "SUCCESS":
        return "bg-green-500/20 border-green-500 text-green-400";
      default:
        return "bg-slate-500/20 border-slate-500 text-slate-400";
    }
  };

  // Users management helpers
  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const params = { page: usersPage, size: usersSize };
      const page = await Admin.getAllUsers(params);
      setUsers(page?.content || []);
      setUsersTotalPages(page?.totalPages ?? 0);
    } catch (error) {
      console.error("Error fetching users:", error);
      showMessage("Failed to load users", "error");
    } finally {
      setUsersLoading(false);
    }
  };

  const handleChangeUserRole = async (userId, newRole) => {
    if (!window.confirm(`Change role of user ${userId} to ${newRole}?`)) return;
    try {
      await Admin.updateUserRole(userId, newRole);
      showMessage("User role updated", "success");
      fetchUsers();
    } catch (error) {
      console.error("Error updating role:", error);
      showMessage("Failed to update user role", "error");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Delete this user permanently?")) return;
    try {
      await Admin.deleteUser(userId);
      showMessage("User deleted", "success");
      fetchUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      showMessage("Failed to delete user", "error");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🔒 Security Settings</h1>
          <p className="text-slate-400">
            Configure security policies and monitor access logs
          </p>
        </div>

        {/* Message Alert */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg border ${
              messageType === "success"
                ? "bg-green-500/20 border-green-500 text-green-200"
                : "bg-red-500/20 border-red-500 text-red-200"
            }`}
          >
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Security Settings Card */}
          <div className="lg:col-span-2 bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-8 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-8">Security Policies</h2>

            <div className="space-y-6">
              {/* Two Factor Authentication */}
              <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-600 flex items-center justify-between">
                <div>
                  <label className="text-white font-medium">Two-Factor Authentication</label>
                  <p className="text-slate-400 text-sm mt-1">
                    Require 2FA for admin accounts
                  </p>
                </div>
                <input
                  type="checkbox"
                  name="twoFactorEnabled"
                  checked={securitySettings.twoFactorEnabled}
                  onChange={handleSettingChange}
                  className="w-6 h-6 rounded cursor-pointer accent-blue-500"
                />
              </div>

              {/* Session Timeout */}
              <div>
                <label className="block text-white font-medium mb-2">
                  Session Timeout (minutes)
                </label>
                <input
                  type="number"
                  name="sessionTimeout"
                  value={securitySettings.sessionTimeout}
                  onChange={handleSettingChange}
                  min="5"
                  max="480"
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
                <p className="text-slate-400 text-xs mt-2">
                  Users will be logged out after inactivity
                </p>
              </div>

              {/* Password Expiry */}
              <div>
                <label className="block text-white font-medium mb-2">
                  Password Expiry (days)
                </label>
                <input
                  type="number"
                  name="passwordExpiryDays"
                  value={securitySettings.passwordExpiryDays}
                  onChange={handleSettingChange}
                  min="7"
                  max="365"
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
                <p className="text-slate-400 text-xs mt-2">
                  Users must change password after this period
                </p>
              </div>

              {/* Failed Login Attempts */}
              <div>
                <label className="block text-white font-medium mb-2">
                  Max Failed Login Attempts
                </label>
                <input
                  type="number"
                  name="loginAttempts"
                  value={securitySettings.loginAttempts}
                  onChange={handleSettingChange}
                  min="1"
                  max="10"
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
                <p className="text-slate-400 text-xs mt-2">
                  Account will be locked after failed attempts
                </p>
              </div>

              {/* IP Whitelist */}
              <div>
                <label className="block text-white font-medium mb-2">
                  IP Whitelist (comma-separated)
                </label>
                <textarea
                  name="ipWhitelist"
                  value={securitySettings.ipWhitelist}
                  onChange={handleSettingChange}
                  placeholder="192.168.1.1, 10.0.0.5, 172.16.0.0/12"
                  rows="3"
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
                <p className="text-slate-400 text-xs mt-2">
                  Leave empty to allow all IPs
                </p>
              </div>

              {/* Encryption */}
              <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-600 flex items-center justify-between">
                <div>
                  <label className="text-white font-medium">Data Encryption</label>
                  <p className="text-slate-400 text-sm mt-1">
                    Enable end-to-end encryption
                  </p>
                </div>
                <input
                  type="checkbox"
                  name="encryptionEnabled"
                  checked={securitySettings.encryptionEnabled}
                  onChange={handleSettingChange}
                  className="w-6 h-6 rounded cursor-pointer accent-blue-500"
                />
              </div>

              {/* Save Button */}
              <button
                onClick={saveSecuritySettings}
                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors mt-2"
              >
                Save Security Settings
              </button>
            </div>
          </div>

          {/* Security Status Card */}
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-8 shadow-2xl">
            <h3 className="text-2xl font-bold text-white mb-6">Security Status</h3>

            <div className="space-y-4">
              <div className="p-4 bg-blue-500/20 border border-blue-500 rounded-lg">
                <p className="text-blue-400 text-sm font-semibold">2FA Status</p>
                <p className="text-blue-200 text-lg mt-2">
                  {securitySettings.twoFactorEnabled ? "✓ Enabled" : "✗ Disabled"}
                </p>
              </div>

              <div className="p-4 bg-green-500/20 border border-green-500 rounded-lg">
                <p className="text-green-400 text-sm font-semibold">Encryption</p>
                <p className="text-green-200 text-lg mt-2">
                  {securitySettings.encryptionEnabled ? "✓ Active" : "✗ Inactive"}
                </p>
              </div>

              <div className="p-4 bg-purple-500/20 border border-purple-500 rounded-lg">
                <p className="text-purple-400 text-sm font-semibold">Session Timeout</p>
                <p className="text-purple-200 text-lg mt-2">
                  {securitySettings.sessionTimeout} min
                </p>
              </div>

              <div className="p-4 bg-yellow-500/20 border border-yellow-500 rounded-lg">
                <p className="text-yellow-400 text-sm font-semibold">Password Expiry</p>
                <p className="text-yellow-200 text-lg mt-2">
                  {securitySettings.passwordExpiryDays} days
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Security Logs */}
        <div className="mt-8 bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-8 shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-6">Security Logs</h2>

          {loading ? (
            <div className="text-slate-400 text-center py-12">
              <div className="inline-block animate-spin">⏳</div> Loading logs...
            </div>
          ) : securityLogs.length === 0 ? (
            <div className="text-slate-400 text-center py-12">No security logs found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-600">
                  <tr className="text-slate-400">
                    <th className="text-left py-3 px-4">Timestamp</th>
                    <th className="text-left py-3 px-4">User</th>
                    <th className="text-left py-3 px-4">Action</th>
                    <th className="text-left py-3 px-4">IP Address</th>
                    <th className="text-left py-3 px-4">Level</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-600">
                  {securityLogs.map((log, idx) => (
                    <tr key={idx} className="hover:bg-slate-700/30 transition-colors">
                      <td className="py-3 px-4 text-slate-300">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-white">{log.username}</td>
                      <td className="py-3 px-4 text-slate-300">{log.action}</td>
                      <td className="py-3 px-4 text-slate-300">{log.ipAddress}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold border ${getLogLevelColor(
                            log.level
                          )}`}
                        >
                          {log.level}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSecurity;